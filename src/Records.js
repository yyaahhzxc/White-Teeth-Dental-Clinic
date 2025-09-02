import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  Fab,
  Zoom,
  Tooltip,
  IconButton,
  MenuItem
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useNavigate } from 'react-router-dom'; // ⭐ 1. ENSURE THIS IMPORT EXISTS

import Header from './header';
import QuickActionButton from './QuickActionButton';
import ViewRecord from './view-record';
import AddPatientRecord from './add-record'; // ⭐ 1. IMPORT THE PATIENT MODAL

// API Base URL
const API_BASE = 'http://localhost:3001';

// Utility function to compute age
function computeAge(birthDate) {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  // Sort/filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Floating button state is handled by QuickActionButton
  const navigate = useNavigate();
  const [showPatientModal, setShowPatientModal] = useState(false);

  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medInfo, setMedInfo] = useState(null); // ⭐ MODIFIED


  // Fetch patients from backend
  useEffect(() => {
  fetch(`${API_BASE}/patients`)
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        setFilteredPatients(data);
      })
      .catch(err => console.error('Error fetching patients:', err));
  }, []);

  // Search filter
  useEffect(() => {
    let result = patients.filter(patient => {
      const fullName = [
        patient.lastName,
        patient.firstName,
        patient.middleName ? patient.middleName.charAt(0) + '.' : '',
        patient.suffix
      ].filter(Boolean).join(' ').toLowerCase();
      return fullName.includes(search.toLowerCase());
    });
    setFilteredPatients(result);
    setPage(0);
  }, [search, patients]);

  const handleAddPatientRecord = () => setShowPatientModal(true);
 
  // Sorting logic
  const sortedPatients = React.useMemo(() => {
    let sortable = [...filteredPatients];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        switch (sortConfig.key) {
          case 'name': {
            const nameA = [
              a.lastName,
              a.firstName,
              a.middleName ? a.middleName.charAt(0) + '.' : '',
              a.suffix
            ].filter(Boolean).join(' ').toLowerCase();
            const nameB = [
              b.lastName,
              b.firstName,
              b.middleName ? b.middleName.charAt(0) + '.' : '',
              b.suffix
            ].filter(Boolean).join(' ').toLowerCase();
            if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          }
          case 'age':
            return sortConfig.direction === 'asc'
              ? computeAge(a.dateOfBirth) - computeAge(b.dateOfBirth)
              : computeAge(b.dateOfBirth) - computeAge(a.dateOfBirth);
          case 'sex':
            if (a.sex < b.sex) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a.sex > b.sex) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          // Removed contactNumber and address sorting
          default:
            return 0;
        }
      });
    }
    return sortable;
  }, [filteredPatients, sortConfig]);

  // Pagination helpers
  const totalPages = Math.ceil(sortedPatients.length / rowsPerPage);

  function getPageItems(current, total) {
    const pages = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (current <= 4) {
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
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
  }

  const pageItems = getPageItems(page + 1, totalPages);

  // rows to display on current page
  const visibleRows = sortedPatients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Sorting handler
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // View handler
 // ⭐ MODIFIED: fetch med info too when viewing a patient
 const handleViewPatient = async (patient) => {
  setSelectedPatient(patient);

  try {
  const res = await fetch(`${API_BASE}/medical-information/${patient.id}`);
    const data = await res.json();
    setMedInfo(data || null);
  } catch (err) {
    console.error("Error fetching medical info:", err);
    setMedInfo(null);
  }

  setViewDialogOpen(true);
};


const handleAddAppointment = () => navigate('/add-appointment');
  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', backgroundImage: 'url("/White-Teeth-BG.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <Header />
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
              sx={{ mr: 2, width: 220 }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1 }} />
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFilterOpen(true)}
              sx={{ mr: 2 }}
            >
              Filter
            </Button>
            <Dialog open={filterOpen} onClose={() => setFilterOpen(false)}>
              <DialogTitle>Sort/Filter Columns</DialogTitle>
              <DialogContent>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button onClick={() => handleSort('name')}>Name</Button>
                  <Button onClick={() => handleSort('age')}>Age</Button>
                  <Button onClick={() => handleSort('sex')}>Sex</Button>
                  {/* Remove these:
                  <Button onClick={() => handleSort('contactNumber')}>Contact Number</Button>
                  <Button onClick={() => handleSort('address')}>Address</Button>
                  */}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setFilterOpen(false)}>Close</Button>
              </DialogActions>
            </Dialog>
          </Box>

          <TableContainer sx={{ maxHeight: 400, overflowY: 'auto' }}>
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
                      width: 200,
                      cursor: 'pointer',
                      backgroundColor: sortConfig.key === 'name' ? '#e0e0e0' : 'inherit',
                      borderRadius: 2
                    }}
                    onClick={() => handleSort('name')}
                  >
                    <b>Full Name</b>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 80,
                      cursor: 'pointer',
                      backgroundColor: sortConfig.key === 'age' ? '#e0e0e0' : 'inherit',
                      borderRadius: 2
                    }}
                    onClick={() => handleSort('age')}
                  >
                    <b>Age</b>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 80,
                      cursor: 'pointer',
                      backgroundColor: sortConfig.key === 'sex' ? '#e0e0e0' : 'inherit',
                      borderRadius: 2
                    }}
                    onClick={() => handleSort('sex')}
                  >
                    <b>Sex</b>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 140,
                      // cursor: 'pointer',
                      backgroundColor: sortConfig.key === 'contactNumber' ? '#e0e0e0' : 'inherit',
                      borderRadius: 2
                    }}
                  >
                    <b>Contact Number</b>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 220,
                      // cursor: 'pointer',
                      backgroundColor: sortConfig.key === 'address' ? '#e0e0e0' : 'inherit',
                      borderRadius: 2
                    }}
                  >
                    <b>Address</b>
                  </TableCell>
                  <TableCell align="center" sx={{ width: 80 }}><b>View</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.length ? (
                  visibleRows.map((patient, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {`${patient.lastName || ''}, ${patient.firstName || ''}${patient.middleName ? ' ' + patient.middleName.charAt(0) + '.' : ''}${patient.suffix ? ' ' + patient.suffix : ''}`}
                      </TableCell>
                      <TableCell>{computeAge(patient.dateOfBirth)}</TableCell>
                      <TableCell>{patient.sex}</TableCell>
                      <TableCell>{patient.contactNumber || patient.contact || ''}</TableCell>
                      <TableCell>{patient.address || ''}</TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleViewPatient(patient)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
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

      {/* View Patient Dialog */}
      <ViewRecord
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        patient={selectedPatient}
        medInfo={medInfo} // ⭐ MODIFIED
        onRecordUpdated={() => {
          // Refresh the list after edit
          fetch(`${API_BASE}/patients`)
            .then(res => res.json())
            .then(data => {
              setPatients(data);
              setFilteredPatients(data);
            });
        }}
      />

<QuickActionButton
        onAddPatientRecord={handleAddPatientRecord}
      />  
      
       {/* Patient Modal */}
       <AddPatientRecord open={showPatientModal} onClose={() => setShowPatientModal(false)} />  </Box>
  );
}

export default PatientList;