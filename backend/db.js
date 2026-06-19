/* ============================================================
   db.js — minimal persistence layer.
   For a real production deployment, swap this file's internals
   for a Postgres (pg) or SQLite (better-sqlite3) driver — every
   route only calls the functions exported here, so nothing else
   needs to change.
   ============================================================ */
const fs = require('fs');
const path = require('path');

// On platforms with a persistent volume (Railway, Fly.io, a VPS...), set
// DB_FILE_PATH to a path inside that volume so saves survive redeploys.
// Without it, this defaults to a local file — fine for local dev, but
// WILL be wiped on any host with an ephemeral filesystem.
const DB_FILE = process.env.DB_FILE_PATH || path.join(__dirname, 'data', 'db.json');

function ensureDir() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readDb() {
    ensureDir();
    if (!fs.existsSync(DB_FILE)) {
        const empty = { users: {} };
        fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2));
        return empty;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDb(db) {
    ensureDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// --- Users ---
function getUser(username) {
    const db = readDb();
    return db.users[username] || null;
}

function createUser(username, passwordHash, initialState) {
    const db = readDb();
    if (db.users[username]) throw new Error('USERNAME_TAKEN');
    db.users[username] = {
        username,
        passwordHash,
        createdAt: new Date().toISOString(),
        state: initialState
    };
    writeDb(db);
    return db.users[username];
}

function getState(username) {
    const db = readDb();
    const user = db.users[username];
    return user ? user.state : null;
}

function saveState(username, state) {
    const db = readDb();
    if (!db.users[username]) throw new Error('USER_NOT_FOUND');
    db.users[username].state = state;
    writeDb(db);
}

module.exports = { getUser, createUser, getState, saveState };
