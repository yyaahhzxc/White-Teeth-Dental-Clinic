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
  Fab,
  Zoom,
  Button
} from '@mui/material';
import { Search, FilterList, Download } from '@mui/icons-material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useNavigate } from 'react-router-dom';
import Header from './header';

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  // Floating button states
  const [showActions, setShowActions] = useState(false);
  const [showFirst, setShowFirst] = useState(false);
  const [showSecond, setShowSecond] = useState(false);

  const navigate = useNavigate();

  // Fetch patients from backend
  useEffect(() => {
    fetch('http://localhost:3001/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        setFilteredPatients(data);
      })
      .catch(err => console.error('Error fetching patients:', err));
  }, []);

  // Filter patients by name
  useEffect(() => {
    const result = patients.filter(patient =>
      (patient.name || '').toLowerCase().includes(search.toLowerCase())
    );
    setFilteredPatients(result);
    // reset page if filter reduces total pages
    setPage(0);
  }, [search, patients]);

  const handleExport = () => {
    console.log('Export patients data');
    // Implement CSV or Excel export logic here
  };

  // Floating button logic
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

  const handleAddPatientList = () => {
    alert('Add Patient List clicked!');
  };

  const handleAddAppointment = () => {
    alert('Add Appointment clicked!');
  };

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / rowsPerPage));

  // Keep current page within range if filtered list shrinks
  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, page]);

  // Create page items with ellipsis logic
  const getPageItems = (current, total) => {
    const pages = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    // total > 7
    pages.push(1);

    if (current <= 4) {
      // show 2..5
      for (let i = 2; i <= 5; i++) pages.push(i);
      pages.push('ellipsis');
      pages.push(total);
      return pages;
    }

    if (current >= total - 3) {
      pages.push('ellipsis');
      for (let i = total - 4; i <= total; i++) pages.push(i);
      return pages;
    }

    // middle: show ... (cur-1, cur, cur+1) ...
    pages.push('ellipsis');
    pages.push(current); // will show as actual number in rendering as 1-based
    pages.push('ellipsis');
    pages.push(total);
    // But we actually want to show current-1, current, current+1 for nicer UX:
    // Let's return a more useful layout:
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
  };

  const pageItems = getPageItems(page + 1, totalPages); // page is zero-based, helper uses 1-based

  // rows to display on current page
  const visibleRows = filteredPatients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', backgroundImage: 'url("/White-Teeth-BG.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ flexGrow: 1 }}>
              Patient Records
            </Typography>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search by name"
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
            <Tooltip title="Export">
              <IconButton onClick={handleExport}>
                <Download />
              </IconButton>
            </Tooltip>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>NAME</b></TableCell>
                  <TableCell><b>SEX</b></TableCell>
                  <TableCell><b>AGE</b></TableCell>
                  <TableCell><b>CONTACT</b></TableCell>
                  <TableCell><b>DATE CREATED</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.length ? (
                  visibleRows.map((patient, index) => (
                    <TableRow key={index}>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell>{patient.sex}</TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell>{patient.contact}</TableCell>
                      <TableCell>{patient.dateCreated}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No patients found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Custom Pagination at bottom-left */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mt: 2 }}>
            <Button
              size="small"
              startIcon={<KeyboardArrowLeftIcon />}
              disabled={page === 0}
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              sx={{ textTransform: 'none', mr: 1 }}
            >
              Previous
            </Button>

            {pageItems.map((item, idx) => {
              if (item === 'ellipsis') {
                return (
                  <Typography key={`e-${idx}`} sx={{ mx: 0.5, color: 'text.secondary' }}>
                    ...
                  </Typography>
                );
              }

              const pageNumber = Number(item);
              const zeroBased = pageNumber - 1;
              const isActive = zeroBased === page;

              return (
                <Button
                  key={pageNumber}
                  size="small"
                  variant={isActive ? 'contained' : 'outlined'}
                  onClick={() => setPage(zeroBased)}
                  sx={{
                    minWidth: 36,
                    mx: 0.5,
                    py: 0.5,
                    px: 1,
                    backgroundColor: isActive ? '#1746A2' : 'transparent',
                    color: isActive ? 'white' : 'inherit',
                    borderColor: '#ddd',
                    '&:hover': {
                      backgroundColor: isActive ? '#1746A2' : '#f4f4f4',
                    },
                    textTransform: 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  {pageNumber}
                </Button>
              );
            })}

            <Button
              size="small"
              endIcon={<KeyboardArrowRightIcon />}
              disabled={page >= totalPages - 1}
              onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
              sx={{ textTransform: 'none', ml: 1 }}
            >
              Next
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Floating Buttons */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          zIndex: 1300,
        }}
      >
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
                textAlign: 'right',
                fontSize: '1.15rem',
              }}
            >
              Add Patient List
            </Typography>
            <Fab
              size="large"
              color="primary"
              sx={{ zIndex: 1, width: 64, height: 64 }}
              onClick={handleAddPatientList}
            >
              <PersonAddIcon sx={{ fontSize: 36 }} />
            </Fab>
          </Box>
        </Zoom>

        <Fab
          color="default"
          onClick={toggleActions}
          sx={{
            transition: 'transform 0.2s ease-in-out',
            transform: showActions ? 'rotate(45deg)' : 'rotate(0deg)',
            width: 72,
            height: 72,
            bgcolor: '#888',
            color: 'white',
            '&:hover': { bgcolor: '#666' },
          }}
        >
          <AddIcon sx={{ fontSize: 40 }} />
        </Fab>
      </Box>
    </Box>
  );
}

export default PatientList;
