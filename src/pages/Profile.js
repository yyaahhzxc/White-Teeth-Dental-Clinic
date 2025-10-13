import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  IconButton,
  Fade,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment
} from "@mui/material";
import { 
  Edit as EditIcon, 
  Visibility, 
  VisibilityOff 
} from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import Header from "../components/header";
import { API_BASE } from '../apiConfig';

export default function Profile() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    employeeRole: "",
    role: "",
    status: ""
  });
  const [originalData, setOriginalData] = useState({});
  const [photo, setPhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMasked, setPasswordMasked] = useState(true); // Track if password is masked
  const [currentUserRole, setCurrentUserRole] = useState('user'); // Track current user's role
  const [employeeRoleOptions, setEmployeeRoleOptions] = useState([]);
  const [userRoleOptions, setUserRoleOptions] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    color: '#C8E6C9',        // success bg default
    textColor: '#38883C'     // success text default
  });

  const navigate = useNavigate();

  // Fetch role options from database
  useEffect(() => {
    fetchRoleOptions();
  }, []);

  const fetchRoleOptions = async () => {
    try {
      const response = await fetch(`${API_BASE}/role-options`);
      if (response.ok) {
        const { employeeRoles, userRoles } = await response.json();
        setEmployeeRoleOptions(employeeRoles);
        setUserRoleOptions(userRoles);
      } else {
        console.log('Role options endpoint not available, using defaults');
        setDefaultRoleOptions();
      }
    } catch (error) {
      console.error('Error fetching role options:', error);
      setDefaultRoleOptions();
    }
  };

  const setDefaultRoleOptions = () => {
    // Set employee role options based on standardized database roles
    setEmployeeRoleOptions([
      'Dentist',
      'Assistant Dentist', 
      'Receptionist'
    ]);
    setUserRoleOptions(['User', 'Administrator']);
  };

  // Unified snackbar helper (mirrors Accounts.js style)
  const showSnackbar = (message, { error = false, duration = 2000 } = {}) => {
    setSnackbar({
      open: true,
      message,
      color: error ? '#FFCDD2' : '#C8E6C9',
      textColor: error ? '#B71C1C' : '#38883C'
    });
    if (duration !== 0) {
      setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), duration);
    }
  };

  // Get current user data
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      // First try to get user from localStorage (same as header)
      const userStr = localStorage.getItem('user');
      let username = 'admin';
      let currentUser = null;
      if (userStr) {
        currentUser = JSON.parse(userStr);
        username = currentUser.username || 'admin';
      }

      // Always fetch actual info from backend
      let userInfo = null;
      try {
        // Fetch all users first
        const response = await fetch(`${API_BASE}/users`);
        if (response.ok) {
          const users = await response.json();
          userInfo = users.find(user => user.username === username) || users[0];
        }
        // If userInfo found, fetch full details including password
        if (userInfo && userInfo.id) {
          const detailsRes = await fetch(`${API_BASE}/users/${userInfo.id}`);
          if (detailsRes.ok) {
            const details = await detailsRes.json();
            userInfo = { ...userInfo, ...details };
          }
        }
      } catch (err) {
        // fallback to localStorage info if backend fails
        userInfo = currentUser;
      }

      if (userInfo) {
        const userData = {
          firstName: userInfo.firstName || "",
          lastName: userInfo.lastName || "",
          username: userInfo.username || "",
          password: userInfo.password || "", // Now password is fetched from backend
          employeeRole: userInfo.employeeRole || "",
          role: userInfo.role || userInfo.userRole || "",
          status: userInfo.status || ""
        };
        setFormData(userData);
        setOriginalData(userData);
        setPasswordMasked(true); // Password is initially masked

        // Set current user's role for permission checking
        setCurrentUserRole(userInfo.role || userInfo.userRole || 'user');
      }
      // Fetch photo from backend
      if (username) {
        try {
          const photoRes = await fetch(`${API_BASE}/user-photo/${username}`);
          if (photoRes.ok) {
            const { photo: photoData } = await photoRes.json();
            setPhoto(photoData || "");
          }
        } catch (err) {
          setPhoto("");
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle photo upload
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showSnackbar('Please select a valid image file', { error: true, duration: 3000 });
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('Image size must be less than 5MB', { error: true, duration: 3000 });
      return;
    }
    
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      try {
        const username = formData.username || 'admin';
        const url = `${API_BASE}/user-photo/${username}`;
        console.log('Uploading photo to:', url);
        console.log('Username:', username);
        console.log('Base64 length:', base64.length);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo: base64 })
        });
        
        if (response.ok) {
          setPhoto(base64);
          showSnackbar('Photo updated successfully!');
          try { window.dispatchEvent(new Event('userPhotoChanged')); } catch(e) {}
        } else {
          const errorData = await response.text();
          console.error('Upload failed with status:', response.status, 'Error:', errorData);
          throw new Error(`Failed to upload photo (${response.status}): ${errorData}`);
        }
      } catch (err) {
        console.error('Error uploading photo:', err);
        showSnackbar('Failed to update photo', { error: true, duration: 3000 });
      }
      setUploading(false);
    };
    reader.onerror = () => {
      showSnackbar('Failed to read image file', { error: true, duration: 3000 });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle photo removal
  const handleRemovePhoto = async () => {
    setUploading(true);
    try {
      const response = await fetch(`${API_BASE}/user-photo/${formData.username || 'admin'}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setPhoto("");  // Set to empty string to show default icon
        showSnackbar('Photo removed successfully!');
        try { window.dispatchEvent(new Event('userPhotoChanged')); } catch(e) {}
      } else {
        throw new Error('Failed to remove photo');
      }
    } catch (err) {
      console.error('Error removing photo:', err);
      showSnackbar('Failed to remove photo', { error: true, duration: 3000 });
    }
    setUploading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'password') {
      setPasswordMasked(false); // User is typing a new password
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDropdownChange = (name) => (event) => {
    setFormData(prev => ({
      ...prev,
      [name]: event.target.value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      // Debug logging
      console.log('Current user:', currentUser);
      console.log('Token exists:', !!token);
      console.log('Token length:', token ? token.length : 0);
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Prepare update data (exclude password if it's the masked value)
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        employeeRole: formData.employeeRole,
        userRole: formData.role,
        status: formData.status
      };

      // Only include password if it's been changed (not empty and not masked)
      if (formData.password && !passwordMasked) {
        updateData.password = formData.password;
      }

      console.log('Sending update data:', updateData);

      const response = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        // Update localStorage with new user data
        const updatedUser = {
          ...currentUser,
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          employeeRole: formData.employeeRole,
          userRole: formData.role,
          role: formData.role?.toLowerCase() || 'user'
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        showSnackbar('Profile updated successfully!');
        setIsEditing(false);
        setOriginalData(formData);
        
        // Trigger user change event to update header
        try { window.dispatchEvent(new Event('userChanged')); } catch(e) {}
      } else {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || 'Unknown error' };
        }
        
        // Handle authentication errors
        if (response.status === 401) {
          showSnackbar('Session expired. Please log in again.', { error: true, duration: 5000 });
          // Clear localStorage and redirect to login
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }
        
        throw new Error(errorData.error || errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showSnackbar(`Failed to update profile: ${error.message}`, { error: true, duration: 3000 });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setPasswordMasked(true); // Reset password to masked state
    setShowPassword(false); // Hide password when canceling
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: '#2148c0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="white">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#2148c0',
      position: 'relative'
    }}>
      {/* Header */}
      <Header />
      
      {/* Main Content - White container that extends almost to edges */}
      <Box sx={{ 
        px: '44px', // left-11 and right margins from Figma
        pt: '20px', // Small top spacing after header
        pb: '44px'
      }}>
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 5,
            bgcolor: '#f8f8f8',
            border: '1px solid #f0f0f0',
            position: 'relative',
            height: '650px', // Reduced from 680px to 650px to definitely eliminate scrollbar
            width: '1351px', // Fixed width from Figma
            mx: 'auto',
            mt: '41px' // 153px (top) - 112px (header height)
          }}
        >
          {/* Title */}
          <Typography 
            variant="h1" 
            sx={{ 
              position: 'absolute',
              top: '31px',
              left: '48px',
              fontWeight: 800,
              fontSize: '48px',
              color: '#1b1b1b',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1,
              m: 0
            }}
          >
            Profile Settings
          </Typography>

          {/* Avatar */}
          <Avatar
            src={photo || '/default-icon.svg'}
            sx={{ 
              position: 'absolute',
              left: '67px',
              top: '157px',
              width: 350,
              height: 350,
              bgcolor: photo ? '#eaddff' : 'transparent',
              color: '#4F378A',
              border: photo ? '2px solid #e0d3f7' : 'none',
              boxSizing: 'border-box',
              '& img': { objectFit: 'cover', width: '100%', height: '100%' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            alt="User avatar"
          />

          {/* Change Photo Button */}
          <Button
            component="label"
            variant="contained"
            disabled={uploading}
            sx={{
              position: 'absolute',
              left: '59px',
              top: '530px',
              bgcolor: '#274fc7',
              color: 'white',
              fontWeight: 600,
              px: 0,
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '16px',
              lineHeight: 1.3,
              width: '126px',
              height: '48px',
              '&:hover': { bgcolor: '#1e3a9f' },
              '&:disabled': { 
                bgcolor: '#ccc', 
                color: '#888' 
              }
            }}
          >
            {uploading ? 'Uploading...' : 'Change Photo'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </Button>

          {/* Remove Photo Button */}
          <Button
            variant="outlined"
            onClick={handleRemovePhoto}
            disabled={uploading}
            sx={{
              position: 'absolute',
              left: '300px',
              top: '530px',
              borderColor: '#2148c0',
              color: '#2148c0',
              fontWeight: 600,
              px: 0,
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '16px',
              lineHeight: 1.3,
              width: '126px',
              height: '48px',
              bgcolor: 'white',
              borderWidth: '1px',
              '&:hover': { bgcolor: '#f8f8f8', borderColor: '#1e3a9f' },
              '&:disabled': { 
                bgcolor: '#f5f5f5', 
                borderColor: '#ccc', 
                color: '#999' 
              }
            }}
          >
            {uploading ? 'Removing...' : 'Remove Photo'}
          </Button>

          {/* First Name */}
          <Box sx={{ position: 'absolute', left: '535px', top: '147px', width: '341px' }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '24px', color: 'black', fontFamily: 'Inter, sans-serif', lineHeight: 1, mb: '10px' }}>First Name</Typography>
            <TextField
              name="firstName"
              value={formData.firstName || ''}
              onChange={handleInputChange}
              variant="outlined"
              disabled={!isEditing}
              sx={{ width: '341px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 1, height: '56px' } }}
            />
          </Box>

          {/* Last Name */}
          <Box sx={{ position: 'absolute', left: '918px', top: '144px', width: '341px' }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '24px', color: 'black', fontFamily: 'Inter, sans-serif', lineHeight: 1, mb: '10px' }}>Last Name</Typography>
            <TextField
              name="lastName"
              value={formData.lastName || ''}
              onChange={handleInputChange}
              variant="outlined"
              disabled={!isEditing}
              sx={{ width: '341px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 1, height: '56px' } }}
            />
          </Box>

          {/* Username */}
          <Box sx={{ position: 'absolute', left: '535px', top: '254px', width: '341px' }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '24px', color: 'black', fontFamily: 'Inter, sans-serif', lineHeight: 1, mb: '10px' }}>Username</Typography>
            <TextField
              name="username"
              value={formData.username || ''}
              onChange={handleInputChange}
              variant="outlined"
              disabled={!isEditing}
              sx={{ width: '341px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 1, height: '56px' } }}
            />
          </Box>

          {/* Password */}
          <Box sx={{ position: 'absolute', left: '918px', top: '260px', width: '341px' }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '24px', color: 'black', fontFamily: 'Inter, sans-serif', lineHeight: 1, mb: '10px' }}>Password</Typography>
            <TextField
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password || ''}
              onChange={handleInputChange}
              variant="outlined"
              disabled={!isEditing}
              placeholder={isEditing && passwordMasked ? "Enter new password..." : ""}
              sx={{ width: '341px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 1, height: '56px' } }}
              InputProps={{
                endAdornment: isEditing ? (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                      sx={{ mr: 1 }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
          </Box>

          {/* Employee Role */}
          <Box sx={{ position: 'absolute', left: '535px', top: '367px', width: '341px' }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '24px', color: 'black', fontFamily: 'Inter, sans-serif', lineHeight: 1, mb: '10px' }}>Employee Role</Typography>
            {(isEditing && currentUserRole.toLowerCase() === 'administrator') ? (
              <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 1, height: '56px' } }}>
                <Select
                  name="employeeRole"
                  value={formData.employeeRole || ''}
                  onChange={handleDropdownChange('employeeRole')}
                  displayEmpty
                  sx={{ height: '56px' }}
                >
                  <MenuItem value="">
                    <em>Select Employee Role</em>
                  </MenuItem>
                  {employeeRoleOptions.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : isEditing ? (
              <TextField
                name="employeeRole"
                value={formData.employeeRole || ''}
                variant="outlined"
                disabled
                sx={{
                  width: '341px',
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#f5f5f5', // grayed out background only when editing
                    borderRadius: 1,
                    height: '56px'
                  }
                }}
                helperText={"Only administrators can change employee role"}
                FormHelperTextProps={{
                  sx: {
                    color: '#666',
                    fontSize: '12px',
                    mt: 0.5,
                    fontStyle: 'italic'
                  }
                }}
              />
            ) : (
              <TextField
                name="employeeRole"
                value={formData.employeeRole || ''}
                variant="outlined"
                disabled
                sx={{
                  width: '341px',
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white', // normal background when not editing
                    borderRadius: 1,
                    height: '56px'
                  }
                }}
              />
            )}
          </Box>

          {/* User Role */}
          <Box sx={{ position: 'absolute', left: '918px', top: '367px', width: '341px' }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '24px', color: 'black', fontFamily: 'Inter, sans-serif', lineHeight: 1, mb: '10px' }}>User Role</Typography>
            {isEditing && currentUserRole.toLowerCase() === 'administrator' ? (
              <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 1, height: '56px' } }}>
                <Select
                  name="role"
                  value={formData.role || ''}
                  onChange={handleDropdownChange('role')}
                  displayEmpty
                  sx={{ height: '56px' }}
                >
                  <MenuItem value="">
                    <em>Select User Role</em>
                  </MenuItem>
                  {userRoleOptions.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                name="role"
                value={formData.role || ''}
                variant="outlined"
                disabled
                sx={{ 
                  width: '341px', 
                  '& .MuiOutlinedInput-root': { 
                    bgcolor: isEditing && currentUserRole.toLowerCase() !== 'administrator' ? '#f5f5f5' : 'white', 
                    borderRadius: 1, 
                    height: '56px' 
                  } 
                }}
                helperText={isEditing && currentUserRole.toLowerCase() !== 'administrator' ? "Only administrators can change user roles" : ""}
                FormHelperTextProps={{
                  sx: { 
                    color: '#666', 
                    fontSize: '12px', 
                    mt: 0.5,
                    fontStyle: 'italic'
                  }
                }}
              />
            )}
          </Box>

          {/* Edit Icon Button */}
          {!isEditing && (
            <IconButton
              onClick={() => setIsEditing(true)}
              sx={{
                position: 'absolute',
                right: '87px', // Match Figma positioning
                top: '74px', // Moved up further from 94px
                bgcolor: '#274fc7',
                color: 'white',
                width: 43.5,
                height: 43.5,
                borderRadius: '7.3px',
                '&:hover': { bgcolor: '#1e3a9f' }
              }}
            >
              <EditIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}

          {/* Save/Cancel Buttons - Show when editing */}
          {isEditing && (
            <Box sx={{ 
              position: 'absolute',
              right: '95px', // Align with Figma
              top: '60px', // Positioned safely below User Role field to avoid overlap
              display: 'flex',
              gap: 1.5 // Reduced gap to prevent overlap
            }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                sx={{
                  borderColor: '#2148c0',
                  color: '#2148c0',
                  fontWeight: 600,
                  px: 0,
                  py: 1.5,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '16px',
                  width: '120px', // Slightly reduced width
                  height: '43.5',
                  bgcolor: 'white',
                  '&:hover': {
                    borderColor: '#1e3a9f',
                    color: '#1e3a9f',
                    bgcolor: '#f8f8f8'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSaving}
                sx={{
                  bgcolor: '#274fc7',
                  color: 'white',
                  fontWeight: 600,
                  px: 0,
                  py: 1.5,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '16px',
                  width: '120px', // Slightly reduced width
                  height: '43.5',
                  '&:hover': {
                    bgcolor: '#1e3a9f'
                  }
                }}
              >
                {isSaving ? 'Saving...' : 'Confirm'}
              </Button>
            </Box>
          )}

          {/* Logout Button - Bottom Right */}
          <Box sx={{ 
            position: 'absolute',
            bottom: 48,
            right: '95px' // Aligned with Cancel/Confirm buttons
          }}>
            <Button
              variant="outlined"
              onClick={handleLogout}
              sx={{
                borderColor: '#ff3b30',
                color: '#ff3b30',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '16px',
                lineHeight: 1.3,
                width: '122px', // Fixed width to match design
                height: '48px',
                borderWidth: '2px',
                '&:hover': {
                  borderColor: '#d12b20',
                  color: '#d12b20',
                  bgcolor: 'rgba(255, 59, 48, 0.04)',
                  borderWidth: '2px'
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Box>

      <Fade in={snackbar.open} timeout={{ enter: 300, exit: 300 }}>
        <Box
          onClick={handleCloseSnackbar}
          sx={{
            position: 'fixed',
            top: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: snackbar.color,
            color: snackbar.textColor,
            borderRadius: 2,
            py: 1,
            px: 3,
            fontWeight: 500,
            fontSize: '1.1rem',
            boxShadow: 3,
            zIndex: 2000,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {snackbar.message}
        </Box>
      </Fade>
    </Box>
  );
}

