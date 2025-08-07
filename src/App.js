import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  InputAdornment
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Dashboard from './Dashboard';
import AddPatientRecord from './AddPatientRecord';
import { Routes, Route, useNavigate } from 'react-router-dom';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const usernameRef = useRef();
  const passwordRef = useRef();

  const handleLogin = async () => {
    setLoginError('');
    if (username && password) {
      try {
        const res = await fetch('http://localhost:3001/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        // Fix: Check if fetch actually connects, and handle CORS or server issues
        if (res.ok) {
          navigate('/dashboard', { state: { justLoggedIn: true } });
        } else {
          let data = {};
          try {
            data = await res.json();
          } catch {
            data = {};
          }
          setLoginError(data.message || 'Login failed');
        }
      } catch (err) {
        setLoginError('Unable to connect to server. Is the backend running on http://localhost:3001?');
      }
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Box
            sx={{
              minHeight: '100vh',
              width: '100vw',
              backgroundImage: 'url("/White-Teeth-BG.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              m: 0,
              p: 0,
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <Paper
              elevation={6}
              sx={{
                p: 4,
                width: 350,
                textAlign: 'center',
                borderRadius: 3,
                backdropFilter: 'blur(6px)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              <Box mb={3}>
                <img
                  src="/White-Teeth-Logo.png"
                  alt="logo"
                  style={{ width: 80, height: 80 }}
                />
              </Box>

              <TextField
                fullWidth
                label="Username"
                placeholder="Username"
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
                placeholder="Password"
                type="password"
                variant="outlined"
                margin="normal"
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
                }}
              />

              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2, height: 50 }}
                onClick={handleLogin}
              >
                LOGIN
              </Button>

              {loginError && (
                <Typography sx={{ mt: 2, color: 'red', fontWeight: 500 }}>
                  {loginError}
                </Typography>
              )}

              <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
                Forgot password?
              </Typography>
            </Paper>
          </Box>
        }
      />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/add-patient" element={<AddPatientRecord />} />
    </Routes>
  );
}

export default App;
