const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to database (use backend clinic.db to avoid duplicate DB files)
const DB_PATH = path.resolve(__dirname, 'clinic.db');
console.log('Using SQLite DB at', DB_PATH);
const db = new sqlite3.Database(DB_PATH, (err) => {
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

// Create services table
db.run(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price REAL,
    duration TEXT,
    type TEXT,
    status TEXT
  )
`);

// Create users table (with role column defaulting to 'user')
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
  )
`);

// Ensure default users exist (admin and regular user) with role
function ensureDefaultUsers() {
  const defaults = [
    { username: 'admin', password: 'admin123', role: 'admin', label: 'admin' },
    { username: 'user', password: 'user', role: 'user', label: 'user' },
  ];

  // Ensure the users table has a 'role' column; if not, add it (SQLite supports ADD COLUMN)
  db.all("PRAGMA table_info(users)", [], (err, cols) => {
    if (err) {
      console.error('Error checking users table schema', err);
      // proceed with seeding; inserts that reference role may fail but we'll attempt safe inserts below
      seedDefaults();
      return;
    }
    const hasRole = Array.isArray(cols) && cols.some((c) => c && c.name === 'role');
    if (!hasRole) {
      db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", [], (alterErr) => {
        if (alterErr) console.error('Error adding role column to users table', alterErr);
        seedDefaults();
      });
    } else {
      seedDefaults();
    }
  });

  function seedDefaults() {
    defaults.forEach((u) => {
      db.get('SELECT * FROM users WHERE username = ?', [u.username], (err, row) => {
        if (err) {
          console.error('Error checking for user', u.username, err);
          return;
        }
        if (!row) {
          // Insert including role now that schema should be up-to-date
          db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [u.username, u.password, u.role], (insertErr) => {
            if (insertErr) {
              // Try fallback insert without role (for very old schema)
              console.error('Error creating default user with role', u.username, insertErr);
              db.run('INSERT INTO users (username, password) VALUES (?, ?)', [u.username, u.password], (fallbackErr) => {
                if (fallbackErr) console.error('Fallback insert failed for', u.username, fallbackErr);
                else console.log('✅ Default', u.label, 'user created (fallback):', u.username);
              });
            } else {
              console.log('✅ Default', u.label, 'user created:', u.username);
            }
          });
        } else if (!row.role) {
          db.run('UPDATE users SET role = ? WHERE username = ?', [u.role, u.username], (updateErr) => {
            if (updateErr) console.error('Error updating role for', u.username, updateErr);
            else console.log('✅ Updated role for existing user', u.username);
          });
        }
      });
    });
  }
}

// Create default users now that the table exists
ensureDefaultUsers();

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

// Simple in-memory session store (suitable for local/desktop app)
const sessions = {}; // token -> { id, username, role }
function createToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Master password (dev convenience). Kept here so admin routes can accept a dev bypass header.
const MASTER_PASSWORD = 'admin123';

// Authenticate middleware: looks for Bearer <token> in Authorization header or x-access-token
function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'] || req.headers['x-access-token'];
  let token = null;
  if (auth && typeof auth === 'string') {
    if (auth.startsWith('Bearer ')) token = auth.slice(7).trim();
    else token = auth.trim();
  }
  if (!token) return res.status(401).json({ message: 'Missing token' });
  const session = sessions[token];
  if (!session) return res.status(401).json({ message: 'Invalid or expired token' });
  req.user = session;
  next();
}

// Role check middleware factory
function requireRole(required) {
  return (req, res, next) => {
    // Dev bypass: accept x-master-password header equal to MASTER_PASSWORD
    const masterHeader = req.headers['x-master-password'];
    if (masterHeader && masterHeader === MASTER_PASSWORD) {
      req.user = { id: 0, username: 'master', role: 'admin' };
      return next();
    }

    authenticateToken(req, res, () => {
      const role = req.user && req.user.role;
      if (!role) return res.status(403).json({ message: 'Forbidden' });
      if (Array.isArray(required)) {
        if (!required.includes(role)) return res.status(403).json({ message: 'Forbidden' });
      } else {
        if (role !== required) return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    });
  };
}

// Login (returns token and user info including role)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const MASTER_PASSWORD = 'admin123';
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (password === MASTER_PASSWORD || row.password === password) {
      const token = createToken();
      sessions[token] = { id: row.id, username: row.username, role: row.role || 'user' };
      return res.json({ success: true, token, user: sessions[token] });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  });
});

