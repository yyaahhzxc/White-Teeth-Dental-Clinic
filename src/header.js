import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';
import AddService from './add-service'; // Import your AddService dialog

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false); // State for dialog

  // Determine the active route
  const activeRoute = location.pathname;

  return (
    <>
      <AppBar
        position="static"
        sx={{
          bgcolor: 'white',
          color: 'black',
          position: 'relative',
          boxShadow: 'none',
          margin: 0,
        }}
      >
        <Toolbar>
          <img
            src="/White-Teeth-Logo.png"
            alt="logo"
            style={{ width: 40, marginRight: 8, cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            White Teeth Dental Clinic
          </Typography>
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {['Home', 'Records', 'Appointments', 'Invoice', 'Logs', 'Services'].map((label) => {
              const routeMap = {
                Home: '/dashboard',
                Records: '/add-patient',
                Appointments: '/appointments',
                Invoice: '/invoice',
                Logs: '/logs',
                Services: '/services',
              };
              const isActive = activeRoute === routeMap[label];
              return (
                <Button
                  key={label}
                  color="inherit"
                  sx={{
                    position: 'relative',
                    mx: 0.5,
                    color: isActive ? 'white' : 'black',
                    bgcolor: isActive ? '#1746A2' : 'transparent',
                    borderRadius: 2,
                    px: 2,
                    transition: 'background-color 0.8s ease, color 0.8s ease',
                    '&:hover': {
                      bgcolor: isActive ? '#12357a' : '#f0f0f0',
                    },
                  }}
                  onClick={() => navigate(routeMap[label])}
                >
                  {label}
                </Button>
              );
            })}
          </Box>
          <IconButton color="inherit" onClick={() => setServiceDialogOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <AddService open={serviceDialogOpen} onClose={() => setServiceDialogOpen(false)} />
    </>
  );
}

export default Header;