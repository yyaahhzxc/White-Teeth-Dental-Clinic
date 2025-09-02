import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
} from '@mui/material';
import { Search, FilterList, Add, Edit } from '@mui/icons-material';
import TuneIcon from '@mui/icons-material/Tune';
import Header from './header';
import QuickActionButton from './QuickActionButton';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Fade from '@mui/material/Fade';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import Collapse from '@mui/material/Collapse';
import { API_BASE, MASTER_PASSWORD } from './apiConfig';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function Accounts() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailsEditing, setIsDetailsEditing] = useState(false);
  const [detailsFormData, setDetailsFormData] = useState({});
  const [showDetailsPassword, setShowDetailsPassword] = useState(false);

  // Helper to extract a useful error message from a response
  const parseError = async (response) => {
    try {
      const data = await response.json();
      return (data && (data.error || data.message)) || JSON.stringify(data) || response.statusText || 'Unknown error';
    } catch (e) {
      return response.statusText || 'Unknown error';
    }
  };

  // Snackbar helper for success/error messages
  const showSnackbar = (message, options = {}) => {
    setSnackbarMessage(message);
    setSnackbarColor(options.color || (options.error ? '#FFCDD2' : '#C8E6C9'));
    setSnackbarTextColor(options.textColor || (options.error ? '#B71C1C' : '#38883C'));
    setSnackbarOpen(true);
    if (options.duration !== 0) setTimeout(() => setSnackbarOpen(false), options.duration || 2000);
  };

  // Helper to send a request with token if available, retry with master password on 401/403
  const sendAuthenticatedRequest = async (url, fetchOptions = {}) => {
    const token = localStorage.getItem('token');

    const baseHeaders = Object.assign({}, fetchOptions.headers || {});

    if (token) {
      const headersWithToken = Object.assign({}, baseHeaders, { 'Authorization': `Bearer ${token}` });
      let res = await fetch(url, Object.assign({}, fetchOptions, { headers: headersWithToken }));
      if (res.status === 401 || res.status === 403) {
        // retry with master password
        const headersWithMaster = Object.assign({}, baseHeaders, { 'x-master-password': MASTER_PASSWORD });
        res = await fetch(url, Object.assign({}, fetchOptions, { headers: headersWithMaster }));
      }
      return res;
    }

    // No token: use master password directly
    const headersWithMaster = Object.assign({}, baseHeaders, { 'x-master-password': MASTER_PASSWORD });
    return await fetch(url, Object.assign({}, fetchOptions, { headers: headersWithMaster }));
  };

  // Update stored `user` in localStorage if the saved/edited user matches the current stored user
  const updateStoredUser = (updates = {}) => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      const stored = JSON.parse(raw);
      if (!stored || !stored.id) return;
      // Only update if the edited user matches the logged-in user
      if (updates.id && String(updates.id) !== String(stored.id)) return;
      if (selectedUser && String(selectedUser.id) !== String(stored.id)) return;
      const merged = { ...stored, ...updates };
      localStorage.setItem('user', JSON.stringify(merged));
      try { window.dispatchEvent(new Event('userChanged')); } catch (e) {}
      try { if (typeof window.__forceReloadUser === 'function') window.__forceReloadUser(); } catch (e) {}
    } catch (e) {
      // ignore
    }
  };
  
  // Form state for adding/editing users
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    employeeRole: '',
    userRole: '',
    status: 'enabled'
  });

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarColor, setSnackbarColor] = useState('#C8E6C9');
  const [snackbarTextColor, setSnackbarTextColor] = useState('#38883C');

  // Filter state
  const filterCategories = [
    { label: 'Employee Role', value: 'employeeRole', types: ['Dentist', 'Receptionist', 'Dental Assistant'] },
    { label: 'User Role', value: 'userRole', types: ['Administrator', 'User'] },
    { label: 'Status', value: 'status', types: ['enabled', 'disabled'] },
  ];
  const [activeFilters, setActiveFilters] = useState([
    { category: '', type: '' }
  ]);
  const [showFilterBox, setShowFilterBox] = useState(false);

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  // Helper to build query string from filters
  const buildFilterQuery = (filters) => {
    const params = [];
    filters.forEach(f => {
      if (f.category && f.type) {
        params.push(`${encodeURIComponent(f.category)}=${encodeURIComponent(f.type)}`);
      }
    });
    return params.length ? `?${params.join('&')}` : '';
  };

  // Modified fetchUsers to accept filters
  const fetchUsers = async (filters = activeFilters) => {
    try {
      const query = buildFilterQuery(filters);
  const response = await fetch(`${API_BASE}/users${query}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Refetch users when filters change
  useEffect(() => {
    if (showFilterBox) {
      fetchUsers(activeFilters);
    } else {
      fetchUsers([]); // fetch all users when filter box is closed
    }
    // eslint-disable-next-line
  }, [activeFilters, showFilterBox]);

  // Search filter
  useEffect(() => {
    let result = users.filter(user => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const username = (user.username || '').toLowerCase();
      const searchTerm = search.toLowerCase();
      return fullName.includes(searchTerm) || username.includes(searchTerm);
    });
    setFilteredUsers(result);
  }, [search, users]);

  const handleAddUser = async () => {
    try {
  const response = await sendAuthenticatedRequest(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchUsers();
        setAddUserOpen(false);
        resetForm();
        showSnackbar('User added successfully!');
      } else {
        const errMsg = await parseError(response);
        showSnackbar(`Error: ${errMsg}`, { error: true, duration: 3000 });
      }
    } catch (error) {
      console.error('Error adding user:', error);
  showSnackbar('Error adding user', { error: true });
    }
  };

  const handleEditUser = async () => {
    try {
  const response = await sendAuthenticatedRequest(`${API_BASE}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchUsers();
        setEditUserOpen(false);
        resetForm();
        setSelectedUser(null);
        showSnackbar('User updated successfully');
        try { updateStoredUser({ ...formData }); } catch (e) {}
      } else {
        const errMsg = await parseError(response);
        showSnackbar(`Error: ${errMsg}`, { error: true, duration: 3000 });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showSnackbar('Error updating user', { error: true });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
  const response = await sendAuthenticatedRequest(`${API_BASE}/users/${userId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchUsers();
          showSnackbar('User deleted');
          try {
            const raw = localStorage.getItem('user');
            if (raw) {
              const s = JSON.parse(raw);
              if (s && String(s.id) === String(userId)) {
                localStorage.removeItem('user');
                try { window.dispatchEvent(new Event('userChanged')); } catch (e) {}
              }
            }
          } catch (e) {}
        } else {
          const errMsg = await parseError(response);
          showSnackbar(`Error: ${errMsg}`, { error: true, duration: 3000 });
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        showSnackbar('Error deleting user', { error: true });
      }
    }
  };

  const openDetailsDialog = async (user) => {
    try {
      // Fetch full user details from backend
      const response = await fetch(`${API_BASE}/users/${user.id}`);
      if (response.ok) {
        const userDetails = await response.json();
        setSelectedUser(userDetails);
        setDetailsFormData({
          firstName: userDetails.firstName || '',
          lastName: userDetails.lastName || '',
          username: userDetails.username || '',
          password: userDetails.password || '', // Now password will be included
          employeeRole: userDetails.employeeRole || '',
          userRole: userDetails.userRole || '',
          status: userDetails.status || 'enabled'
        });
      } else {
        // fallback to old behavior if fetch fails
        setSelectedUser(user);
        setDetailsFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          username: user.username || '',
          password: '', // fallback: no password
          employeeRole: user.employeeRole || '',
          userRole: user.userRole || '',
          status: user.status || 'enabled'
        });
      }
      setIsDetailsEditing(false);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setSelectedUser(user);
      setDetailsFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        password: '', // fallback: no password
        employeeRole: user.employeeRole || '',
        userRole: user.userRole || '',
        status: user.status || 'enabled'
      });
      setIsDetailsEditing(false);
      setDetailsOpen(true);
    }
  };

  const handleDetailsEdit = () => {
    setIsDetailsEditing(true);
  };

  // Update details form state when editing user details
  const handleDetailsFormChange = (field, value) => {
    setDetailsFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailsSave = async () => {
    try {
      if (!selectedUser || !selectedUser.id) {
        showSnackbar('No user selected', { error: true });
        return;
      }

  const response = await sendAuthenticatedRequest(`${API_BASE}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detailsFormData)
      });

      if (response.ok) {
        await fetchUsers();
        setSelectedUser(prev => ({ ...prev, ...detailsFormData }));
        setDetailsFormData(prev => ({ ...prev, ...detailsFormData }));
        setIsDetailsEditing(false);
        setDetailsOpen(false); // Close the dialog after saving
        showSnackbar('Change successful!');
        try { updateStoredUser({ ...detailsFormData }); } catch (e) {}
      } else {
        const errMsg = await parseError(response);
        showSnackbar(`Error: ${errMsg}`, { error: true, duration: 3000 });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showSnackbar('Error updating user', { error: true });
    }
  };

  const handleDetailsCancel = () => {
    setDetailsFormData({
      firstName: selectedUser.firstName || '',
      lastName: selectedUser.lastName || '',
      username: selectedUser.username || '',
      employeeRole: selectedUser.employeeRole || '',
      userRole: selectedUser.userRole || '',
      status: selectedUser.status || 'enabled'
    });
    setIsDetailsEditing(false);
    setSnackbarMessage('Change canceled');
    setSnackbarColor('#FFCDD2');
    setSnackbarTextColor('#B71C1C');
    setSnackbarOpen(true);
    setTimeout(() => setSnackbarOpen(false), 1500);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
    try {
  const response = await sendAuthenticatedRequest(`${API_BASE}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchUsers();
        // Update selected user if details modal is open
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(prev => ({ ...prev, status: newStatus }));
          setDetailsOpen(false); // This will close the dialog after status change
        }
        showSnackbar(`User ${newStatus} successfully!`);
        try { updateStoredUser({ status: newStatus }); } catch (e) {}
      } else {
        const errMsg = await parseError(response);
        showSnackbar(`Error: ${errMsg}`, { error: true, duration: 3000 });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      showSnackbar('Error updating user status', { error: true });
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      employeeRole: '',
      userRole: '',
      status: 'enabled'
    });
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFilterCategoryChange = (idx, value) => {
    setActiveFilters(filters => filters.map((f, i) => i === idx ? { category: value, type: '' } : f));
  };
  const handleFilterTypeChange = (idx, value) => {
    setActiveFilters(filters => filters.map((f, i) => i === idx ? { ...f, type: value } : f));
  };
  const handleAddFilter = () => {
    setActiveFilters(filters => [...filters, { category: '', type: '' }]);
  };
  const handleRemoveFilter = (idx) => {
    setActiveFilters(filters => filters.filter((_, i) => i !== idx));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#2148c0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />
      
      {/* Users Title and Controls */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          py: 4,
          px: 2, // Add padding to match container
        }}
      >
        {/* Users Title */}
        <Typography 
          variant="h3" 
          sx={{ 
            color: 'white',
            fontWeight: 800,
            fontSize: '39.14px',
            fontFamily: 'Inter, sans-serif',
            mb: 3, // Add margin bottom for spacing
          }}
        >
          Users
        </Typography>
        
        {/* Search and Controls Row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            maxWidth: 'calc(100vw - 64px)', // Match the container width
            gap: 2,
          }}
        >
          {/* Search Bar */}
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search by name or username"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ 
              width: 343, // Match Figma width
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#f3edf7',
                borderRadius: '10px',
                height: '38px',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover fieldset': {
                  border: 'none',
                },
                '&.Mui-focused fieldset': {
                  border: '1px solid #2148c0',
                },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#7f7f7f' }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Filter and Add User buttons */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Filter Button */}
            <Button
              variant="outlined"
              startIcon={<TuneIcon />}
              onClick={() => setShowFilterBox(v => !v)}
              sx={{
                backgroundColor: 'white',
                color: '#7f7f7f',
                border: '1px solid white',
                borderRadius: '10px',
                height: '38px',
                px: 2,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '16px',
                fontFamily: 'DM Sans, sans-serif',
                minWidth: 99,
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  border: '1px solid white',
                },
              }}
            >
              Filter
            </Button>

            {/* Add User Button */}
            <Button
              variant="contained"
              onClick={() => setAddUserOpen(true)}
              sx={{
                backgroundColor: 'white',
                color: '#2148c0',
                borderRadius: '8px',
                height: '38px',
                px: 3,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '16px',
                fontFamily: 'Inter, sans-serif',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#f8f9ff',
                  boxShadow: 'none',
                },
              }}
            >
              Add User
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content Container */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          px: 2, // Reduced from 3 to 2 (16px instead of 24px)
          pb: 2, // Reduced from 3 to 2
        }}
      >
        <Paper 
          sx={{ 
            width: '100%', // Changed from fixed 1353px to 100%
            maxWidth: 'calc(100vw - 32px)', // Max width minus small margins
            height: '580px', // Reduced from 606px to 580px
            borderRadius: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Filter Bar UI with animation */}
          <Collapse in={showFilterBox} timeout={400}>
            <Box sx={{
              background: '#fff',
              borderRadius: 2,
              mx: 3,
              mb: 2,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              boxShadow: 1,
            }}>
              {activeFilters.map((filter, idx) => {
                const categoryObj = filterCategories.find(c => c.value === filter.category);
                return (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ minWidth: 140 }}>
                      <Typography variant="caption" sx={{ color: '#333', mb: 0.5 }}>Category</Typography>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={filter.category}
                          onChange={e => handleFilterCategoryChange(idx, e.target.value)}
                          displayEmpty
                          sx={{ bgcolor: '#f5f5f5', color: '#333', borderRadius: 1 }}
                        >
                          <MenuItem value="" disabled>Select category</MenuItem>
                          {filterCategories.map(cat => (
                            <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ minWidth: 180 }}>
                      <Typography variant="caption" sx={{ color: '#333', mb: 0.5 }}>Type</Typography>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={filter.type}
                          onChange={e => handleFilterTypeChange(idx, e.target.value)}
                          displayEmpty
                          sx={{ bgcolor: '#f5f5f5', color: '#333', borderRadius: 1 }}
                          disabled={!filter.category}
                        >
                          <MenuItem value="" disabled>Select type</MenuItem>
                          {categoryObj && categoryObj.types.map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                      <IconButton
                        onClick={() => handleRemoveFilter(idx)}
                        sx={{ bgcolor: '#B71C1C', color: '#fff', borderRadius: 1, ml: 1, '&:hover': { bgcolor: '#C62828' } }}
                        size="small"
                        disabled={activeFilters.length === 1}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <IconButton
                  onClick={handleAddFilter}
                  sx={{ bgcolor: '#f5f5f5', color: '#333', borderRadius: 1, '&:hover': { bgcolor: '#e0e0e0' } }}
                  size="medium"
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
          </Collapse>

          {/* Table Container */}
          <Box
            sx={{
              mx: 3,
              mt: 2, // Added top margin
              mb: 3,
              backgroundColor: '#dfdfdf',
              borderRadius: '10px',
              overflow: 'hidden',
              height: '480px', // Reduced height to fit better within the container
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ p: 3 }}> {/* Increased padding from 2 to 3 */}
              {/* Table Header */}
              <Box 
                sx={{ 
                  display: 'flex',
                  px: 2, // Padding on the container
                  py: 1,
                  alignItems: 'center',
                  mb: 1,
                  width: '100%',
                }}
              >
                <Box sx={{ flex: '1', textAlign: 'center' }}> {/* Name: Centered */}
                  <Typography 
                    sx={{ 
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 500,
                      fontSize: '18px',
                      color: '#6d6b80',
                      lineHeight: '24px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Name
                  </Typography>
                </Box>
                <Box sx={{ flex: '1', textAlign: 'center' }}> {/* Username: Centered */}
                  <Typography 
                    sx={{ 
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 500,
                      fontSize: '18px',
                      color: '#6d6b80',
                      lineHeight: '24px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Username
                  </Typography>
                </Box>
                <Box sx={{ flex: '1', textAlign: 'center' }}> {/* Employee Role: Centered */}
                  <Typography 
                    sx={{ 
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 500,
                      fontSize: '18px',
                      color: '#6d6b80',
                      lineHeight: '24px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Employee Role
                  </Typography>
                </Box>
                <Box sx={{ flex: '1', textAlign: 'center' }}> {/* User Role: Centered */}
                  <Typography 
                    sx={{ 
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 500,
                      fontSize: '18px',
                      color: '#6d6b80',
                      lineHeight: '24px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    User Role
                  </Typography>
                </Box>
                <Box sx={{ flex: '1', textAlign: 'center' }}> {/* Status: Centered */}
                  <Typography 
                    sx={{ 
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 500,
                      fontSize: '18px',
                      color: '#6d6b80',
                      lineHeight: '24px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Status
                  </Typography>
                </Box>
              </Box>

              {/* Table Rows */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <Box 
                      key={user.id}
                      sx={{ 
                        display: 'flex', 
                        px: 2, // Match header padding exactly
                        py: 1,
                        alignItems: 'center',
                        backgroundColor: '#f9fafc',
                        borderRadius: '10px',
                        height: 66,
                        '&:hover': { 
                          backgroundColor: '#f0f4f8',
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => openDetailsDialog(user)}
                    >
                      <Box sx={{ flex: '1', textAlign: 'left' }}> {/* Name: Flush left, no padding */}
                        <Typography
                          sx={{
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 400,
                            fontSize: '16px',
                            color: '#6d6b80',
                            lineHeight: '24px',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {`${user.firstName || ''} ${user.lastName || ''}`}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1', textAlign: 'center' }}> {/* Username: Centered with no extra padding */}
                        <Typography
                          sx={{
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 400,
                            fontSize: '16px',
                            color: '#6d6b80',
                            lineHeight: '24px',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {user.username}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1', textAlign: 'center' }}> {/* Employee Role: Centered with no extra padding */}
                        <Typography
                          sx={{
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 400,
                            fontSize: '16px',
                            color: '#6d6b80',
                            lineHeight: '24px',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {user.employeeRole || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1', textAlign: 'center' }}> {/* User Role: Centered with no extra padding */}
                        <Typography
                          sx={{
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 400,
                            fontSize: '16px',
                            color: '#6d6b80',
                            lineHeight: '24px',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {user.userRole || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1', textAlign: 'center' }}> {/* Status: Centered with no extra padding */}
                        <Chip
                          label={user.status === 'enabled' ? 'Enabled' : 'Disabled'}
                          sx={{
                            backgroundColor: user.status === 'enabled' ? '#4CAF50' : '#F44336',
                            color: 'white',
                            fontWeight: 500,
                            fontSize: '14px',
                            fontFamily: 'Roboto, sans-serif',
                            borderRadius: '20px',
                            height: '32px',
                            minWidth: '80px',
                            '& .MuiChip-label': {
                              px: 2,
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box 
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      py: 4,
                      backgroundColor: '#f9fafc',
                      borderRadius: '10px',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 400,
                        fontSize: '16px',
                        color: '#6d6b80',
                      }}
                    >
                      No users found.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* QuickActionButton */}
      <QuickActionButton 
        onAddPatientRecord={() => {
          // Handle add patient record - you can navigate to add patient page or open modal
          /* no-op: handled by parent routing or UI */
        }}
        onAddAppointment={() => {
          // Handle add appointment - you can navigate to add appointment page or open modal
          /* no-op: handled by parent routing or UI */
        }}
      />

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onClose={() => setAddUserOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Username"
              value={formData.username}
              onChange={(e) => handleFormChange('username', e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleFormChange('password', e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleFormChange('firstName', e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleFormChange('lastName', e.target.value)}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Employee Role</InputLabel>
              <Select
                value={formData.employeeRole}
                onChange={(e) => handleFormChange('employeeRole', e.target.value)}
                label="Employee Role"
              >
                <MenuItem value="Dentist">Dentist</MenuItem>
                <MenuItem value="Receptionist">Receptionist</MenuItem>
                <MenuItem value="Dental Assistant">Dental Assistant</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>User Role</InputLabel>
              <Select
                value={formData.userRole}
                onChange={(e) => handleFormChange('userRole', e.target.value)}
                label="User Role"
              >
                <MenuItem value="Administrator">Administrator</MenuItem>
                <MenuItem value="User">User</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="enabled">Enabled</MenuItem>
                <MenuItem value="disabled">Disabled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserOpen(false)}>Cancel</Button>
          <Button onClick={handleAddUser} variant="contained">Add User</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Username"
              value={formData.username}
              onChange={(e) => handleFormChange('username', e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="New Password (leave blank to keep current)"
              type="password"
              value={formData.password}
              onChange={(e) => handleFormChange('password', e.target.value)}
              fullWidth
            />
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleFormChange('firstName', e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleFormChange('lastName', e.target.value)}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Employee Role</InputLabel>
              <Select
                value={formData.employeeRole}
                onChange={(e) => handleFormChange('employeeRole', e.target.value)}
                label="Employee Role"
              >
                <MenuItem value="Dentist">Dentist</MenuItem>
                <MenuItem value="Receptionist">Receptionist</MenuItem>
                <MenuItem value="Dental Assistant">Dental Assistant</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>User Role</InputLabel>
              <Select
                value={formData.userRole}
                onChange={(e) => handleFormChange('userRole', e.target.value)}
                label="User Role"
              >
                <MenuItem value="Administrator">Administrator</MenuItem>
                <MenuItem value="User">User</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="enabled">Enabled</MenuItem>
                <MenuItem value="disabled">Disabled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserOpen(false)}>Cancel</Button>
          <Button onClick={handleEditUser} variant="contained">Update User</Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" sx={{ textAlign: 'center', color: '#4A69BD', fontWeight: 600 }}>
            User Details
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              {/* First Name and Last Name Row */}
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={detailsFormData.firstName || ''}
                  onChange={(e) => handleDetailsFormChange('firstName', e.target.value)}
                  disabled={!isDetailsEditing}
                  variant="outlined"
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                    },
                    '& .MuiOutlinedInput-root.Mui-disabled': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                />
                <TextField
                  label="Last Name"
                  fullWidth
                  value={detailsFormData.lastName || ''}
                  onChange={(e) => handleDetailsFormChange('lastName', e.target.value)}
                  disabled={!isDetailsEditing}
                  variant="outlined"
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                    },
                    '& .MuiOutlinedInput-root.Mui-disabled': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                />
              </Box>

              {/* Username and Password Row */}
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <TextField
                  label="Username"
                  fullWidth
                  value={detailsFormData.username || ''}
                  onChange={(e) => handleDetailsFormChange('username', e.target.value)}
                  disabled={!isDetailsEditing}
                  variant="outlined"
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                    },
                    '& .MuiOutlinedInput-root.Mui-disabled': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                />
                <TextField
                  label="Password"
                  fullWidth
                  type={showDetailsPassword ? "text" : "password"}
                  value={detailsFormData.password || ''}
                  onChange={(e) => handleDetailsFormChange('password', e.target.value)}
                  disabled={!isDetailsEditing}
                  variant="outlined"
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                    },
                    '& .MuiOutlinedInput-root.Mui-disabled': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showDetailsPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowDetailsPassword((prev) => !prev)}
                          edge="end"
                        >
                          {showDetailsPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              {/* Employee Role, User Role, Status Row */}
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Employee Role</InputLabel>
                  <Select
                    value={detailsFormData.employeeRole || ''}
                    onChange={(e) => handleDetailsFormChange('employeeRole', e.target.value)}
                    disabled={!isDetailsEditing}
                    label="Employee Role"
                    sx={{
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      },
                      '& .MuiSelect-select.Mui-disabled': {
                        WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                      }
                    }}
                  >
                    <MenuItem value="">-</MenuItem>
                    <MenuItem value="Dentist">Dentist</MenuItem>
                    <MenuItem value="Receptionist">Receptionist</MenuItem>
                    <MenuItem value="Dental Assistant">Dental Assistant</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>User Role</InputLabel>
                  <Select
                    value={detailsFormData.userRole || ''}
                    onChange={(e) => handleDetailsFormChange('userRole', e.target.value)}
                    disabled={!isDetailsEditing}
                    label="User Role"
                    sx={{
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      },
                      '& .MuiSelect-select.Mui-disabled': {
                        WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                      }
                    }}
                  >
                    <MenuItem value="">-</MenuItem>
                    <MenuItem value="Administrator">Administrator</MenuItem>
                    <MenuItem value="User">User</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={detailsFormData.status || 'enabled'}
                    onChange={(e) => handleDetailsFormChange('status', e.target.value)}
                    disabled={!isDetailsEditing}
                    label="Status"
                    sx={{
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      },
                      '& .MuiSelect-select.Mui-disabled': {
                        WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)'
                      }
                    }}
                  >
                    <MenuItem value="enabled">Enabled</MenuItem>
                    <MenuItem value="disabled">Disabled</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => setDetailsOpen(false)} 
            sx={{ color: 'text.secondary' }}
          >
            Close
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isDetailsEditing ? (
              <>
                <Button
                  variant="outlined"
                  onClick={handleDetailsCancel}
                  sx={{ 
                    color: 'text.secondary',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'text.secondary',
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleDetailsSave}
                  sx={{ 
                    backgroundColor: '#4A69BD',
                    boxShadow: 1,
                    '&:hover': {
                      boxShadow: 2,
                      backgroundColor: '#3d5aa3'
                    }
                  }}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleDetailsEdit}
                sx={{ 
                  backgroundColor: '#4A69BD',
                  boxShadow: 1,
                  '&:hover': {
                    boxShadow: 2,
                    backgroundColor: '#3d5aa3'
                  }
                }}
              >
                Edit Details
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>
      <Fade in={snackbarOpen} timeout={{ enter: 400, exit: 400 }}>
        <Box sx={{ position: 'fixed', top: 32, left: '50%', transform: 'translateX(-50%)', bgcolor: snackbarColor, color: snackbarTextColor, borderRadius: 2, py: 1, px: 3, fontWeight: 500, fontSize: '1.1rem', boxShadow: 3, zIndex: 2000 }}>
          {snackbarMessage}
        </Box>
      </Fade>
    </Box>
  );
}
