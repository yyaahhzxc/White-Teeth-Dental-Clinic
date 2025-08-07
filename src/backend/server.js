const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./clinic.db', (err) => {
  if (err) return console.error(err.message);
  console.log('✅ Connected to SQLite database.');
});

db.run(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    contact TEXT
  )
`);

// Create users table and insert default admin user if not exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (!row) {
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', 'admin']);
    }
  });
});



app.get('/patients', (req, res) => {
  db.all('SELECT * FROM patients', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }
  );
});

app.listen(3001, () => console.log('🚀 Server running on http://localhost:3001'));
