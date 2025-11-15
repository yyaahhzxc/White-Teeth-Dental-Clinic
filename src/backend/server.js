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



//TABLE CREATION FUNCTIONS

// Connect to database (use backend clinic.db to avoid duplicate DB files)
const DB_PATH = path.join(__dirname, 'clinic.db');
console.log('Using SQLite DB at', DB_PATH);
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) return console.error(err.message);
  console.log('✅ Connected to SQLite database.');
});


// Add this after your existing table creation code
console.log('Creating packages table and migrating data...');

// Create packages table
db.run(`
  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL DEFAULT 0,
    duration INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('❌ Error creating packages table:', err);
  } else {
    console.log('✅ Packages table created/verified');
    migratePackagesToSeparateTable();
  }
});


// Create package_services junction table
db.run(`
  CREATE TABLE IF NOT EXISTS package_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    packageId INTEGER NOT NULL,
    serviceId INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (packageId) REFERENCES packages (id) ON DELETE CASCADE,
    FOREIGN KEY (serviceId) REFERENCES services (id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) {
    console.error('❌ Error creating package_services table:', err);
  } else {
    console.log('✅ Package services junction table created/verified');
  }
});





function migratePackagesToSeparateTable() {
  console.log('🔄 Starting package migration...');
  
  // Get all existing packages from services table
  db.all('SELECT * FROM services WHERE type = "Package Treatment"', [], (err, packages) => {
    if (err) {
      console.error('❌ Error fetching packages for migration:', err);
      return;
    }
    
    if (packages.length === 0) {
      console.log('✅ No packages to migrate');
      return;
    }
    
    console.log(`📦 Found ${packages.length} packages to migrate`);
    
    packages.forEach((pkg, index) => {
      // Insert into packages table
      db.run(
        'INSERT OR IGNORE INTO packages (name, description, price, duration, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [
          pkg.name,
          pkg.description || `Package containing multiple services`,
          pkg.price || 0,
          pkg.duration || 0,
          pkg.status || 'Active',
          new Date().toISOString()
        ],
        function(insertErr) {
          if (insertErr) {
            console.error(`❌ Error migrating package ${pkg.name}:`, insertErr);
            return;
          }

          const newPackageId = this.lastID;
          console.log(`✅ Migrated package: ${pkg.name} (ID: ${pkg.id} → ${newPackageId})`);
          
          // Migrate any existing package-service relationships
          // (if you had any stored in appointment_services with negative IDs)
          db.all(
            'SELECT * FROM appointment_services WHERE appointmentId = ?',
            [-pkg.id],
            (relErr, relations) => {
              if (!relErr && relations.length > 0) {
                relations.forEach(rel => {
                  db.run(
                    'INSERT INTO package_services (packageId, serviceId, quantity) VALUES (?, ?, ?)',
                    [newPackageId, rel.serviceId, rel.quantity || 1],
                    (relInsertErr) => {
                      if (relInsertErr) {
                        console.error(`❌ Error migrating package service relation:`, relInsertErr);
                      } else {
                        console.log(`✅ Migrated package service relation for package ${newPackageId}`);
                      }
                    }
                  );
                });
                
                // Clean up old negative ID relations
                db.run('DELETE FROM appointment_services WHERE appointmentId = ?', [-pkg.id]);
              }
            }
          );
          
          // If this is the last package, clean up services table
          if (index === packages.length - 1) {
            setTimeout(() => {
              db.run('DELETE FROM services WHERE type = "Package Treatment"', [], function(deleteErr) {
                if (deleteErr) {
                  console.error('❌ Error cleaning up old packages from services:', deleteErr);
                } else {
                  console.log(`✅ Migration complete! Removed ${this.changes} old packages from services table`);
                }
              });
            }, 1000); // Wait 1 second for all relations to be processed
          }
        }
      );
    });
  });
}


          











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

// Add this right after your other table creation code (around line 50-70)
console.log('Creating appointment_services junction table...');

db.run(`
  CREATE TABLE IF NOT EXISTS appointment_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointmentId INTEGER NOT NULL,
    serviceId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointmentId) REFERENCES appointments (id) ON DELETE CASCADE,
    FOREIGN KEY (serviceId) REFERENCES services (id)
  )
`, (err) => {
  if (err) {
    console.error('❌ Error creating appointment_services table:', err);
  } else {
    console.log('✅ Appointment services junction table created/verified');
    
    // Check if table has any data
    db.get('SELECT COUNT(*) as count FROM appointment_services', [], (countErr, countRow) => {
      if (!countErr) {
        console.log(`📊 Current appointment_services records: ${countRow.count}`);
      }
    });
  }
});

// Add this migration after your existing table creation code (around line 70)
console.log('Adding quantity column to appointment_services table...');

