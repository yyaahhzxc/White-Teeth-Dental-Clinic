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
  Tooltip
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useNavigate } from 'react-router-dom';
import Header from './header';

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

  // Sort popup state
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');

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

  // Filter and sort patients
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

    result.sort((a, b) => {
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
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    setFilteredPatients(result);
    setPage(0); // Reset to first page on filter/sort
  }, [patients, search, sortOrder]);

  // Pagination helpers
  const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);

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
              Sort
            </Button>
            <Dialog open={filterOpen} onClose={() => setFilterOpen(false)}>
              <DialogTitle>Sort by Name</DialogTitle>
              <DialogContent>
                <RadioGroup
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                >
                  <FormControlLabel value="asc" control={<Radio />} label="A-Z (Ascending)" />
                  <FormControlLabel value="desc" control={<Radio />} label="Z-A (Descending)" />
                </RadioGroup>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setFilterOpen(false)}>Close</Button>
              </DialogActions>
            </Dialog>
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
                      <TableCell>
                        {`${patient.lastName || ''}, ${patient.firstName || ''}${patient.middleName ? ' ' + patient.middleName.charAt(0) + '.' : ''}${patient.suffix ? ' ' + patient.suffix : ''}`}
                      </TableCell>
                      <TableCell>{patient.sex}</TableCell>
                      <TableCell>{computeAge(patient.dateOfBirth)}</TableCell>
                      <TableCell>{patient.contact || patient.contactNumber || ''}</TableCell>
                      <TableCell>{patient.dateCreated}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
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
        }}
      >
        <Zoom in={showActions}>
          <Box>
            <Tooltip title="Add Patient">
              <Fab
                color="primary"
                onClick={() => navigate('/add-patient')}
                sx={{ mb: 1 }}
              >
                <PersonAddIcon sx={{ fontSize: 36 }} />
              </Fab>
            </Tooltip>
          </Box>
        </Zoom>
        <Fab
          color="default"
          onClick={() => setShowActions(!showActions)}
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