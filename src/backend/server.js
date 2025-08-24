const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = './clinic.db';

// 1️⃣ Delete the old database file if it exists
if (fs.existsSync(DB_FILE)) {
  fs.unlinkSync(DB_FILE);
  console.log('🗑️ Old database deleted. Starting fresh...');
}

// 2️⃣ Create new database file and connect
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error(err.message);
  console.log('✅ Connected to fresh SQLite database.');
});

// 3️⃣ Recreate tables
db.run(`
  CREATE TABLE patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT,
    lastName TEXT,
    middleName TEXT,
    suffix TEXT,
    maritalStatus TEXT,
    contactNumber TEXT,
    occupation TEXT,
    address TEXT,
    dateOfBirth TEXT,
    sex TEXT,
    contactPersonName TEXT,
    contactPersonRelationship TEXT,
    contactPersonNumber TEXT,
    contactPersonAddress TEXT,
    dateCreated TEXT
  )
`);

db.serialize(() => {
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // Default admin account
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', 'admin']);
});

db.run(`
  CREATE TABLE ServiceTable (
    serviceID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price REAL,
    duration INTEGER,
    type TEXT,
    status TEXT
  )
`);

// --- Your existing routes stay the same ---

// Get all patients
app.get('/patients', (req, res) => {
  db.all('SELECT * FROM patients', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a patient
app.post('/patients', (req, res) => {
  const {
    firstName,
    lastName,
    middleName,
    suffix,
    maritalStatus,
    contactNumber,
    occupation,
    address,
    dateOfBirth,
    sex,
    contactPersonName,
    contactPersonRelationship,
    contactPersonNumber,
    contactPersonAddress
  } = req.body;
  const dateCreated = new Date().toISOString().split('T')[0];
  db.run(
    `INSERT INTO patients (
      firstName, lastName, middleName, suffix, maritalStatus, contactNumber, occupation, address,
      dateOfBirth, sex, contactPersonName, contactPersonRelationship, contactPersonNumber, contactPersonAddress, dateCreated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      firstName,
      lastName,
      middleName,
      suffix,
      maritalStatus,
      contactNumber,
      occupation,
      address,
      dateOfBirth,
      sex,
      contactPersonName,
      contactPersonRelationship,
      contactPersonNumber,
      contactPersonAddress,
      dateCreated
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID,
        firstName,
        lastName,
        middleName,
        suffix,
        maritalStatus,
        contactNumber,
        occupation,
        address,
        dateOfBirth,
        sex,
        contactPersonName,
        contactPersonRelationship,
        contactPersonNumber,
        contactPersonAddress,
        dateCreated
      });
    }
  );
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const MASTER_PASSWORD = 'admin123';
  // Look up user by username first
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Allow login when provided password matches stored password OR is the master password
    if (password === MASTER_PASSWORD || row.password === password) {
      return res.json({ success: true });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  });
});

// Validate security questions for password reset
app.post('/forgot-validate', (req, res) => {
  const { q1, q2, q3 } = req.body;
  if (q1 == null || q2 == null || q3 == null) {
    return res.status(400).json({ message: 'Missing answers' });
  }

  const normalize = (s) => String(s).trim().toLowerCase();

  const a1 = normalize(q1);
  const a2 = normalize(q2);
  const a3 = normalize(q3);

  const ok1 = a1 === '2019' || a1 === '2019.';
  const ok2 = a2 === 'davao' || a2 === 'davao city' || a2 === 'davao, philippines';
  const ok3 = a3 === 'jan' || a3 === 'kenneth' || a3 === 'jan kenneth' || a3 === 'jankenneth';

  if (ok1 && ok2 && ok3) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ message: 'Incorrect answers' });
});

// Reset password (updates users table)
app.post('/forgot-reset', (req, res) => {
  const { username = 'admin', newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ message: 'New password required' });

  db.get('SELECT password FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!row) return res.status(404).json({ message: 'User not found' });

    if (row.password === newPassword) {
      return res.status(400).json({ message: "New password cannot be the same as the old password" });
    }

    db.run('UPDATE users SET password = ? WHERE username = ?', [newPassword, username], function (err) {
      if (err) return res.status(500).json({ message: err.message });
      return res.json({ success: true });
    });
  });
});

// Add a service
app.post('/service-table', (req, res) => {
  const { name, description, price, duration, type, status } = req.body;
  db.run(
    `INSERT INTO ServiceTable (name, description, price, duration, type, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description, price, duration, type, status],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ serviceID: this.lastID, name, description, price, duration, type, status });
    }
  );
});

// Get all services
app.get('/service-table', (req, res) => {
  db.all('SELECT * FROM ServiceTable', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/service-table/:id', (req, res) => {
  const id = req.params.id;
  const { name, description, price, duration, type, status } = req.body;
  db.run(
    `UPDATE ServiceTable SET name=?, description=?, price=?, duration=?, type=?, status=? WHERE serviceID=?`,
    [name, description, price, duration, type, status, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.listen(3001, () => console.log('🚀 Server running on http://localhost:3001'));
