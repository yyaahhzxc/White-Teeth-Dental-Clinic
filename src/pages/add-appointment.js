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
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { API_BASE } from '../apiConfig';

// Add this utility function at the top of the file
const normalizeDateForStorage = (dateString) => {
  // Always return the string as-is (assume it's already YYYY-MM-DD)
  return dateString || '';
};

function AddAppointmentDialog({ open, onClose, onAddPatient }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Service states
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceInputValue, setServiceInputValue] = useState('');

  // Appointment time states
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');

  // Comments state
  const [comments, setComments] = useState('');

  // Add discard confirmation state
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Helper function to add minutes to time string
  const addMinutesToTime = (timeString, minutes) => {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  };

  const isValidBusinessTime = (timeString) => {
    if (!timeString) return false;
    const [hours] = timeString.split(':').map(Number);
    return hours >= 8 && hours < 17; // 8am to 5pm (17 is 5pm in 24hr format)
  };
  
  // Helper function to validate appointment end time doesn't exceed business hours
  const validateAppointmentTime = (startTime, duration) => {
    if (!startTime || !duration) return true;
    
    const endTime = addMinutesToTime(startTime, duration);
    const [endHours] = endTime.split(':').map(Number);
    
    return endHours <= 17; // End time should not exceed 5pm
  };


  // Fetch patients
  useEffect(() => {
    if (open) {
      fetchPatients();
      fetchServices();
    }
  }, [open]);

  // When service or timeStart changes, adjust timeEnd and appointmentDate
  useEffect(() => {
  if (
    selectedService &&
    typeof selectedService.duration === 'number' &&
    timeStart &&
    appointmentDate
  ) {
    // Validate start time is within business hours
    if (!isValidBusinessTime(timeStart)) {
      setSnackbar({
        open: true,
        message: 'Start time must be between 8:00 AM and 5:00 PM',
        severity: 'error'
      });
      setTimeStart('');
      return;
    }

    // Validate that appointment doesn't go beyond business hours
    if (!validateAppointmentTime(timeStart, selectedService.duration)) {
      setSnackbar({
        open: true,
        message: `Appointment would end after 5:00 PM. Please select an earlier time or choose a shorter service.`,
        severity: 'warning'
      });
      setTimeStart('');
      return;
    }

    // duration is in minutes
    const newTimeEnd = addMinutesToTime(timeStart, selectedService.duration);
    setTimeEnd(newTimeEnd);
          
    // If the end time is past midnight, increment the date
    const [startHour, startMin] = timeStart.split(':').map(Number);
    const [endHour, endMin] = newTimeEnd.split(':').map(Number);
    if (endHour < startHour || (endHour === startHour && endMin < startMin)) {
      // Add one day to appointmentDate using local timezone
      const dateObj = new Date(appointmentDate + 'T00:00:00');
      dateObj.setDate(dateObj.getDate() + 1);
      setAppointmentDate(dateObj.toISOString().split('T')[0]);
    }
  }
  // eslint-disable-next-line
}, [selectedService, timeStart]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/patients`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        console.error('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    setServiceLoading(true);
    try {
      const response = await fetch(`${API_BASE}/service-table`);
      if (response.ok) {
        const data = await response.json();
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

  // Validation function
  const validateForm = () => {
    if (!selectedPatient) {
      setSnackbar({
        open: true,
        message: 'Please select a patient',
        severity: 'error'
      });
      return false;
    }
    if (!selectedService) {
      setSnackbar({
        open: true,
        message: 'Please select a service',
        severity: 'error'
      });
      return false;
    }
    if (!appointmentDate) {
      setSnackbar({
        open: true,
        message: 'Please select an appointment date',
        severity: 'error'
      });
      return false;
    }
    if (!timeStart) {
      setSnackbar({
        open: true,
        message: 'Please select a start time',
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
    if (!timeEnd) {
      setSnackbar({
        open: true,
        message: 'Please select an end time',
        severity: 'error'
      });
      return false;
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

  // Replace your handleSubmit function
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const appointmentData = {
        patientId: selectedPatient.id,
        serviceId: selectedService.id,
        appointmentDate: normalizeDateForStorage(appointmentDate), // Fix here
        timeStart,
        timeEnd,
        comments: comments || '',
        status: 'Scheduled'
      };

      const response = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();
            
      if (response.ok) {

          // ADD THIS: Dispatch event to trigger refresh in Appointments.js
      window.dispatchEvent(new CustomEvent('appointmentAdded'));
        setSnackbar({ 
          open: true, 
          message: 'Appointment created successfully!', 
          severity: 'success' 
        });
                
        // Clear form
        setSelectedPatient(null);
        setSelectedService(null);
        setAppointmentDate('');
        setTimeStart('');
        setTimeEnd('');
        setComments('');
        setInputValue('');
        setServiceInputValue('');
                
        // Close dialog after a short delay
        setTimeout(() => {
          onClose();
          setSnackbar({ open: false, message: '', severity: 'success' });
        }, 1500);
                
      } else {
        setSnackbar({ 
          open: true, 
          message: result.error || 'Failed to create appointment', 
          severity: 'error' 
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      setSnackbar({ 
        open: true, 
        message: 'Network error. Please try again.', 
        severity: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Check if form has data to show discard confirmation
  const hasFormData = () => {
    return selectedPatient || selectedService || appointmentDate || timeStart || timeEnd || comments;
  };

  const handleClose = () => {
    if (hasFormData()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleDiscardConfirm = () => {
    // Clear all form data
    setSelectedPatient(null);
    setSelectedService(null);
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
                onChange={(event, newValue) => {
                  setSelectedPatient(newValue);
                }}
                inputValue={inputValue}
                onInputChange={(event, newInputValue) => {
                  setInputValue(newInputValue);
                }}
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

            {/* Service Selection */}
            <Box>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                fontWeight: '600', 
                color: '#5f6368',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }}>
                Service *
              </Typography>
              <Autocomplete
                value={selectedService}
                onChange={(event, newValue) => {
                  // Prevent selecting inactive service via keyboard
                  if (newValue && typeof newValue.status === 'string' && newValue.status.toLowerCase() !== 'active') {
                    return;
                  }
                  setSelectedService(newValue);
                }}
                inputValue={serviceInputValue}
                onInputChange={(event, newInputValue) => {
                  setServiceInputValue(newInputValue);
                }}
                options={services}
                getOptionLabel={(option) => option ? option.name : ''}
                loading={serviceLoading}
                isOptionDisabled={(option) =>
                  option && typeof option.status === 'string' && option.status.toLowerCase() !== 'active'
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search for a service..."
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
                        fontFamily: 'Inter, sans-serif'
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const isInactive = option && typeof option.status === 'string' && option.status.toLowerCase() !== 'active';
                  return (
                    <Box
                      {...props}
                      sx={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: isInactive ? '#aaa' : 'inherit',
                        backgroundColor: isInactive ? '#f5f5f5' : 'inherit',
                        cursor: isInactive ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: '500' }}>
                          {option.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#5f6368', fontSize: '12px' }}>
                          ₱{option.price} • {option.duration} minutes
                          {isInactive && (
                            <span style={{ marginLeft: 8, fontSize: 12, color: '#c00' }}>
                              (Inactive)
                            </span>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                noOptionsText="No services found"
                size="medium"
              />
            </Box>

            {/* Date and Time Row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              {/* Date */}
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
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }
                  }}
                />
              </Box>

              {/* Start Time */}
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
    step: "900" // 15-minute intervals (900 seconds)
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      fontFamily: 'Inter, sans-serif'
    }
  }}
/>
              </Box>

              {/* End Time */}
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
    step: "900" // 15-minute intervals
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      fontFamily: 'Inter, sans-serif'
    }
  }}
/>
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

      {/* Snackbar for notifications */}
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