db.run(`
  ALTER TABLE appointment_services 
  ADD COLUMN quantity INTEGER DEFAULT 1
`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('❌ Error adding quantity column:', err);
  } else {
    console.log('✅ Quantity column added/verified in appointment_services table');
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

// Create expenses table (primary key = year + seq in id)
db.run(`
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,            -- format "YYYY-0001"
    year INTEGER NOT NULL,
    seq INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    amount REAL NOT NULL,
    date TEXT NOT NULL,             -- ISO date string
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) console.error('Error creating expenses table:', err);
  else console.log('✅ Expenses table ready');
});

//TABLE CREATION FUNCTIONS





//APPOINTMENTS AYAW SAG HILABTI//

// Replace your GET appointments/date-range endpoint (around line 156) with this corrected version:
app.get('/appointments/date-range', (req, res) => {
  const { startDate, endDate } = req.query;

  const selectQuery = `
    SELECT
      a.*,
      p.firstName || ' ' || p.lastName AS patientName,

      (
        SELECT GROUP_CONCAT(serviceName || ' (x' || quantity || ')', ', ')
        FROM (
          -- Direct services
          SELECT s.name AS serviceName, aps.quantity
          FROM appointment_services aps
          JOIN services s ON aps.serviceId = s.id
          WHERE aps.appointmentId = a.id

          UNION ALL

          -- Package-expanded services
          SELECT s2.name AS serviceName, (ps.quantity * aps2.quantity)
          FROM appointment_services aps2
          JOIN package_services ps ON aps2.serviceId = ps.packageId
          JOIN services s2 ON ps.serviceId = s2.id
          WHERE aps2.appointmentId = a.id
        )
      ) AS serviceNames

    FROM appointments a
    LEFT JOIN patients p ON p.id = a.patientId
    WHERE a.appointmentDate BETWEEN ? AND ?
    ORDER BY a.appointmentDate, a.timeStart
  `;

  db.all(selectQuery, [startDate, endDate], (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed range query." });
    res.json(rows);
  });
});



app.get('/appointments', (req, res) => {
  const selectQuery = `
    SELECT 
      a.*,
      p.firstName || ' ' || p.lastName AS patientName,

      (
        SELECT GROUP_CONCAT(serviceName || ' (x' || quantity || ')', ', ')
        FROM (
          -- Normal services
          SELECT s.name AS serviceName, aps.quantity
          FROM appointment_services aps
          JOIN services s ON aps.serviceId = s.id
          WHERE aps.appointmentId = a.id

          UNION ALL

          -- Expanded package services
          SELECT s2.name AS serviceName, (ps.quantity * aps2.quantity)
          FROM appointment_services aps2
          JOIN package_services ps ON aps2.serviceId = ps.packageId
          JOIN services s2 ON ps.serviceId = s2.id
          WHERE aps2.appointmentId = a.id
        )
      ) AS serviceNames

    FROM appointments a
    LEFT JOIN patients p ON p.id = a.patientId
    ORDER BY a.appointmentDate DESC, a.timeStart ASC
  `;

  db.all(selectQuery, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to retrieve appointments." });
    res.json(rows);
  });
});


// GET appointment by ID
app.get('/appointments/:id', (req, res) => {
  const { id } = req.params;

  const selectQuery = `
    SELECT 
      a.*,
      p.firstName || ' ' || p.lastName AS patientName,

      -- Return expanded service names
      (
        SELECT GROUP_CONCAT(serviceName || ' (x' || quantity || ')', ', ')
        FROM (
          -- Normal services
          SELECT 
            s.name AS serviceName, 
            aps.quantity AS quantity
          FROM appointment_services aps
          JOIN services s ON aps.serviceId = s.id
          WHERE aps.appointmentId = a.id

          UNION ALL

          -- Package-expanded services
          SELECT 
            s2.name AS serviceName,
            (ps.quantity * aps2.quantity) AS quantity
          FROM appointment_services aps2
          JOIN package_services ps ON aps2.serviceId = ps.packageId
          JOIN services s2 ON ps.serviceId = s2.id
          WHERE aps2.appointmentId = a.id
        )
      ) AS serviceNames,

      -- Return serviceIds with expanded services
      (
        SELECT GROUP_CONCAT(serviceId || ':' || quantity)
        FROM (
          -- Normal services
          SELECT aps.serviceId AS serviceId, aps.quantity AS quantity
          FROM appointment_services aps
          WHERE aps.appointmentId = a.id

          UNION ALL

          -- Expand package contents
          SELECT 
            ps.serviceId AS serviceId,
            (ps.quantity * aps2.quantity) AS quantity
          FROM appointment_services aps2
          JOIN package_services ps ON aps2.serviceId = ps.packageId
          WHERE aps2.appointmentId = a.id
        )
      ) AS serviceIds

    FROM appointments a
    LEFT JOIN patients p ON p.id = a.patientId
    WHERE a.id = ?
  `;

  db.get(selectQuery, [id], (err, row) => {
    if (err || !row) {
      return res.status(500).json({ error: "Failed to fetch appointment." });
    }
    res.json(row);
  });
});


// POST 
app.post('/appointments', (req, res) => {
  const {
    patientId,
    serviceId,
    serviceIds,
    serviceQuantities, // New field with quantity data from add-appointment.js
    appointmentDate,
    timeStart,
    timeEnd,
    comments,
    status = 'Scheduled'
  } = req.body;

  console.log('=== POST APPOINTMENT DEBUG ===');
  console.log('Request body:', req.body);
  console.log('Primary serviceId:', serviceId);
  console.log('Service quantities:', serviceQuantities);

  // Validate required fields
  if (!patientId) {
    return res.status(400).json({ error: 'Missing required field: patientId' });
  }
  if (!serviceId) {
    return res.status(400).json({ error: 'Missing required field: serviceId' });
  }
  if (!appointmentDate || !timeStart || !timeEnd) {
    return res.status(400).json({ error: 'Missing required fields: appointmentDate, timeStart, timeEnd' });
  }

  // Insert appointment first
  const insertQuery = `
    INSERT INTO appointments (patientId, serviceId, appointmentDate, timeStart, timeEnd, comments, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  console.log('Inserting appointment with data:', {
    patientId,
    serviceId,
    appointmentDate,
    timeStart,
    timeEnd,
    comments: comments || '',
    status
  });

  db.run(insertQuery, [
    patientId,
    serviceId,
    appointmentDate,
    timeStart,
    timeEnd,
    comments || '',
    status
  ], function (err) {
    if (err) {
      console.error('❌ Error creating appointment:', err);
      return res.status(500).json({ error: 'Failed to create appointment', details: err.message });
    }

    const appointmentId = this.lastID;
    console.log('✅ Appointment created with ID:', appointmentId);

    // Handle services with quantities
    let servicesToInsert = [];
    
    // Priority 1: Use serviceQuantities from add-appointment.js (preferred format)
    if (serviceQuantities && Array.isArray(serviceQuantities)) {
      servicesToInsert = serviceQuantities.map(item => ({
        id: item.serviceId,
        quantity: item.quantity || 1
      }));
      console.log('✅ Using serviceQuantities format:', servicesToInsert);
    }
    // Priority 2: Fallback to serviceIds array 
    else if (Array.isArray(serviceIds) && serviceIds.length > 0) {
      servicesToInsert = serviceIds.map(serviceData => {
        if (typeof serviceData === 'object' && serviceData.id) {
          return {
            id: serviceData.id,
            quantity: serviceData.quantity || 1
          };
        } else {
          return {
            id: parseInt(serviceData),
            quantity: 1
          };
        }
      });
      console.log('✅ Using serviceIds format:', servicesToInsert);
    }
    // Priority 3: Final fallback - use primary serviceId
    else if (serviceId) {
      servicesToInsert = [{
        id: parseInt(serviceId),
        quantity: 1
      }];
      console.log('✅ Using primary serviceId fallback:', servicesToInsert);
    }

    if (servicesToInsert.length === 0) {
      console.log('⚠️ No valid services to insert into junction table');
      return returnCreatedAppointment(appointmentId);
    }

    // Insert each service into the junction table with quantities
    let servicesProcessed = 0;
    let errors = [];

    servicesToInsert.forEach((serviceData, index) => {
      console.log(`📝 Inserting service ${index + 1}/${servicesToInsert.length}:`, serviceData);
      
      const serviceId = serviceData.id;
      const quantity = serviceData.quantity || 1;
      
      const junctionQuery = 'INSERT INTO appointment_services (appointmentId, serviceId, quantity) VALUES (?, ?, ?)';
      
      db.run(junctionQuery, [appointmentId, serviceId, quantity], function(junctionErr) {
        servicesProcessed++;
        
        if (junctionErr) {
          console.error(`❌ Error inserting service ${serviceId} with quantity ${quantity}:`, junctionErr);
          errors.push(junctionErr);
        } else {
          console.log(`✅ Service ${serviceId} (qty: ${quantity}) inserted with row ID:`, this.lastID);
        }
        
        if (servicesProcessed === servicesToInsert.length) {
          if (errors.length > 0) {
            console.error('⚠️ Some services failed to insert:', errors);
          }
          console.log('✅ All services processed, returning appointment');
          returnCreatedAppointment(appointmentId);
        }
      });
    });
  });

  function returnCreatedAppointment(appointmentId) {
    console.log('📤 Fetching created appointment with services for ID:', appointmentId);
    
    // Updated query to include quantities in the display
    const selectQuery = `
      SELECT 
        a.*,
        p.firstName || ' ' || p.lastName as patientName,
        p.firstName,
        p.lastName,
        s_primary.name as primaryServiceName,
        s_primary.duration as primaryServiceDuration,
        s_primary.price as primaryServicePrice,
        (
          SELECT GROUP_CONCAT(s_multi.name || ' (x' || as_junction.quantity || ')', ', ')
          FROM appointment_services as_junction 
          JOIN services s_multi ON as_junction.serviceId = s_multi.id
          WHERE as_junction.appointmentId = a.id
        ) as junctionServiceNames,
        (
          SELECT GROUP_CONCAT(s_multi.id || ':' || as_junction.quantity)
          FROM appointment_services as_junction 
          JOIN services s_multi ON as_junction.serviceId = s_multi.id
          WHERE as_junction.appointmentId = a.id
        ) as junctionServiceIds,
        (
          SELECT SUM(s_multi.price * as_junction.quantity)
          FROM appointment_services as_junction 
          JOIN services s_multi ON as_junction.serviceId = s_multi.id
          WHERE as_junction.appointmentId = a.id
        ) as junctionTotalPrice,
        (
          SELECT SUM(s_multi.duration * as_junction.quantity)
          FROM appointment_services as_junction 
          JOIN services s_multi ON as_junction.serviceId = s_multi.id
          WHERE as_junction.appointmentId = a.id
        ) as junctionTotalDuration,
        (
          SELECT COUNT(*)
          FROM appointment_services 
          WHERE appointmentId = a.id
        ) as junctionServiceCount
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      LEFT JOIN services s_primary ON a.serviceId = s_primary.id
      WHERE a.id = ?
    `;
    
    db.get(selectQuery, [appointmentId], (selectErr, row) => {
      if (selectErr) {
        console.error('❌ Error fetching created appointment:', selectErr);
        return res.status(500).json({ error: 'Appointment created but failed to fetch details' });
      }
      
      if (!row) {
        console.error('❌ Created appointment not found');
        return res.status(500).json({ error: 'Appointment created but not found' });
      }
      
      // Process the result to determine which services to use
      const hasJunctionServices = row.junctionServiceCount > 0;
      
      let finalServiceNames, finalServiceIds, finalTotalPrice, finalTotalDuration;
      
      if (hasJunctionServices) {
        finalServiceNames = row.junctionServiceNames;
        finalServiceIds = row.junctionServiceIds;
        finalTotalPrice = row.junctionTotalPrice;
        finalTotalDuration = row.junctionTotalDuration;
      } else {
        finalServiceNames = row.primaryServiceName;
        finalServiceIds = row.serviceId;
        finalTotalPrice = row.primaryServicePrice;
        finalTotalDuration = row.primaryServiceDuration;
      }
      
      const processedRow = {
        ...row,
        serviceName: finalServiceNames,
        procedure: finalServiceNames,
        serviceIds: finalServiceIds,
        serviceNames: finalServiceNames,
        totalPrice: finalTotalPrice,
        totalDuration: finalTotalDuration,
        hasMultipleServices: hasJunctionServices && finalServiceNames && finalServiceNames.includes(',')
      };
      
      console.log('✅ Returning created appointment:', {
        id: processedRow.id,
        serviceNames: processedRow.serviceNames,
        serviceIds: processedRow.serviceIds,
        totalPrice: processedRow.totalPrice,
        hasMultiple: processedRow.hasMultipleServices
      });
      
      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        appointment: processedRow,
        appointmentId: appointmentId
      });
    });
  }
});

