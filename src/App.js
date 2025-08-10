import React, { useState, useRef } from 'react';
import { Box, Paper, TextField, Button, Typography, InputAdornment } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import AddPatientRecord from './Records';
import Header from './header'; // Import the Header component

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

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
        if (res.ok) {
          navigate('/dashboard', { state: { justLoggedIn: true } });
        } else {
          const data = await res.json();
          setLoginError(data.message || 'Login failed');
        }
      } catch (err) {
        setLoginError('Unable to connect to server. Is the backend running on http://localhost:3001?');
      }
    }
  };

  // Determine if the current route is the login page
  const isLoginPage = location.pathname === '/';

  return (
    <Box>
      {/* Render Header only if not on the login page */}
      {!isLoginPage && <Header />}

      <Routes>
        {/* Login Page */}
        <Route
          path="/"
          element={
            <Box
              sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                p: 3,
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
                <Typography variant="h5" sx={{ mb: 3 }}>
                  Login
                </Typography>
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
                  type="password"
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
                  sx={{ mt: 2 }}
                  onClick={handleLogin}
                >
                  Login
                </Button>
                {loginError && (
                  <Typography color="error" sx={{ mt: 2 }}>
                    {loginError}
                  </Typography>
                )}
              </Paper>
            </Box>
          }
        />
        {/* Dashboard Page */}
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Add Patient Record Page */}
        <Route path="/add-patient" element={<AddPatientRecord />} />
      </Routes>
    </Box>
  );
}

export default App;