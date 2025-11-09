import React, { useEffect, useState } from 'react';
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
  Fade,
  Autocomplete,
  Chip,
  InputAdornment,
  MenuItem,
  Divider,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  ShoppingBasket as PackageIcon,
  Description as DescIcon,
  AttachMoney as PriceIcon,
  Schedule as TimeIcon,
  ToggleOn as StatusIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

import { API_BASE } from '../apiConfig';

const statusOptions = [
  { value: 'Active', label: 'Active', color: '#4caf50' },
  { value: 'Inactive', label: 'Inactive', color: '#f44336' }
];

  export default function AddPackage({ open, onClose, onAddPackage, showSnackbar }) {
    const [packageData, setPackageData] = useState({
      name: '',
      price: '',
      duration: '',
      status: 'Active'
    });

    const [availableServices, setAvailableServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]); // {id,name,price,duration,quantity}
    const [loading, setLoading] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [nameExists, setNameExists] = useState(false);

    // computed totals
    const totalDuration = selectedServices.reduce((sum, s) => sum + ((s.duration || 0) * (s.quantity || 1)), 0);
    const autoPrice = selectedServices.reduce((sum, s) => sum + ((parseFloat(s.price) || 0) * (s.quantity || 1)), 0);

    useEffect(() => {
      if (open) {
        fetchServices();
        setPackageData({ name: '', price: '', duration: '', status: 'Active' });
        setSelectedServices([]);
        setSubmitAttempted(false);
        setNameExists(false);
      }
    }, [open]);

    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_BASE}/service-table`);
        if (res.ok) {
          const data = await res.json();
          setAvailableServices(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch services', err);
      }
    };

    const handleChange = (field, value) => {
      setPackageData(prev => ({ ...prev, [field]: value }));
      if (field === 'name') setNameExists(false);
    };

    const handleSelectServices = (e, values) => {
      const mapped = values.map(v => {
        const existing = selectedServices.find(s => s.id === v.id);
        return {
          id: v.id,
          name: v.name,
          price: v.price,
          duration: v.duration,
          quantity: existing ? existing.quantity : 1
        };
      });
      setSelectedServices(mapped);
    };

    const updateQuantity = (serviceId, delta) => {
      setSelectedServices(prev => prev.map(s => {
        if (s.id === serviceId) {
          const q = Math.max(1, (s.quantity || 1) + delta);
          return { ...s, quantity: q };
        }
        return s;
      }));
    };

    const validateFields = () => {
      const errors = {};
      if (!packageData.name.trim()) errors.name = true;
      if (selectedServices.length === 0) errors.services = true;
      return Object.keys(errors).length === 0;
    };

    const getFieldError = (fieldName) => {
      if (!submitAttempted) return false;
      if (fieldName === 'name') return !packageData.name.trim();
      if (fieldName === 'services') return selectedServices.length === 0;
      if (fieldName === 'status') return !packageData.status;
      return false;
    };

    const getHelperText = (fieldName) => {
      if (fieldName === 'name' && nameExists) return 'A service or package with this name already exists';
      if (getFieldError(fieldName)) return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      return '';
    };

    const submitPackage = async () => {
      setSubmitAttempted(true);
      if (!validateFields()) return;

      // check duplicate name
      try {
        const all = await fetch(`${API_BASE}/service-table`).then(r => r.json());
        const dup = all.some(s => s.name && s.name.trim().toLowerCase() === packageData.name.trim().toLowerCase());
        if (dup) {
          setNameExists(true);
          return;
        }
      } catch (err) {
        // ignore
      }

      const payload = {
        name: packageData.name.trim(),
        type: 'Package Treatment',
        status: packageData.status,
        price: packageData.price ? parseFloat(packageData.price) : autoPrice,
        duration: Math.round(totalDuration),
        packageServices: selectedServices.map(s => ({ serviceId: s.id, quantity: s.quantity, price: s.price, duration: s.duration }))
      };

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/service-table`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          if (typeof onAddPackage === 'function') onAddPackage();
          onClose();
          if (typeof showSnackbar === 'function') showSnackbar('Package added successfully', { severity: 'success' });
        } else {
          if (typeof showSnackbar === 'function') showSnackbar('Failed to add package', { severity: 'error' });
        }
      } catch (err) {
        console.error(err);
        if (typeof showSnackbar === 'function') showSnackbar('Failed to add package', { severity: 'error' });
      } finally {
        setLoading(false);
      }
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
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #2148C0 0%, #1a3ba8 100%)', color: 'white', position: 'relative', px: 4, py: 3, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
            <PackageIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '28px', fontFamily: 'Inter, sans-serif' }}>
              Add New Package
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

        {loading && (
          <LinearProgress sx={{ backgroundColor: 'rgba(33, 72, 192, 0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#2148C0' } }} />
        )}

        <DialogContent sx={{ p: 4, backgroundColor: '#fafbfc' }}>
          {submitAttempted && !validateFields() && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
              <Typography variant="body2">Please fill in all required fields correctly</Typography>
            </Alert>
          )}

          {nameExists && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
              <Typography variant="body2">A service or package with this name already exists</Typography>
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 3 }}>
            {/* Package Name */}
            <Box>
              <Typography variant="body2" sx={{ mt: 5, mb: 1, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
                Package Name *
              </Typography>
              <TextField
                fullWidth
                name="name"
                value={packageData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Family Cleaning Package"
                disabled={loading}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: 'white' } }}
              />
            </Box>

            {/* Services multi-select */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
                Services *
              </Typography>
              <Autocomplete
                multiple
                options={availableServices}
                getOptionLabel={(opt) => opt.name || ''}
                value={selectedServices.map(s => availableServices.find(a => a.id === s.id) || s)}
                onChange={handleSelectServices}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.name} {...getTagProps({ index })} key={option.id} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} placeholder="Search and select services" size="small" />
                )}
              />
            </Box>

            {/* Selected services list (visible even when empty) */}
            <Box sx={{ p: 2, backgroundColor: '#fff', borderRadius: '12px' }}>
              <Typography sx={{ fontWeight: 600, mb: 2 }}>Selected Services</Typography>
              {selectedServices.length === 0 ? (
                <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
                  <Typography sx={{ color: '#6b7280' }}>No services selected </Typography>
                </Box>
              ) : (
                selectedServices.map(s => (
                  <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>{s.name}</Typography>
                      <Typography sx={{ color: '#6b7280', fontSize: 13 }}>{s.duration} min • ₱{s.price}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton size="small" onClick={() => updateQuantity(s.id, -1)}><RemoveIcon fontSize="small" /></IconButton>
                      <Typography>{s.quantity || 1}</Typography>
                      <IconButton size="small" onClick={() => updateQuantity(s.id, 1)}><AddIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                ))
              )}

              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>Auto Duration</Typography>
                <Typography>{totalDuration} minutes</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700 }}>Auto Price</Typography>
                <Typography>₱{autoPrice.toFixed(2)}</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Package Price (₱)</Typography>
              <TextField
                fullWidth
                size="small"
                value={packageData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder={autoPrice ? `Auto: ₱${autoPrice.toFixed(2)}` : '0.00'}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Box>

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
                value={packageData.status}
                onChange={(e) => handleChange('status', e.target.value)}
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

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={loading} sx={{ color: '#5f6368' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitPackage}
            disabled={loading}
            sx={{
              backgroundColor: '#2148c0',
              color: 'white',
              '&:hover': { backgroundColor: '#1e3fa8' }
            }}
          >
            Save Package
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
