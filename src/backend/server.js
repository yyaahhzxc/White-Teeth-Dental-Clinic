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
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate parameters are required' });
  }

  console.log('🔍 Fetching appointments for date range:', { startDate, endDate });

  const query = `
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
  WHERE a.appointmentDate BETWEEN ? AND ?
  ORDER BY a.appointmentDate ASC, a.timeStart ASC
`;
  
  db.all(query, [startDate, endDate], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching appointments by date range:', err);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    } else {
      console.log(`📊 Found ${rows.length} appointments`);
      
      // Process the results
      const processedRows = rows.map(row => {
        console.log(`🔧 Processing appointment ${row.id}:`);
        console.log(`   - Primary service: ${row.primaryServiceName}`);
        console.log(`   - Junction services: ${row.junctionServiceNames}`);
        console.log(`   - Junction count: ${row.junctionServiceCount}`);
        
        // Determine which services to use
        const hasJunctionServices = row.junctionServiceCount > 0;
        
        let finalServiceNames, finalServiceIds, finalTotalPrice, finalTotalDuration;
        
        if (hasJunctionServices) {
          // Use junction table data
          finalServiceNames = row.junctionServiceNames;
          finalServiceIds = row.junctionServiceIds;
          finalTotalPrice = row.junctionTotalPrice || 0;
          finalTotalDuration = row.junctionTotalDuration || 60;
          console.log(`   ✅ Using junction services: ${finalServiceNames}`);
        } else {
          // Fall back to primary service
          finalServiceNames = row.primaryServiceName || 'No Service';
          finalServiceIds = row.serviceId ? row.serviceId.toString() : '';
          finalTotalPrice = row.primaryServicePrice || 0;
          finalTotalDuration = row.primaryServiceDuration || 60;
          console.log(`   ⚠️ Using primary service fallback: ${finalServiceNames}`);
        }
        
        const processed = {
          ...row,
          serviceName: finalServiceNames,
          procedure: finalServiceNames,
          serviceIds: finalServiceIds,
          serviceNames: finalServiceNames,
          totalPrice: finalTotalPrice,
          totalDuration: finalTotalDuration,
          hasMultipleServices: hasJunctionServices && finalServiceNames && finalServiceNames.includes(',')
        };
        
        console.log(`   📋 Final result: ${processed.serviceName} (Multiple: ${processed.hasMultipleServices})`);
        return processed;
      });
      
      console.log(`✅ Processed ${processedRows.length} appointments successfully`);
      res.json(processedRows);
    }
  });
});


