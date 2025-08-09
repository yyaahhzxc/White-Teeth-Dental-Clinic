import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Fab,
  Zoom,
  Fade
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './header'; // Import the new Header component
import { Typography } from '@mui/material';

function Dashboard() {
  const [showActions, setShowActions] = useState(false);
  const [showFirst, setShowFirst] = useState(false); // Appointment
  const [showSecond, setShowSecond] = useState(false); // Patient
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showPatientAdded, setShowPatientAdded] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.history.state && window.history.state.usr && window.history.state.usr.justLoggedIn) {
      setShowLoginAlert(true);
      setTimeout(() => setShowLoginAlert(false), 1500);
    }
    if (location.state && location.state.patientAdded) {
      setShowPatientAdded(true);
      setTimeout(() => setShowPatientAdded(false), 1500);
      // Clear the state so it doesn't show again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const toggleActions = () => {
    if (!showActions) {
      setShowActions(true);
      setTimeout(() => setShowSecond(true), 15);
      setTimeout(() => setShowFirst(true), 75);
    } else {
      setShowFirst(false);
      setTimeout(() => setShowSecond(false), 15);
      setTimeout(() => setShowActions(false), 75);
    }
  };

  const handleAddPatientRecord = () => {
    setShowActions(false);
    setShowFirst(false);
    setShowSecond(false);
    navigate('/add-patient');
  };

  const handleAddAppointment = () => {
    setShowActions(false);
    setShowFirst(false);
    setShowSecond(false);
    navigate('/add-appointment'); // Update this route if necessary
  };

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundImage: 'url("/White-Teeth-BG.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative', // for overlay stacking
      }}
    >
      {/* Use the extracted Header component */}
      <Header />

      {/* Login Success Alert */}
      <Fade in={showLoginAlert} timeout={{ enter: 400, exit: 400 }}>
        <Box
          sx={{
            position: 'fixed',
            top: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: '#C8E6C9',
            color: '#38883C',
            borderRadius: 2,
            py: 1,
            px: 3,
            fontWeight: 500,
            fontSize: '1.1rem',
            boxShadow: 3,
            zIndex: 2000,
          }}
        >
          Login successful!
        </Box>
      </Fade>
      <Fade in={showPatientAdded} timeout={{ enter: 400, exit: 400 }}>
        <Box
          sx={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: '#C8E6C9',
            color: '#38883C',
            borderRadius: 2,
            py: 1,
            px: 3,
            fontWeight: 500,
            fontSize: '1.1rem',
            boxShadow: 3,
            zIndex: 2000,
          }}
        >
          Patient added successfully!
        </Box>
      </Fade>

      {/* Summary Cards */}
      <Box display="flex" gap={2} p={3}>
        <Paper sx={{ flex: 1, bgcolor: '#178E5C', color: 'white', p: 2, borderRadius: 2 }}>
          <Typography variant="h4">3</Typography>
          <Typography>Completed Appointments Today</Typography>
        </Paper>
        <Paper sx={{ flex: 1, bgcolor: '#FFAA1D', color: 'white', p: 2, borderRadius: 2 }}>
          <Typography variant="h4">15</Typography>
          <Typography>Upcoming Appointments</Typography>
        </Paper>
        <Paper sx={{ flex: 1, bgcolor: '#D9003C', color: 'white', p: 2, borderRadius: 2 }}>
          <Typography variant="h4">4</Typography>
          <Typography>Upcoming Appointments Today</Typography>
        </Paper>
      </Box>

      {/* Floating Buttons */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          zIndex: 1300, // above overlay
        }}
      >
        <Zoom in={showFirst} timeout={{ enter: 150, exit: 150 }}>
          <Box display="flex" alignItems="center" mb={1} sx={{ position: 'relative' }}>
            <Typography
              variant="body2"
              sx={{
                position: 'absolute',
                right: '100%',
                mr: 2,
                bgcolor: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                boxShadow: 1,
                fontWeight: 500,
                color: '#1746A2',
                minWidth: 120,
                whiteSpace: 'nowrap',
                textAlign: 'center',
                fontSize: '1.15rem',
              }}
            >
              Add Appointment
            </Typography>
            <Fab
              size="large"
              color="primary"
              sx={{ zIndex: 1, width: 64, height: 64 }}
              onClick={handleAddAppointment}
            >
              <EventAvailableIcon sx={{ fontSize: 36 }} />
            </Fab>
          </Box>
        </Zoom>

        <Zoom in={showSecond} timeout={{ enter: 150, exit: 150 }}>
          <Box display="flex" alignItems="center" mb={1} sx={{ position: 'relative' }}>
            <Typography
              variant="body2"
              sx={{
                position: 'absolute',
                right: '100%',
                mr: 2,
                bgcolor: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                boxShadow: 1,
                fontWeight: 500,
                color: '#1746A2',
                minWidth: 120,
                whiteSpace: 'nowrap',
                textAlign: 'right',
                fontSize: '1.15rem',
              }}
            >
              Add Patient Record
            </Typography>
            <Fab
              size="large"
              color="primary"
              sx={{ zIndex: 1, width: 64, height: 64 }}
              onClick={handleAddPatientRecord}
            >
              <PersonAddIcon sx={{ fontSize: 36 }} />
            </Fab>
          </Box>
        </Zoom>

        <Fab
          color="primary"
          onClick={toggleActions}
          sx={{
            transition: 'transform 0.2s ease-in-out',
            transform: showActions ? 'rotate(45deg)' : 'rotate(0deg)',
            width: 72,
            height: 72,
          }}
        >
          <AddIcon sx={{ fontSize: 40 }} />
        </Fab>
      </Box>
    </Box>
  );
}

export default Dashboard;