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
import QuickActionButton from './QuickActionButton';
import { Typography } from '@mui/material';
import AddPatientRecord from './add-record';
import AddService from './add-service';

function Dashboard() {
  // quick-action state moved into shared QuickActionButton
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showPatientAdded, setShowPatientAdded] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('justLoggedIn') || location.state?.usr?.justLoggedIn || window.history.state?.usr?.justLoggedIn;
    if (justLoggedIn) {
      setShowLoginAlert(true);
      setTimeout(() => setShowLoginAlert(false), 1500);
      // clear navigation + session flag so this only shows once per successful login
      try { sessionStorage.removeItem('justLoggedIn'); } catch (e) {}
      try { navigate(location.pathname, { replace: true, state: {} }); } catch (e) {}
      try { window.history.replaceState({}, document.title, location.pathname); } catch (e) {}
    }
    if (location.state?.patientAdded) {
      setShowPatientAdded(true);
      setTimeout(() => setShowPatientAdded(false), 1500);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // listen for login/logout changes so we can show a logout snackbar and clear the login alert
    const onUserChanged = () => {
      // hide any lingering login alert
      setShowLoginAlert(false);
      try {
        const raw = localStorage.getItem('user');
        if (!raw) {
          setShowLogoutAlert(true);
          setTimeout(() => setShowLogoutAlert(false), 1500);
        }
      } catch (e) {}
    };
    window.addEventListener('userChanged', onUserChanged);
    return () => window.removeEventListener('userChanged', onUserChanged);
  }, [location, navigate]);

  // handlers to pass down to QuickActionButton
  const handleAddPatientRecord = () => setShowPatientModal(true);
  const handleAddAppointment = () => navigate('/add-appointment');

  return (
    <Box sx={{ height: '100vh', backgroundImage: 'url("/White-Teeth-BG.png")', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', userSelect: 'none' }}>
  {/* Site header */}
  <Header />
  {/* Overlay for quick actions was removed; quick-action state now lives inside `QuickActionButton`. */}

      {/* Alerts */}
      <Fade in={showLoginAlert} timeout={{ enter: 400, exit: 400 }}>
        <Box sx={{ position: 'fixed', top: 32, left: '50%', transform: 'translateX(-50%)', bgcolor: '#C8E6C9', color: '#38883C', borderRadius: 2, py: 1, px: 3, fontWeight: 500, fontSize: '1.1rem', boxShadow: 3, zIndex: 2000 }}>
          Login successful!
        </Box>
      </Fade>
      <Fade in={showLogoutAlert} timeout={{ enter: 400, exit: 400 }}>
        <Box sx={{ position: 'fixed', top: 32, left: '50%', transform: 'translateX(-50%)', bgcolor: '#FFE0B2', color: '#8A4B00', borderRadius: 2, py: 1, px: 3, fontWeight: 500, fontSize: '1.1rem', boxShadow: 3, zIndex: 2000 }}>
          Logged out
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

  <QuickActionButton onAddPatientRecord={handleAddPatientRecord} onAddAppointment={handleAddAppointment} />

      {/* Patient Modal */}
      <AddPatientRecord open={showPatientModal} onClose={() => setShowPatientModal(false)} />
    </Box>
  );
}

export default Dashboard;