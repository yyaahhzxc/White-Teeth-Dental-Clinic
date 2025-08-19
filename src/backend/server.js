const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Confirm connecting SQL to server
const db = new sqlite3.Database('./clinic.db', (err) => {
  if (err) return console.error(err.message);
  console.log('✅ Connected to SQLite database.');
});

// Create patients table with all required fields
db.run(`
  CREATE TABLE IF NOT EXISTS patients (
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
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // Get list of users
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (!row) {
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', 'admin']);
    }
  });
});

// Create ServiceTable if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS ServiceTable (
    serviceID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price REAL,
    duration INTEGER,
    type TEXT,
    status TEXT
  )
`);


db.run(`
  CREATE TABLE IF NOT EXISTS ServiceTable (
    serviceID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price REAL,
    duration INTEGER,
    type TEXT,
    status TEXT
  )
`);

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

// Endpoint to add a service
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
