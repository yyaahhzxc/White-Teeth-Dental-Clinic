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
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../apiConfig';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false); // State for dialog
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);

  // Helper to determine if a user object represents an admin.
  // Accepts different role property names and common values ('admin', 'administrator').
  const isAdminUser = (u) => {
    if (!u) return false;
    const candidates = [u.role, u.userRole, u.user_role, u.userRoleName, u.user_role_name];
    for (let v of candidates) {
      if (!v) continue;
      try {
        const s = String(v).toLowerCase();
        if (s === 'admin' || s === 'administrator' || s.includes('admin')) return true;
      } catch (e) {
        // ignore
      }
    }
    return false;
  };

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);
  const navigateTo = (path) => {
    handleMenuClose();
    navigate(path);
  };

  // Load and maintain current user data reliably
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        // First get basic user info from localStorage
        const stored = localStorage.getItem('user');
        let username = 'admin';
        let basicUser = null;
        
        if (stored) {
          basicUser = JSON.parse(stored);
          username = basicUser.username || 'admin';
          // Set basic user data immediately for UI responsiveness
          setCurrentUser(basicUser);
          setIsAdmin(isAdminUser(basicUser));
        }

        // Then fetch complete user data from backend
        try {
          const response = await fetch(`${API_BASE}/users`);
          if (response.ok) {
            const users = await response.json();
            const completeUser = users.find(user => user.username === username) || users[0];
            if (completeUser) {
              // Update with complete backend data
              setCurrentUser(completeUser);
              setIsAdmin(isAdminUser(completeUser));
              
              // Also update localStorage with complete data
              localStorage.setItem('user', JSON.stringify(completeUser));
              
              // Load user photo
              if (completeUser.username) {
                try {
                  const photoRes = await fetch(`${API_BASE}/user-photo/${completeUser.username}`);
                  if (photoRes.ok) {
                    const photoData = await photoRes.json();
                    setUserPhoto(photoData.photo || null);
                  } else {
                    setUserPhoto(null);
                  }
                } catch (photoErr) {
                  setUserPhoto(null);
                }
              }
            }
          }
        } catch (backendError) {
          console.log('Backend not available, using localStorage data');
          // If backend fails, fallback to localStorage data
          if (basicUser) {
            // Still try to load photo from backend if possible
            if (basicUser.username) {
              try {
                const photoRes = await fetch(`${API_BASE}/user-photo/${basicUser.username}`);
                if (photoRes.ok) {
                  const photoData = await photoRes.json();
                  setUserPhoto(photoData.photo || null);
                } else {
                  setUserPhoto(null);
                }
              } catch (photoErr) {
                setUserPhoto(null);
              }
            }
          }
        }
        
        if (!stored && !basicUser) {
          setCurrentUser(null);
          setIsAdmin(false);
          setUserPhoto(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setCurrentUser(null);
        setIsAdmin(false);
        setUserPhoto(null);
      }
    };

    // Initial load
    loadCurrentUser();

    // Set up periodic refresh to ensure we get fresh data
    const refreshInterval = setInterval(loadCurrentUser, 30000); // Refresh every 30 seconds

    // Listen for user changes
    const handleUserChanged = () => loadCurrentUser();
    const handlePhotoChanged = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const user = JSON.parse(stored);
          if (user.username) {
            try {
              const photoRes = await fetch(`${API_BASE}/user-photo/${user.username}`);
              if (photoRes.ok) {
                const photoData = await photoRes.json();
                setUserPhoto(photoData.photo || null);
              } else {
                setUserPhoto(null);
              }
            } catch (photoErr) {
              setUserPhoto(null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading photo:', error);
        setUserPhoto(null);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        loadCurrentUser();
      }
    };

    // Add event listeners
    window.addEventListener('userChanged', handleUserChanged);
    window.addEventListener('userPhotoChanged', handlePhotoChanged);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('userChanged', handleUserChanged);
      window.removeEventListener('userPhotoChanged', handlePhotoChanged);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);  // Keep isAdmin in sync with currentUser
  useEffect(() => {
    setIsAdmin(isAdminUser(currentUser));
  }, [currentUser]);

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
              ['Home', 'Records', 'Appointments', 'Invoices', 'Services', 'Accounting']
            ).map((label) => {
              const routeMap = {
                Home: '/dashboard',
                Records: '/add-patient',
                Appointments: '/appointments',
                Invoices: '/invoice',
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
            <Avatar src={userPhoto || '/default-icon.svg'} sx={{ width: 32, height: 32, bgcolor: userPhoto ? '#1976d2' : 'transparent', border: userPhoto ? '1px solid #155a9c' : 'none', boxSizing: 'border-box', '& img': { objectFit: 'cover', width: '100%', height: '100%' } }} />
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
              <Avatar src={userPhoto || '/default-icon.svg'} sx={{ width: 56, height: 56, bgcolor: userPhoto ? '#b39ddb' : 'transparent', border: userPhoto ? '2px solid #a38ccc' : 'none', boxSizing: 'border-box', '& img': { objectFit: 'cover', width: '100%', height: '100%' } }} />
              <Box>
                <Typography variant="subtitle1">
                  {currentUser && currentUser.firstName && currentUser.lastName 
                    ? `${currentUser.lastName}, ${currentUser.firstName}`
                    : 'User Name'
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {currentUser && currentUser.username ? currentUser.username : 'username'}
                </Typography>
              </Box>
            </Box>
            <Divider />
            <MenuItem onClick={() => navigateTo('/settings')}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            {(isAdmin || isAdminUser(currentUser)) && (
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
                  fetch(`${API_BASE}/logout`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} }).catch(() => {});
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