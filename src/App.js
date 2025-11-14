import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, TextField, Button, Typography, InputAdornment, IconButton } from '@mui/material';
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
import Accounting from './pages/Accounting';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import Accounts from './pages/Accounts';
import { API_BASE } from './apiConfig';
import GlobalToast from './components/GlobalToast';





function App() {
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
                <PersonIcon />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          label="Password"
          variant="outlined"
          margin="normal"
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
                <LockIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleLogin}
        >
          Login
        </Button>
        <Button
          variant="text"
          color="primary"
          fullWidth
          sx={{ mt: 1 }}
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
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: 'url("/White-Teeth-BG.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
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
  <Route path="/accounting" element={<Accounting />} />

  {/* Service Page */}
  <Route path="/service-page" element={<ServiceList />} />
      </Routes>
      <GlobalToast />
    </Box>
  );
}

export default App;