import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Autocomplete,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Popover,
  InputAdornment
} from '@mui/material';
import { Close as CloseIcon, CalendarToday } from '@mui/icons-material';
import { API_BASE } from '../apiConfig';
import DateCalendar from '../components/DateCalendar';

// Utility function
const normalizeDateForStorage = (dateString) => {
  return dateString || '';
};

function AddAppointmentDialog({ open, onClose, onAddPatient }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Service states - UPDATED to match appointments tab structure
  const [services, setServices] = useState([]); // Combined services and packages
  const [selectedServices, setSelectedServices] = useState([]); // { ...service, quantity: number }
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceInputValue, setServiceInputValue] = useState('');

  // Appointment time states
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [timeStart, setTimeStart] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [timeEnd, setTimeEnd] = useState('');

  // Comments state
  const [comments, setComments] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Date calendar state
  const [dateCalendarAnchor, setDateCalendarAnchor] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Helper functions
  const addMinutesToTime = (timeString, minutes) => {
    if (!timeString || !minutes) return timeString;
    
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    const finalHours = newHours % 24;
    
    return `${String(finalHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  };

  const isValidBusinessTime = (timeString) => {
    if (!timeString) return false;
    const [hours] = timeString.split(':').map(Number);
    return hours >= 8 && hours < 17;
  };

  // Fetch patients and services on open
  useEffect(() => {
    if (open) {
      fetchPatients();
      fetchServices();
    }
  }, [open]);

  // Auto-calculate end time based on selected services
  useEffect(() => {
    if (selectedServices.length > 0 && timeStart && appointmentDate) {
      if (!isValidBusinessTime(timeStart)) {
        setSnackbar({
          open: true,
          message: 'Start time must be between 8:00 AM and 5:00 PM',
          severity: 'error'
        });
        setTimeStart('');
        return;
      }

      // Calculate total duration from all selected services with quantities
      const totalDuration = selectedServices.reduce((total, service) => {
        const duration = parseInt(service.duration) || 0;
        const quantity = service.quantity || 1;
        return total + (duration * quantity);
      }, 0);

      console.log('Selected services with quantities:', selectedServices);
      console.log('Total duration calculated:', totalDuration);

      // Auto-calculate end time
      const calculatedEndTime = addMinutesToTime(timeStart, totalDuration);
      setTimeEnd(calculatedEndTime);

      // Validate end time doesn't exceed business hours
      const [endHours, endMinutes] = calculatedEndTime.split(':').map(Number);
      
      if (endHours > 17 || (endHours === 17 && endMinutes > 0)) {
        setSnackbar({
          open: true,
          message: `Appointment would end after 5:00 PM (calculated end: ${calculatedEndTime}). Please select an earlier start time or fewer services.`,
          severity: 'warning'
        });
      }
    } else if (selectedServices.length === 0) {
      setTimeEnd('');
    }
  }, [selectedServices, timeStart, appointmentDate]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/patients`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Fetch combined services and packages (matching appointments tab)
  const fetchServices = async () => {
    setServiceLoading(true);
    try {
      const response = await fetch(`${API_BASE}/appointment-services`);
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Fetched services and packages:', data);
        setServices(data);
      } else {
        console.error('Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setServiceLoading(false);
    }
  };

  const validateForm = () => {
    if (!selectedPatient) {
      setSnackbar({
        open: true,
        message: 'Please select a patient',
        severity: 'error'
      });
      return false;
    }
    if (selectedServices.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one service or package',
        severity: 'error'
      });
      return false;
    }
    if (selectedServices.some(service => !service.id || service.quantity <= 0)) {
      setSnackbar({
        open: true,
        message: 'Invalid service selected. Please reselect services.',
        severity: 'error'
      });
      return false;
    }
    if (!appointmentDate || !timeStart || !timeEnd) {
      setSnackbar({
        open: true,
        message: 'Please fill in all date and time fields',
        severity: 'error'
      });
      return false;
    }
    if (!isValidBusinessTime(timeStart)) {
      setSnackbar({
        open: true,
        message: 'Start time must be between 8:00 AM and 5:00 PM',
        severity: 'error'
      });
      return false;
    }
    
    // Validate end time
    if (timeStart && timeEnd) {
      const [startHours, startMins] = timeStart.split(':').map(Number);
      const [endHours, endMins] = timeEnd.split(':').map(Number);
      const startTime = startHours * 60 + startMins;
      const endTime = endHours * 60 + endMins;
      
      if (endTime <= startTime) {
        setSnackbar({
          open: true,
          message: 'End time must be after start time',
          severity: 'error'
        });
        return false;
      }
    }
    
    const [endHours] = timeEnd.split(':').map(Number);
    if (endHours > 17) {
      setSnackbar({
        open: true,
        message: 'End time cannot be after 5:00 PM',
        severity: 'error'
      });
      return false;
    }
    return true;
  };

  // REPLACE the conflict check section in handleSubmit (around line 200-230):

