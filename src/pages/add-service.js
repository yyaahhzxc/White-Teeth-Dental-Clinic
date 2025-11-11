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
  Divider,
  Fade,
  InputAdornment,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  MedicalServices as ServiceIcon,
  Description as DescIcon,
  AttachMoney as PriceIcon,
  Schedule as TimeIcon,
  Category as TypeIcon,
  ToggleOn as StatusIcon
} from '@mui/icons-material';

const serviceTypes = [
  { value: 'Single Treatment', label: 'Single Treatment', desc: 'Single service' },
  { value: 'Package Treatment', label: 'Package Treatment', desc: 'Multi-service package' },
];

const statusOptions = [
  { value: 'Active', label: 'Active', color: '#4caf50' },
  { value: 'Inactive', label: 'Inactive', color: '#f44336' }
];

import { API_BASE } from '../apiConfig';

const AddService = ({ open, onClose, handleAddService, showSnackbar }) => {
  const [service, setService] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    type: '',
    status: 'Active' // Default to Active
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [requiredError, setRequiredError] = useState(false);
  const [requiredFields, setRequiredFields] = useState({});
  const [nameExists, setNameExists] = useState(false);
  const [allServices, setAllServices] = useState([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Fetch all services for duplicate name check
  useEffect(() => {
    if (open) {
      setRequiredError(false);
      setRequiredFields({});
      setNameExists(false);
      setSubmitAttempted(false);
      setLoading(true);
      
      fetch(`${API_BASE}/service-table`)
        .then(res => res.json())
        .then(data => {
          setAllServices(data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [open]);

  // Clear fields when dialog is closed
  useEffect(() => {
    if (!open) {
      setService({
        name: '',
        description: '',
        price: '',
        duration: '',
        type: '',
        status: 'Active'
      });
      setRequiredError(false);
      setRequiredFields({});
      setNameExists(false);
      setSubmitAttempted(false);
      setLoading(false);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setService(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (name === 'name') setNameExists(false);
    if (submitAttempted && requiredFields[name]) {
      setRequiredFields(prev => ({ ...prev, [name]: false }));
    }
  };

  const validateFields = () => {
    const errors = {};
    if (!service.name.trim()) errors.name = true;
    if (!service.description.trim()) errors.description = true;
    if (!service.price.trim() || parseFloat(service.price) <= 0) errors.price = true;
    if (!service.duration.trim() || parseFloat(service.duration) <= 0) errors.duration = true;
    if (!service.type.trim()) errors.type = true;
    if (!service.status.trim()) errors.status = true;
    
    setRequiredFields(errors);
    return Object.keys(errors).length === 0;
  };

  const submitService = async () => {
    setSubmitAttempted(true);
    const isValid = validateFields();

    // Check for duplicate name (case-insensitive)
    const duplicate = allServices.some(
      s => s.name.trim().toLowerCase() === service.name.trim().toLowerCase()
    );
    setNameExists(duplicate);

    if (!isValid || duplicate) {
      setRequiredError(true);
      setTimeout(() => setRequiredError(false), 3000);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/service-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...service,
          price: parseFloat(service.price),
          duration: parseInt(service.duration)
        })
      });

      if (response.ok) {
        handleAddService();
        onClose();
        if (typeof showSnackbar === 'function') {
          showSnackbar('Service added successfully!', { severity: 'success' });
        }
      } else {
        throw new Error('Failed to create service');
      }
    } catch (err) {
      if (typeof showSnackbar === 'function') {
        showSnackbar('Failed to save service. Please try again.', { severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName) => {
    return submitAttempted && requiredFields[fieldName];
  };

  const getHelperText = (fieldName, customText = '') => {
    if (fieldName === 'name' && nameExists) {
      return 'A service with this name already exists';
    }
    if (fieldName === 'price' && service.price && parseFloat(service.price) <= 0) {
      return 'Price must be greater than 0';
    }
    if (fieldName === 'duration' && service.duration && parseFloat(service.duration) <= 0) {
      return 'Duration must be greater than 0';
    }
    if (getFieldError(fieldName)) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    return customText;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 300 }}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          boxShadow: '0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.20)',
          overflow: 'hidden',
          maxWidth: '600px',
          margin: '16px'
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
          <ServiceIcon sx={{ fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '28px', fontFamily: 'Inter, sans-serif' }}>
            Add New Service
          </Typography>
        </Box>
        
        
        <IconButton
          onClick={onClose}
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
              Service Name *
            </Typography>
            <TextField
              fullWidth
              name="name"
              value={service.name}
              onChange={handleChange}
              placeholder="e.g., Teeth Cleaning, Root Canal Treatment"
              disabled={loading}
              error={getFieldError('name') || nameExists}
              helperText={getHelperText('name')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ServiceIcon sx={{ color: '#6b7280', fontSize: 20 }} />
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
              Description *
            </Typography>
            <TextField
              fullWidth
              name="description"
              value={service.description}
              onChange={handleChange}
              placeholder="Detailed description of the service..."
              multiline
              rows={3}
              disabled={loading}
              error={getFieldError('description')}
              helperText={getHelperText('description', 'Provide a clear description of what this service includes')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                    <DescIcon sx={{ color: '#6b7280', fontSize: 20 }} />
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
                Price (₱) *
              </Typography>
              <TextField
                fullWidth
                name="price"
                value={service.price}
                onChange={handleChange}
                placeholder="0.00"
                type="number"
                disabled={loading}
                error={getFieldError('price') || (service.price && parseFloat(service.price) <= 0)}
                helperText={getHelperText('price')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PriceIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  inputProps: { min: 0, step: 0.01 }
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
                Duration (minutes) *
              </Typography>
              <TextField
                fullWidth
                name="duration"
                value={service.duration}
                onChange={handleChange}
                placeholder="30"
                type="number"
                disabled={loading}
                error={getFieldError('duration') || (service.duration && parseFloat(service.duration) <= 0)}
                helperText={getHelperText('duration')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TimeIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  inputProps: { min: 1, step: 1 }
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
                Service Type *
              </Typography>
              <TextField
                select
                fullWidth
                name="type"
                value={service.type}
                onChange={handleChange}
                disabled={loading}
                error={getFieldError('type')}
                helperText={getHelperText('type')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TypeIcon sx={{ color: '#6b7280', fontSize: 20 }} />
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
                {serviceTypes.map((type) => (
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
                Status *
              </Typography>
              <TextField
                select
                fullWidth
                name="status"
                value={service.status}
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
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ p: 3, backgroundColor: 'white', gap: 2 }}>
        <Button
          onClick={onClose}
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
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submitService}
          disabled={loading}
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
          {loading ? 'Creating Service...' : 'Create Service'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddService;