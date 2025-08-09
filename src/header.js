import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine the active route
  const activeRoute = location.pathname;

  return (
    <AppBar position="static" sx={{ bgcolor: 'white', color: 'black' }}>
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
        {['Home', 'Records', 'Appointments', 'Invoice', 'Logs'].map((label) => {
          // Map labels to routes
          const routeMap = {
            Home: '/dashboard',
            Records: '/add-patient',
            Appointments: '/appointments',
            Invoice: '/invoice',
            Logs: '/logs',
          };

          const isActive = activeRoute === routeMap[label]; // Check if the route is active

          return (
            <Button
              key={label}
              color="inherit"
              sx={isActive ? {
                bgcolor: '#1746A2',
                color: 'white',
                borderRadius: 2,
                px: 2,
                mx: 0.5,
                '&:hover': {
                  bgcolor: '#12357a',
                }
              } : { mx: 0.5 }}
              onClick={() => navigate(routeMap[label])}
            >
              {label}
            </Button>
          );
        })}
        <IconButton color="inherit">
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Header;