const handleSubmit = async () => {
  if (!validateForm()) return;

  setSubmitting(true);
  try {
    const normalizedDate = normalizeDateForStorage(appointmentDate);
    console.log('🔍 Checking for conflicts on date:', normalizedDate);
    
    // **FIX: Use date-range endpoint instead of fetching all appointments**
    const conflictResponse = await fetch(
      `${API_BASE}/appointments/date-range?startDate=${normalizedDate}&endDate=${normalizedDate}`
    );
    
    if (!conflictResponse.ok) {
      const errorText = await conflictResponse.text();
      console.error('❌ Failed to fetch appointments for conflict check:', errorText);
      throw new Error('Failed to fetch appointments for conflict check');
    }
    
    const allAppointments = await conflictResponse.json();
    console.log('📋 Appointments on this date:', allAppointments.length);
    
    const [startHour, startMin] = timeStart.split(':').map(Number);
    const [endHour, endMin] = timeEnd.split(':').map(Number);
    const newStartMinutes = startHour * 60 + startMin;
    const newEndMinutes = endHour * 60 + endMin;
    
    const conflictingAppointment = allAppointments.find(apt => {
      // Skip cancelled or done appointments
      if (apt.status === 'done' || apt.status === 'cancelled') return false;
      
      if (!apt.timeStart || !apt.timeEnd) return false;
      
      const [aptStartH, aptStartM] = apt.timeStart.split(':').map(Number);
      const [aptEndH, aptEndM] = apt.timeEnd.split(':').map(Number);
      const aptStartMinutes = aptStartH * 60 + aptStartM;
      const aptEndMinutes = aptEndH * 60 + aptEndM;
      
      // Check for time overlap
      return (newStartMinutes < aptEndMinutes && newEndMinutes > aptStartMinutes);
    });
    
    if (conflictingAppointment) {
      console.log('⚠️ Conflict found:', conflictingAppointment);
      setSnackbar({
        open: true,
        message: `Unable to book appointment: conflicting schedule with ${conflictingAppointment.patientName || 'another patient'}`,
        severity: 'error'
      });
      setSubmitting(false);
      return;
    }
    
    console.log('✅ No conflicts found, creating appointment...');
    
    // Calculate totals
    const totalPrice = selectedServices.reduce((total, service) => 
      total + (parseFloat(service.price) * service.quantity), 0
    );
    
    const totalDuration = selectedServices.reduce((total, service) => 
      total + (parseInt(service.duration) * service.quantity), 0
    );
    
    // Create service summary with quantities
    const serviceNames = selectedServices.map(service => 
      `${service.name}${service.quantity > 1 ? ` (x${service.quantity})` : ''}${service.source_type === 'package' ? ' 📦' : ''}`
    ).join(', ');
    
    const serviceIds = selectedServices.map(service => service.id);

    // Create serviceQuantities array with source type info
    const serviceQuantities = selectedServices.map(service => ({
      serviceId: service.id,
      quantity: service.quantity,
      price: parseFloat(service.price),
      duration: parseInt(service.duration),
      source_type: service.source_type || 'service'
    }));

    const appointmentData = {
      patientId: selectedPatient.id,
      serviceId: serviceIds[0],
      serviceName: selectedServices[0].name,
      serviceIds: serviceIds,
      serviceNames: serviceNames,
      serviceQuantities: serviceQuantities,
      totalPrice: totalPrice,
      totalDuration: totalDuration,
      appointmentDate: normalizedDate,
      timeStart: timeStart,
      timeEnd: timeEnd,
      comments: comments,
      status: 'Scheduled'
    };

    console.log('📤 Creating appointment:', appointmentData);

    const response = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ Appointment created successfully:', responseData);
      
      setSnackbar({
        open: true,
        message: 'Appointment created successfully!',
        severity: 'success'
      });

      // Clear form
      setSelectedPatient(null);
      setInputValue('');
      setSelectedServices([]);
      setServiceInputValue('');
      setAppointmentDate('');
      setTimeStart('');
      setTimeEnd('');
      setComments('');

      setTimeout(() => {
        onClose();
        
        // Dispatch events for calendar refresh
        console.log('🚀 Dispatching appointment events for calendar refresh');
        
        window.dispatchEvent(new CustomEvent('appointmentCreated', {
          detail: responseData.appointment
        }));
        
        window.dispatchEvent(new CustomEvent('appointmentAdded', {
          detail: responseData.appointment
        }));
        
        window.dispatchEvent(new CustomEvent('refreshAppointments'));
        
      }, 1000);
    } else {
      const errorData = await response.text();
      console.error('❌ Failed to create appointment:', response.status, errorData);
      
      setSnackbar({
        open: true,
        message: `Failed to create appointment: ${errorData}`,
        severity: 'error'
      });
    }
  } catch (error) {
    console.error('❌ Error submitting appointment:', error);
    setSnackbar({
      open: true,
      message: `Error: ${error.message}`,
      severity: 'error'
    });
  } finally {
    setSubmitting(false);
  }
};

  const hasFormData = () => {
    return selectedPatient || selectedServices.length > 0 || appointmentDate || timeStart || timeEnd || comments;
  };

  const handleClose = () => {
    if (hasFormData()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleDiscardConfirm = () => {
    setSelectedPatient(null);
    setSelectedServices([]);
    setAppointmentDate('');
    setTimeStart('');
    setTimeEnd('');
    setComments('');
    setInputValue('');
    setServiceInputValue('');
    setShowDiscardConfirm(false);
    onClose();
  };

  const handleDiscardCancel = () => {
    setShowDiscardConfirm(false);
  };

  const updateServiceQuantity = (serviceId, newQuantity) => {
    if (newQuantity <= 0) {
      setSelectedServices(prev => prev.filter(service => service.id !== serviceId));
    } else {
      setSelectedServices(prev => 
        prev.map(service => 
          service.id === serviceId 
            ? { ...service, quantity: newQuantity }
            : service
        )
      );
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0px 24px 48px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: '24px',
          fontWeight: '600',
          color: '#202124',
          pb: 1
        }}>
          Add New Appointment
          <IconButton 
            onClick={handleClose}
            sx={{ 
              color: '#5f6368',
              '&:hover': {
                backgroundColor: '#f1f3f4'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            {/* Patient Selection */}
            <Box>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                fontWeight: '600', 
                color: '#5f6368',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }}>
                Patient *
              </Typography>
              <Autocomplete
                value={selectedPatient}
                onChange={(event, newValue) => setSelectedPatient(newValue)}
                inputValue={inputValue}
                onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
                options={patients}
                getOptionLabel={(option) => 
                  option ? `${option.firstName} ${option.lastName}` : ''
                }
                loading={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search for a patient..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif'
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box {...props} sx={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px'
                  }}>
                    <Box>
                      <Typography sx={{ fontWeight: '500' }}>
                        {option.firstName} {option.lastName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#5f6368', fontSize: '12px' }}>
                        {option.email || 'No email'} • {option.phone || 'No phone'}
                      </Typography>
                    </Box>
                  </Box>
                )}
                noOptionsText="No patients found"
                size="medium"
              />
            </Box>

            {/* Service/Package Selection */}
            <Box>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                fontWeight: '600', 
                color: '#5f6368',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }}>
                Services & Packages * {selectedServices.length > 0 && `(${selectedServices.length} selected)`}
              </Typography>
              <Autocomplete
                value={null}
                onChange={(event, newValue) => {
                  if (newValue) {
                    const existingService = selectedServices.find(service => service.id === newValue.id);
                    if (existingService) {
                      updateServiceQuantity(newValue.id, existingService.quantity + 1);
                    } else {
                      setSelectedServices(prev => [...prev, { ...newValue, quantity: 1 }]);
                    }
                    setServiceInputValue('');
                  }
                }}
                inputValue={serviceInputValue}
                onInputChange={(event, newInputValue) => setServiceInputValue(newInputValue)}
                options={services.filter(service => 
                  !service.status || service.status.toLowerCase() === 'active'
                )}
                getOptionLabel={(option) => option ? option.name : ''}
                loading={serviceLoading}
                filterOptions={(options, { inputValue }) => {
                  return options.filter(option => {
                    const matchesInput = option.name.toLowerCase().includes(inputValue.toLowerCase());
                    const isActive = !option.status || option.status.toLowerCase() === 'active';
                    return matchesInput && isActive;
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={selectedServices.length === 0 ? "Search for services or packages..." : "Add more..."}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {serviceLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif',
                        minHeight: '56px'
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box
                    {...props}
                    sx={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: '500' }}>
                          {option.name}
                        </Typography>
                        {option.source_type === 'package' && (
                          <Typography sx={{ fontSize: '16px' }}>📦</Typography>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#5f6368', fontSize: '12px' }}>
                        ₱{option.price} • {option.duration} minutes
                        {option.source_type === 'package' && ' • Package'}
                      </Typography>
                      
                      {/* Removed package contents display from dropdown */}
                      
                      {selectedServices.find(service => service.id === option.id) && (
                        <Typography variant="body2" sx={{ 
                          color: '#1a73e8', 
                          fontSize: '12px', 
                          fontWeight: '600',
                          mt: 0.5
                        }}>
                          Already selected (Qty: {selectedServices.find(service => service.id === option.id).quantity})
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}  
                noOptionsText="No active services or packages found"
                size="medium"
              />
              
              {/* Selected Services Summary */}
              {selectedServices.length > 0 && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2.5, 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '12px',
                  border: '1px solid #e8eaed'
                }}>
                  <Typography variant="body2" sx={{ 
                    fontWeight: '600', 
                    color: '#1a73e8',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    Selected Items ({selectedServices.length})
                  </Typography>
                  
                  {selectedServices.map((service) => (
  <Box key={service.id}>
    <Box 
      sx={{ 
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto',
        alignItems: 'center',
        gap: 2,
        mb: 1.5,
        p: 1.5,
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #f1f3f4'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ 
          fontSize: '14px', 
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          color: '#202124'
        }}>
          {service.name}
        </Typography>
        {service.source_type === 'package' && (
          <Typography sx={{ fontSize: '14px' }}>📦</Typography>
        )}
      </Box>
      
      {/* Quantity Controls */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '4px'
      }}>
        <IconButton
          size="small"
          onClick={() => updateServiceQuantity(service.id, service.quantity - 1)}
          sx={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            width: '24px',
            height: '24px',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          <Typography sx={{ fontSize: '14px', fontWeight: '600', color: '#5f6368' }}>-</Typography>
        </IconButton>
        
        <Typography sx={{ 
          fontSize: '14px', 
          fontFamily: 'Inter, sans-serif', 
          fontWeight: '600',
          minWidth: '24px',
          textAlign: 'center',
          color: '#202124'
        }}>
          {service.quantity}
        </Typography>
        
        <IconButton
          size="small"
          onClick={() => updateServiceQuantity(service.id, service.quantity + 1)}
          sx={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            width: '24px',
            height: '24px',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          <Typography sx={{ fontSize: '14px', fontWeight: '600', color: '#5f6368' }}>+</Typography>
        </IconButton>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 0.5,
        backgroundColor: '#e8f5e8',
        px: 1,
        py: 0.5,
        borderRadius: '6px'
      }}>
        <Typography sx={{ 
          fontSize: '12px', 
          fontFamily: 'Inter, sans-serif', 
          color: '#4caf50',
          fontWeight: '600'
        }}>
          ₱{(parseFloat(service.price) * service.quantity).toLocaleString()}
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 0.5,
        backgroundColor: '#e3f2fd',
        px: 1,
        py: 0.5,
        borderRadius: '6px'
      }}>
        <Typography sx={{ 
          fontSize: '12px', 
          fontFamily: 'Inter, sans-serif', 
          color: '#1565c0',
          fontWeight: '600'
        }}>
          {service.duration * service.quantity}min
        </Typography>
      </Box>
    </Box>
    
    {/* Show package contents in selected items */}
    {service.source_type === 'package' && service.includedServices && service.includedServices.length > 0 && (
      <Box sx={{ 
        ml: 3, 
        mb: 2, 
        pl: 2, 
        borderLeft: '3px solid #1a73e8',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        p: 1.5
      }}>
        <Typography variant="caption" sx={{ 
          color: '#1a73e8', 
          fontWeight: '600',
          fontSize: '12px',
          display: 'block',
          mb: 1
        }}>
          📦 Package includes:
        </Typography>
        {service.includedServices.map((includedService, idx) => (
          <Typography 
            key={idx} 
            variant="caption" 
            sx={{ 
              color: '#5f6368', 
              fontSize: '12px',
              display: 'block',
              ml: 1,
              mb: 0.5
            }}
          >
            • {includedService.name} {includedService.quantity > 1 ? `(x${includedService.quantity})` : ''}
            <Typography component="span" sx={{ color: '#4caf50', ml: 1, fontSize: '11px' }}>
              ₱{includedService.price}
            </Typography>
          </Typography>
        ))}
      </Box>
    )}
  </Box>
))}
    
                  
                  {/* Total Summary */}
                  <Box sx={{ 
                    borderTop: '2px solid #e8eaed', 
                    pt: 2, 
                    mt: 2, 
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    alignItems: 'center',
                    gap: 2,
                    backgroundColor: '#f1f3f4',
                    p: 2,
                    borderRadius: '8px'
                  }}>
                    <Typography sx={{ 
                      fontSize: '16px', 
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: '700',
                      color: '#202124'
                    }}>
                      Total Summary
                    </Typography>
                    
                    <Typography sx={{ 
                      fontSize: '14px', 
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: '600',
                      color: '#5f6368',
                      textAlign: 'center'
                    }}>
                      {selectedServices.reduce((total, service) => total + service.quantity, 0)} items
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      backgroundColor: '#4caf50',
                      px: 2,
                      py: 1,
                      borderRadius: '8px'
                    }}>
                      <Typography sx={{ 
                        fontSize: '14px', 
                        fontFamily: 'Inter, sans-serif',
                        color: 'white',
                        fontWeight: '700'
                      }}>
                        ₱{selectedServices.reduce((total, service) => total + (parseFloat(service.price) * service.quantity || 0), 0).toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      backgroundColor: '#1565c0',
                      px: 2,
                      py: 1,
                      borderRadius: '8px'
                    }}>
                      <Typography sx={{ 
                        fontSize: '14px', 
                        fontFamily: 'Inter, sans-serif',
                        color: 'white',
                        fontWeight: '700'
                      }}>
                        {selectedServices.reduce((total, service) => total + (parseInt(service.duration) * service.quantity || 0), 0)}min
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Date and Time Selection */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ 
                  mb: 1, 
                  fontWeight: '600', 
                  color: '#5f6368',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px'
                }}>
                  Date *
                </Typography>
                <TextField
                  value={appointmentDate ? (() => {
                    const [yyyy, mm, dd] = appointmentDate.split('-');
                    return `${mm}-${dd}-${yyyy}`;
                  })() : ''}
                  onClick={(e) => setDateCalendarAnchor(e.currentTarget)}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={(e) => setDateCalendarAnchor(e.currentTarget)} edge="end">
                          <CalendarToday sx={{ fontSize: 18 }} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer'
                    }
                  }}
                />
                <Popover
                  open={Boolean(dateCalendarAnchor)}
                  anchorEl={dateCalendarAnchor}
                  onClose={() => setDateCalendarAnchor(null)}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  <DateCalendar
                    currentDate={appointmentDate ? new Date(appointmentDate) : new Date()}
                    onDateSelect={(date) => {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setAppointmentDate(`${year}-${month}-${day}`);
                      setDateCalendarAnchor(null);
                    }}
                    minDate={new Date()}
                  />
                </Popover>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ 
                  mb: 1, 
                  fontWeight: '600', 
                  color: '#5f6368',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px'
                }}>
                  Start Time *
                </Typography>
                <TextField
                  type="time"
                  value={timeStart}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    if (!newTime || isValidBusinessTime(newTime)) {
                      setTimeStart(newTime);
                    } else {
                      setSnackbar({
                        open: true,
                        message: 'Please select a time between 8:00 AM and 5:00 PM',
                        severity: 'error'
                      });
                    }
                  }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: "08:00",
                    max: "17:00",
                    step: "900"
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ 
                  mb: 1, 
                  fontWeight: '600', 
                  color: '#5f6368',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px'
                }}>
                  End Time *
                </Typography>
                <TextField
                  type="time"
                  value={timeEnd}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    const [hours] = newTime.split(':').map(Number);
                    if (hours <= 17) {
                      setTimeEnd(newTime);
                    } else {
                      setSnackbar({
                        open: true,
                        message: 'End time cannot be after 5:00 PM',
                        severity: 'error'
                      });
                    }
                  }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: "08:00",
                    max: "17:00",
                    step: "900"
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif',
                      backgroundColor: selectedServices.length > 0 && timeStart ? '#f8f9fa' : 'white'
                    }
                  }}
                />
                {selectedServices.length > 0 && timeStart && (
                  <Typography variant="caption" sx={{ 
                    color: '#1a73e8', 
                    fontSize: '12px',
                    fontStyle: 'italic',
                    mt: 0.5,
                    display: 'block'
                  }}>
                    Auto-calculated based on {selectedServices.reduce((total, service) => total + (parseInt(service.duration) * service.quantity || 0), 0)} minutes total duration
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Comments */}
            <Box>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                fontWeight: '600', 
                color: '#5f6368',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }}>
                Comments
              </Typography>
              <TextField
                multiline
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any additional notes..."
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif'
                  }
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleClose}
            sx={{ 
              color: '#5f6368',
              fontFamily: 'Inter, sans-serif',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            sx={{
              backgroundColor: '#1a73e8',
              fontFamily: 'Inter, sans-serif',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '8px',
              px: 3,
              '&:hover': {
                backgroundColor: '#1557b0'
              }
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Create Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Discard Confirmation Dialog */}
      <Dialog
        open={showDiscardConfirm}
        onClose={handleDiscardCancel}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            padding: '8px'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Discard changes?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            color: '#5f6368'
          }}>
            You have unsaved changes. Are you sure you want to discard them?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDiscardCancel}
            sx={{ 
              color: '#5f6368',
              fontFamily: 'Inter, sans-serif',
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDiscardConfirm}
            color="error"
            sx={{ 
              fontFamily: 'Inter, sans-serif',
              textTransform: 'none'
            }}
          >
            Discard
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default AddAppointmentDialog;