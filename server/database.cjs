const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create students table
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      school TEXT,
      grade TEXT
    )`);

    // Create projects table
    // content stores the JSON string of nodes, edges, logs, etc.
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT,
      created_at TEXT,
      content TEXT,
      FOREIGN KEY (student_id) REFERENCES students (id)
    )`);

    // Create datasets table
    db.run(`CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      name TEXT NOT NULL,
      type TEXT,
      content TEXT,
      is_public INTEGER DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY (owner_id) REFERENCES students (id)
    )`);
  }
});

module.exports = db;
