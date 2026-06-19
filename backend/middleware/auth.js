const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    const header = req.headers['authorization'];
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.username = payload.username;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { requireAuth };
