const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

// Import backend dependencies directly
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// Robust development detection
const isDev = process.env.ELECTRON_START_URL || process.env.NODE_ENV === 'development' || process.defaultApp || /[\\/]electron[\\/]/.test(process.execPath);

let mainWindow;
let frontendServer;
let backendServer;
let db;

// MIME type mapping
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf'
};

function initializeDatabase() {
  return new Promise((resolve, reject) => {
  // Create database in the app's data directory. In dev, use backend clinic.db to avoid duplicates.
  const dbPath = isDev ? path.join(__dirname, 'src', 'backend', 'clinic.db') : path.join(process.resourcesPath, 'clinic.db');
    console.log('Database path:', dbPath);
    
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database.');
      
      // Create tables
      db.serialize(() => {
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

        // Create users table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
          )
        `);

        // Insert default admin user if not exists
        db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
          if (err) {
            console.error('Error checking for admin user:', err);
          } else if (!row) {
            db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', 'admin123'], (err) => {
              if (err) {
                console.error('Error creating admin user:', err);
              } else {
                console.log('✅ Default admin user created (username: admin, password: admin123)');
              }
            });
          }
          resolve();
        });
      });
    });
  });
}

function createSimpleServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath;
      let urlPath = url.parse(req.url).pathname;
      
      console.log(`Frontend request: ${req.url}`);
      
      // Handle root and empty paths
      if (urlPath === '/' || urlPath === '') {
        urlPath = '/index.html';
      }
      
  // Remove leading slash and map to dist directory
  const relativePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
  // Decode URL-encoded characters (e.g. %20 -> space) so filenames with spaces work
  const decodedRelativePath = decodeURIComponent(relativePath);
  filePath = path.join(__dirname, 'dist', decodedRelativePath);
      
      console.log(`Serving file: ${filePath}`);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.error(`File not found: ${filePath}`);
          // Try fallback to index.html for SPA routes
          if (!relativePath.includes('.')) {
            const indexPath = path.join(__dirname, 'dist', 'index.html');
            fs.readFile(indexPath, (indexErr, indexData) => {
              if (indexErr) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not found');
                return;
              }
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(indexData);
            });
            return;
          }
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        console.log(`Serving ${filePath} as ${contentType}`);
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000' // Cache images for 1 year
        });
        res.end(data);
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Frontend server listening on http://127.0.0.1:${port}`);
      resolve({ server, port });
    });

    server.on('error', (err) => {
      console.error('Frontend server error:', err);
      reject(err);
    });
  });
}

function createBackendServer() {
  return new Promise((resolve, reject) => {
    const backendApp = express();
    backendApp.use(cors());
    backendApp.use(express.json());

    // Add patient endpoint
    backendApp.post('/patients', (req, res) => {
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

    // Login endpoint
    backendApp.post('/login', (req, res) => {
      const { username, password } = req.body;
      const MASTER_PASSWORD = 'admin123';
      
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (password === MASTER_PASSWORD || row.password === password) {
          return res.json({ success: true });
        }

        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      });
    });

    // Medical information endpoints
    backendApp.post('/medical-information', (req, res) => {
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

    // Service endpoints
    backendApp.post('/service-table', (req, res) => {
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
    backendApp.get('/patients', (req, res) => {
      db.all('SELECT * FROM patients', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    });

    // Get medical information by patientId
    backendApp.get('/medical-information/:patientId', (req, res) => {
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
    backendApp.get('/service-table', (req, res) => {
      db.all('SELECT * FROM services', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    });

    // Forgot password endpoints
    backendApp.post('/forgot-validate', (req, res) => {
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

    backendApp.post('/forgot-reset', (req, res) => {
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

    // Start backend server
    backendServer = backendApp.listen(3001, '127.0.0.1', () => {
      console.log('🚀 Backend server running on http://127.0.0.1:3001');
      resolve();
    });

    backendServer.on('error', (err) => {
      console.error('Backend server error:', err);
      reject(err);
    });
  });
}

function createSimpleServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath;
      let urlPath = url.parse(req.url).pathname;
      
      // Handle root and empty paths
      if (urlPath === '/' || urlPath === '') {
        urlPath = '/index.html';
      }
      
      // Remove leading slash and map to dist directory
      const relativePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
      filePath = path.join(__dirname, 'dist', relativePath);
      
      console.log(`HTTP Request: ${req.url} -> ${filePath}`);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.error(`File not found: ${filePath}`);
          // Try fallback to index.html for SPA routes
          if (!relativePath.includes('.')) {
            const indexPath = path.join(__dirname, 'dist', 'index.html');
            fs.readFile(indexPath, (indexErr, indexData) => {
              if (indexErr) {
                res.writeHead(404);
                res.end('Not found');
                return;
              }
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(indexData);
            });
            return;
          }
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'text/plain';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Frontend server listening on http://127.0.0.1:${port}`);
      resolve({ server, port });
    });

    server.on('error', reject);
  });
}

function createWindow(frontendPort) {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, 'public/White-Teeth-Logo.png'),
    show: false,
  });

  // Hide the menu bar
  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL || 'http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`http://127.0.0.1:${frontendPort}`);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Add error handling
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });
}

function stopServers() {
  if (backendServer) {
    backendServer.close();
    backendServer = null;
  }
  if (frontendServer) {
    frontendServer.close();
    frontendServer = null;
  }
  if (db) {
    db.close();
    db = null;
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  console.log('Electron starting. process.execPath=', process.execPath);
  console.log('isDev detected =', isDev);
  console.log('__dirname =', __dirname);
  
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Start backend server
    await createBackendServer();
    
    if (!isDev) {
      // Start frontend server for production
      const { server, port } = await createSimpleServer();
      frontendServer = server;
      createWindow(port);
    } else {
      // Development mode
      createWindow();
    }
  } catch (err) {
    console.error('Failed to start servers:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  stopServers();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServers();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});