// GET all appointments
app.get('/appointments', (req, res) => {
  console.log('🔍 Fetching all appointments');

  const query = `
    SELECT 
      a.*,
      p.firstName || ' ' || p.lastName as patientName,
      p.firstName,
      p.lastName,
      s_primary.name as primaryServiceName,
      s_primary.duration as primaryServiceDuration,
      s_primary.price as primaryServicePrice,
      (
        SELECT GROUP_CONCAT(s_multi.name, ', ')
        FROM appointment_services as_junction 
        JOIN services s_multi ON as_junction.serviceId = s_multi.id
        WHERE as_junction.appointmentId = a.id
      ) as junctionServiceNames,
      (
        SELECT GROUP_CONCAT(s_multi.id)
        FROM appointment_services as_junction 
        JOIN services s_multi ON as_junction.serviceId = s_multi.id
        WHERE as_junction.appointmentId = a.id
      ) as junctionServiceIds,
      (
        SELECT SUM(s_multi.price)
        FROM appointment_services as_junction 
        JOIN services s_multi ON as_junction.serviceId = s_multi.id
        WHERE as_junction.appointmentId = a.id
      ) as junctionTotalPrice,
      (
        SELECT SUM(s_multi.duration)
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
    ORDER BY a.appointmentDate DESC, a.timeStart DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching appointments:', err);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    } else {
      const processedRows = rows.map(row => {
        const hasJunctionServices = row.junctionServiceCount > 0;
        
        let finalServiceNames, finalServiceIds, finalTotalPrice, finalTotalDuration;
        
        if (hasJunctionServices) {
          finalServiceNames = row.junctionServiceNames;
          finalServiceIds = row.junctionServiceIds;
          finalTotalPrice = row.junctionTotalPrice || 0;
          finalTotalDuration = row.junctionTotalDuration || 60;
        } else {
          finalServiceNames = row.primaryServiceName || 'No Service';
          finalServiceIds = row.serviceId ? row.serviceId.toString() : '';
          finalTotalPrice = row.primaryServicePrice || 0;
          finalTotalDuration = row.primaryServiceDuration || 60;
        }
        
        return {
          ...row,
          serviceName: finalServiceNames,
          procedure: finalServiceNames,
          serviceIds: finalServiceIds,
          serviceNames: finalServiceNames,
          totalPrice: finalTotalPrice,
          totalDuration: finalTotalDuration,
          hasMultipleServices: hasJunctionServices && finalServiceNames && finalServiceNames.includes(',')
        };
      });
      
      res.json(processedRows);
    }
  });
});

// GET appointment by ID
app.get('/appointments/:id', (req, res) => {
  const { id } = req.params;
  
  console.log('Fetching appointment details for ID:', id);
  
  const query = `
    SELECT 
      a.*,
      p.firstName || ' ' || p.lastName as patientName,
      p.firstName,
      p.lastName,
      s_primary.name as primaryServiceName,
      s_primary.duration as primaryServiceDuration,
      s_primary.price as primaryServicePrice,
      (
        SELECT GROUP_CONCAT(s_multi.name, ', ')
        FROM appointment_services as_junction 
        JOIN services s_multi ON as_junction.serviceId = s_multi.id
        WHERE as_junction.appointmentId = a.id
      ) as junctionServiceNames,
      (
        SELECT GROUP_CONCAT(s_multi.id)
        FROM appointment_services as_junction 
        JOIN services s_multi ON as_junction.serviceId = s_multi.id
        WHERE as_junction.appointmentId = a.id
      ) as junctionServiceIds,
      (
        SELECT SUM(s_multi.price)
        FROM appointment_services as_junction 
        JOIN services s_multi ON as_junction.serviceId = s_multi.id
        WHERE as_junction.appointmentId = a.id
      ) as junctionTotalPrice,
      (
        SELECT SUM(s_multi.duration)
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
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error fetching appointment:', err);
      res.status(500).json({ error: 'Failed to fetch appointment' });
    } else if (!row) {
      res.status(404).json({ error: 'Appointment not found' });
    } else {
      console.log('Raw appointment data:', row);
      
      // Process the result to determine which services to use
      const hasJunctionServices = row.junctionServiceCount > 0;
      
      let finalServiceNames, finalServiceIds, finalTotalPrice, finalTotalDuration;
      
      if (hasJunctionServices) {
        // Use junction table data
        finalServiceNames = row.junctionServiceNames;
        finalServiceIds = row.junctionServiceIds;
        finalTotalPrice = row.junctionTotalPrice || 0;
        finalTotalDuration = row.junctionTotalDuration || 60;
        console.log(`✅ Using junction services: ${finalServiceNames}`);
      } else {
        // Fall back to primary service
        finalServiceNames = row.primaryServiceName || 'No Service';
        finalServiceIds = row.serviceId ? row.serviceId.toString() : '';
        finalTotalPrice = row.primaryServicePrice || 0;
        finalTotalDuration = row.primaryServiceDuration || 60;
        console.log(`⚠️ Using primary service fallback: ${finalServiceNames}`);
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
      
      console.log('Processed appointment details:', processedRow);
      res.json(processedRow);
    }
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
    serviceId,
    serviceName,
    serviceIds,
    serviceNames,
    totalPrice,
    totalDuration
  } = req.body;

  console.log('=== PUT APPOINTMENT DEBUG ===');
  console.log('Appointment ID:', id);
  console.log('Request body:', req.body);
  console.log('Service IDs with quantities:', serviceIds);

  // Validate required fields
  if (!id) {
    return res.status(400).json({ error: 'Missing appointment ID' });
  }

  // Update the main appointment record
  const updateQuery = `
    UPDATE appointments 
    SET appointmentDate = ?, timeStart = ?, timeEnd = ?, comments = ?, status = ?, serviceId = ?
    WHERE id = ?
  `;

  db.run(updateQuery, [
    appointmentDate,
    timeStart,
    timeEnd,
    comments || '',
    status || 'Scheduled',
    serviceId,
    id
  ], function (err) {
    if (err) {
      console.error('❌ Error updating appointment:', err);
      return res.status(500).json({ error: 'Failed to update appointment', details: err.message });
    }

    console.log('✅ Main appointment updated');

    // Handle service updates with quantities
    if (serviceIds && Array.isArray(serviceIds)) {
      // First, delete existing service associations
      db.run('DELETE FROM appointment_services WHERE appointmentId = ?', [id], (deleteErr) => {
        if (deleteErr) {
          console.error('Error deleting old services:', deleteErr);
          return res.status(500).json({ error: 'Failed to update services' });
        }
        
        console.log('✅ Old service associations deleted');
        
        // Insert new service associations with quantities
        let servicesInserted = 0;
        const totalServices = serviceIds.length;
        let insertErrors = [];
        
        if (totalServices === 0) {
          console.log('✅ No services to insert, returning updated appointment');
          return returnUpdatedAppointment();
        }
        
        serviceIds.forEach((serviceData, index) => {
          const serviceIdValue = typeof serviceData === 'object' ? serviceData.id : serviceData;
          const quantity = typeof serviceData === 'object' ? (serviceData.quantity || 1) : 1;
          
          console.log(`📝 Inserting service ${index + 1}/${totalServices}: ID=${serviceIdValue}, Qty=${quantity}`);
          
          db.run(
            'INSERT INTO appointment_services (appointmentId, serviceId, quantity) VALUES (?, ?, ?)',
            [id, serviceIdValue, quantity],
            function(insertErr) {
              servicesInserted++;
              
              if (insertErr) {
                console.error(`❌ Error inserting service ${serviceIdValue}:`, insertErr);
                insertErrors.push(insertErr);
              } else {
                console.log(`✅ Service ${serviceIdValue} (qty: ${quantity}) inserted`);
              }
              
              // Check if all services have been processed
              if (servicesInserted === totalServices) {
                if (insertErrors.length > 0) {
                  console.error('⚠️ Some services failed to insert:', insertErrors);
                }
                console.log('✅ All services processed, returning updated appointment');
                returnUpdatedAppointment();
              }
            }
          );
        });
      });
    } else {
      // No service updates needed, just return the updated appointment
      console.log('✅ No service updates needed, returning updated appointment');
      returnUpdatedAppointment();
    }
  });

  // Helper function to return the updated appointment (only called once)
  function returnUpdatedAppointment() {
    console.log('📤 Fetching updated appointment details for ID:', id);
    
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
    
    db.get(selectQuery, [id], (selectErr, row) => {
      if (selectErr) {
        console.error('❌ Error fetching updated appointment:', selectErr);
        return res.status(500).json({ error: 'Appointment updated but failed to fetch details' });
      }
      
      if (!row) {
        console.error('❌ Updated appointment not found');
        return res.status(404).json({ error: 'Appointment not found after update' });
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
      
      console.log('✅ Returning updated appointment:', {
        id: processedRow.id,
        serviceNames: processedRow.serviceNames,
        serviceIds: processedRow.serviceIds,
        totalPrice: processedRow.totalPrice,
        hasMultiple: processedRow.hasMultipleServices
      });
      
      // THIS IS THE ONLY PLACE WHERE WE SEND A RESPONSE
      res.json({
        success: true,
        message: 'Appointment updated successfully',
        appointment: processedRow
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



//PATIENT ENDPOINTS

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
  db.all('SELECT * FROM services ORDER BY name', [], (err, rows) => {
    if (err) {
      console.error('Error fetching services:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Services fetched from /service-table:', rows.length, 'services');
    console.log('Sample service:', rows[0]); // Debug: show first service structure
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

                    
                                                      //SERVICE ENDPOINTS//


// Add package endpoint (new endpoint specifically for packages)
app.post('/packages', (req, res) => {
  const {
    name,
    type = 'Package Treatment',
    status,
    price,
    duration,
    packageServices = [] // Array of {serviceId, quantity, price, duration}
  } = req.body;

  console.log('=== CREATE PACKAGE DEBUG ===');
  console.log('Package data:', { name, type, status, price, duration });
  console.log('Package services:', packageServices);

  // Validate required fields
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Package name is required' });
  }

  if (!packageServices || packageServices.length === 0) {
    return res.status(400).json({ error: 'At least one service is required for a package' });
  }

  // Insert the package into services table
  const insertPackageQuery = `
    INSERT INTO services (name, type, status, price, duration, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const description = `Package containing ${packageServices.length} service(s)`;

  db.run(insertPackageQuery, [
    name.trim(),
    type,
    status || 'Active',
    price || 0,
    duration || 0,
    description
  ], function (err) {
    if (err) {
      console.error('❌ Error creating package:', err);
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'A service with this name already exists' });
      }
      return res.status(500).json({ error: 'Failed to create package', details: err.message });
    }

    const packageId = this.lastID;
    console.log('✅ Package created with ID:', packageId);

    // Insert package services into appointment_services table
    // (We'll reuse this table to store package compositions)
    let servicesProcessed = 0;
    let errors = [];

    packageServices.forEach((serviceData, index) => {
      console.log(`📝 Inserting package service ${index + 1}/${packageServices.length}:`, serviceData);
      
      const junctionQuery = 'INSERT INTO appointment_services (appointmentId, serviceId, quantity) VALUES (?, ?, ?)';
      
      // Use negative packageId to distinguish from actual appointments
      db.run(junctionQuery, [-packageId, serviceData.serviceId, serviceData.quantity || 1], function(junctionErr) {
        servicesProcessed++;
        
        if (junctionErr) {
          console.error(`❌ Error inserting package service ${serviceData.serviceId}:`, junctionErr);
          errors.push(junctionErr);
        } else {
          console.log(`✅ Package service ${serviceData.serviceId} (qty: ${serviceData.quantity}) inserted`);
        }
        
        if (servicesProcessed === packageServices.length) {
          if (errors.length > 0) {
            console.error('⚠️ Some package services failed to insert:', errors);
          }
          console.log('✅ All package services processed');
          
          res.status(201).json({
            success: true,
            message: 'Package created successfully',
            package: {
              id: packageId,
              name: name.trim(),
              type,
              status: status || 'Active',
              price: price || 0,
              duration: duration || 0,
              serviceCount: packageServices.length
            }
          });
        }
      });
    });
  });
});

// Get package details with services
app.get('/packages/:id', (req, res) => {
  const { id } = req.params;
  
  console.log('Fetching package details for ID:', id);
  
  // First get the package info
  const packageQuery = 'SELECT * FROM services WHERE id = ? AND type = "Package Treatment"';
  
  db.get(packageQuery, [id], (err, packageRow) => {
    if (err) {
      console.error('Error fetching package:', err);
      return res.status(500).json({ error: 'Failed to fetch package' });
    }
    
    if (!packageRow) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    // Then get the package services
    const servicesQuery = `
      SELECT 
        s.id,
        s.name,
        s.price,
        s.duration,
        as_junction.quantity
      FROM appointment_services as_junction
      JOIN services s ON as_junction.serviceId = s.id
      WHERE as_junction.appointmentId = ?
      ORDER BY s.name
    `;
    
    db.all(servicesQuery, [-id], (servicesErr, servicesRows) => {
      if (servicesErr) {
        console.error('Error fetching package services:', servicesErr);
        return res.status(500).json({ error: 'Failed to fetch package services' });
      }
      
      const packageWithServices = {
        ...packageRow,
        packageServices: servicesRows.map(row => ({
          serviceId: row.id,
          name: row.name,
          price: row.price,
          duration: row.duration,
          quantity: row.quantity
        }))
      };
      
      console.log('Package with services:', packageWithServices);
      res.json(packageWithServices);
    });
  });
});

// Update services endpoint to return packages too
app.get('/services-and-packages', (req, res) => {
  db.all('SELECT * FROM services ORDER BY type, name', [], (err, rows) => {
    if (err) {
      console.error('Error fetching services and packages:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const services = rows.filter(row => row.type !== 'Package Treatment');
    const packages = rows.filter(row => row.type === 'Package Treatment');
    
    res.json({
      services,
      packages,
      all: rows
    });
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
