const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('weather.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    location TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

db.close();
console.log('Database setup complete.');