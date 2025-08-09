import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Header from './header'; // Import the Header component

function AddPatientRecord() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!name || !age || !contact) {
      setError('All fields are required');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, contact }),
      });

      if (res.ok) {
        navigate('/dashboard', { state: { patientAdded: true } });
      } else {
        setError('Failed to add patient');
      }
    } catch {
      setError('Unable to connect to the server');
    }
  };

  return (
    <Box>
      {/* Add the Header component */}
      <Header />

      {/* Main content */}
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
            Add Patient Record
          </Typography>
          <TextField
            fullWidth
            label="Name"
            variant="outlined"
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            fullWidth
            label="Age"
            variant="outlined"
            margin="normal"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <TextField
            fullWidth
            label="Contact"
            variant="outlined"
            margin="normal"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}

export default AddPatientRecord;