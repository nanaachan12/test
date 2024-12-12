const { BigQuery } = require('@google-cloud/bigquery');
const User = require('../models/User');

const bigqueryClient = new BigQuery();

exports.googleLogin = (req, res) => {
    const sqlQuery = `SELECT name, COUNT(*) as count
                      FROM \`bigquery-public-data.samples.shakespeare\`
                      GROUP BY name
                      ORDER BY count DESC
                      LIMIT 10`;

    bigqueryClient.query(sqlQuery)
        .then(([rows]) => {
            res.status(200).json(rows);
        })
        .catch(error => {
            console.error('Error running query:', error);
            res.status(500).json({ error: 'Error running query' });
        });
};

exports.googleCallback = (req, res) => {
    res.redirect('/dashboard');
};

exports.logout = (req, res) => {
    req.logout();
    res.redirect('/');
};

exports.dashboard = (req, res) => {
    if (!req.user) {
        return res.redirect('/');
    }
    res.render('dashboard', { user: req.user });
};

exports.verifyGoogleToken = async (req, res) => {
    const { idToken } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];

        let user = await User.findOne({ googleId: userid });
        if (!user) {
            user = new User({
                googleId: userid,
                email: email,
                name: name
            });
            await user.save();
        }

        res.status(200).json({ user: { id: user.googleId, email: user.email, name: user.name } });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};