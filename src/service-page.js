import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Button,
  Fab,
  Zoom,
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import Header from './header';
import AddService from './add-service';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddPatientRecord from './add-record'; // If you want to show the modal

function ServiceList() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [search, setSearch] = useState('');
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

  // Fetch services from backend (replace with your actual endpoint)
  useEffect(() => {
    fetch('http://localhost:3001/service-table')
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setFilteredServices(data);
      })
      .catch(err => console.error('Error fetching services:', err));
  }, []);

  // Filter services by name
  useEffect(() => {
    const result = services.filter(service =>
      (service.name || '').toLowerCase().includes(search.toLowerCase())
    );
    setFilteredServices(result);
  }, [search, services]);

  const handleExport = () => {
    console.log('Export services data');
    // Implement CSV or Excel export logic here
  };

  // Add new service (simulate backend add)
  const handleAddService = (newService) => {
    // After adding, fetch the updated list
    fetch('http://localhost:3001/service-table')
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setFilteredServices(data);
      });
    setServiceDialogOpen(false);
  };

  // Delete service
  const handleDeleteService = (index) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  // Edit service (for demo, just alert)
  const handleEditService = (service) => {
    alert(`Edit service: ${service.name}`);
  };

  // Floating button logic
  const [showActions, setShowActions] = useState(false);
  const [showFirst, setShowFirst] = useState(false);
  const [showSecond, setShowSecond] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);

  const toggleActions = () => {
    if (!showActions) {
      setShowActions(true);
      setTimeout(() => setShowSecond(true), 15);
      setTimeout(() => setShowFirst(true), 75);
    } else {
      setShowFirst(false);
      setTimeout(() => setShowSecond(false), 15);
      setTimeout(() => setShowActions(false), 75);
    }
  };

  const handleAddPatientRecord = () => {
    setShowActions(false);
    setShowFirst(false);
    setShowSecond(false);
    setShowPatientModal(true);
  };

  const handleAddAppointment = () => {
    setShowActions(false);
    setShowFirst(false);
    setShowSecond(false);
    // navigate to appointment page or show modal
  };

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', backgroundImage: 'url("/White-Teeth-BG.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ flexGrow: 1 }}>
              Service List
            </Typography>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search by service name"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ mr: 2, width: 240 }}
              InputProps={{
                startAdornment: (
                  <IconButton>
                    <Search />
                  </IconButton>
                ),
              }}
            />
            <Tooltip title="Filter">
              <IconButton>
                <FilterList />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ ml: 2, backgroundColor: '#2148C0', color: '#fff', borderRadius: 2, fontWeight: 'bold' }}
              onClick={() => setServiceDialogOpen(true)}
            >
              Add Service
            </Button>
          </Box>

          <TableContainer sx={{ maxHeight: 680, overflowY: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><b>Name</b></TableCell>
                  <TableCell><b>Description</b></TableCell>
                  <TableCell><b>Price</b></TableCell>
                  <TableCell><b>Duration</b></TableCell>
                  <TableCell><b>Type</b></TableCell>
                  <TableCell><b>Status</b></TableCell>
                  <TableCell align="center"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredServices.length ? (
                  filteredServices.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{service.description}</TableCell>
                      <TableCell>{service.price}</TableCell>
                      <TableCell>{service.duration}</TableCell>
                      <TableCell>{service.type}</TableCell>
                      <TableCell
                        sx={{
                          color: service.status === 'Active' ? 'green' : 'red',
                          fontWeight: 'bold'
                        }}
                      >
                        {service.status}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleEditService(service)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No services found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Floating Plus Button */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, zIndex: 1300 }}>
        <Zoom in={showFirst} timeout={{ enter: 150, exit: 150 }}>
          <Box display="flex" alignItems="center" mb={1} sx={{ position: 'relative' }}>
            <Typography
              variant="body2"
              sx={{
                position: 'absolute',
                right: '100%',
                mr: 2,
                bgcolor: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                boxShadow: 1,
                fontWeight: 500,
                color: '#1746A2',
                minWidth: 120,
                whiteSpace: 'nowrap',
                textAlign: 'center',
                fontSize: '1.15rem',
              }}
            >
              Add Appointment
            </Typography>
            <Fab
              size="large"
              color="primary"
              sx={{ zIndex: 1, width: 64, height: 64 }}
              onClick={handleAddAppointment}
            >
              <EventAvailableIcon sx={{ fontSize: 36 }} />
            </Fab>
          </Box>
        </Zoom>

        <Zoom in={showSecond} timeout={{ enter: 150, exit: 150 }}>
          <Box display="flex" alignItems="center" mb={1} sx={{ position: 'relative' }}>
            <Typography variant="body2" sx={{ position: 'absolute', right: '100%', mr: 2, bgcolor: 'white', px: 1.5, py: 0.5, borderRadius: 1.5, boxShadow: 1, fontWeight: 500, color: '#1746A2', minWidth: 120, whiteSpace: 'nowrap', textAlign: 'right', fontSize: '1.15rem' }}>Add Patient Record</Typography>
            <Fab size="large" color="primary" sx={{ zIndex: 1, width: 64, height: 64 }} onClick={handleAddPatientRecord}>
              <PersonAddIcon sx={{ fontSize: 36 }} />
            </Fab>
          </Box>
        </Zoom>

        <Fab color="primary" onClick={toggleActions} sx={{ transition: 'transform 0.2s ease-in-out', transform: showActions ? 'rotate(45deg)' : 'rotate(0deg)', width: 72, height: 72 }}>
          <AddIcon sx={{ fontSize: 40 }} />
        </Fab>
      </Box>
      
      {/* Patient Modal */}
      <AddPatientRecord open={showPatientModal} onClose={() => setShowPatientModal(false)} />
      <AddService
        open={serviceDialogOpen}
        onClose={() => setServiceDialogOpen(false)}
        handleAddService={handleAddService}
      />
    </Box>
  );
}

export default ServiceList;
