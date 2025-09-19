const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for photo uploads



// Simple in-memory session store (suitable for local/desktop app)
// Removed duplicate declaration of sessions
// Connect to database (use backend c// Authenticate middleware: looks for Bearer <token> in Authorization header or x-access-token
function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'] || req.headers['x-access-token'];
  let token = null;
  if (auth && typeof auth === 'string') {
    if (auth.startsWith('Bearer ')) token = auth.slice(7).trim();
    else token = auth.trim();
  }
  
  console.log('🔐 Authentication attempt:');
  console.log('  - Token provided:', !!token);
  console.log('  - Token length:', token ? token.length : 0);
  console.log('  - Active sessions:', Object.keys(sessions).length);
  
  if (!token) {
    console.log('❌ Authentication failed: Missing token');
    return res.status(401).json({ message: 'Missing token' });
  }
  
  const session = sessions[token];
  if (!session) {
    console.log('❌ Authentication failed: Invalid or expired token');
    console.log('  - Token not found in sessions');
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  console.log('✅ Authentication successful:', session);
  req.user = session;
  next();
}

// Connect to database (use backend clinic.db to avoid duplicate DB files)
const DB_PATH = path.join(__dirname, 'clinic.db');
console.log('Using SQLite DB at', DB_PATH);
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) return console.error(err.message);
  console.log('✅ Connected to SQLite database.');
});

db.run(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientId INTEGER NOT NULL,
    serviceId INTEGER NOT NULL,
    appointmentDate TEXT NOT NULL,
    timeStart TEXT NOT NULL,
    timeEnd TEXT NOT NULL,
    comments TEXT,
    status TEXT DEFAULT 'Scheduled',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES patients (id),
    FOREIGN KEY (serviceId) REFERENCES services (id)
  )
`, (err) => {
  if (err) {
    console.error('Error creating appointments table:', err);
  } else {
    console.log('✅ Appointments table ready');
  }
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

db.run(`
  CREATE TABLE IF NOT EXISTS tooth_charts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientId INTEGER,
    selectedTeeth TEXT,
    toothSummaries TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(patientId) REFERENCES patients(id)
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

// Create users table (with all required columns)
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user',
    firstName TEXT,
    lastName TEXT,
    employeeRole TEXT,
    userRole TEXT,
    status TEXT DEFAULT 'enabled',
    photo TEXT
  )
`, [], (err) => {
  if (err) {
    console.error('Error creating users table:', err);
  } else {
    ensureDefaultUsers();
  }
});

// Create visit logs table
db.run(`
  CREATE TABLE IF NOT EXISTS visit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientId INTEGER NOT NULL,
    appointmentId INTEGER NOT NULL,
    visitDate TEXT NOT NULL,
    timeStart TEXT NOT NULL,
    timeEnd TEXT NOT NULL,
    attendingDentist TEXT NOT NULL,
    concern TEXT,
    proceduresDone TEXT,
    progressNotes TEXT,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES patients (id),
    FOREIGN KEY (appointmentId) REFERENCES appointments (id)
  )
`, (err) => {
  if (err) {
    console.error('Error creating visit_logs table:', err);
  } else {
    console.log('✅ Visit logs table ready');
  }
});



//APPOINTMENTS AYAW SAG HILABTI//



// GET appointments by date range
app.get('/appointments/date-range', (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate parameters are required' });
  }

  const query = `
    SELECT 
      a.*,
      p.firstName || ' ' || p.lastName as patientName,
      p.firstName,
      p.lastName,
      s.name as serviceName,
      s.duration as serviceDuration,
      s.price as servicePrice
    FROM appointments a
    LEFT JOIN patients p ON a.patientId = p.id
    LEFT JOIN services s ON a.serviceId = s.id
    WHERE a.appointmentDate BETWEEN ? AND ?
    ORDER BY a.appointmentDate ASC, a.timeStart ASC
  `;
  
  db.all(query, [startDate, endDate], (err, rows) => {
    if (err) {
      console.error('Error fetching appointments by date range:', err);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    } else {
      res.json(rows);
    }
  });
});


// GET all appointments
app.get('/appointments', (req, res) => {
  const query = `
    SELECT 
      a.*,
      p.firstName || ' ' || p.lastName as patientName,
      p.firstName,
      p.lastName,
      s.name as serviceName,
      s.duration as serviceDuration,
      s.price as servicePrice
    FROM appointments a
    LEFT JOIN patients p ON a.patientId = p.id
    LEFT JOIN services s ON a.serviceId = s.id
    ORDER BY a.appointmentDate DESC, a.timeStart DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching appointments:', err);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    } else {
      res.json(rows);
    }
  });
});

