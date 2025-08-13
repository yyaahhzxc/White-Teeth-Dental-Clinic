import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Fab,
  Zoom,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Grid,
  Tabs,
  Tab,
  Button,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './header'; // Import the new Header component
import { Typography } from '@mui/material';
import AddPatientRecord from './add-record';
import AddService from './add-service';

function Dashboard() {
  const [showActions, setShowActions] = useState(false);
  const [showFirst, setShowFirst] = useState(false);
  const [showSecond, setShowSecond] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showPatientAdded, setShowPatientAdded] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.history.state?.usr?.justLoggedIn) {
      setShowLoginAlert(true);
      setTimeout(() => setShowLoginAlert(false), 1500);
    }
    if (location.state?.patientAdded) {
      setShowPatientAdded(true);
      setTimeout(() => setShowPatientAdded(false), 1500);
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
    setShowPatientModal(true); // open modal instead of navigating
  };

  const handleAddAppointment = () => {
    setShowActions(false);
    setShowFirst(false);
    setShowSecond(false);
    navigate('/add-appointment'); // Update this route if necessary
  };

  return (
    <Box sx={{ height: '100vh', backgroundImage: 'url("/White-Teeth-BG.png")', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
      {/* Overlay */}
      {(showActions || showFirst || showSecond) && (
        <Box
          onClick={() => { if (showActions) toggleActions(); }}
          sx={{
            position: 'fixed', zIndex: 1200, top: 0, left: 0, width: '100vw', height: '100vh',
            pointerEvents: showActions ? 'auto' : 'none',
            bgcolor: showActions ? 'rgba(0,0,0,0.01)' : 'rgba(0,0,0,0.45)',
            animation: `${showActions ? 'fadeDarken' : 'fadeLighten'} 0.25s forwards`,
            transition: 'background 0.25s',
            '@keyframes fadeDarken': {
              from: { backgroundColor: 'rgba(0,0,0,0.01)' },
              to: { backgroundColor: 'rgba(0,0,0,0.45)' }
            },
            '@keyframes fadeLighten': {
              from: { backgroundColor: 'rgba(0,0,0,0.45)' },
              to: { backgroundColor: 'rgba(0,0,0,0.01)' }
            }
          }}
        />
      )}

      {/* Alerts */}
      <Fade in={showLoginAlert} timeout={{ enter: 400, exit: 400 }}>
        <Box sx={{ position: 'fixed', top: 32, left: '50%', transform: 'translateX(-50%)', bgcolor: '#C8E6C9', color: '#38883C', borderRadius: 2, py: 1, px: 3, fontWeight: 500, fontSize: '1.1rem', boxShadow: 3, zIndex: 2000 }}>
          Login successful!
        </Box>
      </Fade>
      <Fade in={showPatientAdded} timeout={{ enter: 400, exit: 400 }}>
        <Box sx={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', bgcolor: '#C8E6C9', color: '#38883C', borderRadius: 2, py: 1, px: 3, fontWeight: 500, fontSize: '1.1rem', boxShadow: 3, zIndex: 2000 }}>
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
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, zIndex: 1300 }}>
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
            <Typography variant="body2" sx={{ position: 'absolute', right: '100%', mr: 2, bgcolor: 'white', px: 1.5, py: 0.5, borderRadius: 1.5, boxShadow: 1, fontWeight: 500, color: '#1746A2', minWidth: 120, whiteSpace: 'nowrap', textAlign: 'right', fontSize: '1.15rem' }}>Add Patient Record</Typography>
            <Fab size="large" color="primary" sx={{ zIndex: 1, width: 64, height: 64 }} onClick={handleAddPatientRecord}>
              <PersonAddIcon sx={{ fontSize: 36 }} />
            </Fab>
          </Box>
        </Zoom>

        <Fab color="primary" onClick={toggleActions} sx={{ transition: 'transform 0.2s ease-in-out', transform: showActions ? 'rotate(45deg)' : 'rotate(0deg)', width: 72, height: 72 }}>
          <AddIcon sx={{ fontSize: 40 }} />
        </Fab>
      </Box>

      {/* Patient Modal */}
      <AddPatientRecord open={showPatientModal} onClose={() => setShowPatientModal(false)} />
    </Box>
  );
}

export default Dashboard;