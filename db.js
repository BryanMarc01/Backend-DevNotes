const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./sticky_notes.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    content TEXT,
    x INTEGER DEFAULT 0,
    y INTEGER DEFAULT 0
  )`);
});

module.exports = db;
