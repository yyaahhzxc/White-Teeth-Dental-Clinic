const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to database
const db = new sqlite3.Database('./clinic.db', (err) => {
  if (err) return console.error(err.message);
  console.log('✅ Connected to SQLite database.');
});

// Create patients table
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

// Create medical information table
db.run(`
  CREATE TABLE IF NOT EXISTS MedicalInformation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientId INTEGER,
    allergies TEXT,
    bloodType TEXT,
    bloodborneDiseases TEXT,
    pregnancyStatus TEXT,
    medications TEXT,
    additionalNotes TEXT,
    bloodPressure TEXT,
    diabetic TEXT,
    FOREIGN KEY(patientId) REFERENCES patients(id)
  )
`);

// Add patient endpoint
app.post('/patients', (req, res) => {
  const {
    firstName, lastName, middleName, suffix, maritalStatus,
    contactNumber, occupation, address, dateOfBirth, sex,
    contactPersonName, contactPersonRelationship, contactPersonNumber,
    contactPersonAddress, dateCreated
  } = req.body;

  db.run(
    `INSERT INTO patients (
      firstName, lastName, middleName, suffix, maritalStatus, contactNumber, occupation, address, dateOfBirth, sex,
      contactPersonName, contactPersonRelationship, contactPersonNumber, contactPersonAddress, dateCreated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      firstName, lastName, middleName, suffix, maritalStatus,
      contactNumber, occupation, address, dateOfBirth, sex,
      contactPersonName, contactPersonRelationship, contactPersonNumber,
      contactPersonAddress, dateCreated
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Add medical information endpoint
app.post('/medical-information', (req, res) => {
  const {
    patientId, allergies, bloodType, bloodborneDiseases, pregnancyStatus,
    medications, additionalNotes, bloodPressure, diabetic
  } = req.body;

  db.run(
    `INSERT INTO MedicalInformation (
      patientId, allergies, bloodType, bloodborneDiseases, pregnancyStatus, medications, additionalNotes, bloodPressure, diabetic
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [patientId, allergies, bloodType, bloodborneDiseases, pregnancyStatus, medications, additionalNotes, bloodPressure, diabetic],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Get all patients
app.get('/patients', (req, res) => {
  db.all('SELECT * FROM patients', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get medical information by patientId
app.get('/medical-information/:patientId', (req, res) => {
  const patientId = req.params.patientId;
  db.get(
    'SELECT * FROM MedicalInformation WHERE patientId = ?',
    [patientId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    }
  );
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
