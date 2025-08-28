import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false); // State for dialog
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);
  const navigateTo = (path) => {
    handleMenuClose();
    navigate(path);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        setIsAdmin(u && u.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      setIsAdmin(false);
    }
  // If there's a token but the stored user might be stale, try to refresh from server
    try {
      const token = localStorage.getItem('token');
      if (token) {
        fetch('http://localhost:3001/me', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => {
            if (!r.ok) throw new Error('not-auth');
            return r.json();
          })
          .then((data) => {
            if (data && data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));
              setIsAdmin(data.user.role === 'admin');
            }
          })
          .catch(() => {
            // ignore errors - user may need to login again
          });
      }
    } catch (e) {
      // ignore
    }
    // listen for changes to user (login/logout) so header updates immediately
    const onUserChanged = () => {
      try {
        const raw2 = localStorage.getItem('user');
        if (raw2) {
          const u2 = JSON.parse(raw2);
          setIsAdmin(u2 && u2.role === 'admin');
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        setIsAdmin(false);
      }
    };
    window.addEventListener('userChanged', onUserChanged);
    return () => window.removeEventListener('userChanged', onUserChanged);
  }, []);

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
            {/* Navigation items in specific order. 'Logs' kept in routeMap but not shown. */}
            {(
              ['Home', 'Records', 'Appointments', 'Invoice', 'Services', 'Accounting']
            ).map((label) => {
              const routeMap = {
                Home: '/dashboard',
                Records: '/add-patient',
                Appointments: '/appointments',
                Invoice: '/invoice',
                Logs: '/logs', // keep Logs mapping in code but don't render it
                Services: '/service-page',
                Users: '/accounts',
                Accounting: '/accounting',
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
          <IconButton
            color="inherit"
            sx={{ ml: 1 }}
            aria-label="user"
            onClick={handleAvatarClick}
            aria-controls={open ? 'header-user-menu' : undefined}
            aria-haspopup="true"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
              <PersonIcon sx={{ color: 'white', fontSize: 18 }} />
            </Avatar>
          </IconButton>

          <Menu
            id="header-user-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box
              component="button"
              onClick={() => navigateTo('/profile')}
              sx={{
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Avatar sx={{ width: 56, height: 56, bgcolor: '#b39ddb' }}>
                <PersonIcon sx={{ color: 'white' }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1">Last, First</Typography>
                <Typography variant="caption" color="text.secondary">username</Typography>
              </Box>
            </Box>
            <Divider />
            <MenuItem onClick={() => navigateTo('/settings')}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            {isAdmin && (
              <MenuItem onClick={() => { navigateTo('/accounts'); }}>
                <ListItemIcon>
                  <PeopleIcon sx={{ color: '#6A1B9A' }} fontSize="small" />
                </ListItemIcon>
                <ListItemText sx={{ color: '#6A1B9A' }}>Users</ListItemText>
              </MenuItem>
            )}
            <MenuItem onClick={() => navigateTo('/logs')}>
              <ListItemIcon>
                <BookmarksIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logs</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                // clear stored session info and navigate to login
                handleMenuClose();
                try {
                  const token = localStorage.getItem('token');
                  fetch('http://localhost:3001/logout', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} }).catch(() => {});
                } catch (e) {}
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                try { sessionStorage.removeItem('justLoggedIn'); } catch (e) {}
                try { window.dispatchEvent(new Event('userChanged')); } catch (e) {}
                navigate('/login');
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </>
  );
}

export default Header;