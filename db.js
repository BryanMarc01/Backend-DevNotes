// db.js
const Database = require('better-sqlite3');
const db = new Database('notes.db');

// 1) Crea la tabla si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    link TEXT,
    category TEXT DEFAULT 'other',
    cost REAL DEFAULT 0,
    x REAL DEFAULT 0,
    y REAL DEFAULT 0,
    lat REAL DEFAULT NULL,
    lng REAL DEFAULT NULL,
    zIndex INTEGER DEFAULT 1,
    minimized INTEGER DEFAULT 0,
    startDate TEXT,
    endDate TEXT
  )
`);

// 2) Si tu tabla ya existía desde antes (solo con content, x, y), puedes hacer:
try {
  db.exec("ALTER TABLE notes ADD COLUMN title TEXT");
} catch {}
try {
  db.exec("ALTER TABLE notes ADD COLUMN link TEXT");
} catch {}
try {
  db.exec("ALTER TABLE notes ADD COLUMN category TEXT DEFAULT 'other'");
} catch {}
try {
  db.exec("ALTER TABLE notes ADD COLUMN cost REAL DEFAULT 0");
} catch {}
try {
  db.exec("ALTER TABLE notes ADD COLUMN lat REAL DEFAULT NULL");
} catch {}
try {
  db.exec("ALTER TABLE notes ADD COLUMN lng REAL DEFAULT NULL");
} catch {}
try {
  db.exec("ALTER TABLE notes ADD COLUMN zIndex INTEGER DEFAULT 1");
} catch {}
try {
  db.exec("ALTER TABLE notes ADD COLUMN minimized INTEGER DEFAULT 0");
} catch {}
try {
  db.exec("ALTER TABLE notes ADD COLUMN startDate TEXT");
} catch {}
try {
  db.exec("ALTER TABLE notes ADD COLUMN endDate TEXT");
} catch {}

// Listo, con estos 'try' evitamos errores si las columnas ya existen.

module.exports = db;