app.get('/appointment-services', (req, res) => {
  console.log('🔄 GET /appointment-services - Fetching services for appointments');
  
  // Query to get both services and packages with unique identifiers
  const query = `
    SELECT 
      'service' as source_type,
      'svc_' || id as unique_id,
      id as original_id,
      name,
      description,
      price,
      duration,
      CASE 
        WHEN type IS NULL OR type = '' THEN 'Single Treatment'
        ELSE type 
      END as type,
      status
    FROM services 
    WHERE (type != 'Package Treatment' OR type IS NULL) 
      AND status = 'Active'
    
    UNION ALL
    
    SELECT 
      'package' as source_type,
      'pkg_' || id as unique_id,
      id as original_id,
      name,
      description,
      price,
      duration,
      'Package Treatment' as type,
      status
    FROM packages 
    WHERE status = 'Active'
    
    ORDER BY name ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching appointment services:', err);
      return res.status(500).json({ error: err.message });
    }

    const formattedServices = rows.map(row => ({
      id: row.unique_id, // Use unique ID to prevent conflicts
      originalId: row.original_id, // Keep original ID for database operations
      name: row.name,
      description: row.description || '',
      price: parseFloat(row.price) || 0,
      duration: parseInt(row.duration) || 0,
      type: row.type,
      status: row.status,
      isPackage: row.source_type === 'package',
      sourceType: row.source_type
    }));

    console.log(`✅ Fetched ${formattedServices.length} appointment services (${formattedServices.filter(s => s.isPackage).length} packages)`);
    res.json(formattedServices);
  });
});



app.get('/debug/appointment-services/:appointmentId', (req, res) => {
  const { appointmentId } = req.params;
  
  const query = `
    SELECT 
      a.id as appointmentId,
      a.patientId,
      a.serviceId as primaryServiceId,
      as_junction.serviceId as junctionServiceId,
      s.name as serviceName,
      s.price,
      s.duration
    FROM appointments a
    LEFT JOIN appointment_services as_junction ON a.id = as_junction.appointmentId
    LEFT JOIN services s ON as_junction.serviceId = s.id
    WHERE a.id = ?
    ORDER BY as_junction.serviceId
  `;
  
  db.all(query, [appointmentId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      appointmentId,
      primaryServiceId: rows[0]?.primaryServiceId,
      junctionServices: rows.filter(row => row.junctionServiceId).map(row => ({
        serviceId: row.junctionServiceId,
        serviceName: row.serviceName,
        price: row.price,
        duration: row.duration
      })),
      rawData: rows
    });
  });
});

// Debug endpoint to check all junction table data
app.get('/debug/all-appointment-services', (req, res) => {
  const query = `
    SELECT 
      as_junction.*,
      s.name as serviceName,
      a.patientId,
      p.firstName || ' ' || p.lastName as patientName
    FROM appointment_services as_junction
    LEFT JOIN services s ON as_junction.serviceId = s.id
    LEFT JOIN appointments a ON as_junction.appointmentId = a.id
    LEFT JOIN patients p ON a.patientId = p.id
    ORDER BY as_junction.appointmentId, as_junction.serviceId
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Debug endpoint to check table schema
app.get('/debug/table-schema/:tableName', (req, res) => {
  const { tableName } = req.params;
  db.all(`PRAGMA table_info(${tableName})`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});


// Replace your existing PUT appointments endpoint with this updated version
// PUT appointments endpoint (replace your existing one around line 800-1200)
app.put('/appointments/:id', (req, res) => {
  const { id } = req.params;
  const {
    appointmentDate,
    timeStart,
    timeEnd,
    comments,
    status,
    serviceIds // [{ id, quantity, isPackage }]
  } = req.body;

  console.log("=== PUT APPOINTMENT (FIXED) ===");
  console.log("Incoming serviceIds:", serviceIds);

  if (!id) {
    return res.status(400).json({ error: "Missing appointment ID" });
  }

  // UPDATE MAIN APPOINTMENT
  const updateQuery = `
    UPDATE appointments
    SET appointmentDate=?, timeStart=?, timeEnd=?, comments=?, status=?
    WHERE id=?
  `;

  db.run(updateQuery, [
    appointmentDate,
    timeStart,
    timeEnd,
    comments || "",
    status || "Scheduled",
    id
  ], function (err) {
    if (err) {
      console.error("❌ Appointment update failed:", err);
      return res.status(500).json({ error: "Failed to update appointment." });
    }

    console.log("✅ Main appointment updated.");

    // CLEAN OLD JUNCTION ROWS
    db.run("DELETE FROM appointment_services WHERE appointmentId=?", [id], (err) => {
      if (err) {
        console.error("❌ Failed to wipe old junction rows:", err);
        return res.status(500).json({ error: "Failed to clear previous services." });
      }

      console.log("🧹 Old services removed.");

      if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
        console.log("⚠️ No new services supplied.");
        return returnUpdatedAppointment();
      }

      let tasksRemaining = 0;
      let errors = [];

      // Helper to insert one row
      const insertServiceRow = (serviceId, quantity) => {
        tasksRemaining++;
        db.run(
          "INSERT INTO appointment_services (appointmentId, serviceId, quantity) VALUES (?, ?, ?)",
          [id, serviceId, quantity],
          (err) => {
            tasksRemaining--;
            if (err) {
              console.error("❌ Failed inserting service:", err);
              errors.push(err);
            }
            if (tasksRemaining === 0) finishInsertion();
          }
        );
      };

      // Helper to finish
      const finishInsertion = () => {
        if (errors.length > 0) {
          return res.status(500).json({ error: "Some services failed to insert." });
        }
        return returnUpdatedAppointment();
      };

      // Loop through each selected item
      serviceIds.forEach((item) => {
        const { id: rawId, quantity, isPackage } = item;
        const baseQty = quantity || 1;
        const realServiceId = parseInt(rawId); // ensure clean ID

        if (isPackage) {
          // Expand package → package_services
          console.log(`📦 Expanding package ID ${realServiceId}`);

          tasksRemaining++;
          db.all(
            "SELECT serviceId, quantity FROM package_services WHERE packageId=?",
            [realServiceId],
            (err, pkgRows) => {
              tasksRemaining--;

              if (err) {
                console.error("❌ Error fetching package contents:", err);
                errors.push(err);
                if (tasksRemaining === 0) finishInsertion();
                return;
              }

              if (!pkgRows || pkgRows.length === 0) {
                console.log("⚠️ Package has no inner services. Inserting package itself.");
                insertServiceRow(realServiceId, baseQty);
                return;
              }

              pkgRows.forEach((row) => {
                const expandedQty = row.quantity * baseQty;
                console.log(`➡️ Insert service ${row.serviceId} (qty: ${expandedQty})`);
                insertServiceRow(row.serviceId, expandedQty);
              });

              if (tasksRemaining === 0) finishInsertion();
            }
          );
        } else {
          console.log(`➕ Inserting regular service ${realServiceId} x ${baseQty}`);
          insertServiceRow(realServiceId, baseQty);
        }
      });
    });
  });

  // RETURN UPDATED APPOINTMENT (WITH PACKAGE EXPANSION)
  function returnUpdatedAppointment() {
    console.log("📥 Fetching updated appointment...");

    const selectQuery = `
      SELECT 
        a.*,
        p.firstName || ' ' || p.lastName AS patientName,
        (
          SELECT GROUP_CONCAT(s.name || ' (x' || aps.quantity || ')', ', ')
          FROM appointment_services aps
          JOIN services s ON aps.serviceId = s.id
          WHERE aps.appointmentId = a.id
        ) AS serviceNames,
        (
          SELECT GROUP_CONCAT(aps.serviceId || ':' || aps.quantity)
          FROM appointment_services aps
          WHERE aps.appointmentId = a.id
        ) AS serviceIds
      FROM appointments a
      LEFT JOIN patients p ON p.id = a.patientId
      WHERE a.id = ?
    `;

    db.get(selectQuery, [id], (err, row) => {
      if (err || !row) {
        console.error("❌ Failed returning updated appointment:", err);
        return res.status(500).json({ error: "Failed returning updated appointment." });
      }

      console.log("✅ Returning updated appointment:", row);
      res.json(row);
    });
  }
});


//APPOINTMENTS AYAW SAG HILABTI//







// Remove any existing package endpoints and replace with this complete section:

// =====================================================
// ENHANCED PACKAGE MANAGEMENT SYSTEM
// =====================================================

// Helper function to fetch package with its services and quantities
function getPackageWithServices(packageId, callback) {
  const pkgQuery = `SELECT * FROM packages WHERE id = ?`;
  
  db.get(pkgQuery, [packageId], (err, packageRow) => {
    if (err) return callback(err);
    if (!packageRow) return callback(null, null);

    // Fetch services for this package with quantities
    const servicesQuery = `
      SELECT 
        ps.id as packageServiceId,
        ps.serviceId,
        ps.quantity,
        s.name,
        s.description,
        s.price,
        s.duration,
        s.type,
        s.status
      FROM package_services ps
      LEFT JOIN services s ON ps.serviceId = s.id
      WHERE ps.packageId = ?
      ORDER BY s.name ASC
    `;
    
    db.all(servicesQuery, [packageId], (sErr, serviceRows) => {
      if (sErr) return callback(sErr);
      
      const packageServices = (serviceRows || []).map(row => ({
        packageServiceId: row.packageServiceId,
        serviceId: row.serviceId,
        name: row.name || 'Unknown Service',
        description: row.description || '',
        price: row.price || 0,
        duration: row.duration || 0,
        type: row.type || 'Single Treatment',
        status: row.status || 'Active',
        quantity: row.quantity || 1
      }));

      // Calculate totals
      const totalPrice = packageServices.reduce((sum, service) => 
        sum + ((service.price || 0) * (service.quantity || 1)), 0
      );
      const totalDuration = packageServices.reduce((sum, service) => 
        sum + ((service.duration || 0) * (service.quantity || 1)), 0
      );

      const result = {
        ...packageRow,
        type: 'Package Treatment',
        packageServices: packageServices,
        services: packageServices, // For compatibility
        serviceCount: packageServices.length,
        calculatedPrice: totalPrice,
        calculatedDuration: totalDuration
      };
      
      callback(null, result);
    });
  });
}

// GET /packages - List all packages with their services
app.get('/packages', (req, res) => {
  console.log('📦 GET /packages - Fetching all packages');
  
  const query = `SELECT * FROM packages ORDER BY createdAt DESC`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching packages:', err);
      return res.status(500).json({ error: err.message });
    }

    if (rows.length === 0) {
      console.log('✅ No packages found');
      return res.json([]);
    }

    // Fetch services for each package
    let processedCount = 0;
    const results = [];

    rows.forEach((pkg) => {
      getPackageWithServices(pkg.id, (gErr, fullPackage) => {
        processedCount++;
        
        if (gErr) {
          console.error(`❌ Error fetching services for package ${pkg.id}:`, gErr);
        } else if (fullPackage) {
          results.push(fullPackage);
        }

        if (processedCount === rows.length) {
          results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          console.log(`✅ Fetched ${results.length} packages with services`);
          res.json(results);
        }
      });
    });
  });
});

