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
import Header from '../components/header'; // Import the new Header component
import QuickActionButton from '../components/QuickActionButton';
import { Typography } from '@mui/material';
import AddPatientRecord from './add-record';
import AddService from './add-service';
import Toast from '../components/Toast';

function Dashboard() {
  // quick-action state moved into shared QuickActionButton
  const [showPatientAdded, setShowPatientAdded] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  // Toast state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    type: 'info'
  });

  const showToast = (message, type = 'info') => {
    setToast({ open: true, message, type });
  };

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('justLoggedIn') || location.state?.usr?.justLoggedIn || window.history.state?.usr?.justLoggedIn;
    if (justLoggedIn) {
      showToast('Login successful!', 'success');
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
      try {
        const raw = localStorage.getItem('user');
        if (!raw) {
          showToast('Logged out', 'info');
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
      <Fade in={showPatientAdded} timeout={{ enter: 400, exit: 400 }}>
        <Box sx={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', bgcolor: '#C8E6C9', color: '#38883C', borderRadius: 2, py: 1, px: 3, fontWeight: 500, fontSize: '1.1rem', boxShadow: 3, zIndex: 2000 }}>
          Patient added successfully!
        </Box>
      </Fade>

      {/* Summary Cards */}
      <Box display="flex" gap={2} p={3}>
  <Paper sx={{ flex: 1, bgcolor: '#4caf50', color: 'white', p: 3, borderRadius: 2, height: 220, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
    <Typography variant="h1" sx={{ fontWeight: 800, fontSize: '6rem', lineHeight: 1, mb: 0.5 }}>3</Typography>
    <Typography variant="h6" sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>Completed<br/>Appointments Today</Typography>
  </Paper>
  <Paper sx={{ flex: 1, bgcolor: '#ff9800', color: 'white', p: 3, borderRadius: 2, height: 220, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
    <Typography variant="h1" sx={{ fontWeight: 800, fontSize: '6rem', lineHeight: 1, mb: 0.5 }}>15</Typography>
    <Typography variant="h6" sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>Upcoming<br/>Appointments</Typography>
  </Paper>
  <Paper sx={{ flex: 1, bgcolor: '#d13858', color: 'white', p: 3, borderRadius: 2, height: 220, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
    <Typography variant="h1" sx={{ fontWeight: 800, fontSize: '6rem', lineHeight: 1, mb: 0.5 }}>4</Typography>
    <Typography variant="h6" sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>Upcoming<br/>Appointments Today</Typography>
  </Paper>
</Box>


  <QuickActionButton onAddPatientRecord={handleAddPatientRecord} onAddAppointment={handleAddAppointment} />

      {/* Patient Modal */}
      <AddPatientRecord open={showPatientModal} onClose={() => setShowPatientModal(false)} />

      {/* Toast */}
      <Toast 
        open={toast.open} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Box>
  );
}

export default Dashboard;