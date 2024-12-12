const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy; 
const { OAuth2Client } = require('google-auth-library');
const userModel = require('../models/User.js');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    callbackURL: '/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await userModel.findUserByGoogleId(profile.id);
        if (!user) {
            user = {
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName
            };
            await userModel.saveUser(user);
        }
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.googleId);
});

passport.deserializeUser(async (googleId, done) => {
    try {
        const user = await userModel.findUserByGoogleId(googleId);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

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
};