const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { performAlchemy, performEnhance } = require('../utils/gameRules');

const router = express.Router();
router.use(requireAuth); // every route below requires a valid JWT

// GET current player state (used on app load instead of localStorage)
router.get('/me', (req, res) => {
    const state = db.getState(req.username);
    if (!state) return res.status(404).json({ error: 'No save found' });
    res.json({ state });
});

// Bulk save — still useful for fields that don't need server validation
// (UI prefs, selected zone, cosmetic stuff). Anything involving currency,
// items, or RNG should go through a dedicated validated route instead,
// like /alchemy and /enhance below.
router.put('/me', (req, res) => {
    const { state } = req.body;
    if (!state) return res.status(400).json({ error: 'Missing state' });
    db.saveState(req.username, state);
    res.json({ ok: true });
});

// --- Server-authoritative actions (the important part) ---

router.post('/alchemy', (req, res) => {
    const { recipe } = req.body;
    const state = db.getState(req.username);
    if (!state) return res.status(404).json({ error: 'No save found' });

    const result = performAlchemy(state, recipe);
    if (!result.ok) return res.status(400).json({ error: result.message });

    db.saveState(req.username, result.state);
    res.json({ success: result.success, message: result.message, state: result.state });
});

router.post('/enhance', (req, res) => {
    const { slot, useProtection } = req.body;
    const state = db.getState(req.username);
    if (!state) return res.status(404).json({ error: 'No save found' });

    const result = performEnhance(state, slot, !!useProtection);
    if (!result.ok) return res.status(400).json({ error: result.message });

    db.saveState(req.username, result.state);
    res.json({ success: result.success, protected: !!result.protected, message: result.message, state: result.state });
});

module.exports = router;
