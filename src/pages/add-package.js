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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Autocomplete,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  MedicalServices as ServiceIcon,
  Description as DescIcon,
  AttachMoney as PriceIcon,
  Schedule as TimeIcon,
  ToggleOn as StatusIcon,
  LocalOffer as PackageIcon
} from '@mui/icons-material';

const API_BASE = 'http://localhost:3001'; // Use direct API_BASE

const statusOptions = [
  { value: 'Active', label: 'Active', color: '#4caf50' },
  { value: 'Inactive', label: 'Inactive', color: '#f44336' }
];

const AddPackage = ({ open, onClose, onAddPackage, showSnackbar }) => {
  const [packageData, setPackageData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    status: 'Active'
  });

  const [selectedServices, setSelectedServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [serviceToAdd, setServiceToAdd] = useState(null);
  const [serviceQuantity, setServiceQuantity] = useState(1);

  // UI states
  const [loading, setLoading] = useState(false);
  const [requiredError, setRequiredError] = useState(false);
  const [requiredFields, setRequiredFields] = useState({});
  const [nameExists, setNameExists] = useState(false);
  const [allPackages, setAllPackages] = useState([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Fetch available services and existing packages for validation
  useEffect(() => {
    if (open) {
      fetchData();
      resetForm();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching services for package creation...');
      
      // Use the services-and-packages endpoint
      const servicesResponse = await fetch(`${API_BASE}/services-and-packages`);
      
      if (servicesResponse.ok) {
        const data = await servicesResponse.json();
        console.log('📦 Services data received:', data);
        
        // Handle the response structure from /services-and-packages
        let servicesList = [];
        
        if (data.services && Array.isArray(data.services)) {
          // Data has separate services and packages arrays
          servicesList = data.services;
        } else if (data.all && Array.isArray(data.all)) {
          // Data has combined array
          servicesList = data.all.filter(s => s.type !== 'Package Treatment');
        } else if (Array.isArray(data)) {
          // Data is directly an array
          servicesList = data.filter(s => s.type !== 'Package Treatment');
        }
        
        // Filter to only active single treatment services
        const singleServices = servicesList.filter(s => 
          s.type !== 'Package Treatment' && 
          s.status === 'Active'
        );
        
        console.log(`✅ Found ${singleServices.length} active single treatment services`);
        console.log('Sample services:', singleServices.slice(0, 3));
        
        setAvailableServices(singleServices);
      } else {
        console.error('❌ Failed to fetch services:', servicesResponse.status);
        throw new Error(`HTTP ${servicesResponse.status}`);
      }
  
      // Fetch existing packages for name validation
      const packagesResponse = await fetch(`${API_BASE}/packages`);
      if (packagesResponse.ok) {
        const packages = await packagesResponse.json();
        console.log(`✅ Found ${packages.length} existing packages`);
        setAllPackages(packages);
      }
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setAvailableServices([]);
      setAllPackages([]);
    } finally {
      setLoading(false);
    }
  };
  

  const resetForm = () => {
    setPackageData({
      name: '',
      description: '',
      price: '',
      duration: '',
      status: 'Active'
    });
    setSelectedServices([]);
    setServiceToAdd(null);
    setServiceQuantity(1);
    setRequiredError(false);
    setRequiredFields({});
    setNameExists(false);
    setSubmitAttempted(false);
  };

  const handlePackageChange = (e) => {
    const { name, value } = e.target;
    setPackageData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (name === 'name') setNameExists(false);
    if (submitAttempted && requiredFields[name]) {
      setRequiredFields(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleAddService = () => {
    if (!serviceToAdd) return;

    const existingIndex = selectedServices.findIndex(s => s.serviceId === serviceToAdd.id);
    
    if (existingIndex >= 0) {
      // Update existing service quantity
      const updated = [...selectedServices];
      updated[existingIndex].quantity += serviceQuantity;
      setSelectedServices(updated);
    } else {
      // Add new service
      const newService = {
        serviceId: serviceToAdd.id,
        name: serviceToAdd.name,
        price: serviceToAdd.price || 0,
        duration: serviceToAdd.duration || 0,
        quantity: serviceQuantity
      };
      setSelectedServices(prev => [...prev, newService]);
    }

    setServiceToAdd(null);
    setServiceQuantity(1);
  };

  const handleRemoveService = (serviceId) => {
    setSelectedServices(prev => prev.filter(s => s.serviceId !== serviceId));
  };

  const handleUpdateQuantity = (serviceId, newQuantity) => {
    if (newQuantity < 1) return;
    setSelectedServices(prev => 
      prev.map(s => s.serviceId === serviceId ? { ...s, quantity: newQuantity } : s)
    );
  };

  const validateFields = () => {
    const errors = {};
    if (!packageData.name.trim()) errors.name = true;
    if (!packageData.description.trim()) errors.description = true;
    if (!packageData.status.trim()) errors.status = true;
    if (selectedServices.length === 0) errors.services = true;
    
    setRequiredFields(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateTotals = () => {
    const totalPrice = selectedServices.reduce((sum, service) => 
      sum + (service.price * service.quantity), 0
    );
    const totalDuration = selectedServices.reduce((sum, service) => 
      sum + (service.duration * service.quantity), 0
    );
    return { totalPrice, totalDuration };
  };

  const submitPackage = async () => {
    setSubmitAttempted(true);
    const isValid = validateFields();

    // Check for duplicate name
    const duplicate = allPackages.some(
      p => p.name.trim().toLowerCase() === packageData.name.trim().toLowerCase()
    );
    setNameExists(duplicate);

    if (!isValid || duplicate) {
      setRequiredError(true);
      setTimeout(() => setRequiredError(false), 3000);
      return;
    }

    setLoading(true);
    
    const { totalPrice, totalDuration } = calculateTotals();
    
    try {
      const response = await fetch(`${API_BASE}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: packageData.name.trim(),
          description: packageData.description.trim(),
          price: parseFloat(packageData.price) || totalPrice,
          duration: parseInt(packageData.duration) || totalDuration,
          status: packageData.status,
          services: selectedServices.map(s => ({
            serviceId: s.serviceId,
            quantity: s.quantity
          }))
        })
      });

      if (response.ok) {
        const newPackage = await response.json();
        console.log('Package created:', newPackage);
        
        if (onAddPackage) onAddPackage();
        onClose();
        
        if (typeof showSnackbar === 'function') {
          showSnackbar(`Package "${packageData.name}" created successfully!`, { severity: 'success' });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create package');
      }
    } catch (err) {
      console.error('Package creation error:', err);
      if (typeof showSnackbar === 'function') {
        showSnackbar(`Failed to create package: ${err.message}`, { severity: 'error' });
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
      return 'A package with this name already exists';
    }
    if (fieldName === 'services' && selectedServices.length === 0) {
      return 'Package must contain at least one service';
    }
    if (getFieldError(fieldName)) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    return customText;
  };

  const { totalPrice, totalDuration } = calculateTotals();

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
          boxShadow: '0 24px 38px 3px rgba(0,0,0,0.14)',
          overflow: 'hidden',
          maxWidth: '800px',
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
          <PackageIcon sx={{ fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '28px', fontFamily: 'Inter, sans-serif' }}>
            Create Service Package
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
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Progress Bar */}
      {loading && <LinearProgress />}

      {/* Content */}
      <DialogContent sx={{ p: 4, backgroundColor: '#fafbfc' }}>
        {/* Error Alert */}
        {requiredError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            <Typography variant="body2">
              {nameExists ? 'Package name already exists' : 'Please fill in all required fields correctly'}
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'grid', gap: 3 }}>
          {/* Package Basic Info */}
          <Paper sx={{ p: 3, borderRadius: '12px', backgroundColor: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2148C0' }}>
              Package Information
            </Typography>

            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* Package Name */}
              <TextField
                fullWidth
                name="name"
                label="Package Name"
                value={packageData.name}
                onChange={handlePackageChange}
                placeholder="e.g., Complete Dental Checkup Package"
                disabled={loading}
                error={getFieldError('name') || nameExists}
                helperText={getHelperText('name')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PackageIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />

              {/* Description */}
              <TextField
                fullWidth
                name="description"
                label="Description"
                value={packageData.description}
                onChange={handlePackageChange}
                placeholder="Describe what this package includes..."
                multiline
                rows={3}
                disabled={loading}
                error={getFieldError('description')}
                helperText={getHelperText('description')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />

              {/* Status */}
              <TextField
                select
                fullWidth
                name="status"
                label="Status"
                value={packageData.status}
                onChange={handlePackageChange}
                disabled={loading}
                error={getFieldError('status')}
                helperText={getHelperText('status')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: status.color }} />
                      <Typography>{status.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Paper>

          {/* Services Section */}
          <Paper sx={{ p: 3, borderRadius: '12px', backgroundColor: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2148C0' }}>
              Package Services {getFieldError('services') && <span style={{ color: '#f44336' }}>*</span>}
            </Typography>

            {/* Add Service Form */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 2, mb: 3, alignItems: 'end' }}>
              <Autocomplete
                value={serviceToAdd}
                onChange={(event, newValue) => setServiceToAdd(newValue)}
                options={availableServices}
                getOptionLabel={(option) => option.name || ''}
                renderInput={(params) => (
                  <TextField {...params} label="Select Service" placeholder="Choose a service to add..." />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography sx={{ fontWeight: 500 }}>{option.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                        ₱{option.price?.toLocaleString()} • {option.duration} mins
                      </Typography>
                    </Box>
                  </Box>
                )}
              />

              <TextField
                type="number"
                label="Quantity"
                value={serviceQuantity}
                onChange={(e) => setServiceQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1 }}
                sx={{ width: '100px' }}
              />

              <Button
                variant="contained"
                onClick={handleAddService}
                disabled={!serviceToAdd}
                startIcon={<AddIcon />}
                sx={{ height: '56px', px: 3, borderRadius: '12px' }}
              >
                Add
              </Button>
            </Box>

            {/* Selected Services List */}
            <Box>
              {selectedServices.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: getFieldError('services') ? '1px solid #f44336' : '1px solid #e5e7eb'
                }}>
                  <Typography sx={{ 
                    color: getFieldError('services') ? '#f44336' : '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    {getHelperText('services', 'No services added yet. Add services to create a package.')}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {selectedServices.map((service, index) => (
                    <ListItem key={service.serviceId} sx={{ borderBottom: index < selectedServices.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 600 }}>{service.name}</Typography>}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Chip label={`₱${(service.price * service.quantity).toLocaleString()}`} size="small" sx={{ backgroundColor: '#e8f5e8', color: '#2e7d32' }} />
                            <Chip label={`${service.duration * service.quantity} mins`} size="small" sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }} />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          type="number"
                          value={service.quantity}
                          onChange={(e) => handleUpdateQuantity(service.serviceId, parseInt(e.target.value))}
                          size="small"
                          inputProps={{ min: 1, style: { textAlign: 'center' } }}
                          sx={{ width: '70px' }}
                        />
                        <IconButton onClick={() => handleRemoveService(service.serviceId)} size="small" sx={{ color: '#f44336' }}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            {/* Package Totals */}
            {selectedServices.length > 0 && (
              <Paper sx={{ 
                mt: 3, 
                p: 3, 
                background: 'linear-gradient(135deg, #2148C0 0%, #1a3ba8 100%)',
                color: 'white',
                borderRadius: '12px'
              }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Package Summary</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Total Price</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>₱{totalPrice.toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Total Duration</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalDuration} minutes</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                  {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} included
                </Typography>
              </Paper>
            )}
          </Paper>
        </Box>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ p: 3, backgroundColor: 'white', gap: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ borderRadius: '12px', px: 3, py: 1.5 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submitPackage}
          disabled={loading || selectedServices.length === 0}
          sx={{
            borderRadius: '12px',
            px: 4,
            py: 1.5,
            background: 'linear-gradient(135deg, #2148C0 0%, #1a3ba8 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #1a3ba8 0%, #164091 100%)' }
          }}
        >
          {loading ? 'Creating Package...' : 'Create Package'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPackage;