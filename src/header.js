import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine the active route
  const activeRoute = location.pathname;

  return (
    <AppBar position="static" sx={{ bgcolor: 'white', color: 'black', position: 'relative' }}>
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

        {/* Wrapper for buttons */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {/* Render buttons */}
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
                sx={{
                  position: 'relative',
                  mx: 0.5,
                  color: isActive ? 'white' : 'black', // Active text color
                  bgcolor: isActive ? '#1746A2' : 'transparent', // Active background color
                  borderRadius: 2,
                  px: 2,
                  transition: 'background-color 0.8s ease, color 0.8s ease', // Smooth transition for background and text color
                  '&:hover': {
                    bgcolor: isActive ? '#12357a' : '#f0f0f0', // Hover effect
                  },
                }}
                onClick={() => navigate(routeMap[label])}
              >
                {label}
              </Button>
            );
          })}
        </Box>

        <IconButton color="inherit">
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Header;