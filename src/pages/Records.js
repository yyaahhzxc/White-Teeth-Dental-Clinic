import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Collapse,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import Header from '../components/header';
import QuickActionButton from '../components/QuickActionButton';
import AddPatientRecord from './add-record';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import FilterComponent, { FilterButton, FilterContent } from '../components/FilterComponent';
import SortableHeader, { sortData } from '../components/SortableHeader';
import DualSortableHeader, { sortDualData } from '../components/DualSortableHeader';
import Pagination from '../components/Pagination';
import ViewRecord from './view-record';

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
  const [categoryFilteredPatients, setCategoryFilteredPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Filter state
  const [showFilterBox, setShowFilterBox] = useState(false);
  const [activeFilters, setActiveFilters] = useState([
    { category: '', type: '' }
  ]);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const navigate = useNavigate();
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medInfo, setMedInfo] = useState(null);
  // Handler to open patient view modal
  
  const handleViewPatient = async (patient) => {
    setSelectedPatient(patient);
    
    try {
      const res = await fetch(`${API_BASE}/medical-information/${patient.id}`);
      const data = await res.json();
      setMedInfo(data || null);
      
      // Optional: Log the patient record access
      try {
        await fetch(`${API_BASE}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'Patient Record Viewed',
            description: `Patient record accessed for ${patient.firstName} ${patient.lastName}`,
            tableName: 'patients',
            recordId: patient.id,
            username: 'current_user' // Replace with actual username if available
          })
        });
      } catch (logError) {
        console.error('Failed to log record access:', logError);
        // Don't throw - this shouldn't prevent viewing the record
      }
    } catch (err) {
      console.error("Error fetching medical info:", err);
      setMedInfo(null);
    }
    
    setViewDialogOpen(true);
  };
  

  // Filter categories for patient records
  const filterCategories = [
    { label: 'Sex', value: 'sex', types: ['Male', 'Female'] },
    { label: 'Age Range', value: 'ageRange', types: ['0-18', '19-35', '36-50', '51-65', '65+'] },
  ];


  // Fetch patients from backend
  useEffect(() => {
    fetchPatients();
  }, []);

  // Helper to build query string from filters
  const buildFilterQuery = (filters) => {
    const params = [];
    filters.forEach(f => {
      if (f.category && f.type) {
        if (f.category === 'ageRange') {
          // Handle age range filtering on frontend since backend may not support it
          return;
        }
        params.push(`${encodeURIComponent(f.category)}=${encodeURIComponent(f.type)}`);
      }
    });
    return params.length ? `?${params.join('&')}` : '';
  };

  // Modified fetchPatients to accept filters
  const fetchPatients = async (filters = activeFilters) => {
    try {
      const query = buildFilterQuery(filters);
      const response = await fetch(`${API_BASE}/patients${query}`);
      if (response.ok) {
        const data = await response.json();
        let processedData = data;
        
        // Apply age range filtering on frontend
        if (showFilterBox) {
          filters.forEach(f => {
            if (f.category === 'ageRange' && f.type) {
              processedData = processedData.filter(patient => {
                const age = computeAge(patient.dateOfBirth);
                switch (f.type) {
                  case '0-18': return age >= 0 && age <= 18;
                  case '19-35': return age >= 19 && age <= 35;
                  case '36-50': return age >= 36 && age <= 50;
                  case '51-65': return age >= 51 && age <= 65;
                  case '65+': return age > 65;
                  default: return true;
                }
              });
            }
          });
        }
        
        setPatients(processedData);
        setFilteredPatients(processedData);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  // Refetch patients when filters change
  useEffect(() => {
    if (showFilterBox) {
      fetchPatients(activeFilters);
    } else {
      fetchPatients([]); // fetch all patients when filter box is closed
    }
    setPage(0); // Reset to first page when filters change
  }, [activeFilters, showFilterBox]);

  // Initialize category filtered data when patients change
  useEffect(() => {
    setCategoryFilteredPatients(patients);
  }, [patients]);

  // Search filter - handle both search and empty search cases
  useEffect(() => {
    if (!search) {
      setFilteredPatients(categoryFilteredPatients);
      setPage(0);
    } else {
      // Apply search filter manually since SearchBar might not handle empty case
      const filtered = categoryFilteredPatients.filter(patient => {
        const fullName = [
          patient.lastName,
          patient.firstName,
          patient.middleName ? patient.middleName.charAt(0) + '.' : '',
          patient.suffix
        ].filter(Boolean).join(' ').toLowerCase();
        return fullName.includes(search.toLowerCase()) || 
               (patient.address && patient.address.toLowerCase().includes(search.toLowerCase()));
      });
      setFilteredPatients(filtered);
      setPage(0);
    }
  }, [search, categoryFilteredPatients]);

  const handleAddPatientRecord = () => setShowPatientModal(true);

  // Handle filter changes from FilterComponent
  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
  };

  // Handle sort changes from SortableHeader
  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  // Reset page when search or filters change
  useEffect(() => {
    setPage(0);
  }, [search, activeFilters, rowsPerPage]);

  // Pagination calculations with sorting
  const sortedPatients = sortDualData(filteredPatients, sortConfig);
  const totalPages = Math.ceil(sortedPatients.length / rowsPerPage);
  const visiblePatients = sortedPatients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // View handler
  const handleAddAppointment = () => navigate('/add-appointment');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#2148c0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />
      
      {/* Patient Records Title */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pt: 2,
          pb: 2,
          px: 2,
        }}
      >
        <Typography 
          variant="h3" 
          sx={{ 
            color: 'white',
            fontWeight: 800,
            fontSize: '39.14px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Patient Records
        </Typography>
      </Box>

      {/* Main Content Container - now using DataTable */}
      <DataTable
        topContent={
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                px: 3,
                pt: 3,
                pb: 2,
                gap: 2,
                boxSizing: 'border-box',
              }}
            >
              {/* Search Bar */}
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by patient name or address"
                searchFields={['firstName', 'lastName', 'middleName', 'address']}
                data={categoryFilteredPatients}
              />
              {/* Filter and Add Patient buttons */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', width: 'auto', p: 0, m: 0, flex: 1 }}>
                <FilterButton onClick={() => setShowFilterBox(v => !v)} />
                <Button
                  variant="contained"
                  onClick={() => setShowPatientModal(true)}
                  sx={{
                    backgroundColor: '#2148c0',
                    color: 'white',
                    borderRadius: '8px',
                    height: '38px',
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: '#1e3fa8',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Add Patient
                </Button>
              </Box>
            </Box>
            {/* Filter Bar UI with animation */}
            <Collapse 
              in={showFilterBox} 
              timeout={{ enter: 300, exit: 200 }}
              easing={{
                enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
                exit: 'cubic-bezier(0.4, 0, 0.6, 1)',
              }}
            >
              <FilterContent
                filterCategories={filterCategories}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
              />
            </Collapse>
          </>
        }
        tableHeader={
          <Box sx={{ px: 3, pt: 3, pb: 3 }}>
            <Box 
              sx={{ 
                display: 'flex',
                px: 2,
                alignItems: 'center',
              }}
            >
              <DualSortableHeader
                firstSortKey="firstName"
                secondSortKey="lastName"
                currentSort={sortConfig}
                onSort={handleSort}
                textAlign="left"
              />
              <SortableHeader
                label="Age"
                sortKey="age"
                currentSort={sortConfig}
                onSort={handleSort}
                textAlign="center"
                customSort={(a, b, direction) => {
                  const ageA = computeAge(a.dateOfBirth);
                  const ageB = computeAge(b.dateOfBirth);
                  return direction === 'asc' ? ageA - ageB : ageB - ageA;
                }}
              />
              <SortableHeader
                label="Sex"
                sortKey="sex"
                currentSort={sortConfig}
                onSort={handleSort}
                textAlign="center"
              />
              <SortableHeader
                label="Contact Number"
                textAlign="center"
                sortable={false}
              />
              <SortableHeader
                label="Address"
                textAlign="center"
                sortable={false}
              />
            </Box>
          </Box>
        }
        tableRows={
          <Box sx={{ 
            px: 3, 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            minHeight: '402px',
            maxHeight: '402px',
            overflow: visiblePatients.length > 5 ? 'auto' : 'hidden',
            '&::-webkit-scrollbar': {
              width: '6px',
              display: visiblePatients.length > 5 ? 'block' : 'none',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '3px',
              '&:hover': {
                background: '#a8a8a8',
              },
            },
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pb: 2 }}>
              {visiblePatients.length > 0 ? (
                visiblePatients.map((patient) => (
                  <Box 
                    key={patient.id}
                    sx={{ 
                      display: 'flex', 
                      px: 2,
                      py: 0.875,
                      alignItems: 'center',
                      backgroundColor: '#f9fafc',
                      borderRadius: '10px',
                      height: 60,
                      '&:hover': { 
                        backgroundColor: '#f0f4f8',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => handleViewPatient(patient)}
                  >
                    <Box sx={{ flex: '1', textAlign: 'left' }}>
                      <Typography
                        sx={{
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 400,
                          fontSize: '15px',
                          color: '#6d6b80',
                          lineHeight: '22px',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {`${patient.firstName || ''} ${patient.lastName || ''}`}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1', textAlign: 'center' }}>
                      <Typography
                        sx={{
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 400,
                          fontSize: '15px',
                          color: '#6d6b80',
                          lineHeight: '22px',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {computeAge(patient.dateOfBirth)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1', textAlign: 'center' }}>
                      <Typography
                        sx={{
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 400,
                          fontSize: '15px',
                          color: '#6d6b80',
                          lineHeight: '22px',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {patient.sex || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1', textAlign: 'center' }}>
                      <Typography
                        sx={{
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 400,
                          fontSize: '15px',
                          color: '#6d6b80',
                          lineHeight: '22px',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {patient.contactNumber || patient.contact || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1', textAlign: 'center' }}>
                      <Typography
                        sx={{
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 400,
                          fontSize: '15px',
                          color: '#6d6b80',
                          lineHeight: '22px',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {patient.address || '-'}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Box 
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 4,
                    backgroundColor: '#f9fafc',
                    borderRadius: '10px',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 400,
                      fontSize: '16px',
                      color: '#6d6b80',
                    }}
                  >
                    No patient records found.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        }
        pagination={
          <Box sx={{ mt: 2, mb: 2, px: 3, pt: 0, pb: 0 }}>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={value => {
                setRowsPerPage(value);
                setPage(0);
              }}
            />
          </Box>
        }
        grayMinHeight={showFilterBox ? '440px' : '560px'}
        whiteMinHeight={showFilterBox ? '720px' : '620px'}
      />

      {/* FilterComponent for data filtering logic */}
      <FilterComponent
        filterCategories={filterCategories}
        data={patients}
        onFilteredData={setCategoryFilteredPatients}
        activeFilters={activeFilters}
        showFilterBox={showFilterBox}
      />

      {/* QuickActionButton */}
      <QuickActionButton 
        onAddPatientRecord={handleAddPatientRecord}
        onAddAppointment={handleAddAppointment}
      />

      {/* Patient Modal */}
      <ViewRecord
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        patient={selectedPatient}
        medInfo={medInfo}
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
      <AddPatientRecord open={showPatientModal} onClose={() => setShowPatientModal(false)} />
    </Box>
  );
}

export default PatientList;