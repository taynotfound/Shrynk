const express = require('express');
const router = express.Router();
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const path = require('path');
const bcrypt = require('bcrypt');

// Serve the login page
router.get('/login', (req, res) => {
    res.render('login');
});

// Serve the registration page
router.get('/register', (req, res) => {
    res.render('register');
});

// Registration route
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const existingUser = await db.get(`users.${username}`);

    if (existingUser) {
        return res.status(400).send('User already exists');
    }
    const hash = await encrypt(password);
    const user = { username, hash };
    req.session.user = user;
        req.session.save();
    await db.set(`users.${username}`, { username, hash });
    res.redirect('/dashboard');
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get(`users.${username}`);

    if (user && await compare(password, user.hash)) {
        req.session.user = user;
        req.session.save();

        return res.redirect('/dashboard');
    } else {
        return res.status(401).send('Invalid credentials');
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;


async function encrypt(password){
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
}

async function compare(password, hash){
    return bcrypt.compareSync(password, hash);
}