// Add this endpoint after your GET /packages endpoint (around line 950)
app.get('/packages/:id', (req, res) => {
  const packageId = parseInt(req.params.id);
  
  console.log(`📦 GET /packages/${packageId} - Fetching package details`);
  
  if (!packageId || packageId < 1) {
    return res.status(400).json({ error: 'Invalid package ID' });
  }

  getPackageWithServices(packageId, (err, packageData) => {
    if (err) {
      console.error('❌ Error fetching package:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!packageData) {
      console.log(`❌ Package ${packageId} not found`);
      return res.status(404).json({ error: 'Package not found' });
    }
    
    console.log(`✅ Package ${packageId} found with ${packageData.packageServices?.length || 0} services`);
    res.json(packageData);
  });
});

app.get('/service-table', (req, res) => {
  console.log('📋 GET /service-table - Fetching all services');
  
  const query = `
    SELECT 
      id,
      name,
      description,
      price,
      duration,
      CASE 
        WHEN type IS NULL OR type = '' THEN 'Single Treatment'
        ELSE type 
      END as type,
      status
    FROM services 
    ORDER BY name ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching services:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`✅ Found ${rows.length} services`);
    res.json(rows || []);
  });
});




app.put('/packages/:id', (req, res) => {
  const packageId = parseInt(req.params.id);
  const { name, description, price, duration, status, services } = req.body;
  
  console.log(`📦 PUT /packages/${packageId} - Updating package`);
  console.log('Request body:', req.body);
  
  if (!packageId || packageId < 1) {
    return res.status(400).json({ error: 'Invalid package ID' });
  }

  // Get current package for logging
  getPackageWithServices(packageId, (getErr, oldPackage) => {
    if (getErr) {
      console.error('Error getting old package:', getErr);
      return res.status(500).json({ error: getErr.message });
    }
    
    if (!oldPackage) {
      console.log(`Package ${packageId} not found`);
      return res.status(404).json({ error: 'Package not found' });
    }

    // Build update query dynamically
    const fields = [];
    const values = [];
    
    if (name !== undefined) { fields.push('name = ?'); values.push(name.trim()); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (price !== undefined) { fields.push('price = ?'); values.push(parseFloat(price) || 0); }
    if (duration !== undefined) { fields.push('duration = ?'); values.push(parseInt(duration) || 0); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    
    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(packageId);

    const updateQuery = `UPDATE packages SET ${fields.join(', ')} WHERE id = ?`;
    
    console.log('Update query:', updateQuery);
    console.log('Update values:', values);

    db.run(updateQuery, values, function(err) {
      if (err) {
        console.error('Error updating package:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        console.log('No changes made to package');
        return res.status(404).json({ error: 'Package not found or no changes made' });
      }

      console.log(`✅ Package ${packageId} updated successfully`);

      // Return the updated package
      getPackageWithServices(packageId, (finalErr, updatedPackage) => {
        if (finalErr) {
          console.error('Error fetching updated package:', finalErr);
          return res.status(500).json({ error: 'Package updated but failed to fetch updated data' });
        }
        
        console.log('Returning updated package:', updatedPackage.name);
        res.json({
          success: true,
          message: 'Package updated successfully',
          package: updatedPackage
        });
      });
    });
  });
});

// POST /packages - Create new package with services
app.post('/packages', (req, res) => {
  const { 
    name, 
    description = '', 
    price = 0, 
    duration = 0, 
    status = 'Active', 
    services = [] 
  } = req.body;
  
  console.log('📦 POST /packages - Creating package:', { 
    name, 
    servicesCount: services.length,
    services: services
  });
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Package name is required' });
  }

  if (!Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ error: 'Package must contain at least one service' });
  }

  // Validate that all services exist
  const serviceIds = services.map(s => parseInt(s.serviceId)).filter(id => !isNaN(id));
  if (serviceIds.length === 0) {
    return res.status(400).json({ error: 'No valid services provided' });
  }

  const placeholders = serviceIds.map(() => '?').join(',');
  const checkServicesQuery = `SELECT id FROM services WHERE id IN (${placeholders})`;

  db.all(checkServicesQuery, serviceIds, (err, existingServices) => {
    if (err) {
      console.error('❌ Error checking services:', err);
      return res.status(500).json({ error: err.message });
    }

    const existingServiceIds = existingServices.map(s => s.id);
    const missingServices = serviceIds.filter(id => !existingServiceIds.includes(id));

    if (missingServices.length > 0) {
      return res.status(400).json({ 
        error: `Services not found: ${missingServices.join(', ')}` 
      });
    }

    // Create the package
    const now = new Date().toISOString();
    const insertQuery = `
      INSERT INTO packages (name, description, price, duration, status, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertQuery, [name.trim(), description, price, duration, status, now, now], function(err) {
      if (err) {
        console.error('❌ Error creating package:', err);
        return res.status(500).json({ error: err.message });
      }

      const newPackageId = this.lastID;
      console.log(`✅ Package created with ID: ${newPackageId}`);

      // Add services to package
      const insertServiceQuery = `
        INSERT INTO package_services (packageId, serviceId, quantity, createdAt) 
        VALUES (?, ?, ?, ?)
      `;
      
      db.serialize(() => {
        const stmt = db.prepare(insertServiceQuery);
        
        services.forEach(service => {
          const serviceId = parseInt(service.serviceId);
          const quantity = parseInt(service.quantity) || 1;
          
          if (serviceId && serviceId > 0) {
            stmt.run(newPackageId, serviceId, quantity, now);
          }
        });
        
        stmt.finalize((finalErr) => {
          if (finalErr) {
            console.error('❌ Error adding services to package:', finalErr);
          }
          
          // Return the complete package
          getPackageWithServices(newPackageId, (gErr, newPackage) => {
            if (gErr) {
              console.error('❌ Error fetching created package:', gErr);
              return res.status(500).json({ error: gErr.message });
            }
            
            // Log activity
            if (typeof logActivity === 'function') {
              logActivity(
                'Package Created',
                `Package "${name}" created with ${newPackage.packageServices.length} services`,
                'packages',
                newPackageId,
                req.user?.id,
                req.user?.username || 'system',
                null,
                { name, description, price, duration, status, services },
                req
              );
            }
            
            console.log(`✅ Package created successfully with ${newPackage.packageServices.length} services`);
            res.status(201).json(newPackage);
          });
        });
      });
    });
  });
});

