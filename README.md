# White Teeth Dental Clinic - Management System

A comprehensive dental clinic management system built as a React desktop application with Express.js backend and SQLite database.

## 👪 Project Team Members
- Warlter Anthony Andao
- Jan Kenneth Gerona 
- Yahyah Odin

## 📖 Brief Introduction

This is a dental clinic management system built as a desktop application. The system features:
- **Patient Records Management** - Complete patient information and medical history
- **Service Management** - Dental services catalog and pricing
- **Appointment Scheduling** - Patient appointment booking and management
- **User Management** - Role-based access control (Administrator, Dentist, Assistant, Receptionist)
- **Sales & Invoicing** - Financial tracking and invoice generation
- **Audit Logs** - System activity tracking

**Quick Overview:**
- **Development:** Run `npm run dev` for frontend + `npm start` in `src/backend` for backend
- **Production:** Build with `npm run build` then compile with `electron-builder`
- **Result:** Portable .exe file that runs without installation

## 🛠️ Tech Stack

### Frontend:
- **React 19.1.0** - UI framework
- **Material-UI (MUI) 7.3.1** - Component library and icons
- **Emotion 11.14.0** - CSS-in-JS styling
- **Vite 7.1.3** - Build tool and dev server
- **React Router DOM 7.8.0** - Client-side routing
- **React Draggable 4.5.0** - Draggable UI components
- **React Icons 5.5.0** - Additional icon set

### Backend:
- **Node.js** - Runtime environment
- **Express.js 5.1.0** - Web server framework
- **SQLite3 5.1.7** - Embedded database
- **CORS 2.8.5** - Cross-origin resource sharing

### Desktop App:
- **Electron 37.3.1** - Desktop app framework
- **Electron Builder 26.0.12** - App packaging/compilation

### Development Tools:
- **Concurrently 9.2.0** - Run multiple commands simultaneously
- **Wait-on 8.0.4** - Wait for services to be available
- **Testing Library** - React component testing utilities

## 🛠️ Prerequisites

