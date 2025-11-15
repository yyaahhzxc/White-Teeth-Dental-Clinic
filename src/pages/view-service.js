import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  MenuItem,
  Dialog as MuiDialog,
  Snackbar,
  Divider,
  Fade,
  InputAdornment,
  Alert,
  LinearProgress,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  MedicalServices as ServiceIcon,
  Description as DescIcon,
  AttachMoney as PriceIcon,
  Schedule as TimeIcon,
  Category as TypeIcon,
  ToggleOn as StatusIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { API_BASE } from '../apiConfig';

const serviceTypes = [
  { value: 'Single Treatment', label: 'Single Treatment', desc: 'One-time service' },
  { value: 'Package Treatment', label: 'Package Treatment', desc: 'Multi-session package' },
];

const statusOptions = [
  { value: 'Active', label: 'Active', color: '#4caf50' },
  { value: 'Inactive', label: 'Inactive', color: '#f44336' }
];

const ViewService = ({ open, onClose, service, onServiceUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedService, setEditedService] = useState(service || {});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiredError, setRequiredError] = useState(false);
  const [requiredFields, setRequiredFields] = useState({});
  const [nameExists, setNameExists] = useState(false);
  const [allServices, setAllServices] = useState([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [packageServices, setPackageServices] = useState([]);
const [loadingPackageServices, setLoadingPackageServices] = useState(false);

  const showSnackbar = (msg) => {
    setSnackbarMsg(msg);
    setSnackbarOpen(true);
    setTimeout(() => setSnackbarOpen(false), 3000);
  };

  useEffect(() => {
    setEditedService(service || {});
    setIsEditing(false);
    setRequiredError(false);
    setRequiredFields({});
    setNameExists(false);
    setSubmitAttempted(false);
  }, [service, open]);

  // Fetch all services for duplicate name check when editing
  useEffect(() => {
    if (open && isEditing) {
      setLoading(true);
      fetch(`${API_BASE}/service-table`)
        .then(res => res.json())
        .then(data => {
          setAllServices(data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [open, isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
    setRequiredError(false);
    setRequiredFields({});
    setNameExists(false);
    setSubmitAttempted(false);
  };

  const validateFields = () => {
    const errors = {};
    if (!editedService.name?.trim()) errors.name = true;
    if (!editedService.description?.trim()) errors.description = true;
    if (!editedService.price || parseFloat(editedService.price) <= 0) errors.price = true;
    if (!editedService.duration || parseFloat(editedService.duration) <= 0) errors.duration = true;
    if (!editedService.type?.trim()) errors.type = true;
    if (!editedService.status?.trim()) errors.status = true;
    
    setRequiredFields(errors);
    return Object.keys(errors).length === 0;
  };


  const fetchPackageDetails = async (packageId) => {
    if (!packageId) return;
    
    setLoadingPackageServices(true);
    try {
      const response = await fetch(`${API_BASE}/packages/${packageId}`);
      if (response.ok) {
        const data = await response.json();
        setPackageServices(data.packageServices || []);
        console.log('Package services loaded:', data.packageServices);
      } else {
        console.error('Failed to fetch package details');
        setPackageServices([]);
      }
    } catch (error) {
      console.error('Error fetching package details:', error);
      setPackageServices([]);
    } finally {
      setLoadingPackageServices(false);
    }
  };

  // Add useEffect to fetch package details when service changes
useEffect(() => {
  if (service && service.type === 'Package Treatment') {
    fetchPackageDetails(service.id);
  } else {
    setPackageServices([]);
  }
}, [service]);

// REPLACE the existing handleSaveClick function (around line 100-150) with this:
// REPLACE the existing handleSaveClick function (around line 100-150) with this:
const handleSaveClick = async () => {
  setSubmitAttempted(true);
  const isValid = validateFields();

  // Check for duplicate name (case-insensitive), excluding current service
  const duplicate = allServices.some(
    s => s.id !== editedService.id && 
    s.name.trim().toLowerCase() === editedService.name.trim().toLowerCase()
  );
  setNameExists(duplicate);

  if (!isValid || duplicate) {
    setRequiredError(true);
    setTimeout(() => setRequiredError(false), 3000);
    return;
  }

  setLoading(true);
  try {
    // Determine if this is a package or regular service
    const isPackage = editedService.type === 'Package Treatment';
    
    let endpoint, requestData;
    
    if (isPackage) {
      // For packages, use the packages endpoint
      endpoint = `${API_BASE}/packages/${editedService.id}`;
      requestData = {
        name: editedService.name.trim(),
        description: editedService.description,
        price: parseFloat(editedService.price) || 0,
        duration: parseInt(editedService.duration) || 0,
        status: editedService.status
        // Note: Package services are managed separately via package_services table
      };
    } else {
      // For regular services, use the services endpoint
      endpoint = `${API_BASE}/service-table/${editedService.id}`;
      requestData = {
        name: editedService.name.trim(),
        description: editedService.description,
        price: parseFloat(editedService.price) || 0,
        duration: parseInt(editedService.duration) || 0,
        type: editedService.type,
        status: editedService.status
      };
    }
    
    console.log('Saving to endpoint:', endpoint);
    console.log('Request data:', requestData);
    console.log('Is package:', isPackage);
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    if (response.ok) {
      setIsEditing(false);
      if (onServiceUpdated) onServiceUpdated();
      showSnackbar(`${isPackage ? 'Package' : 'Service'} updated successfully!`);
      
      // If this is a package, refresh the package services
      if (isPackage) {
        fetchPackageDetails(editedService.id);
      }
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update ${isPackage ? 'package' : 'service'}`);
    }
  } catch (err) {
    console.error('Save Error:', err);
    showSnackbar(`Failed to save changes: ${err.message}`);
  } finally {
    setLoading(false);
  }
};



  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedService(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (name === 'name') setNameExists(false);
    if (submitAttempted && requiredFields[name]) {
      setRequiredFields(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleDialogClose = () => {
    if (isEditing) {
      setConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const handleConfirmSave = async () => {
    await handleSaveClick();
    setConfirmOpen(false);
    onClose();
  };

  const handleConfirmDiscard = () => {
    setConfirmOpen(false);
    setIsEditing(false);
    setEditedService(service || {});
    onClose();
  };

  const getFieldError = (fieldName) => {
    return submitAttempted && requiredFields[fieldName];
  };

  const getHelperText = (fieldName, customText = '') => {
    if (fieldName === 'name' && nameExists) {
      return 'A service with this name already exists';
    }
    if (fieldName === 'price' && editedService.price && parseFloat(editedService.price) <= 0) {
      return 'Price must be greater than 0';
    }
    if (fieldName === 'duration' && editedService.duration && parseFloat(editedService.duration) <= 0) {
      return 'Duration must be greater than 0';
    }
    if (getFieldError(fieldName)) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    return customText;
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : '#6b7280';
  };

  return (
    <>
     <Dialog
  open={open}
  onClose={handleDialogClose}
  fullWidth
  maxWidth={false}  // Disable Material-UI's maxWidth constraints
  TransitionComponent={Fade}
  TransitionProps={{ timeout: 300 }}
  sx={{
    '& .MuiDialog-paper': {
      borderRadius: '16px',
      boxShadow: '0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.20)',
      overflow: 'hidden',
      width: '600px',           // Fixed width
      maxWidth: '600px',        // Maximum width
      minWidth: '600px',        // Minimum width  
      margin: '16px auto',      // Center the dialog
      '@media (max-width: 632px)': {  // For very small screens
        width: 'calc(100vw - 32px)',
        minWidth: 'unset',
        maxWidth: 'unset'
      }
    }
  }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #2148C0 0%, #1a3ba8 100%)',
            color: 'white',
            position: 'relative',
            px: 4,
            py: 3,
            textAlign: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
            {isEditing ? (
              <EditIcon sx={{ fontSize: 32 }} />
            ) : (
              <ViewIcon sx={{ fontSize: 32 }} />
            )}
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '28px', fontFamily: 'Inter, sans-serif' }}>
              {isEditing ? 'Edit Service' : 'View Service'}
            </Typography>
          </Box>
        
          <IconButton
            onClick={handleDialogClose}
            disabled={loading}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
              '&:disabled': { color: 'rgba(255,255,255,0.5)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Progress Bar */}
        {loading && (
          <LinearProgress 
            sx={{ 
              backgroundColor: 'rgba(33, 72, 192, 0.1)',
              '& .MuiLinearProgress-bar': { backgroundColor: '#2148C0' }
            }} 
          />
        )}

        {/* Content */}
        <DialogContent sx={{ p: 4, backgroundColor: '#fafbfc' }}>
          {/* Error Alert */}
          {requiredError && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: '12px' }}
              onClose={() => setRequiredError(false)}
            >
              <Typography variant="body2" sx={{ fontFamily: 'Inter, sans-serif' }}>
                {nameExists ? 'Service name already exists' : 'Please fill in all required fields correctly'}
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 3 }}>
            {/* Service Name */}
            <Box>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                fontWeight: 600, 
                color: '#374151',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                marginTop: 5
              }}>
                Service Name {isEditing && '*'}
              </Typography>
              <TextField
                fullWidth
                name="name"
                value={editedService?.name || ''}
                onChange={handleChange}
                placeholder="e.g., Teeth Cleaning, Root Canal Treatment"
                disabled={!isEditing || loading}
                error={getFieldError('name') || nameExists}
                helperText={isEditing ? getHelperText('name') : ''}
                InputProps={{
                  readOnly: !isEditing,
                  startAdornment: (
                    <InputAdornment position="start">
                      <ServiceIcon sx={{ color: isEditing ? '#6b7280' : '#9ca3af', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    fontFamily: 'Inter, sans-serif',
                    '&:hover': isEditing ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } : {},
                    '&.Mui-focused': isEditing ? { boxShadow: '0 4px 12px rgba(33, 72, 192, 0.15)' } : {}
                  }
                }}
              />
            </Box>

            {/* Description */}
            <Box>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                fontWeight: 600, 
                color: '#374151',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }}>
                Description {isEditing && '*'}
              </Typography>
              <TextField
                fullWidth
                name="description"
                value={editedService?.description || ''}
                onChange={handleChange}
                placeholder="Detailed description of the service..."
                multiline
                rows={3}
                disabled={!isEditing || loading}
                error={getFieldError('description')}
                helperText={isEditing ? getHelperText('description', 'Provide a clear description of what this service includes') : ''}
                InputProps={{
                  readOnly: !isEditing,
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <DescIcon sx={{ color: isEditing ? '#6b7280' : '#9ca3af', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    fontFamily: 'Inter, sans-serif',
                    '&:hover': isEditing ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } : {},
                    '&.Mui-focused': isEditing ? { boxShadow: '0 4px 12px rgba(33, 72, 192, 0.15)' } : {}
                  }
                }}
              />
            </Box>

            {/* Price and Duration Row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              {/* Price */}
              <Box>
                <Typography variant="body2" sx={{ 
                  mb: 1, 
                  fontWeight: 600, 
                  color: '#374151',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px'
                }}>
                  Price (₱) {isEditing && '*'}
                </Typography>
                <TextField
                  fullWidth
                  name="price"
                  value={editedService?.price || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  type="number"
                  disabled={!isEditing || loading}
                  error={getFieldError('price') || (editedService.price && parseFloat(editedService.price) <= 0)}
                  helperText={isEditing ? getHelperText('price') : ''}
                  InputProps={{
                    readOnly: !isEditing,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PriceIcon sx={{ color: isEditing ? '#6b7280' : '#9ca3af', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: isEditing ? 'white' : '#f9fafb',
                      fontFamily: 'Inter, sans-serif',
                      '&:hover': isEditing ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } : {},
                      '&.Mui-focused': isEditing ? { boxShadow: '0 4px 12px rgba(33, 72, 192, 0.15)' } : {}
                    }
                  }}
                />
              </Box>

              {/* Duration */}
              <Box>
                <Typography variant="body2" sx={{ 
                  mb: 1, 
                  fontWeight: 600, 
                  color: '#374151',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px'
                }}>
                  Duration (minutes) {isEditing && '*'}
                </Typography>
                <TextField
                  fullWidth
                  name="duration"
                  value={editedService?.duration || ''}
                  onChange={handleChange}
                  placeholder="30"
                  type="number"
                  disabled={!isEditing || loading}
                  error={getFieldError('duration') || (editedService.duration && parseFloat(editedService.duration) <= 0)}
                  helperText={isEditing ? getHelperText('duration') : ''}
                  InputProps={{
                    readOnly: !isEditing,
                    startAdornment: (
                      <InputAdornment position="start">
                        <TimeIcon sx={{ color: isEditing ? '#6b7280' : '#9ca3af', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    inputProps: { min: 1, step: 1 }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: isEditing ? 'white' : '#f9fafb',
                      fontFamily: 'Inter, sans-serif',
                      '&:hover': isEditing ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } : {},
                      '&.Mui-focused': isEditing ? { boxShadow: '0 4px 12px rgba(33, 72, 192, 0.15)' } : {}
                    }
                  }}
                />
              </Box>
            </Box>

            
            {/* Type and Status Row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              {/* Service Type */}
              <Box>
                <Typography variant="body2" sx={{ 
                  mb: 1, 
                  fontWeight: 600, 
                  color: '#374151',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px'
                }}>
                  Service Type {isEditing && '*'}
                </Typography>
                <TextField
                  select={isEditing}
                  fullWidth
                  name="type"
                  value={editedService?.type || ''}
                  onChange={handleChange}
                  disabled={!isEditing || loading}
                  error={getFieldError('type')}
                  helperText={isEditing ? getHelperText('type') : ''}
                  InputProps={{
                    readOnly: !isEditing,
                    startAdornment: (
                      <InputAdornment position="start">
                        <TypeIcon sx={{ color: isEditing ? '#6b7280' : '#9ca3af', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: isEditing ? 'white' : '#f9fafb',
                      fontFamily: 'Inter, sans-serif',
                      '&:hover': isEditing ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } : {},
                      '&.Mui-focused': isEditing ? { boxShadow: '0 4px 12px rgba(33, 72, 192, 0.15)' } : {}
                    }
                  }}
                >
                  {isEditing && serviceTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box>
                        <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                          {type.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
                          {type.desc}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Status */}
              <Box>
                <Typography variant="body2" sx={{ 
                  mb: 1, 
                  fontWeight: 600, 
                  color: '#374151',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px'
                }}>
                  Status {isEditing && '*'}
                </Typography>
                {isEditing ? (
                  <TextField
                    select
                    fullWidth
                    name="status"
                    value={editedService?.status || ''}
                    onChange={handleChange}
                    disabled={loading}
                    error={getFieldError('status')}
                    helperText={getHelperText('status')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <StatusIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: 'white',
                        fontFamily: 'Inter, sans-serif',
                        '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
                        '&.Mui-focused': { boxShadow: '0 4px 12px rgba(33, 72, 192, 0.15)' }
                      }
                    }}
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: status.color
                            }}
                          />
                          <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                            {status.label}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <Box sx={{
                    borderRadius: '12px',
                    backgroundColor: '#f9fafb',
                    p: 2,
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '56px'
                  }}>
                    <StatusIcon sx={{ color: '#9ca3af', fontSize: 20, mr: 1.5 }} />
                    <Chip
                      label={editedService?.status}
                      sx={{
                        backgroundColor: getStatusColor(editedService?.status),
                        color: 'white',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: '500'
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>

            {/* Package Contents Section - Compact version outside main grid */}
            {service?.type === 'Package Treatment' && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 3 }} />
                
                <Typography variant="h6" sx={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  fontSize: '16px',
                  color: '#2148C0',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <ServiceIcon sx={{ fontSize: 20 }} />
                  Package Contents
                </Typography>
                
                {loadingPackageServices ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    py: 3,
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <CircularProgress size={32} sx={{ color: '#2148C0' }} />
                  </Box>
                ) : packageServices.length > 0 ? (
                  <Box sx={{ 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    maxHeight: '250px',  // Limit height
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Scrollable Services List */}
                    <Box sx={{ 
                      p: 2, 
                      maxHeight: '160px', 
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': { width: '6px' },
                      '&::-webkit-scrollbar-track': { backgroundColor: '#f1f5f9' },
                      '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '3px' }
                    }}>
                      {packageServices.map((pkgService, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            py: 1.5,
                            px: 2,
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            mb: index < packageServices.length - 1 ? 1.5 : 0,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #f1f5f9'
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ 
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: '600',
                              fontSize: '14px',
                              color: '#1e293b',
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {pkgService.name}
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2
                            }}>
                              <Typography sx={{ 
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '12px',
                                color: '#059669',
                                fontWeight: '500'
                              }}>
                                ₱{pkgService.price?.toLocaleString()}
                              </Typography>
                              <Typography sx={{ 
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '12px',
                                color: '#7c3aed',
                                fontWeight: '500'
                              }}>
                                {pkgService.duration}min
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ 
                            backgroundColor: '#2148C0',
                            color: 'white',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '16px',
                            minWidth: '32px',
                            textAlign: 'center'
                          }}>
                            <Typography sx={{ 
                              fontSize: '12px',
                              fontWeight: '700',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              x{pkgService.quantity}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                    
                    {/* Compact Package Totals */}
                    <Box sx={{ 
                      backgroundColor: '#2148C0',
                      color: 'white',
                      px: 3,
                      py: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Box>
                        <Typography sx={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          opacity: 0.9,
                          mb: 0.25
                        }}>
                          Total Price
                        </Typography>
                        <Typography sx={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: '700',
                          fontSize: '16px'
                        }}>
                          ₱{packageServices.reduce((total, s) => total + ((s.price || 0) * (s.quantity || 1)), 0).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          opacity: 0.9,
                          mb: 0.25
                        }}>
                          Services
                        </Typography>
                        <Typography sx={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: '700',
                          fontSize: '16px'
                        }}>
                          {packageServices.length}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          opacity: 0.9,
                          mb: 0.25
                        }}>
                          Duration
                        </Typography>
                        <Typography sx={{ 
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: '700',
                          fontSize: '16px'
                        }}>
                          {packageServices.reduce((total, s) => total + ((s.duration || 0) * (s.quantity || 1)), 0)}min
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    backgroundColor: '#fef3cd',
                    border: '1px solid #fbbf24',
                    borderRadius: '12px',
                    p: 2,
                    textAlign: 'center'
                  }}>
                    <Typography sx={{ 
                      color: '#92400e',
                      fontStyle: 'italic',
                      fontSize: '14px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: '500'
                    }}>
                      No services found in this package
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>  {/* This closes the main grid */}
        </DialogContent>

        <Divider />

        {/* Actions */}
        <DialogActions sx={{ p: 3, backgroundColor: 'white', gap: 2 }}>
          <Button
            onClick={handleDialogClose}
            disabled={loading}
            sx={{
              borderRadius: '12px',
              px: 3,
              py: 1.5,
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              '&:hover': {
                backgroundColor: '#f9fafb',
                borderColor: '#d1d5db'
              }
            }}
          >
            {isEditing ? 'Cancel' : 'Close'}
          </Button>
          
          {isEditing ? (
            <Button
              variant="contained"
              onClick={handleSaveClick}
              disabled={loading}
              startIcon={<SaveIcon />}
              sx={{
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                background: 'linear-gradient(135deg, #2148C0 0%, #1a3ba8 100%)',
                boxShadow: '0 4px 12px rgba(33, 72, 192, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1a3ba8 0%, #164091 100%)',
                  boxShadow: '0 6px 16px rgba(33, 72, 192, 0.4)',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  background: '#e5e7eb',
                  color: '#9ca3af',
                  boxShadow: 'none'
                }
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleEditClick}
              startIcon={<EditIcon />}
              sx={{
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                background: 'linear-gradient(135deg, #2148C0 0%, #1a3ba8 100%)',
                boxShadow: '0 4px 12px rgba(33, 72, 192, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1a3ba8 0%, #164091 100%)',
                  boxShadow: '0 6px 16px rgba(33, 72, 192, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Edit Service
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <MuiDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '16px',
            maxWidth: '400px'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: 'Inter, sans-serif', 
          fontWeight: 600,
          pb: 1
        }}>
          Save changes?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#6b7280' }}>
            Do you want to save your changes before closing?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleConfirmDiscard} 
            sx={{
              color: '#ef4444',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#fef2f2' }
            }}
          >
            Discard
          </Button>
          <Button 
            onClick={handleConfirmSave} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #2148C0 0%, #1a3ba8 100%)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              borderRadius: '8px',
              '&:hover': {
                background: 'linear-gradient(135deg, #1a3ba8 0%, #164091 100%)'
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </MuiDialog>

      <Snackbar 
        open={snackbarOpen} 
        message={snackbarMsg} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            fontFamily: 'Inter, sans-serif',
            borderRadius: '12px'
          }
        }}
      />
    </>
  );
};

export default ViewService;