// GET appointment by ID
app.get('/appointments/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      a.*,
      p.firstName || ' ' || p.lastName as patientName,
      p.firstName,
      p.lastName,
      s.name as serviceName,
      s.duration as serviceDuration,
      s.price as servicePrice
    FROM appointments a
    LEFT JOIN patients p ON a.patientId = p.id
    LEFT JOIN services s ON a.serviceId = s.id
    WHERE a.id = ?
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error fetching appointment:', err);
      res.status(500).json({ error: 'Failed to fetch appointment' });
    } else if (!row) {
      res.status(404).json({ error: 'Appointment not found' });
    } else {
      res.json(row);
    }
  });
});

// POST 
app.post('/appointments', (req, res) => {
  const {
    patientId,
    serviceId,
    appointmentDate,
    timeStart,
    timeEnd,
    comments,
    status = 'Scheduled'
  } = req.body;

  // Validate required fields
  if (!patientId || !serviceId || !appointmentDate || !timeStart || !timeEnd) {
    return res.status(400).json({ 
      error: 'Missing required fields: patientId, serviceId, appointmentDate, timeStart, timeEnd' 
    });
  }

  // Check for appointment conflicts
  const conflictQuery = `
    SELECT id FROM appointments 
    WHERE appointmentDate = ? 
    AND (
      (timeStart <= ? AND timeEnd > ?) OR
      (timeStart < ? AND timeEnd >= ?) OR
      (timeStart >= ? AND timeEnd <= ?)
    )
    AND status != 'Cancelled'
  `;

  db.get(conflictQuery, [
    appointmentDate, 
    timeStart, timeStart, 
    timeEnd, timeEnd, 
    timeStart, timeEnd
  ], (conflictErr, conflictRow) => {
    if (conflictErr) {
      console.error('Error checking appointment conflicts:', conflictErr);
      return res.status(500).json({ error: 'Failed to check appointment conflicts' });
    }

    if (conflictRow) {
      return res.status(409).json({ 
        error: 'Appointment time conflict detected. Please choose a different time slot.' 
      });
    }

    // Insert new appointment
    const insertQuery = `
      INSERT INTO appointments (patientId, serviceId, appointmentDate, timeStart, timeEnd, comments, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertQuery, [
      patientId, 
      serviceId, 
      appointmentDate, 
      timeStart, 
      timeEnd, 
      comments || '', 
      status
    ], function(insertErr) {
      if (insertErr) {
        console.error('Error creating appointment:', insertErr);
        res.status(500).json({ error: 'Failed to create appointment' });
      } else {
        // Return the created appointment with joined data
        const selectQuery = `
          SELECT 
            a.*,
            p.firstName || ' ' || p.lastName as patientName,
            p.firstName,
            p.lastName,
            s.name as serviceName,
            s.duration as serviceDuration,
            s.price as servicePrice
          FROM appointments a
          LEFT JOIN patients p ON a.patientId = p.id
          LEFT JOIN services s ON a.serviceId = s.id
          WHERE a.id = ?
        `;
        
        db.get(selectQuery, [this.lastID], (selectErr, row) => {
          if (selectErr) {
            console.error('Error fetching created appointment:', selectErr);
            res.status(500).json({ error: 'Appointment created but failed to fetch details' });
          } else {
            res.status(201).json(row);
          }
        });
      }
    });
  });
});

// Replace your existing PUT appointments endpoint with this updated version
app.put('/appointments/:id', (req, res) => {
  const { id } = req.params;
  const {
    patientId,
    serviceId,
    appointmentDate,
    timeStart,
    timeEnd,
    comments,
    status
  } = req.body;

  console.log('PUT request for appointment:', id);
  console.log('Request body:', req.body);

  // Build the update query dynamically based on what fields are provided
  const updates = [];
  const values = [];
  
  if (patientId !== undefined) {
    updates.push('patientId = ?');
    values.push(patientId);
  }
  
  if (serviceId !== undefined) {
    updates.push('serviceId = ?');
    values.push(serviceId);
  }
  
  if (appointmentDate !== undefined) {
    updates.push('appointmentDate = ?');
    values.push(appointmentDate);
  }
  
  if (timeStart !== undefined) {
    updates.push('timeStart = ?');
    values.push(timeStart);
  }
  
  if (timeEnd !== undefined) {
    updates.push('timeEnd = ?');
    values.push(timeEnd);
  }
  
  if (comments !== undefined) {
    updates.push('comments = ?');
    values.push(comments);
  }
  
  if (status !== undefined) {
    // Convert frontend status to backend format
    const statusMapping = {
      'scheduled': 'Scheduled',
      'ongoing': 'Ongoing', 
      'done': 'Done',
      'partial paid': 'Partial Paid',
      'cancelled': 'Cancelled'
    };
    const backendStatus = statusMapping[status.toLowerCase()] || 'Scheduled';
    updates.push('status = ?');
    values.push(backendStatus);
    console.log('Converting status:', status, '->', backendStatus);
  }
  
  // Always update the updatedAt timestamp
  updates.push('updatedAt = CURRENT_TIMESTAMP');
  
  if (updates.length === 1) { // Only updatedAt was added
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  // Add the ID for the WHERE clause
  values.push(id);
  
  const query = `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`;
  
  console.log('Update query:', query);
  console.log('Query values:', values);
  
  // FIXED CONFLICT DETECTION - Only check if we're updating time-related fields
  if (appointmentDate !== undefined || timeStart !== undefined || timeEnd !== undefined) {
    // Get current appointment data first
    db.get('SELECT * FROM appointments WHERE id = ?', [id], (err, currentAppt) => {
      if (err) {
        console.error('Error fetching current appointment:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!currentAppt) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      // Use provided values or fall back to current values
      const checkDate = appointmentDate || currentAppt.appointmentDate;
      const checkStartTime = timeStart || currentAppt.timeStart;
      const checkEndTime = timeEnd || currentAppt.timeEnd;
      
      console.log('Checking for conflicts with:', {
        date: checkDate,
        startTime: checkStartTime,
        endTime: checkEndTime,
        excludeId: id
      });
      
      // CORRECTED conflict query - simpler and more accurate overlap detection
      const conflictQuery = `
        SELECT id, patientId, appointmentDate, timeStart, timeEnd, status 
        FROM appointments 
        WHERE appointmentDate = ? 
        AND id != ?
        AND status NOT IN ('Cancelled', 'cancelled', 'Done', 'done')
        AND (
          (timeStart < ? AND timeEnd > ?) OR
          (timeStart < ? AND timeEnd > ?) OR
          (timeStart >= ? AND timeStart < ?)
        )
      `;

      db.all(conflictQuery, [
        checkDate, 
        id,
        checkEndTime, checkStartTime,  // New appointment starts before existing ends AND existing starts before new ends
        checkStartTime, checkEndTime,  // New appointment ends after existing starts AND existing ends after new starts  
        checkStartTime, checkEndTime   // Existing appointment starts within new appointment time
      ], (conflictErr, conflictRows) => {
        if (conflictErr) {
          console.error('Error checking appointment conflicts:', conflictErr);
          return res.status(500).json({ error: 'Failed to check appointment conflicts' });
        }

        console.log('Conflict check results:', conflictRows);

        if (conflictRows && conflictRows.length > 0) {
          console.log('Time conflict detected with appointments:', conflictRows.map(r => ({ 
            id: r.id, 
            time: `${r.timeStart}-${r.timeEnd}` 
          })));
          return res.status(409).json({ 
            error: 'Appointment time conflict detected. Please choose a different time slot.',
            conflicts: conflictRows
          });
        }

        // No conflicts, proceed with update
        console.log('No conflicts found, proceeding with update');
        performUpdate();
      });
    });
  } else {
    // No time-related updates, skip conflict check
    console.log('No time fields being updated, skipping conflict check');
    performUpdate();
  }

  function performUpdate() {
    db.run(query, values, function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (this.changes === 0) {
        console.log('No appointment found with ID:', id);
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      console.log('Appointment updated successfully. Changes:', this.changes);
      
      // Return the updated appointment with joined data
      const selectQuery = `
        SELECT 
          a.*,
          p.firstName || ' ' || p.lastName as patientName,
          p.firstName,
          p.lastName,
          s.name as serviceName,
          s.duration as serviceDuration,
          s.price as servicePrice
        FROM appointments a
        LEFT JOIN patients p ON a.patientId = p.id
        LEFT JOIN services s ON a.serviceId = s.id
        WHERE a.id = ?
      `;
      
      db.get(selectQuery, [id], (err, row) => {
        if (err) {
          console.error('Error fetching updated appointment:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('Returning updated appointment:', row);
        res.json({ message: 'Appointment updated successfully', appointment: row });
      });
    });
  }
});

//APPOINTMENTS AYAW SAG HILABTI//

//VISIT LOGS ENDPOINTS//

// Create a new visit log
app.post('/visit-logs', (req, res) => {
  const {
    patientId,
    appointmentId,
    visitDate,
    timeStart,
    timeEnd,
    attendingDentist,
    concern,
    proceduresDone,
    progressNotes,
    notes
  } = req.body;

  const query = `
    INSERT INTO visit_logs (
      patientId, appointmentId, visitDate, timeStart, timeEnd,
      attendingDentist, concern, proceduresDone, progressNotes, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    patientId, appointmentId, visitDate, timeStart, timeEnd,
    attendingDentist, concern, proceduresDone, progressNotes, notes
  ], function(err) {
    if (err) {
      console.error('Error creating visit log:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Visit log created successfully with ID:', this.lastID);
    res.json({ 
      id: this.lastID, 
      message: 'Visit log created successfully' 
    });
  });
});

// Get visit logs for a specific patient
app.get('/visit-logs/patient/:patientId', (req, res) => {
  const { patientId } = req.params;
  
  const query = `
    SELECT 
      vl.*,
      p.firstName || ' ' || p.lastName as patientName,
      a.appointmentDate,
      s.name as serviceName
    FROM visit_logs vl
    LEFT JOIN patients p ON vl.patientId = p.id
    LEFT JOIN appointments a ON vl.appointmentId = a.id
    LEFT JOIN services s ON a.serviceId = s.id
    WHERE vl.patientId = ?
    ORDER BY vl.visitDate DESC, vl.timeStart DESC
  `;
  
  db.all(query, [patientId], (err, rows) => {
    if (err) {
      console.error('Error fetching visit logs:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get visit logs for a specific appointment
app.get('/visit-logs/appointment/:appointmentId', (req, res) => {
  const { appointmentId } = req.params;
  
  const query = `
    SELECT 
      vl.*,
      p.firstName || ' ' || p.lastName as patientName
    FROM visit_logs vl
    LEFT JOIN patients p ON vl.patientId = p.id
    WHERE vl.appointmentId = ?
    ORDER BY vl.createdAt DESC
  `;
  
  db.get(query, [appointmentId], (err, row) => {
    if (err) {
      console.error('Error fetching visit log:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(row || null);
  });
});

// Update a visit log
app.put('/visit-logs/:id', (req, res) => {
  const { id } = req.params;
  const {
    attendingDentist,
    concern,
    proceduresDone,
    progressNotes,
    notes
  } = req.body;

  const query = `
    UPDATE visit_logs 
    SET attendingDentist = ?, concern = ?, proceduresDone = ?, 
        progressNotes = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [
    attendingDentist, concern, proceduresDone, progressNotes, notes, id
  ], function(err) {
    if (err) {
      console.error('Error updating visit log:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Visit log not found' });
    }
    
    res.json({ message: 'Visit log updated successfully' });
  });
});

// Delete a visit log
app.delete('/visit-logs/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM visit_logs WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting visit log:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Visit log not found' });
    }
    
    res.json({ message: 'Visit log deleted successfully' });
  });
});

//VISIT LOGS ENDPOINTS//









// Ensure default users exist with complete information
function ensureDefaultUsers() {
  const defaults = [
    { 
      username: 'admin', 
      password: 'admin', 
      role: 'Administrator', // Changed from 'admin' to 'Administrator'
      firstName: 'Jan',
      lastName: 'Gerona',
      employeeRole: 'Dentist',
      userRole: 'Administrator',
      status: 'enabled',
      label: 'admin' 
    },
    { 
      username: 'user', 
      password: 'user', 
      role: 'User', // Changed from 'user' to 'User'
      firstName: 'Patrick',
      lastName: 'Star',
      employeeRole: 'Receptionist',
      userRole: 'User',
      status: 'enabled',
      label: 'user' 
    },
  ];

  // Ensure the users table has all required columns
  db.all("PRAGMA table_info(users)", [], (err, cols) => {
    if (err) {
      console.error('Error checking users table schema', err);
      seedDefaults();
      return;
    }
    
    const columnNames = cols.map(col => col.name);
  const requiredColumns = ['role', 'firstName', 'lastName', 'employeeRole', 'userRole', 'status', 'photo'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    // Add missing columns
    if (missingColumns.length > 0) {
      let alterPromises = missingColumns.map(colName => {
        return new Promise((resolve, reject) => {
          let defaultValue = colName === 'role' || colName === 'status' ? "'user'" : "''";
          if (colName === 'status') defaultValue = "'enabled'";
          if (colName === 'photo') defaultValue = "''";
          
          db.run(`ALTER TABLE users ADD COLUMN ${colName} TEXT DEFAULT ${defaultValue}`, [], (alterErr) => {
            if (alterErr) {
              console.error(`Error adding ${colName} column:`, alterErr);
              reject(alterErr);
            } else {
              console.log(`✅ Added ${colName} column to users table`);
              resolve();
            }
          });
        });
      });
      
      Promise.all(alterPromises).then(() => {
        seedDefaults();
      }).catch(() => {
        seedDefaults(); // Try seeding anyway
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
          // Insert new user with all fields
          db.run(
            'INSERT INTO users (username, password, role, firstName, lastName, employeeRole, userRole, status, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [u.username, u.password, u.role, u.firstName, u.lastName, u.employeeRole, u.userRole, u.status, ''], 
            (insertErr) => {
              if (insertErr) {
                console.error('Error creating default user', u.username, insertErr);
              } else {
                console.log('✅ Default', u.label, 'user created:', u.username);
              }
            }
          );
        } else {
          // Update existing user with new fields if they're missing
          const updateFields = [];
          const updateValues = [];
          
          if (!row.firstName && u.firstName) {
            updateFields.push('firstName = ?');
            updateValues.push(u.firstName);
          }
          if (!row.lastName && u.lastName) {
            updateFields.push('lastName = ?');
            updateValues.push(u.lastName);
          }
          if (!row.employeeRole && u.employeeRole) {
            updateFields.push('employeeRole = ?');
            updateValues.push(u.employeeRole);
          }
          if (!row.userRole && u.userRole) {
            updateFields.push('userRole = ?');
            updateValues.push(u.userRole);
          }
          if (!row.status && u.status) {
            updateFields.push('status = ?');
            updateValues.push(u.status);
          }
          
          if (updateFields.length > 0) {
            updateValues.push(u.username);
            db.run(
              `UPDATE users SET ${updateFields.join(', ')} WHERE username = ?`, 
              updateValues, 
              (updateErr) => {
                if (updateErr) {
                  console.error('Error updating user', u.username, updateErr);
                } else {
                  console.log('✅ Updated existing user', u.username);
                }
              }
            );
          }
        }
      });
    });
  }
}

// Create default users now that the table exists
ensureDefaultUsers();

// Migrate old role values to new consistent format
function migrateRoleValues() {
  console.log('🔄 Ensuring role consistency...');
  
  // Comprehensive role normalization
  const migrations = [
    {
      name: 'Normalize role "admin" to "Administrator"',
      sql: 'UPDATE users SET role = "Administrator" WHERE role IN ("admin", "Admin")'
    },
    {
      name: 'Normalize userRole "admin" to "Administrator"',
      sql: 'UPDATE users SET userRole = "Administrator" WHERE userRole IN ("admin", "Admin")'
    },
    {
      name: 'Normalize role "user" to "User"',
      sql: 'UPDATE users SET role = "User" WHERE role = "user"'
    },
    {
      name: 'Normalize userRole "user" to "User"',
      sql: 'UPDATE users SET userRole = "User" WHERE userRole = "user"'
    },
    {
      name: 'Sync Administrator roles',
      sql: 'UPDATE users SET role = "Administrator" WHERE userRole = "Administrator" AND role != "Administrator"'
    },
    {
      name: 'Sync User roles',
      sql: 'UPDATE users SET role = "User" WHERE userRole = "User" AND role != "User"'
    },
    {
      name: 'Sync Administrator userRoles',
      sql: 'UPDATE users SET userRole = "Administrator" WHERE role = "Administrator" AND userRole != "Administrator"'
    },
    {
      name: 'Sync User userRoles',
      sql: 'UPDATE users SET userRole = "User" WHERE role = "User" AND userRole != "User"'
    },
    {
      name: 'Set default roles for null/empty values',
      sql: 'UPDATE users SET role = "User", userRole = "User" WHERE role IS NULL OR role = "" OR userRole IS NULL OR userRole = ""'
    }
  ];
  
  let completed = 0;
  function runNext() {
    if (completed >= migrations.length) {
      console.log('✅ Role consistency check completed');
      return;
    }
    
    const migration = migrations[completed];
    db.run(migration.sql, [], function(err) {
      if (err) {
        console.error(`❌ Error in ${migration.name}:`, err);
      } else if (this.changes > 0) {
        console.log(`✅ ${migration.name}: ${this.changes} rows updated`);
      }
      completed++;
      runNext();
    });
  }
  
  runNext();
}

// Helper function to normalize roles
function normalizeRoles(role, userRole) {
  // Convert old 'admin' variants to 'Administrator'
  if (role && (role.toLowerCase() === 'admin' || role === 'Admin')) {
    role = 'Administrator';
  }
  if (userRole && (userRole.toLowerCase() === 'admin' || userRole === 'Admin')) {
    userRole = 'Administrator';
  }
  
  // Convert old 'user' to 'User'
  if (role === 'user') role = 'User';
  if (userRole === 'user') userRole = 'User';
  
  // Ensure consistency between role and userRole
  if (userRole === 'Administrator' && role !== 'Administrator') {
    role = 'Administrator';
  }
  if (role === 'Administrator' && userRole !== 'Administrator') {
    userRole = 'Administrator';
  }
  if (userRole === 'User' && role !== 'User') {
    role = 'User';
  }
  if (role === 'User' && userRole !== 'User') {
    userRole = 'User';
  }
  
  // Default to User if not specified
  if (!role || role === '') role = 'User';
  if (!userRole || userRole === '') userRole = 'User';
  
  return { role, userRole };
}

// Run migration
migrateRoleValues();

// Get user photo by username
app.get('/user-photo/:username', (req, res) => {
  const { username } = req.params;
  db.get('SELECT photo FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ photo: row.photo || '' });
  });
});

// Update user photo by username
app.post('/user-photo/:username', (req, res) => {
  const { username } = req.params;
  const { photo } = req.body;
  console.log(`📸 Photo upload request for user: ${username}`);
  console.log(`📸 Photo data length: ${photo ? photo.length : 0}`);
  if (!photo) {
    console.log('❌ Photo upload failed: No photo provided');
    return res.status(400).json({ error: 'Photo required' });
  }
  db.run('UPDATE users SET photo = ? WHERE username = ?', [photo, username], function (err) {
    if (err) {
      console.log('❌ Photo upload failed: Database error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      console.log('❌ Photo upload failed: User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('✅ Photo upload successful for user:', username);
    res.json({ success: true });
  });
});

// Delete user photo by username
app.delete('/user-photo/:username', (req, res) => {
  const { username } = req.params;
  db.run('UPDATE users SET photo = ? WHERE username = ?', ['', username], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  });
});

// Add patient endpoint (replace your existing one)
app.post('/patients', (req, res) => {
  const {
    firstName, lastName, middleName, suffix, maritalStatus,
    contactNumber, occupation, address, dateOfBirth, sex,
    contactPersonName, contactPersonRelationship, contactPersonNumber,
    contactPersonAddress, dateCreated, toothChart
  } = req.body;

  // First, insert the patient
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
      
      const patientId = this.lastID;
      
      // If tooth chart data exists, save it
      if (toothChart && (toothChart.selectedTeeth.length > 0 || Object.keys(toothChart.toothSummaries).length > 0)) {
        db.run(
          `INSERT INTO tooth_charts (patientId, selectedTeeth, toothSummaries, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?)`,
          [
            patientId,
            JSON.stringify(toothChart.selectedTeeth),
            JSON.stringify(toothChart.toothSummaries),
            toothChart.createdAt || new Date().toISOString(),
            new Date().toISOString()
          ],
          function (toothErr) {
            if (toothErr) {
              console.error('Error saving tooth chart:', toothErr);
              // Still return success for patient, but log the tooth chart error
            }
            res.json({ 
              id: patientId, 
              message: 'Patient saved successfully',
              toothChartSaved: !toothErr 
            });
          }
        );
      } else {
        res.json({ id: patientId, message: 'Patient saved successfully' });
      }
    }
  );
});

app.get('/tooth-chart/:patientId', (req, res) => {
  const patientId = req.params.patientId;
  db.get(
    'SELECT * FROM tooth_charts WHERE patientId = ?',
    [patientId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.json({ selectedTeeth: [], toothSummaries: {} });
      
      res.json({
        id: row.id,
        patientId: row.patientId,
        selectedTeeth: JSON.parse(row.selectedTeeth || '[]'),
        toothSummaries: JSON.parse(row.toothSummaries || '{}'),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      });
    }
  );
});

// Update tooth chart
app.put('/tooth-chart/:patientId', (req, res) => {
  const patientId = req.params.patientId;
  const { selectedTeeth, toothSummaries } = req.body;
  
  // Check if tooth chart exists
  db.get('SELECT id FROM tooth_charts WHERE patientId = ?', [patientId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row) {
      // Update existing tooth chart
      db.run(
        `UPDATE tooth_charts SET selectedTeeth = ?, toothSummaries = ?, updatedAt = ?
         WHERE patientId = ?`,
        [
          JSON.stringify(selectedTeeth),
          JSON.stringify(toothSummaries),
          new Date().toISOString(),
          patientId
        ],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Tooth chart updated successfully', changes: this.changes });
        }
      );
    } else {
      // Create new tooth chart
      db.run(
        `INSERT INTO tooth_charts (patientId, selectedTeeth, toothSummaries, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?)`,
        [
          patientId,
          JSON.stringify(selectedTeeth),
          JSON.stringify(toothSummaries),
          new Date().toISOString(),
          new Date().toISOString()
        ],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Tooth chart created successfully', id: this.lastID });
        }
      );
    }
  });
});

app.get('/patients-with-tooth-charts', (req, res) => {
  db.all(`
    SELECT p.*, 
           tc.selectedTeeth,
           tc.toothSummaries,
           tc.createdAt as toothChartCreated
    FROM patients p
    LEFT JOIN tooth_charts tc ON p.id = tc.patientId
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const patients = rows.map(row => ({
      ...row,
      selectedTeeth: row.selectedTeeth ? JSON.parse(row.selectedTeeth) : [],
      toothSummaries: row.toothSummaries ? JSON.parse(row.toothSummaries) : {}
    }));
    
    res.json(patients);
  });
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
      req.user = { id: 0, username: 'master', role: 'Administrator' };
      return next();
    }

    authenticateToken(req, res, () => {
      const role = req.user && req.user.role;
      if (!role) return res.status(403).json({ message: 'Forbidden' });
      if (Array.isArray(required)) {
        if (!required.includes(role)) return res.status(403).json({ message: 'Forbidden' });
      } else {
        // Handle both old 'admin' and new 'Administrator' for backward compatibility
        const normalizedRole = role.toLowerCase();
        const normalizedRequired = required.toLowerCase();
        if (normalizedRequired === 'admin' && (normalizedRole === 'admin' || normalizedRole === 'administrator')) {
          return next();
        }
        if (role !== required) return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    });
  };
}

// Login (returns token and user info including role)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Login credentials invalid' });
    }
    // Check if user is disabled
    if (user.status && user.status.toLowerCase() !== 'enabled') {
      return res.status(401).json({ message: 'Login credentials invalid' });
    }
    // Check password (plain text for demo, use hashing in production)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Login credentials invalid' });
    }
    // Success: generate token and store session
    const token = createToken();
    sessions[token] = {
      id: user.id,
      username: user.username,
      role: user.role || user.userRole || 'user'
    };
    res.json({ user, token }); // <-- return token here
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

// Get individual patient by ID
app.get('/patients/:id', (req, res) => {
  const patientId = req.params.id;
  db.get('SELECT * FROM patients WHERE id = ?', [patientId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Patient not found' });
    res.json(row);
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

// ===== USER MANAGEMENT ENDPOINTS =====

// Get all users
app.get('/users', (req, res) => {
  // Build dynamic WHERE clause based on query params
  const allowedFilters = ['employeeRole', 'userRole', 'status'];
  const filters = [];
  const values = [];
  allowedFilters.forEach(key => {
    if (req.query[key]) {
      filters.push(`${key} = ?`);
      values.push(req.query[key]);
    }
  });
  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  db.all(`SELECT id, username, firstName, lastName, employeeRole, userRole, status FROM users ${whereClause}`, values, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single user by ID
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  db.get('SELECT id, username, password, firstName, lastName, employeeRole, userRole, status FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

// Add new user
app.post('/users', requireRole('admin'), (req, res) => {
  const { username, password, firstName, lastName, employeeRole, userRole, status } = req.body;
  
  if (!username || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Username, password, firstName, and lastName are required' });
  }

  db.run(
    'INSERT INTO users (username, password, firstName, lastName, employeeRole, userRole, status, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [username, password, firstName, lastName, employeeRole, userRole, status || 'enabled', normalizeRoles('', userRole).role],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'User created successfully' });
    }
  );
});

// Update user
app.put('/users/:id', requireRole('admin'), (req, res) => {
  const userId = req.params.id;
  const { username, password, firstName, lastName, employeeRole, userRole, status } = req.body;

  let updateFields = [];
  let updateValues = [];

  if (username !== undefined) {
    updateFields.push('username = ?');
    updateValues.push(username);
  }
  if (password !== undefined) {
    updateFields.push('password = ?');
    updateValues.push(password);
  }
  if (firstName !== undefined) {
    updateFields.push('firstName = ?');
    updateValues.push(firstName);
  }
  if (lastName !== undefined) {
    updateFields.push('lastName = ?');
    updateValues.push(lastName);
  }
  if (employeeRole !== undefined) {
    updateFields.push('employeeRole = ?');
    updateValues.push(employeeRole);
  }
  if (userRole !== undefined) {
    const normalized = normalizeRoles('', userRole);
    updateFields.push('userRole = ?');
    updateValues.push(normalized.userRole);
    updateFields.push('role = ?');
    updateValues.push(normalized.role);
  }
  if (status !== undefined) {
    updateFields.push('status = ?');
    updateValues.push(status);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updateValues.push(userId);

  db.run(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues,
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User updated successfully', changes: this.changes });
    }
  );
});

// Update own profile (authenticated users can update their own profile)
app.put('/profile', authenticateToken, (req, res) => {
  const userId = req.user.id; // Get user ID from authenticated session
  const { username, password, firstName, lastName, employeeRole, userRole, status } = req.body;

  console.log('📝 Profile update request:');
  console.log('  - User ID:', userId);
  console.log('  - Update data:', { username, firstName, lastName, employeeRole, userRole, status });

  let updateFields = [];
  let updateValues = [];

  if (username !== undefined) {
    updateFields.push('username = ?');
    updateValues.push(username);
  }
  if (password !== undefined) {
    updateFields.push('password = ?');
    updateValues.push(password);
  }
  if (firstName !== undefined) {
    updateFields.push('firstName = ?');
    updateValues.push(firstName);
  }
  if (lastName !== undefined) {
    updateFields.push('lastName = ?');
    updateValues.push(lastName);
  }
  if (employeeRole !== undefined) {
    updateFields.push('employeeRole = ?');
    updateValues.push(employeeRole);
  }
  if (userRole !== undefined) {
    const normalized = normalizeRoles('', userRole);
    updateFields.push('userRole = ?');
    updateValues.push(normalized.userRole);
    updateFields.push('role = ?');
    updateValues.push(normalized.role);
  }
  if (status !== undefined) {
    updateFields.push('status = ?');
    updateValues.push(status);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updateValues.push(userId);

  console.log('  - SQL fields to update:', updateFields);
  console.log('  - SQL values:', updateValues);

  db.run(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues,
    function (err) {
      if (err) {
        console.log('❌ Profile update failed:', err.message);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        console.log('❌ Profile update failed: User not found');
        return res.status(404).json({ error: 'User not found' });
      }
      console.log('✅ Profile update successful. Changes:', this.changes);
      
      // Verify the update by fetching the updated user
      db.get('SELECT * FROM users WHERE id = ?', [userId], (selectErr, updatedUser) => {
        if (!selectErr && updatedUser) {
          console.log('✅ Updated user data:', {
            id: updatedUser.id,
            username: updatedUser.username,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            employeeRole: updatedUser.employeeRole,
            userRole: updatedUser.userRole,
            status: updatedUser.status
          });
        }
      });
      
      res.json({ message: 'Profile updated successfully', changes: this.changes });
    }
  );
});

// Get distinct role options from database
app.get('/role-options', (req, res) => {
  const employeeRolesQuery = 'SELECT DISTINCT employeeRole FROM users WHERE employeeRole IS NOT NULL AND employeeRole != ""';
  const userRolesQuery = 'SELECT DISTINCT userRole FROM users WHERE userRole IS NOT NULL AND userRole != ""';
  
  db.all(employeeRolesQuery, [], (err, employeeRows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all(userRolesQuery, [], (err, userRows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const employeeRoles = employeeRows.map(row => row.employeeRole).filter(Boolean);
      const userRoles = userRows.map(row => row.userRole).filter(Boolean);
      
      // Add standardized default options if not present
      const defaultEmployeeRoles = [
        'Dentist', 
        'Assistant Dentist', 
        'Receptionist'
      ];
      const defaultUserRoles = ['User', 'Administrator'];
      
      defaultEmployeeRoles.forEach(role => {
        if (!employeeRoles.includes(role)) {
          employeeRoles.push(role);
        }
      });
      
      defaultUserRoles.forEach(role => {
        if (!userRoles.includes(role)) {
          userRoles.push(role);
        }
      });
      
      res.json({
        employeeRoles: employeeRoles.sort(),
        userRoles: userRoles.sort()
      });
    });
  });
});

// Debug endpoint to check user data (remove in production)
app.get('/debug/users', (req, res) => {
  db.all('SELECT id, username, firstName, lastName, employeeRole, userRole, status FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Delete user (admin only)
app.delete('/users/:id', requireRole('admin'), (req, res) => {
  const userId = req.params.id;
  
  // Prevent deleting admin user
  db.get('SELECT username FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    
    if (row.username === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin user' });
    }

    db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'User deleted successfully', changes: this.changes });
    });
  });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
