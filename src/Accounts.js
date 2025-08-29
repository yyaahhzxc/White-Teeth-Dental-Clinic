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
} from '@mui/material';
import { Search, FilterList, Add, Edit } from '@mui/icons-material';
import Header from './header';
import QuickActionButton from './QuickActionButton';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Fade from '@mui/material/Fade';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import Collapse from '@mui/material/Collapse';

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
      const response = await fetch(`http://localhost:3001/users${query}`);
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
      const response = await fetch('http://localhost:3001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-master-password': 'admin123' // For now, using master password
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchUsers();
        setAddUserOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user');
    }
  };

  const handleEditUser = async () => {
    try {
      const response = await fetch(`http://localhost:3001/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-master-password': 'admin123' // For now, using master password
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchUsers();
        setEditUserOpen(false);
        resetForm();
        setSelectedUser(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`http://localhost:3001/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'x-master-password': 'admin123'
          }
        });

        if (response.ok) {
          await fetchUsers();
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    }
  };

  const openDetailsDialog = (user) => {
    setSelectedUser(user);
    setDetailsFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      employeeRole: user.employeeRole || '',
      userRole: user.userRole || '',
      status: user.status || 'enabled'
    });
    setIsDetailsEditing(false);
    setDetailsOpen(true);
  };

  const handleDetailsEdit = () => {
    setIsDetailsEditing(true);
  };

  const handleDetailsSave = async () => {
    try {
      const response = await fetch(`http://localhost:3001/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-master-password': 'admin123'
        },
        body: JSON.stringify(detailsFormData)
      });

      if (response.ok) {
        await fetchUsers();
        setSelectedUser(prev => ({ ...prev, ...detailsFormData }));
        setIsDetailsEditing(false);
        setSnackbarMessage('Change successful!');
        setSnackbarColor('#C8E6C9');
        setSnackbarTextColor('#38883C');
        setSnackbarOpen(true);
        setTimeout(() => setSnackbarOpen(false), 1500);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
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
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-master-password': 'admin123'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchUsers();
        // Update selected user if details modal is open
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
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
        backgroundImage: 'url("/White-Teeth-BG.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />
      
      {/* Blue header section */}
      <Box
        sx={{
          backgroundColor: '#4A69BD',
          color: 'white',
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Users
        </Typography>
        <Button
          variant="contained"
          sx={{
            position: 'absolute',
            right: 24,
            backgroundColor: 'white',
            color: '#4A69BD',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
          onClick={() => setAddUserOpen(true)}
        >
          Add User
        </Button>
      </Box>

      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          {/* Search and filter controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search by name or username"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ mr: 2, width: 240 }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'gray' }} />
              }}
            />
            <Button
              variant={showFilterBox ? 'contained' : 'outlined'}
              startIcon={<FilterList />}
              onClick={() => setShowFilterBox(v => !v)}
              sx={{ backgroundColor: showFilterBox ? '#4A69BD' : 'white', color: showFilterBox ? 'white' : '#4A69BD', fontWeight: 'bold', '&:hover': { backgroundColor: showFilterBox ? '#3d5aa3' : '#f5f5f5' } }}
            >
              Filter
            </Button>
          </Box>

          {/* Filter Bar UI with animation and white background */}
          <Collapse in={showFilterBox} timeout={400}>
            <Box sx={{
              background: '#fff',
              borderRadius: 2,
              p: 2,
              mb: 2,
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

          {/* Users table */}
          <TableContainer sx={{ maxHeight: 400, overflowY: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Username</TableCell>
                  <TableCell sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Employee Role</TableCell>
                  <TableCell sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>User Role</TableCell>
                  <TableCell sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                      <TableCell>
                        <Typography
                          sx={{
                            cursor: 'pointer',
                            color: '#4A69BD',
                            fontWeight: 500,
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                          onClick={() => openDetailsDialog(user)}
                        >
                          {`${user.firstName || ''} ${user.lastName || ''}`}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.employeeRole || '-'}</TableCell>
                      <TableCell>{user.userRole || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.status === 'enabled' ? 'Enabled' : 'Disabled'}
                          color={user.status === 'enabled' ? 'success' : 'error'}
                          size="small"
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleToggleStatus(user.id, user.status)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* QuickActionButton */}
      <QuickActionButton 
        onAddPatientRecord={() => {
          // Handle add patient record - you can navigate to add patient page or open modal
          console.log("Add patient record clicked");
        }}
        onAddAppointment={() => {
          // Handle add appointment - you can navigate to add appointment page or open modal
          console.log("Add appointment clicked");
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

              {/* Username */}
              <Box sx={{ mb: 3 }}>
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
                    '&:hover': { backgroundColor: '#3d5aa3' },
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
                  '&:hover': { backgroundColor: '#3d5aa3' },
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
