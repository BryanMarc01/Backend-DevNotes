// backend/db.js
const Database = require('better-sqlite3');
const db = new Database('notes.db');

db.prepare(`
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  content TEXT,
  x INTEGER DEFAULT 0,
  y INTEGER DEFAULT 0
)`).run();

module.exports = db;
