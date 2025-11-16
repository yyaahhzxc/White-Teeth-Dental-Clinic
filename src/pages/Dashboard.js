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
import { API_BASE } from '../apiConfig';

function Dashboard() {
  // quick-action state moved into shared QuickActionButton
  const [showPatientAdded, setShowPatientAdded] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  // Dashboard statistics state
  const [dashboardStats, setDashboardStats] = useState({
    completedToday: 0,
    upcomingTotal: 0,
    upcomingToday: 0
  });
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

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

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/dashboard/stats`);
        if (response.ok) {
          const data = await response.json();
          setDashboardStats(data);
          console.log('✅ Dashboard stats loaded:', data);
        } else {
          console.error('❌ Failed to fetch dashboard stats');
        }
      } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, []);

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('justLoggedIn') || location.state?.usr?.justLoggedIn || window.history.state?.usr?.justLoggedIn;
    if (justLoggedIn) {
      showToast('Login successful!', 'success');
      setShowLoginAlert(true);
      setTimeout(() => setShowLoginAlert(false), 2000);
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
          setShowLogoutAlert(true);
          setTimeout(() => setShowLogoutAlert(false), 2000);
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
        <Box sx={{ position: 'fixed', top: 32, left: '50%', transform: 'translateX(-50%)', bgcolor: 'success.light', color: (theme) => theme.palette.text.primary, borderRadius: 2, py: 1, px: 3, fontWeight: 500, fontSize: '1.1rem', boxShadow: 3, zIndex: 2000 }}>
          Login successful!
        </Box>
      </Fade>
      <Fade in={showLogoutAlert} timeout={{ enter: 400, exit: 400 }}>
        <Box sx={{ position: 'fixed', top: 32, left: '50%', transform: 'translateX(-50%)', bgcolor: 'warning.light', color: (theme) => theme.palette.text.primary, borderRadius: 2, py: 1, px: 3, fontWeight: 500, fontSize: '1.1rem', boxShadow: 3, zIndex: 2000 }}>
          Logged out
        </Box>
      </Fade>
      <Fade in={showPatientAdded} timeout={{ enter: 400, exit: 400 }}>
        <Box sx={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', bgcolor: 'success.light', color: (theme) => theme.palette.text.primary, borderRadius: 2, py: 1, px: 3, fontWeight: 500, fontSize: '1.1rem', boxShadow: 3, zIndex: 2000 }}>
          Patient added successfully!
        </Box>
      </Fade>

      {/* Summary Cards */}
      <Box display="flex" gap={2} p={3}>
  <Paper sx={{ flex: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.success.dark : theme.palette.success.main, color: (theme) => theme.palette.mode === 'dark' ? '#000' : theme.palette.getContrastText(theme.palette.mode === 'dark' ? theme.palette.success.dark : theme.palette.success.main), p: 4, borderRadius: 2, height: 220 }}>
    <Typography variant="h4">3</Typography>
    <Typography>Completed Appointments Today</Typography>
  </Paper>
  <Paper sx={{ flex: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.warning.dark : theme.palette.warning.main, color: (theme) => theme.palette.mode === 'dark' ? '#000' : theme.palette.getContrastText(theme.palette.mode === 'dark' ? theme.palette.warning.dark : theme.palette.warning.main), p: 4, borderRadius: 2, height: 220 }}>
    <Typography variant="h4">15</Typography>
    <Typography>Upcoming Appointments</Typography>
  </Paper>
  <Paper sx={{ flex: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.error.dark : theme.palette.error.main, color: (theme) => theme.palette.mode === 'dark' ? '#000' : theme.palette.getContrastText(theme.palette.mode === 'dark' ? theme.palette.error.dark : theme.palette.error.main), p: 4, borderRadius: 2, height: 220 }}>
    <Typography variant="h4">4</Typography>
    <Typography>Upcoming Appointments Today</Typography>
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