// PUT /packages/:id - Update package and its services
app.put('/packages/:id', (req, res) => {
  const packageId = parseInt(req.params.id);
  const { name, description, price, duration, status, services } = req.body;
  
  console.log(`📦 PUT /packages/${packageId} - Updating package`);
  
  if (!packageId || packageId < 1) {
    return res.status(400).json({ error: 'Invalid package ID' });
  }

  // Get current package for logging
  getPackageWithServices(packageId, (getErr, oldPackage) => {
    if (getErr) {
      return res.status(500).json({ error: getErr.message });
    }
    
    if (!oldPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Build update query dynamically
    const fields = [];
    const values = [];
    
    if (name !== undefined) { fields.push('name = ?'); values.push(name.trim()); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (price !== undefined) { fields.push('price = ?'); values.push(price); }
    if (duration !== undefined) { fields.push('duration = ?'); values.push(duration); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    
    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(packageId);

    const updateQuery = `UPDATE packages SET ${fields.join(', ')} WHERE id = ?`;

    db.run(updateQuery, values, function(err) {
      if (err) {
        console.error(`❌ Error updating package ${packageId}:`, err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Package not found' });
      }

      // Update services if provided
      if (Array.isArray(services)) {
        console.log(`🔄 Updating services for package ${packageId}`);
        
        // Validate services exist first
        if (services.length > 0) {
          const serviceIds = services.map(s => parseInt(s.serviceId)).filter(id => !isNaN(id));
          const placeholders = serviceIds.map(() => '?').join(',');
          const checkQuery = `SELECT id FROM services WHERE id IN (${placeholders})`;

          db.all(checkQuery, serviceIds, (checkErr, existingServices) => {
            if (checkErr) {
              return res.status(500).json({ error: checkErr.message });
            }

            const existingIds = existingServices.map(s => s.id);
            const missingIds = serviceIds.filter(id => !existingIds.includes(id));

            if (missingIds.length > 0) {
              return res.status(400).json({ 
                error: `Services not found: ${missingIds.join(', ')}` 
              });
            }

            updatePackageServices();
          });
        } else {
          updatePackageServices();
        }
      } else {
        // No services update - return updated package
        getPackageWithServices(packageId, (gErr, updatedPackage) => {
          if (gErr) return res.status(500).json({ error: gErr.message });
          
          if (typeof logActivity === 'function') {
            logActivity(
              'Package Updated',
              `Package "${updatedPackage.name}" metadata updated`,
              'packages',
              packageId,
              req.user?.id,
              req.user?.username || 'system',
              oldPackage,
              { name, description, price, duration, status },
              req
            );
          }
          
          console.log(`✅ Package ${packageId} updated (metadata only)`);
          res.json(updatedPackage);
        });
      }

      function updatePackageServices() {
        // Replace all services
        db.serialize(() => {
          db.run('DELETE FROM package_services WHERE packageId = ?', [packageId], (delErr) => {
            if (delErr) {
              console.error('❌ Error deleting old package services:', delErr);
              return res.status(500).json({ error: delErr.message });
            }

            if (services.length === 0) {
              // No services to add
              getPackageWithServices(packageId, (gErr, updatedPackage) => {
                if (gErr) return res.status(500).json({ error: gErr.message });
                
                if (typeof logActivity === 'function') {
                  logActivity(
                    'Package Updated',
                    `Package "${updatedPackage.name}" updated (services cleared)`,
                    'packages',
                    packageId,
                    req.user?.id,
                    req.user?.username || 'system',
                    oldPackage,
                    { services },
                    req
                  );
                }
                
                console.log(`✅ Package ${packageId} updated (no services)`);
                res.json(updatedPackage);
              });
            } else {
              // Add new services
              const now = new Date().toISOString();
              const stmt = db.prepare('INSERT INTO package_services (packageId, serviceId, quantity, createdAt) VALUES (?, ?, ?, ?)');
              
              services.forEach(service => {
                const serviceId = parseInt(service.serviceId);
                const quantity = parseInt(service.quantity) || 1;
                
                if (serviceId && serviceId > 0) {
                  stmt.run(packageId, serviceId, quantity, now);
                }
              });
              
              stmt.finalize((finalErr) => {
                if (finalErr) {
                  console.error('❌ Error adding new package services:', finalErr);
                  return res.status(500).json({ error: finalErr.message });
                }
                
                getPackageWithServices(packageId, (gErr, updatedPackage) => {
                  if (gErr) return res.status(500).json({ error: gErr.message });
                  
                  if (typeof logActivity === 'function') {
                    logActivity(
                      'Package Updated',
                      `Package "${updatedPackage.name}" updated with ${updatedPackage.packageServices.length} services`,
                      'packages',
                      packageId,
                      req.user?.id,
                      req.user?.username || 'system',
                      oldPackage,
                      { services },
                      req
                    );
                  }
                  
                  console.log(`✅ Package ${packageId} updated with ${updatedPackage.packageServices.length} services`);
                  res.json(updatedPackage);
                });
              });
            }
          });
        });
      }
    });
  });
});

// DELETE /packages/:id - Delete package and its services
app.delete('/packages/:id', (req, res) => {
  const packageId = parseInt(req.params.id);
  
  console.log(`📦 DELETE /packages/${packageId} - Deleting package`);
  
  if (!packageId || packageId < 1) {
    return res.status(400).json({ error: 'Invalid package ID' });
  }

  // Get package info for logging before deletion
  getPackageWithServices(packageId, (getErr, packageToDelete) => {
    if (getErr) {
      return res.status(500).json({ error: getErr.message });
    }
    
    if (!packageToDelete) {
      return res.status(404).json({ error: 'Package not found' });
    }

    db.serialize(() => {
      // Delete package services first
      db.run('DELETE FROM package_services WHERE packageId = ?', [packageId], (delErr) => {
        if (delErr) {
          console.error(`❌ Error deleting package services for ${packageId}:`, delErr);
          return res.status(500).json({ error: delErr.message });
        }

        // Delete the package
        db.run('DELETE FROM packages WHERE id = ?', [packageId], function(pkgErr) {
          if (pkgErr) {
            console.error(`❌ Error deleting package ${packageId}:`, pkgErr);
            return res.status(500).json({ error: pkgErr.message });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Package not found' });
          }

          if (typeof logActivity === 'function') {
            logActivity(
              'Package Deleted',
              `Package "${packageToDelete.name}" deleted with ${packageToDelete.packageServices.length} services`,
              'packages',
              packageId,
              req.user?.id,
              req.user?.username || 'system',
              packageToDelete,
              null,
              req
            );
          }

          console.log(`✅ Package ${packageId} deleted successfully`);
          res.json({ 
            success: true, 
            message: 'Package deleted successfully',
            deletedPackage: packageToDelete.name
          });
        });
      });
    });
  });
});

// Utility endpoints for package management
// GET /packages/:id/services - Get only the services of a package
app.get('/packages/:id/services', (req, res) => {
  const packageId = parseInt(req.params.id);
  
  if (!packageId) {
    return res.status(400).json({ error: 'Invalid package ID' });
  }

  const query = `
    SELECT 
      ps.id as packageServiceId,
      ps.serviceId,
      ps.quantity,
      s.name,
      s.description, 
      s.price,
      s.duration,
      s.type,
      s.status
    FROM package_services ps
    LEFT JOIN services s ON ps.serviceId = s.id
    WHERE ps.packageId = ?
    ORDER BY s.name ASC
  `;

  db.all(query, [packageId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const services = rows.map(row => ({
      packageServiceId: row.packageServiceId,
      serviceId: row.serviceId,
      name: row.name || 'Unknown Service',
      description: row.description || '',
      price: row.price || 0,
      duration: row.duration || 0,
      type: row.type || 'Single Treatment',
      status: row.status || 'Active',
      quantity: row.quantity || 1
    }));

    res.json(services);
  });
});



// ADD this endpoint after your existing service endpoints (around line 2600):
app.get('/services-and-packages', (req, res) => {
  console.log('🔄 GET /services-and-packages - Fetching combined data');
  
  // Fetch services (excluding packages from services table)
  const servicesQuery = `
    SELECT *, 
           CASE 
             WHEN type IS NULL OR type = '' THEN 'Single Treatment'
             ELSE type 
           END as type 
    FROM services 
    WHERE type != 'Package Treatment' OR type IS NULL
    ORDER BY name ASC
  `;
  
  db.all(servicesQuery, [], (err, services) => {
    if (err) {
      console.error('❌ Error fetching services:', err);
      return res.status(500).json({ 
        error: err.message,
        services: [],
        packages: [],
        all: []
      });
    }

    console.log(`✅ Fetched ${services.length} services`);

    // Fetch packages from packages table
    const packagesQuery = `SELECT * FROM packages ORDER BY name ASC`;
    
    db.all(packagesQuery, [], (packErr, packages) => {
      if (packErr) {
        console.error('❌ Error fetching packages:', packErr);
        return res.json({
          services: services || [],
          packages: [],
          all: services || []
        });
      }

      console.log(`✅ Fetched ${packages.length} packages`);

      // Format packages with calculated totals
      let processedPackages = 0;
      const formattedPackages = [];

      if (packages.length === 0) {
        // No packages, return services only
        const formattedServices = (services || []).map(service => ({
          ...service,
          type: service.type || 'Single Treatment'
        }));

        return res.json({
          services: formattedServices,
          packages: [],
          all: formattedServices
        });
      }

      packages.forEach(pkg => {
        getPackageWithServices(pkg.id, (pkgErr, fullPackage) => {
          processedPackages++;
          
          if (pkgErr) {
            console.error(`❌ Error processing package ${pkg.id}:`, pkgErr);
          } else if (fullPackage) {
            formattedPackages.push({
              ...fullPackage,
              type: 'Package Treatment'
            });
          }

          if (processedPackages === packages.length) {
            // All packages processed
            const formattedServices = (services || []).map(service => ({
              ...service,
              type: service.type || 'Single Treatment'
            }));

            // Combine all items
            const allItems = [...formattedServices, ...formattedPackages];
            allItems.sort((a, b) => a.name.localeCompare(b.name));

            console.log(`✅ Combined ${allItems.length} total items (${formattedServices.length} services + ${formattedPackages.length} packages)`);

            res.json({
              services: formattedServices,
              packages: formattedPackages,
              all: allItems
            });
          }
        });
      });
    });
  });
});













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



//PATIENT ENDPOINTS

// GET all patients with optional filtering
app.get('/patients', (req, res) => {
  console.log('📋 GET /patients - Fetching all patients');
  console.log('Query params:', req.query);
  
  // Build dynamic WHERE clause based on query params
  const allowedFilters = ['sex', 'status'];
  const filters = [];
  const values = [];
  
  allowedFilters.forEach(key => {
    if (req.query[key]) {
      filters.push(`${key} = ?`);
      values.push(req.query[key]);
    }
  });
  
  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  
  const query = `
    SELECT 
      id,
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
    FROM patients 
    ${whereClause}
    ORDER BY lastName ASC, firstName ASC
  `;
  
  db.all(query, values, (err, rows) => {
    if (err) {
      console.error('❌ Error fetching patients:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`✅ Found ${rows.length} patients`);
    res.json(rows || []);
  });
});

// GET patient by ID
app.get('/patients/:id', (req, res) => {
  const { id } = req.params;
  console.log(`📋 GET /patients/${id} - Fetching patient details`);
  
  const query = `
    SELECT * FROM patients WHERE id = ?
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('❌ Error fetching patient:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      console.log(`❌ Patient ${id} not found`);
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    console.log(`✅ Patient ${id} found:`, row.firstName, row.lastName);
    res.json(row);
  });
});


app.get('/debug/patients', (req, res) => {
  db.all('SELECT COUNT(*) as count FROM patients', [], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.all('SELECT * FROM patients LIMIT 5', [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        totalPatients: countResult[0].count,
        samplePatients: rows,
        message: `Database has ${countResult[0].count} patients total`
      });
    });
  });
});

// GET medical information for a patient
app.get('/medical-information/:patientId', (req, res) => {
  const { patientId } = req.params;
  console.log(`🩺 GET /medical-information/${patientId} - Fetching medical info`);
  
  const query = `
    SELECT * FROM MedicalInformation WHERE patientId = ?
  `;
  
  db.get(query, [patientId], (err, row) => {
    if (err) {
      console.error('❌ Error fetching medical information:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      console.log(`ℹ️ No medical information found for patient ${patientId}`);
      return res.json(null);
    }
    
    console.log(`✅ Medical information found for patient ${patientId}`);
    res.json(row);
  });
});



// Add patient endpoint (replace your existing one)
app.post('/patients', (req, res) => {
  const {
    firstName, lastName, middleName, suffix, maritalStatus,
    contactNumber, occupation, address, dateOfBirth, sex,
    contactPersonName, contactPersonRelationship, contactPersonNumber,
    contactPersonAddress, dateCreated, toothChart,
    skipLogging= false
  } = req.body;

  // First, insert the patient
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
      if (err) {
        console.error('Error adding patient:', err);
        return res.status(500).json({ error: err.message });
      }
      
      const patientId = this.lastID;
      const patientName = `${firstName} ${lastName}`.trim();
      
      // ONLY log the patient creation (remove duplicate logging)
      logActivity(
        'Patient Added',
        `New patient record created for ${patientName}`,
        'patients',
        patientId,
        req.user?.id,
        req.user?.username || 'system',
        null,
        { firstName, lastName, middleName, contactNumber, dateOfBirth, sex },
        req
      );


   
      // If tooth chart data exists, save it WITHOUT logging here
      if (toothChart && (toothChart.selectedTeeth.length > 0 || Object.keys(toothChart.toothSummaries).length > 0)) {
        db.run(
          'INSERT INTO tooth_charts (patientId, selectedTeeth, toothSummaries, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
          [
            patientId,
            JSON.stringify(toothChart.selectedTeeth || []),
            JSON.stringify(toothChart.toothSummaries || {}),
            new Date().toISOString(),
            new Date().toISOString()
          ],
          function (toothErr) {
            if (toothErr) {
              console.error('Error saving tooth chart:', toothErr);
            }
            // DON'T log here - tooth chart logging will happen when explicitly saved via PUT /tooth-chart/:patientId
            
            // SEND RESPONSE HERE AFTER TOOTH CHART IS SAVED
            res.json({ id: patientId, message: 'Patient added successfully' });
          }
        );
      } else {
        // SEND RESPONSE HERE IF NO TOOTH CHART
        res.json({ id: patientId, message: 'Patient added successfully' });
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

// Replace your PUT /tooth-chart/:patientId endpoint
// Replace your PUT /tooth-chart/:patientId endpoint
app.put('/tooth-chart/:patientId', (req, res) => {
  const patientId = req.params.patientId;
  const { 
    selectedTeeth, 
    toothSummaries,
    // Add flag to control logging
    skipLogging = false 
  } = req.body;

  
   // Get patient name for logging
  db.get('SELECT firstName, lastName FROM patients WHERE id = ?', [patientId], (err, patient) => {
    if (err) {
      console.error('Error fetching patient:', err);
      return res.status(500).json({ error: err.message });
    }

    const patientName = patient ? `${patient.firstName} ${patient.lastName}`.trim() : `Patient ID ${patientId}`;

    // Check if tooth chart exists
    db.get('SELECT * FROM tooth_charts WHERE patientId = ?', [patientId], (err, oldChart) => {
      if (err) {
        console.error('Error fetching tooth chart:', err);
        return res.status(500).json({ error: err.message });
      }



   if (oldChart) {
        // Update existing tooth chart
        db.run(
          'UPDATE tooth_charts SET selectedTeeth = ?, toothSummaries = ?, updatedAt = ? WHERE patientId = ?',
          [JSON.stringify(selectedTeeth), JSON.stringify(toothSummaries), new Date().toISOString(), patientId],
          function (updateErr) {
            if (updateErr) {
              console.error('Error updating tooth chart:', updateErr);
              return res.status(500).json({ error: updateErr.message });
            }

            // Only log if this is explicit tooth chart update (not cascade)
            if (!skipLogging && this.changes > 0) {
              logActivity(
                'Tooth Chart Updated',
                `Tooth chart updated for ${patientName}`,
                'tooth_charts',
                oldChart.id,
                req.user?.id,
                req.user?.username || 'system',
                { selectedTeeth: JSON.parse(oldChart.selectedTeeth || '[]'), toothSummaries: JSON.parse(oldChart.toothSummaries || '{}') },
                { selectedTeeth, toothSummaries },
                req
              );
            }

            res.json({ message: 'Tooth chart updated successfully' });
          }
        );
      } else {
        // Create new tooth chart - only log if not cascade
        db.run(
          'INSERT INTO tooth_charts (patientId, selectedTeeth, toothSummaries, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
          [patientId, JSON.stringify(selectedTeeth), JSON.stringify(toothSummaries), new Date().toISOString(), new Date().toISOString()],
          function (insertErr) {
            if (insertErr) {
              console.error('Error creating tooth chart:', insertErr);
              return res.status(500).json({ error: insertErr.message });
            }

            // Only log if this is explicit creation (not cascade)
            if (!skipLogging) {
              logActivity(
                'Tooth Chart Added',
                `Tooth chart created for ${patientName}`,
                'tooth_charts',
                this.lastID,
                req.user?.id,
                req.user?.username || 'system',
                null,
                { selectedTeeth, toothSummaries },
                req
              );
            }

            res.json({ id: this.lastID, message: 'Tooth chart created successfully' });
          }
        );
      }
    });
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

// Update patient information
app.put('/patients/:id', (req, res) => {
  const patientId = req.params.id;
  const {
    firstName, lastName, middleName, suffix, maritalStatus,
    contactNumber, occupation, address, dateOfBirth, sex,
    contactPersonName, contactPersonRelationship, contactPersonNumber,
    contactPersonAddress,
    skipLogging =  false
  } = req.body;

  
  // First get the old values for logging
  db.get('SELECT * FROM patients WHERE id = ?', [patientId], (err, oldPatient) => {
    if (err) {
      console.error('Error fetching patient for logging:', err);
      return res.status(500).json({ error: err.message });
    }

    if (!oldPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Log the patient update



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
    function (updateErr) {
        if (updateErr) {
          console.error('Error updating patient:', updateErr);
          return res.status(500).json({ error: updateErr.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Patient not found' });
        }

         // Only log if this is not a cascade update and something actually changed
         if (!skipLogging && this.changes > 0) {
          const patientName = `${firstName || oldPatient.firstName} ${lastName || oldPatient.lastName}`.trim();
          
          // Identify what changed for better logging
          const changes = [];
          if (firstName !== oldPatient.firstName) changes.push(`name: "${oldPatient.firstName}" → "${firstName}"`);
          if (lastName !== oldPatient.lastName) changes.push(`surname: "${oldPatient.lastName}" → "${lastName}"`);
          if (contactNumber !== oldPatient.contactNumber) changes.push(`contact: "${oldPatient.contactNumber}" → "${contactNumber}"`);
          if (address !== oldPatient.address) changes.push(`address updated`);
          if (dateOfBirth !== oldPatient.dateOfBirth) changes.push(`DOB: "${oldPatient.dateOfBirth}" → "${dateOfBirth}"`);
          if (maritalStatus !== oldPatient.maritalStatus) changes.push(`marital status updated`);
          if (occupation !== oldPatient.occupation) changes.push(`occupation updated`);
          
          const changeDescription = changes.length > 0 ? ` (${changes.join(', ')})` : '';
          
          // ONLY log the patient update if there are actual changes
          if (changes.length > 0) {
            logActivity(
              'Patient Updated',
              `Patient record updated for ${patientName}${changeDescription}`,
              'patients',
              patientId,
              req.user?.id,
              req.user?.username || 'system',
              oldPatient,
              { firstName, lastName, middleName, contactNumber, address, dateOfBirth, sex, maritalStatus, occupation },
              req
            );
          }
        }


        res.json({ message: 'Patient updated successfully', changes: this.changes });
      }
    );
  });
})




// Update medical information
app.put('/medical-information/:patientId', (req, res) => {
  const patientId = req.params.patientId;
  const {
    allergies, bloodType, bloodborneDiseases, pregnancyStatus,
    medications, additionalNotes, bloodPressure, diabetic,
    skipLogging = false
  } = req.body;

// Get patient name for logging
db.get('SELECT firstName, lastName FROM patients WHERE id = ?', [patientId], (err, patient) => {
  if (err) {
    console.error('Error fetching patient:', err);
    return res.status(500).json({ error: err.message });
  }

  const patientName = patient ? `${patient.firstName} ${patient.lastName}`.trim() : `Patient ID ${patientId}`;
// Check if medical information exists for this patient
db.get('SELECT * FROM MedicalInformation WHERE patientId = ?', [patientId], (err, oldMedInfo) => {
  if (err) {
    console.error('Error fetching medical info:', err);
    return res.status(500).json({ error: err.message });
  }

  if (oldMedInfo) {
    // Update existing medical information
    db.run(
      `UPDATE MedicalInformation SET 
        allergies = ?, bloodType = ?, bloodborneDiseases = ?, pregnancyStatus = ?,
        medications = ?, additionalNotes = ?, bloodPressure = ?, diabetic = ?
       WHERE patientId = ?`,
      [allergies, bloodType, bloodborneDiseases, pregnancyStatus, medications, additionalNotes, bloodPressure, diabetic, patientId],
      function (updateErr) {
        if (updateErr) {
          console.error('Error updating medical info:', updateErr);
          return res.status(500).json({ error: updateErr.message });
        }

         // Only log if this is an explicit medical info update (not cascade)
            if (!skipLogging && this.changes > 0) {
              // Identify what changed
              const changes = [];
              if (allergies !== oldMedInfo.allergies) changes.push('allergies');
              if (bloodType !== oldMedInfo.bloodType) changes.push('blood type');
              if (medications !== oldMedInfo.medications) changes.push('medications');
              if (bloodPressure !== oldMedInfo.bloodPressure) changes.push('blood pressure');
              
              const changeDescription = changes.length > 0 ? ` (${changes.join(', ')} updated)` : '';

              logActivity(
                'Medical Info Updated',
                `Medical information updated for ${patientName}${changeDescription}`,
                'MedicalInformation',
                oldMedInfo.id,
                req.user?.id,
                req.user?.username || 'system',
                oldMedInfo,
                { allergies, bloodType, bloodborneDiseases, pregnancyStatus, medications, additionalNotes, bloodPressure, diabetic },
                req
              );
            }


        res.json({ message: 'Medical information updated successfully' });
      }
    );
  } else {

     // Create new medical information - only log if not cascade
        db.run(
          `INSERT INTO MedicalInformation (
            patientId, allergies, bloodType, bloodborneDiseases, pregnancyStatus, medications, additionalNotes, bloodPressure, diabetic
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [patientId, allergies, bloodType, bloodborneDiseases, pregnancyStatus, medications, additionalNotes, bloodPressure, diabetic],
          function (insertErr) {
            if (insertErr) {
              console.error('Error creating medical info:', insertErr);
              return res.status(500).json({ error: insertErr.message });
            }

            // Only log if this is explicit creation (not cascade)
            if (!skipLogging) {
              logActivity(
                'Medical Info Added',
                `Medical information created for ${patientName}`,
                'MedicalInformation',
                this.lastID,
                req.user?.id,
                req.user?.username || 'system',
                null,
                { allergies, bloodType, bloodborneDiseases, pregnancyStatus, medications, additionalNotes, bloodPressure, diabetic },
                req
              );
            }

            res.json({ id: this.lastID, message: 'Medical information created successfully' });
          }
        );
      }
    });
  });
});




//PATIENT ENDPOINTS








//AMBOT UNSA NI

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






//LOGIN ENDPOINTS

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

// Also fix the POST /medical-information endpoint (around line 1800)
app.post('/medical-information', (req, res) => {
  const {
    patientId, allergies, bloodType, bloodborneDiseases, pregnancyStatus,
    medications, additionalNotes, bloodPressure, diabetic
  } = req.body;

  // Get patient name for logging
  db.get('SELECT firstName, lastName FROM patients WHERE id = ?', [patientId], (err, patient) => {
    if (err) {
      console.error('Error fetching patient:', err);
      return res.status(500).json({ error: err.message });
    }

    const patientName = patient ? `${patient.firstName} ${patient.lastName}`.trim() : `Patient ID ${patientId}`;

    db.run(
      `INSERT INTO MedicalInformation (
        patientId, allergies, bloodType, bloodborneDiseases, pregnancyStatus, medications, additionalNotes, bloodPressure, diabetic
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patientId, allergies, bloodType, bloodborneDiseases, pregnancyStatus, medications, additionalNotes, bloodPressure, diabetic],
      function (err) {
        if (err) {
          console.error('Error adding medical info:', err);
          return res.status(500).json({ error: err.message });
        }

        // Log ONLY the medical info creation
        logActivity(
          'Medical Info Added',
          `Medical information created for ${patientName}`,
          'MedicalInformation',
          this.lastID,
          req.user?.id,
          req.user?.username || 'system',
          null,
          { allergies, bloodType, bloodborneDiseases, pregnancyStatus, medications, additionalNotes, bloodPressure, diabetic },
          req
        );

        res.json({ id: this.lastID });
      }
    );
  });
});










                                                      //SERVICE ENDPOINTS//






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

app.post('/expenses', (req, res) => {
  const { expense: name, amount, date, category } = req.body;
  if (!name || !amount || !date) {
    return res.status(400).json({ error: 'name, amount and date are required' });
  }

  const d = new Date(date);
  const year = d.getFullYear();

  db.get('SELECT MAX(seq) as maxSeq FROM expenses WHERE year = ?', [year], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    const seq = (row && row.maxSeq) ? row.maxSeq + 1 : 1;
    const id = `${year}-${String(seq).padStart(4, '0')}`;
    const createdAt = new Date().toISOString();

    const q = `INSERT INTO expenses (id, year, seq, name, category, amount, date, createdAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(q, [id, year, seq, name, category || '', amount, date, createdAt], function(insertErr) {
      if (insertErr) {
        console.error('Error inserting expense:', insertErr);
        return res.status(500).json({ error: insertErr.message });
      }
      // return created expense
      res.status(201).json({
        success: true,
        expense: { id, year, seq, name, category: category || '', amount, date, createdAt }
      });
    });
  });
});

// GET all expenses (optional query startDate/endDate)
app.get('/expenses', (req, res) => {
  const { startDate, endDate } = req.query;
  let q = 'SELECT * FROM expenses';
  const params = [];
  if (startDate && endDate) {
    q += ' WHERE date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  q += ' ORDER BY date DESC, id DESC';
  db.all(q, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
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


// LOGS PRE //

// Add this after your existing table creation code (around line 200)
console.log('Creating activity_logs table...');

db.run(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    tableName TEXT,
    recordId INTEGER,
    userId INTEGER,
    username TEXT,
    oldValues TEXT,
    newValues TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    viewStatus TEXT DEFAULT 'Unviewed',
    ipAddress TEXT,
    userAgent TEXT
  )
`, (err) => {
  if (err) {
    console.error('❌ Error creating activity_logs table:', err);
  } else {
    console.log('✅ Activity logs table created/verified');
  }
});

// Logging utility function
function logActivity(action, description, tableName = null, recordId = null, userId = null, username = null, oldValues = null, newValues = null, req = null) {
  const logData = {
    action,
    description,
    tableName,
    recordId,
    userId,
    username,
    oldValues: oldValues ? JSON.stringify(oldValues) : null,
    newValues: newValues ? JSON.stringify(newValues) : null,
    ipAddress: req ? (req.ip || req.connection?.remoteAddress || 'unknown') : null,
    userAgent: req ? req.headers['user-agent'] : null
  };

  const insertQuery = `
    INSERT INTO activity_logs (action, description, tableName, recordId, userId, username, oldValues, newValues, ipAddress, userAgent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(insertQuery, [
    logData.action,
    logData.description,
    logData.tableName,
    logData.recordId,
    logData.userId,
    logData.username,
    logData.oldValues,
    logData.newValues,
    logData.ipAddress,
    logData.userAgent
  ], function(err) {
    if (err) {
      console.error('❌ Error logging activity:', err);
    } else {
      console.log('📝 Activity logged:', logData.action);
    }
  });
}

// GET all logs with pagination and filtering
app.get('/logs', (req, res) => {
  const { 
    page = 0, 
    limit = 50, 
    action, 
    viewStatus, 
    startDate, 
    endDate,
    username,
    tableName 
  } = req.query;

  let whereConditions = [];
  let queryParams = [];

  // Add filters
  if (action) {
    whereConditions.push('action = ?');
    queryParams.push(action);
  }
  
  if (viewStatus) {
    whereConditions.push('viewStatus = ?');
    queryParams.push(viewStatus);
  }
  
  if (startDate) {
    whereConditions.push('date(timestamp) >= ?');
    queryParams.push(startDate);
  }
  
  if (endDate) {
    whereConditions.push('date(timestamp) <= ?');
    queryParams.push(endDate);
  }
  
  if (username) {
    whereConditions.push('username LIKE ?');
    queryParams.push(`%${username}%`);
  }
  
  if (tableName) {
    whereConditions.push('tableName = ?');
    queryParams.push(tableName);
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
  
  // Count total logs
  const countQuery = `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`;
  
  db.get(countQuery, queryParams, (err, countResult) => {
    if (err) {
      console.error('Error counting logs:', err);
      return res.status(500).json({ error: 'Failed to count logs' });
    }

    // Get paginated logs
    const offset = parseInt(page) * parseInt(limit);
    const selectQuery = `
      SELECT * FROM activity_logs 
      ${whereClause}
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `;
    
    const selectParams = [...queryParams, parseInt(limit), offset];

    db.all(selectQuery, selectParams, (err, rows) => {
      if (err) {
        console.error('Error fetching logs:', err);
        return res.status(500).json({ error: 'Failed to fetch logs' });
      }

      res.json({
        logs: rows,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.total / parseInt(limit))
      });
    });
  });
});

// GET log by ID
app.get('/logs/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM activity_logs WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching log:', err);
      return res.status(500).json({ error: 'Failed to fetch log' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    res.json(row);
  });
});

// UPDATE log view status
app.put('/logs/:id', (req, res) => {
  const { id } = req.params;
  const { viewStatus } = req.body;
  
  db.run('UPDATE activity_logs SET viewStatus = ? WHERE id = ?', [viewStatus, id], function(err) {
    if (err) {
      console.error('Error updating log:', err);
      return res.status(500).json({ error: 'Failed to update log' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    res.json({ message: 'Log updated successfully' });
  });
});

// DELETE log (admin only)
app.delete('/logs/:id', requireRole('admin'), (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM activity_logs WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting log:', err);
      return res.status(500).json({ error: 'Failed to delete log' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    res.json({ message: 'Log deleted successfully' });
  });
});

// Get log statistics
app.get('/logs/stats', (req, res) => {
  const queries = {
    totalLogs: 'SELECT COUNT(*) as count FROM activity_logs',
    unviewedLogs: 'SELECT COUNT(*) as count FROM activity_logs WHERE viewStatus = "Unviewed"',
    todayLogs: 'SELECT COUNT(*) as count FROM activity_logs WHERE date(timestamp) = date("now")',
    actionBreakdown: 'SELECT action, COUNT(*) as count FROM activity_logs GROUP BY action ORDER BY count DESC',
    recentActivity: 'SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 5'
  };
  
  const stats = {};
  let completed = 0;
  const total = Object.keys(queries).length;
  
  Object.entries(queries).forEach(([key, query]) => {
    if (key === 'actionBreakdown' || key === 'recentActivity') {
      db.all(query, [], (err, rows) => {
        if (!err) stats[key] = rows;
        completed++;
        if (completed === total) res.json(stats);
      });
    } else {
      db.get(query, [], (err, row) => {
        if (!err) stats[key] = row.count;
        completed++;
        if (completed === total) res.json(stats);
      });
    }
  });
});
