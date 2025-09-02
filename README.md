# White Teeth Dental Clinic - Setup Guide

Setup guide for building the White Teeth Dental Clinic desktop application on a new environment.

## 👪 Project Team Members
- Warlter Anthony Andao
- Jan Kenneth Gerona 
- Yahyah Odin

## 📖 Brief Introduction

This is a dental clinic management system built as a desktop application. To run in development mode, you'll need to start both the frontend (React) and backend (Node.js/Express) servers. For production, the app compiles into a standalone .exe file with embedded SQLite database.

**Quick Overview:**
- **Development:** Run `npm run dev` for frontend + `node server.js` in `cd src/backend` for backend
- **Production:** Build with `npm run build` then compile with `electron-builder`
- **Result:** Portable .exe file that runs without installation

## 🛠️ Tech Stack

### Frontend:
- **React 19.1.0** - UI framework
- **Material-UI (MUI) 7.3.1** - Component library
- **Vite 7.1.3** - Build tool and dev server
- **React Router DOM** - Navigation

### Backend:
- **Node.js** - Runtime environment
- **Express.js 4.21.2** - Web server framework
- **SQLite3 5.1.7** - Database
- **CORS 2.8.5** - Cross-origin resource sharing

### Desktop App:
- **Electron 37.3.1** - Desktop app framework
- **Electron Builder 26.0.12** - App packaging/compilation

### Additional:
- **React Draggable** - Draggable components
- **Concurrently** - Run multiple commands

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

### 3. Install Windows Build Tools
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
node server.js
```
- Backend will run on `http://localhost:3001`
- Keep this terminal open

### Step 2: Start Frontend Development Server
Open **Terminal 2:**
```bash
npm run dev
```
- Frontend will run on `http://localhost:3000`
- Open browser and go to `http://localhost:3000`
- Login with default credentials
    username: `admin`, password: `admin`

## 📦 Compiling to EXE

### Step 1: Build Frontend
```bash
npm run build
```

### Step 2: Compile to Portable EXE
```bash
electron-builder --win portable --publish never
```

**That's it!** Your .exe file will be created in the `dist-electron` folder.

## 📁 Output Files

After compilation, find your executable at:
- **Main EXE:** `dist-electron/White Teeth Dental Clinic-0.1.0-portable.exe`
- **Unpacked Version:** `dist-electron/win-unpacked/`

## � Project Structure

```
White-Teeth-Dental-Clinic/
├── src/                          # React frontend source
│   ├── backend/                  # Express.js backend
│   │   ├── server.js            # Backend server
│   │   ├── clinic.db            # SQLite database
│   │   └── package.json         # Backend dependencies
│   ├── App.js                   # Main React app
│   ├── Dashboard.js             # Dashboard component
│   ├── Records.js               # Records management
│   ├── QuickActionButton.js     # Floating action button
│   └── ...                     # Other React components
├── public/                      # Static assets & images
├── dist/                        # Built frontend (after npm run build)
├── dist-electron/               # Built desktop app (after electron-builder)
├── electron.js                  # Electron main process
├── package.json                 # Main dependencies & scripts
├── vite.config.js              # Vite configuration
└── README1.md                   # This file
```

## 📋 System Requirements

### For Development:
- Windows 10/11
- Node.js 18.x or 20.x LTS
- Python 3.9+
- 4GB+ RAM
- 2GB+ free disk space

### For Built Application:
- Windows 10/11 (64-bit)
- 100MB+ free disk space
- **No additional software required**

## 🎉 Success!

If everything works correctly, you should have:
- ✅ Frontend running at `http://localhost:3000`
- ✅ Backend running at `http://localhost:3001`
- ✅ Functional login system (admin/admin)
- ✅ Database operations working
- ✅ Portable .exe file that runs standalone
- ✅ Complete dental clinic management system

## 🔧 Quick Troubleshooting

### SQLite Build Errors:
```bash
npm rebuild sqlite3
```

### File Lock Errors During Build:
```bash
taskkill /f /im "White Teeth Dental Clinic.exe"
taskkill /f /im "electron.exe"
rmdir /s /q dist-electron
```

### Node Version Issues:
Use Node.js 18.x or 20.x LTS version.

---

**Note:** The final .exe file is completely portable and includes the database. Users can run it without installing Node.js, npm, or any other dependencies.
