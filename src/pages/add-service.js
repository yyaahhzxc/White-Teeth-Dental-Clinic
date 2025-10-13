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
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const serviceTypes = [
  'Single Treatment',
  'Package Treatment',
];

const statusOptions = [
  'Active',
  'Inactive'
];

import { API_BASE } from '../apiConfig';

const AddService = ({ open, onClose, handleAddService, showSnackbar }) => {
  const [service, setService] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    type: '',
    status: ''
  });

  // Validation states
  const [requiredError, setRequiredError] = useState(false);
  const [requiredFields, setRequiredFields] = useState({});
  const [nameExists, setNameExists] = useState(false);
  const [allServices, setAllServices] = useState([]);

  // Fetch all services for duplicate name check
  useEffect(() => {
    if (open) {
      setRequiredError(false);
      setRequiredFields({});
      setNameExists(false);
      fetch(`${API_BASE}/service-table`)
        .then(res => res.json())
        .then(data => setAllServices(data || []));
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
        status: ''
      });
      setRequiredError(false);
      setRequiredFields({});
      setNameExists(false);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setService(prev => ({ ...prev, [name]: value }));
    if (name === 'name') setNameExists(false);
  };

  const validateFields = () => {
    const errors = {};
    if (!service.name.trim()) errors.name = true;
    if (!service.description.trim()) errors.description = true;
    if (!service.price.trim()) errors.price = true;
    if (!service.duration.trim()) errors.duration = true;
    if (!service.type.trim()) errors.type = true;
    if (!service.status.trim()) errors.status = true;
    setRequiredFields(errors);
    return Object.keys(errors).length === 0;
  };

  const submitService = async () => {
    const isValid = validateFields();

    // Check for duplicate name (case-insensitive)
    const duplicate = allServices.some(
      s => s.name.trim().toLowerCase() === service.name.trim().toLowerCase()
    );
    setNameExists(duplicate);

    if (!isValid || duplicate) {
      setRequiredError(true);
      setTimeout(() => setRequiredError(false), 2000);
      return;
    }

    try {
      await fetch(`${API_BASE}/service-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service)
      });
      handleAddService(); // This will fetch the updated list
      onClose();
    } catch (err) {
      if (typeof showSnackbar === 'function') showSnackbar('Failed to save service', { error: true });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-paper': {
          width: '100%',
          maxWidth: 500,
          minHeight: 400,
          borderRadius: 3,
          backgroundColor: '#2148C0',
        }
      }}
    >
      <DialogTitle
        sx={{
          color: '#ffffffff',
          fontSize: 28,
          fontWeight: 800,
          textAlign: 'center',
          position: 'relative'
        }}
      >
        Add Service
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#ffffffff',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          backgroundColor: '#f5f7fa',
          px: 4,
          py: 3,
          borderRadius: 2,
        }}
      >
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            fullWidth
            label="Service Name"
            name="name"
            value={service.name}
            onChange={handleChange}
            sx={{ backgroundColor: '#ffffff9e' }}
            error={
              (requiredError && requiredFields.name && !service.name) ||
              nameExists
            }
            helperText={
              nameExists
                ? "Service already exists"
                : (requiredError && requiredFields.name && !service.name ? "" : "")
            }
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={service.description}
            onChange={handleChange}
            multiline
            rows={2}
            sx={{ backgroundColor: '#ffffff9e' }}
            error={requiredError && requiredFields.description && !service.description}
            helperText={requiredError && requiredFields.description && !service.description ? "" : ""}
          />
          <TextField
            fullWidth
            label="Price"
            name="price"
            value={service.price}
            onChange={handleChange}
            type="number"
            sx={{ backgroundColor: '#ffffff9e' }}
            error={requiredError && requiredFields.price && !service.price}
            helperText={requiredError && requiredFields.price && !service.price ? "" : ""}
          />
          <TextField
            fullWidth
            label="Service Duration (minutes)"
            name="duration"
            value={service.duration}
            onChange={handleChange}
            type="number"
            sx={{ backgroundColor: '#ffffff9e' }}
            error={requiredError && requiredFields.duration && !service.duration}
            helperText={requiredError && requiredFields.duration && !service.duration ? "" : ""}
          />
          <TextField
            select
            fullWidth
            label="Service Type"
            name="type"
            value={service.type}
            onChange={handleChange}
            sx={{ backgroundColor: '#ffffff9e' }}
            error={requiredError && requiredFields.type && !service.type}
            helperText={requiredError && requiredFields.type && !service.type ? "" : ""}
          >
            {serviceTypes.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Status"
            name="status"
            value={service.status}
            onChange={handleChange}
            sx={{ backgroundColor: '#ffffff9e' }}
            error={requiredError && requiredFields.status && !service.status}
            helperText={requiredError && requiredFields.status && !service.status ? "" : ""}
          >
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          onClick={submitService}
          sx={{ borderRadius: 8, px: 2, fontWeight: 'bold', fontSize: 18, mb: 1, mr: 2, backgroundColor: '#ffffffff', color: '#2148C0' }}
        >
          Add Service
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddService;