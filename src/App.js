import React, { useState, useRef } from 'react';
import { Box, Paper, TextField, Button, Typography, InputAdornment } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import PatientList from './Records';
import ServiceList from './service-page';
import HomePage from './HomePage.js';

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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-patient" element={<PatientList />} />
        <Route path="/service-page" element={<ServiceList />} />
      </Routes>
    </Box>
  );
}

export default App;