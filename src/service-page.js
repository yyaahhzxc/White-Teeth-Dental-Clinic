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
  Button,
  Fab,
  Zoom,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddService from './add-service';
import AddPatientRecord from './add-record';
import ViewService from './view-service';
import QuickActionButton from './QuickActionButton';
import Header from './header';

function ServiceList() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [search, setSearch] = useState('');
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Fetch services from backend (replace with your actual endpoint)
  useEffect(() => {
  fetch(`${API_BASE}/service-table`)
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

  // Sorting logic
  const sortedServices = React.useMemo(() => {
    let sortable = [...filteredServices];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        switch (sortConfig.key) {
          case 'name':
            if (a.name < b.name) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a.name > b.name) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          case 'price':
            return sortConfig.direction === 'asc'
              ? a.price - b.price
              : b.price - a.price;
          case 'duration':
            return sortConfig.direction === 'asc'
              ? a.duration - b.duration
              : b.duration - a.duration;
          case 'type':
            // Single Treatment first, then Package Treatment
            if (a.type === b.type) return 0;
            if (sortConfig.direction === 'asc') {
              return a.type === 'Single Treatment' ? -1 : 1;
            } else {
              return a.type === 'Package Treatment' ? -1 : 1;
            }
          case 'status':
            // Active first, then Inactive
            if (a.status === b.status) return 0;
            if (sortConfig.direction === 'asc') {
              return a.status === 'Active' ? -1 : 1;
            } else {
              return a.status === 'Inactive' ? -1 : 1;
            }
          default:
            return 0;
        }
      });
    }
    return sortable;
  }, [filteredServices, sortConfig]);

  // Header click handler
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleAddService = () => {
    // After adding, fetch the updated list
  fetch(`${API_BASE}/service-table`)
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setFilteredServices(data);
      });
    setServiceDialogOpen(false);
  };

  const [showPatientModal, setShowPatientModal] = useState(false);

  // View dialog handler
  const handleEditService = (service) => {
    setSelectedService(service);
    setViewDialogOpen(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', backgroundImage: 'url("/White-Teeth-BG.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <Header />
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
            <Table
              stickyHeader
              sx={{
                tableLayout: 'fixed',
                minWidth: 900,
                '& td, & th': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      width: 160,
                      cursor: 'pointer',
                      backgroundColor: sortConfig.key === 'name' ? '#e0e0e0' : 'inherit',
                      borderRadius: 2
                    }}
                    onClick={() => handleSort('name')}
                  >
                    <b>Name</b>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 220,
                      cursor: 'pointer',
                      backgroundColor: sortConfig.key === 'description' ? '#e0e0e0' : 'inherit',
                      borderRadius: 2
                    }}
                    onClick={() => handleSort('description')}
                  >
                    <b>Description</b>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 100,
                      cursor: 'pointer',
                      backgroundColor: sortConfig.key === 'price' ? '#e0e0e0' : 'inherit',
                      borderRadius: 2
                    }}
                    onClick={() => handleSort('price')}
                  >
                    <b>Price</b>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 120,
                      cursor: 'pointer',
                      backgroundColor: sortConfig.key === 'duration' ? '#e0e0e0' : 'inherit',
                      borderRadius: 2
                    }}
                    onClick={() => handleSort('duration')}
                  >
                    <b>Duration</b>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 160,
                      cursor: 'pointer',
                      backgroundColor: sortConfig.key === 'type' ? '#e0e0e0' : 'inherit',
                      borderRadius: 2
                    }}
                    onClick={() => handleSort('type')}
                  >
                    <b>Type</b>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 100,
                      cursor: 'pointer',
                      backgroundColor: sortConfig.key === 'status' ? '#e0e0e0' : 'inherit',
                      borderRadius: 2
                    }}
                    onClick={() => handleSort('status')}
                  >
                    <b>Status</b>
                  </TableCell>
                  <TableCell align="center" sx={{ width: 80 }}><b>View</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedServices.length ? (
                  sortedServices.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{service.description}</TableCell>
                      <TableCell>{service.price}</TableCell>
                      <TableCell>{service.duration}</TableCell>
                      <TableCell>{service.type}</TableCell>
                      <TableCell
                        sx={{
                          color: service.status === 'Active' ? 'green' : 'red',
                          fontWeight: 'bold',
                          borderRadius: 2
                        }}
                      >
                        {service.status}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleEditService(service)}>
                          <VisibilityIcon fontSize="small" />
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

  <QuickActionButton onAddPatientRecord={() => setShowPatientModal(true)} onAddAppointment={() => {/* navigate if needed */}} />

      {/* Patient Modal */}
      <AddPatientRecord open={showPatientModal} onClose={() => setShowPatientModal(false)} />
      <AddService
        open={serviceDialogOpen}
        onClose={() => setServiceDialogOpen(false)}
        handleAddService={handleAddService}
      />
      <ViewService
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        service={selectedService}
        onServiceUpdated={handleAddService} // This will refresh the list after edit
      />
    </Box>
  );
}

export default ServiceList;
