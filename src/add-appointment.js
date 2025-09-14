import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Autocomplete, TextField, CircularProgress, Box, Typography, Grid
} from '@mui/material';
import { API_BASE } from './apiConfig';
import CloseIcon from '@mui/icons-material/Close';

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

    useEffect(() => {
        if (open) {
            setLoading(true);
            fetch(`${API_BASE}/patients`)
                .then(res => res.json())
                .then(data => {
                    setPatients(data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));

            setServiceLoading(true);
            fetch(`${API_BASE}/service-table`)
                .then(res => res.json())
                .then(data => {
                    setServices(data);
                    setServiceLoading(false);
                })
                .catch(() => setServiceLoading(false));
        }
    }, [open]);

    useEffect(() => {
        if (!open) {
            setSelectedPatient(null);
            setInputValue('');
            setSelectedService(null);
            setServiceInputValue('');
            setAppointmentDate('');
            setTimeStart('');
            setTimeEnd('');
            setComments('');
        }
    }, [open]);

    // Check if there are any matches for the current input
    const filteredOptions = patients.filter(option =>
        (option.firstName && option.lastName
            ? `${option.firstName} ${option.lastName}`
            : option.name || ''
        ).toLowerCase().includes(inputValue.toLowerCase())
    );

    const filteredServiceOptions = services.filter(option =>
        (option.name || '')
            .toLowerCase()
            .includes(serviceInputValue.toLowerCase())
    );

    // Add this helper at the top of your file (outside the component)
    function addMinutesToTime(time, minutes) {
        const [h, m] = time.split(':').map(Number);
        const date = new Date(0, 0, 0, h, m + minutes, 0, 0);
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    }

    // When service or timeStart changes, adjust timeEnd and appointmentDate
    useEffect(() => {
        if (
            selectedService &&
            typeof selectedService.duration === 'number' &&
            timeStart &&
            appointmentDate
        ) {
            // duration is in minutes
            const newTimeEnd = addMinutesToTime(timeStart, selectedService.duration);
            setTimeEnd(newTimeEnd);

            // If the end time is past midnight, increment the date
            const [startHour, startMin] = timeStart.split(':').map(Number);
            const [endHour, endMin] = newTimeEnd.split(':').map(Number);
            if (endHour < startHour || (endHour === startHour && endMin < startMin)) {
                // Add one day to appointmentDate
                const dateObj = new Date(appointmentDate);
                dateObj.setDate(dateObj.getDate() + 1);
                setAppointmentDate(dateObj.toISOString().slice(0, 10));
            }
        }
        // eslint-disable-next-line
    }, [selectedService, timeStart]);

    // Helper to check if any input is filled
    const hasInput = () =>
        selectedPatient ||
        selectedService ||
        appointmentDate ||
        timeStart ||
        timeEnd ||
        comments;

    // Handler for close (X or Cancel)
    const handleRequestClose = () => {
        if (hasInput()) {
            setShowDiscardConfirm(true);
        } else {
            onClose();
        }
    };

    // Handler for confirming discard
    const handleDiscard = () => {
        setShowDiscardConfirm(false);
        onClose();
    };

    // Handler for staying (cancel discard)
    const handleStay = () => {
        setShowDiscardConfirm(false);
    };

    return (
        <>
            <Dialog open={open} onClose={handleRequestClose} maxWidth="sm" fullWidth>
                <DialogTitle
                    sx={{
                        alignSelf: 'center',
                        color: '#2148C0',
                        fontWeight: 800,
                        fontSize: '39.14px',
                        fontFamily: 'Inter, sans-serif',
                        pr: 5
                    }}
                >
                    Add Appointment
                    <Button
                        onClick={handleRequestClose}
                        sx={{
                            position: 'absolute',
                            right: 16,
                            top: 16,
                            minWidth: 0,
                            padding: 0,
                            color: '#888'
                        }}
                    >
                        <CloseIcon />
                    </Button>
                </DialogTitle>
                <DialogContent>
                    {/* Patient Dropdown */}
                    <Autocomplete
                        options={patients}
                        getOptionLabel={(option) =>
                            option.firstName && option.lastName
                                ? `${option.firstName} ${option.lastName}`
                                : option.name || ''
                        }
                        loading={loading}
                        value={selectedPatient}
                        onChange={(_, value) => setSelectedPatient(value)}
                        inputValue={inputValue}
                        onInputChange={(_, value) => setInputValue(value)}
                        noOptionsText={
                            <Box>
                                <Typography color="text.secondary" sx={{ mb: 1 }}>
                                    Patient not found.
                                </Typography>
                                <Button
                                    color="primary"
                                    size="small"
                                    onClick={() => {
                                        onClose();
                                        if (onAddPatient) onAddPatient();
                                    }}
                                >
                                    Create a new patient record
                                </Button>
                            </Box>
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Select Patient"
                                variant="outlined"
                                margin="normal"
                                fullWidth
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />

                    {/* Service Dropdown */}
                    <Autocomplete
                        options={Array.isArray(services) ? services : []}
                        getOptionLabel={(option) =>
                            option && typeof option === 'object' && typeof option.name === 'string'
                                ? option.name
                                : ''
                        }
                        loading={serviceLoading}
                        value={selectedService}
                        onChange={(_, value) => setSelectedService(value)}
                        inputValue={serviceInputValue}
                        onInputChange={(_, value) => setServiceInputValue(value)}
                        isOptionDisabled={(option) => {
                            if (!option || typeof option !== 'object') return false;
                            if (!option.status || typeof option.status !== 'string') return false;
                            return option.status.toLowerCase() !== 'active';
                        }}
                        noOptionsText={
                            <Typography color="text.secondary">
                                Service not found.
                            </Typography>
                        }
                        renderOption={(props, option) => {
                            if (!option || typeof option !== 'object') {
                                return <li {...props}>Invalid service</li>;
                            }

                            const isInactive =
                                typeof option.status === 'string' &&
                                option.status.toLowerCase() !== 'active';

                            return (
                                <li
                                    {...props}
                                    style={{
                                        ...props.style,
                                        color: isInactive ? '#aaa' : 'inherit',
                                        background: isInactive ? '#f5f5f5' : props.style.background,
                                    }}
                                >
                                    {option.name || ''}
                                    {isInactive && (
                                        <span style={{ marginLeft: 8, fontSize: 12, color: '#c00' }}>
                                            (Inactive)
                                        </span>
                                    )}
                                </li>
                            );
                        }}

                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Select Service"
                                variant="outlined"
                                margin="normal"
                                fullWidth
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {serviceLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />

                    {/* Appointment Date and Time Fields */}
                    <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Date"
                                type="date"
                                sx={{ mr: 11.4 }}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={appointmentDate || ''}
                                onChange={e => setAppointmentDate(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Time Start"
                                type="time"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={timeStart || ''}
                                onChange={e => setTimeStart(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Time End"
                                type="time"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={timeEnd || ''}
                                onChange={e => setTimeEnd(e.target.value)}
                            />
                        </Grid>
                    </Grid>

                    {/* Comments Field */}
                    <TextField
                        label="Comments"
                        multiline
                        rows={4}
                        fullWidth
                        margin="normal"
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                    />

                    {/* Add more appointment form fields here */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleRequestClose} color="primary">CANCEL</Button>
                    <Button onClick={onClose} variant="contained" color="primary">ADD</Button>
                </DialogActions>
            </Dialog>

            {/* Discard confirmation dialog */}
            <Dialog open={showDiscardConfirm} onClose={handleStay}>
                <DialogTitle>Discard changes?</DialogTitle>
                <DialogContent>
                    <Typography>
                        You have unsaved changes. Are you sure you want to discard them?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleStay} color="primary">
                        Stay
                    </Button>
                    <Button onClick={handleDiscard} color="error" variant="contained">
                        Discard
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default AddAppointmentDialog;