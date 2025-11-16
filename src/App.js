import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Box, Paper, TextField, Button, Typography, InputAdornment, IconButton } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/Records'
import AddService from './pages/add-service';
import ServiceList from './pages/service-page';
import HomePage from './pages/HomePage';
import ForgotPassword from './pages/ForgotPassword';
import Appointments from './pages/Appointments';
import Invoice from './pages/Invoice';
import Billing from './pages/Billing';
import Sales from './pages/Sales';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import Accounts from './pages/Accounts';
import { API_BASE } from './apiConfig';
import GlobalToast from './components/GlobalToast';





function App() {
  // Theme: Light | Dark | System
  const [appTheme, setAppTheme] = useState(() => {
    try { return localStorage.getItem('appTheme') || 'System'; } catch (e) { return 'System'; }
  });

  const resolveMode = (theme) => {
    if (!theme || theme === 'System') {
      try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; }
    }
    return String(theme).toLowerCase();
  };

  const mode = resolveMode(appTheme);

  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: mode === 'dark' ? '#90caf9' : '#2148C0' },
      background: {
        default: mode === 'dark' ? '#0b1220' : '#f5f7fb',
        paper: mode === 'dark' ? '#0f1720' : '#ffffff'
      },
      text: {
        primary: mode === 'dark' ? '#e6eef8' : '#0f1720',
        secondary: mode === 'dark' ? '#9aa7b8' : '#4b5563'
      }
    }
  }), [mode]);

  // expose CSS variables for non-MUI/custom CSS
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.style.setProperty('--app-bg', muiTheme.palette.background.default);
      root.style.setProperty('--app-surface', muiTheme.palette.background.paper);
      root.style.setProperty('--app-text', muiTheme.palette.text.primary);
      root.style.setProperty('--app-text-secondary', muiTheme.palette.text.secondary);
      root.style.setProperty('--app-accent', muiTheme.palette.primary.main);
    } catch (e) {}
  }, [muiTheme]);

  // Listen for Settings change broadcasts
  useEffect(() => {
    const onThemeChanged = (e) => {
      try {
        const t = e && e.detail && e.detail.theme;
        if (t) {
          setAppTheme(t);
          try { localStorage.setItem('appTheme', t); } catch (e) {}
        }
      } catch (err) {}
    };
    window.addEventListener('appThemeChanged', onThemeChanged);
    return () => window.removeEventListener('appThemeChanged', onThemeChanged);
  }, []);

  // On mount, if logged in, try to load per-user settings from server
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch(`${API_BASE}/user/settings`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const settings = await res.json();
            if (settings && settings.appTheme) {
              setAppTheme(settings.appTheme);
              try { localStorage.setItem('appTheme', settings.appTheme); } catch (e) {}
            }
            if (settings && settings.appTextSizeLevel != null) {
              const v = Number(settings.appTextSizeLevel);
              if (!Number.isNaN(v)) {
                const sizeMap = {1:13,2:14.5,3:16,4:18,5:20};
                const px = sizeMap[v] || 16;
                document.documentElement.style.fontSize = `${px}px`;
                document.documentElement.style.setProperty('--app-ui-font', `${px}px`);
                document.documentElement.style.setProperty('--app-ui-scale', String(px/16));
                try { window.dispatchEvent(new CustomEvent('appTextSizeChanged', { detail: { level: v } })); } catch (e) {}
              }
            }
          }
        }
      } catch (e) {}
    })();
  }, []);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();
  const usernameRef = useRef();
  const passwordRef = useRef();

  // Clear login fields when navigating to /login (after logout or manual nav)
  const { pathname } = window.location;
  React.useEffect(() => {
    if (pathname === '/login') {
      setUsername('');
      setPassword('');
      setLoginError('');
      setShowPassword(false);
    }
  }, [pathname]);

  const handleLogin = async () => {
    setLoginError('');
    if (username && password) {
      try {
        const res = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
          // parse response and store user/token for header and protected requests
          try {
            const data = await res.json();
            if (data && data.user) {
              // Check if user is enabled
              if (data.user.status && data.user.status.toLowerCase() !== 'enabled') {
                setLoginError('Login credentials invalid');
                return;
              }
              if (data.token) {
                localStorage.setItem('token', data.token);
              }
              localStorage.setItem('user', JSON.stringify(data.user));
              try { window.dispatchEvent(new Event('userChanged')); } catch (e) {}
            }
          } catch (e) {
            // ignore parse errors and continue
          }
          try { sessionStorage.setItem('justLoggedIn', '1'); } catch (e) {}
          navigate('/dashboard', { state: { justLoggedIn: true } });
        } else {
          const data = await res.json();
          setLoginError(data.message || 'Login failed');
        }
      } catch (err) {
        setLoginError(`Unable to connect to server. Is the backend running on ${API_BASE}?`);
      }
    }
  };

  const loginForm = (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: 400,
          textAlign: 'center',
          borderRadius: 2,
          backgroundColor: 'white',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <img
            src="/White-Teeth-Logo.png"
            alt="White Teeth Logo"
            style={{ height: '60px' }}
          />
        </Box>
        <TextField
          fullWidth
          label="Username"
          variant="outlined"
          margin="normal"
          sx={{
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2148c0' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#183a93' },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2148c0' }, color: '#000'
          }}
          value={username}
          inputRef={usernameRef}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              passwordRef.current?.focus();
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon sx={{ color: '#2148c0' }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          label="Password"
          variant="outlined"
          margin="normal"
          sx={{
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2148c0' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#183a93' },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2148c0' }, color: '#000'
          }}
          type={showPassword ? 'text' : 'password'}
          value={password}
          inputRef={passwordRef}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleLogin();
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: '#2148c0' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <VisibilityOff sx={{ color: '#2148c0' }} /> : <Visibility sx={{ color: '#2148c0' }} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2, backgroundColor: '#2148c0', color: 'white', '&:hover': { backgroundColor: '#183a93' } }}
          onClick={handleLogin}
        >
          Login
        </Button>
        <Button
          variant="text"
          fullWidth
          sx={{ mt: 1, color: '#2148c0' }}
          onClick={() => navigate('/forgot-password')}
        >
          Forgot Password?
        </Button>
        {loginError && (
          <Typography color="error" sx={{ mt: 2 }}>
            {loginError}
          </Typography>
        )}
      </Paper>
    </Box>
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: 'url("/White-Teeth-BG.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f5f7fb'
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
  <Route path="/login" element={loginForm} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/add-patient" element={<PatientList />} />
  <Route path="/services" element={<ServiceList />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/accounts" element={<Accounts />} />
  <Route path="/appointments" element={<Appointments />} />
  <Route path="/invoice" element={<Invoice />} />
  <Route path="/billing" element={<Billing />} />
            <Route path="/sales" element={<Sales />} />

  {/* Service Page */}
  <Route path="/service-page" element={<ServiceList />} />
        </Routes>
        <GlobalToast />
      </Box>
    </ThemeProvider>
  );
}

export default App;