### 1. Install Node.js
- Download and install Node.js from [nodejs.org](https://nodejs.org/)
- **Recommended:** Node.js 18.x or 20.x LTS version
- Verify installation:
```bash
node --version
npm --version
```

### 2. Install Python (for SQLite compilation)
- Download Python 3.9+ from [python.org](https://python.org/)
- **Important:** Check "Add Python to PATH" during installation
- Verify installation:
```bash
python --version
```

### 3. Install Windows Build Tools (Windows only)
- Open PowerShell as Administrator and run:
```powershell
npm install --global windows-build-tools
```

### 4. Clone/Download Project
```bash
# If using Git
git clone https://github.com/yyaahhzxc/White-Teeth-Dental-Clinic.git
cd White-Teeth-Dental-Clinic

# Or download ZIP and extract to desired folder
```

### 5. Install Dependencies
```bash
# Install main project dependencies
npm install

# Install backend dependencies
cd src/backend
npm install
cd ../..
```

## 🚀 Running in Development Mode

### Step 1: Start Backend Server
Open **Terminal 1:**
```bash
cd src/backend
npm start
```
- Backend will run on `http://localhost:3001`
- Keep this terminal open
- Database will be automatically created if it doesn't exist

### Step 2: Start Frontend Development Server
Open **Terminal 2:**
```bash
npm run dev
```
- Frontend will run on `http://localhost:3000`
- Open browser and go to `http://localhost:3000`
- Login with default credentials: `admin` / `admin`

### Alternative: Run Both Simultaneously
```bash
npm run electron-dev
```
This will start both frontend and backend, then launch the Electron app.

## 📦 Building for Production

### Step 1: Build Frontend
```bash
npm run build
```

### Step 2: Compile to Desktop Application
```bash
# For portable executable
npm run dist

# Or use electron-builder directly
npx electron-builder --win portable --publish never
```

### Step 3: Alternative Build Script
```bash
npm run build-desktop
```

## 📁 Output Files

After compilation, find your executable at:
- **Portable EXE:** `dist-electron/White Teeth Dental Clinic-0.1.0-portable.exe`
- **Unpacked Files:** `dist-electron/win-unpacked/`
- **Built Frontend:** `dist/` (static files)

## 📂 Project Structure

```
White-Teeth-Dental-Clinic/
├── public/                       # Static assets
│   ├── White-Teeth-Logo.png     # App icon
│   ├── White-Teeth-BG.png       # Background image
│   └── ...                      # Other assets
├── src/                          # React frontend source
│   ├── backend/                  # Express.js backend
│   │   ├── server.js            # Main backend server
│   │   ├── clinic.db            # SQLite database
│   │   ├── package.json         # Backend dependencies
│   │   └── ...                  # Migration scripts & utilities
│   ├── apiConfig.js             # API configuration
│   ├── App.js                   # Main React application
│   ├── Dashboard.js             # Main dashboard
│   ├── Records.js               # Patient records management
│   ├── service-page.js          # Services management
│   ├── Appointments.js          # Appointment scheduling
│   ├── Accounts.js              # User account management
│   ├── Profile.js               # User profile settings
│   ├── Invoice.js               # Invoice generation
│   ├── Sales.js                 # Financial management
│   ├── Settings.js              # System settings
│   ├── Logs.js                  # Audit logs viewer
│   ├── add-record.js            # Add patient modal
│   ├── add-service.js           # Add service modal
│   ├── view-record.js           # View/edit patient modal
│   ├── view-service.js          # View/edit service modal
│   ├── header.js                # Navigation header
│   ├── QuickActionButton.js     # Floating action button
│   └── ...                     # Other components
├── build/                       # Build output (after npm run build)
├── dist/                        # Vite build output
├── dist-electron/               # Electron build output
├── electron.js                  # Electron main process
├── package.json                 # Main dependencies & scripts
├── vite.config.js              # Vite configuration
└── README.md                    # This documentation
```

## 🔑 Default Login Credentials

- **Username:** `admin`
- **Password:** `admin`

## 👥 User Roles

The system supports role-based access control:

### User Roles:
- **User** - Basic access level
- **Administrator** - Full system access

### Employee Roles:
- **Dentist** - Primary dental practitioners
- **Assistant Dentist** - Dental assistants
- **Receptionist** - Front desk staff

## 📋 System Requirements

### For Development:
- **OS:** Windows 10/11, macOS 10.15+, Linux Ubuntu 18+
- **Node.js:** 18.x or 20.x LTS
- **Python:** 3.9+ (for SQLite compilation)
- **RAM:** 4GB+ recommended
- **Storage:** 2GB+ free disk space

### For Built Application:
- **OS:** Windows 10/11 (64-bit)
- **Storage:** 100MB+ free disk space
- **Dependencies:** None (completely portable)

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. SQLite Build Errors
```bash
# Rebuild SQLite native bindings
npm rebuild sqlite3

# If still failing, try:
cd src/backend
npm rebuild sqlite3
```

#### 2. File Lock Errors During Build
```bash
# Kill any running processes
taskkill /f /im "White Teeth Dental Clinic.exe"
taskkill /f /im "electron.exe"

# Remove build directory and rebuild
rmdir /s /q dist-electron
npm run dist
```

#### 3. Node Version Compatibility
- Ensure you're using Node.js 18.x or 20.x LTS
- Avoid Node.js 21+ (may cause build issues)
```bash
node --version  # Should show v18.x.x or v20.x.x
```

#### 4. Backend Connection Issues
- Verify backend is running on port 3001
- Check if another service is using port 3001
- Look for CORS errors in browser console

#### 5. White Screen Issues
- Check browser console for JavaScript errors
- Ensure all imports are properly defined
- Verify API_BASE configuration in `src/apiConfig.js`

#### 6. Database Issues
```bash
# Check database structure
cd src/backend
node checkDB.js

# Reset database (WARNING: destroys data)
rm clinic.db
npm start  # Will recreate database
```

#### 7. Port Already in Use
```bash
# Find and kill process using port 3001
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F

# Or use different port in apiConfig.js
```

#### 8. Permission Errors (Windows)
- Run terminals as Administrator
- Ensure antivirus isn't blocking file access
- Check Windows Defender exclusions

#### 9. Missing Dependencies
```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install

# Backend dependencies
cd src/backend
rm -rf node_modules package-lock.json
npm install
```

#### 10. Electron Build Issues
```bash
# Clear Electron cache
npx electron-builder install-app-deps

# Force rebuild
npm run build
npx electron-builder --win portable --publish never
```

## 🧪 Testing the Application

### Manual Testing Checklist:
- [ ] Login with admin/admin credentials
- [ ] Navigate between different pages
- [ ] Add a new patient record
- [ ] Add a new service
- [ ] Create an appointment
- [ ] Generate an invoice
- [ ] Check audit logs
- [ ] Test user role management

### Database Testing:
```bash
cd src/backend
node checkDB.js  # Verify database structure
```

## 🚀 Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Create portable executable:**
   ```bash
   npm run dist
   ```

3. **Distribute the .exe file:**
   - Copy `dist-electron/White Teeth Dental Clinic-0.1.0-portable.exe`
   - No installation required on target machines
   - Database is embedded in the application

## 🎉 Success Indicators

✅ **Development Mode Working:**
- Frontend running at `http://localhost:3000`
- Backend running at `http://localhost:3001`
- Login system functional
- Database operations working
- All pages loading without errors

✅ **Production Build Working:**
- Portable .exe file created successfully
- Application runs without external dependencies
- All features functional in built version
- Database persists between sessions

---

**Note:** The final .exe file is completely portable and includes the embedded SQLite database. Users can run it on any compatible Windows machine without installing Node.js, npm, or any other dependencies.
