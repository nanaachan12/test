const express = require('express');
const router = express.Router();
const userModel = require('../models/User.js'); 
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.get('/google', (req, res) => {
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=token&scope=profileemail`);
});

router.get('/google/callback', async (req, res) => {
    const { id_token } = req.query;

    if (!id_token) {
        return res.status(400).json({ error: 'No ID token provided' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];

        let user = await userModel.findUserByGoogleId(userid);
        if (!user) {
            user = {
                googleId: userid,
                email: email,
                name: name
            };
            await userModel.saveUser(user);
        }

        res.status(200).json({ user: { id: user.googleId, email: user.email, name: user.name } });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

router.get('/logout', (req, res) => {
    res.redirect('/');
});

router.get('/dashboard', async (req, res) => {
    if (!req.user) {
        return res.redirect('/'); 
    }
    const user = await userModel.findUserByGoogleId(req.user.googleId);
    res.render('dashboard', { user });
});

router.post('/verify-token', async (req, res) => {
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

        let user = await userModel.findUserByGoogleId(userid);
        if (!user) {
            user = {
                googleId: userid,
                email: email,
                name: name
            };
            await userModel.saveUser(user);
        }

        res.status(200).json({ user: { id: user.googleId, email: user.email, name: user.name } });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;