const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { getDefaultState } = require('../utils/gameRules');

const router = express.Router();

const USERNAME_RE = /^[a-z0-9_]{3,16}$/;

router.post('/register', async (req, res) => {
    try {
        let { username, password, confirmPassword } = req.body;
        username = (username || '').trim().toLowerCase();

        if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
        if (username === 'admin') return res.status(400).json({ error: 'This username is reserved' });
        if (!USERNAME_RE.test(username)) return res.status(400).json({ error: 'Username must be 3-16 chars: letters, numbers, underscore only' });
        if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
        if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });
        if (db.getUser(username)) return res.status(409).json({ error: 'Username already taken' });

        const passwordHash = await bcrypt.hash(password, 10);
        const initialState = getDefaultState('guest'); // every registered account starts as a fresh "guest"-tier player
        db.createUser(username, passwordHash, initialState);

        const token = signToken(username);
        res.json({ token, state: initialState });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        let { username, password } = req.body;
        username = (username || '').trim().toLowerCase();

        // 'admin' is a fixed demo account, not stored in the user registry.
        if (username === 'admin') {
            if (password !== process.env.ADMIN_PASSWORD) {
                return res.status(401).json({ error: 'Incorrect username or password' });
            }
            let adminUser = db.getUser('admin');
            if (!adminUser) {
                const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
                db.createUser('admin', adminHash, getDefaultState('admin'));
                adminUser = db.getUser('admin');
            }
            const token = signToken('admin');
            return res.json({ token, state: adminUser.state });
        }

        const user = db.getUser(username);
        if (!user) return res.status(401).json({ error: 'Incorrect username or password' });

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Incorrect username or password' });

        const token = signToken(username);
        res.json({ token, state: user.state });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Login failed' });
    }
});

function signToken(username) {
    return jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

module.exports = router;