// Logout (revokes token)
app.post('/logout', authenticateToken, (req, res) => {
  // Get token from header
  const auth = req.headers['authorization'] || req.headers['x-access-token'];
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7).trim() : auth;
  if (token && sessions[token]) delete sessions[token];
  res.json({ success: true });
});

// Return current authenticated user
app.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
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

// Add a service
app.post('/service-table', (req, res) => {
  const { name, description, price, duration, type, status } = req.body;
  db.run(
    `INSERT INTO services (name, description, price, duration, type, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description, price, duration, type, status],
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

// Get all services
app.get('/service-table', (req, res) => {
  db.all('SELECT * FROM services', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update service
app.put('/service-table/:id', (req, res) => {
  const serviceId = req.params.id;
  const { name, description, price, duration, type, status } = req.body;

  db.run(
    `UPDATE services SET 
      name = ?, description = ?, price = ?, duration = ?, type = ?, status = ?
     WHERE id = ?`,
    [name, description, price, duration, type, status, serviceId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.json({ message: 'Service updated successfully', changes: this.changes });
    }
  );
});

// Admin-only: delete a service
app.delete('/service-table/:id', requireRole('admin'), (req, res) => {
  const serviceId = req.params.id;
  db.run('DELETE FROM services WHERE id = ?', [serviceId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted', changes: this.changes });
  });
});

// Update patient information
app.put('/patients/:id', (req, res) => {
  const patientId = req.params.id;
  const {
    firstName, lastName, middleName, suffix, maritalStatus,
    contactNumber, occupation, address, dateOfBirth, sex,
    contactPersonName, contactPersonRelationship, contactPersonNumber,
    contactPersonAddress
  } = req.body;

  db.run(
    `UPDATE patients SET 
      firstName = ?, lastName = ?, middleName = ?, suffix = ?, maritalStatus = ?,
      contactNumber = ?, occupation = ?, address = ?, dateOfBirth = ?, sex = ?,
      contactPersonName = ?, contactPersonRelationship = ?, contactPersonNumber = ?, 
      contactPersonAddress = ?
     WHERE id = ?`,
    [
      firstName, lastName, middleName, suffix, maritalStatus,
      contactNumber, occupation, address, dateOfBirth, sex,
      contactPersonName, contactPersonRelationship, contactPersonNumber,
      contactPersonAddress, patientId
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      res.json({ message: 'Patient updated successfully', changes: this.changes });
    }
  );
});

// Update medical information
app.put('/medical-information/:patientId', (req, res) => {
  const patientId = req.params.patientId;
  const {
    allergies, bloodType, bloodborneDiseases, pregnancyStatus,
    medications, additionalNotes, bloodPressure, diabetic
  } = req.body;

  // First check if medical information exists for this patient
  db.get('SELECT id FROM MedicalInformation WHERE patientId = ?', [patientId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row) {
      // Update existing record
      db.run(
        `UPDATE MedicalInformation SET 
          allergies = ?, bloodType = ?, bloodborneDiseases = ?, pregnancyStatus = ?,
          medications = ?, additionalNotes = ?, bloodPressure = ?, diabetic = ?
         WHERE patientId = ?`,
        [allergies, bloodType, bloodborneDiseases, pregnancyStatus, medications, additionalNotes, bloodPressure, diabetic, patientId],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Medical information updated successfully', changes: this.changes });
        }
      );
    } else {
      // Create new record if none exists
      db.run(
        `INSERT INTO MedicalInformation (
          patientId, allergies, bloodType, bloodborneDiseases, pregnancyStatus,
          medications, additionalNotes, bloodPressure, diabetic
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [patientId, allergies, bloodType, bloodborneDiseases, pregnancyStatus, medications, additionalNotes, bloodPressure, diabetic],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Medical information created successfully', id: this.lastID });
        }
      );
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
