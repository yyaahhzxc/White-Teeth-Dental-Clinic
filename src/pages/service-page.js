import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Collapse,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import Header from '../components/header';
import QuickActionButton from '../components/QuickActionButton';
import AddPatientRecord from './add-record';
import AddService from './add-service';
import AddPackage from './add-package';
import ViewService from './view-service';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import FilterComponent, { FilterButton, FilterContent } from '../components/FilterComponent';
import SortableHeader, { sortData } from '../components/SortableHeader';
import Pagination from '../components/Pagination';

// API Base URL
const API_BASE = 'http://localhost:3001';

function ServiceList() {
  // ...existing code...
  const [services, setServices] = useState([]);
  const [categoryFilteredServices, setCategoryFilteredServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
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
  // ...existing code...

  const navigate = useNavigate();
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Filter categories for services
  const filterCategories = [
    { label: 'Price Range', value: 'priceRange', types: ['0-500', '501-1000', '1001-2000', '2001-5000', '5000+'] },
    { label: 'Duration Range', value: 'durationRange', types: ['0-30 mins', '31-60 mins', '61-90 mins', '91-120 mins', '120+ mins'] },
    { label: 'Treatment Type', value: 'type', types: ['Single Treatment', 'Package Treatment'] },
    { label: 'Status', value: 'status', types: ['Active', 'Inactive'] },
  ];

  // Fetch services from backend
  useEffect(() => {
    fetchServices();
  }, []);

  // Helper to build query string from filters
  const buildFilterQuery = (filters) => {
    const params = [];
    filters.forEach(f => {
      if (f.category && f.type) {
        if (f.category === 'priceRange' || f.category === 'durationRange') {
          // Handle price range and duration range filtering on frontend since backend may not support it
          return;
        }
        params.push(`${encodeURIComponent(f.category)}=${encodeURIComponent(f.type)}`);
      }
    });
    return params.length ? `?${params.join('&')}` : '';
  };

  // Fetch services from backend (no filtering - let FilterComponent handle all filtering)
  const fetchServices = async () => {
    try {
      // Use the new endpoint that returns both services and packages
      const response = await fetch(`${API_BASE}/services-and-packages`);
      if (response.ok) {
        const data = await response.json();
        // Combine regular services and packages into one array
        const allItems = [...(data.services || []), ...(data.packages || [])];
        setServices(allItems);
        console.log('Fetched services and packages:', {
          services: data.services?.length || 0,
          packages: data.packages?.length || 0,
          total: allItems.length
        });
      } else {
        console.error('Failed to fetch services and packages');
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services and packages:', error);
      setServices([]);
    }
  };

  // Fetch services on mount and when needed
  useEffect(() => {
    fetchServices();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(0); // Reset to first page when filters change
  }, [activeFilters, showFilterBox]);

  // Initialize category filtered data when services change
  useEffect(() => {
    setCategoryFilteredServices(services);
  }, [services]);

  // Search filter - handle both search and empty search cases
  useEffect(() => {
    if (!search) {
      setFilteredServices(categoryFilteredServices);
      setPage(0);
    } else {
      // Apply search filter manually
      const filtered = categoryFilteredServices.filter(service => {
        return service.name && service.name.toLowerCase().includes(search.toLowerCase());
      });
      setFilteredServices(filtered);
      setPage(0);
    }
  }, [search, categoryFilteredServices]);

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
  const sortedServices = sortData(filteredServices, sortConfig);
  const totalPages = Math.ceil(sortedServices.length / rowsPerPage);
  const visibleServices = sortedServices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  // Calculate scrollbar display value for table rows
  const scrollbarDisplay = visibleServices && visibleServices.length > 5 ? 'block' : 'none';

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handler to open service view modal
  const handleViewService = async (service) => {
    setSelectedService(service);
    setViewDialogOpen(true);
  };

  const handleAddService = () => {
    // After adding, fetch the updated list using new endpoint
    fetch(`${API_BASE}/services-and-packages`)
      .then(res => res.json())
      .then(data => {
        const allItems = [...(data.services || []), ...(data.packages || [])];
        setServices(allItems);
      })
      .catch(error => {
        console.error('Error refreshing services:', error);
      });
    setShowServiceModal(false);
  };

  const handleAddPackage = () => {
    // Refresh services after adding package using new endpoint
    fetch(`${API_BASE}/services-and-packages`)
      .then(res => res.json())
      .then(data => {
        const allItems = [...(data.services || []), ...(data.packages || [])];
        setServices(allItems);
      })
      .catch(error => {
        console.error('Error refreshing services:', error);
      });
    setShowPackageModal(false);
  };

  const handleAddPatientRecord = () => setShowPatientModal(true);
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
      
      {/* Services Title */}
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
          Services
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
                placeholder="Search by service name"
                searchFields={['name']}
                data={categoryFilteredServices}
              />
              {/* Filter and Add Service buttons */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', width: 'auto', p: 0, m: 0, flex: 1 }}>
                <FilterButton onClick={() => setShowFilterBox(v => !v)} />
                <Button
                  variant="contained"
                  onClick={() => setShowServiceModal(true)}
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
                  Add Service
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowPackageModal(true)}
                  sx={{
                    borderColor: '#2148c0',
                    color: 'white',
                    backgroundColor: '#2148c0',
                    borderRadius: '8px',
                    height: '38px',
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: 'none',
                    ml: 1,
                    '&:hover': {
                      backgroundColor: '#1e3fa8',
                      borderColor: '#1e3fa8'
                    },
                  }}
                >
                  Add Package
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
                <SortableHeader
                  label="Service Name"
                  sortKey="name"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  textAlign="left"
                  sx={{ flex: '2' }}
                />
                <SortableHeader
                  label="Price"
                  sortKey="price"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  textAlign="center"
                  sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
                  customSort={(a, b, direction) => {
                    const priceA = parseFloat(a.price) || 0;
                    const priceB = parseFloat(b.price) || 0;
                    return direction === 'asc' ? priceA - priceB : priceB - priceA;
                  }}
                />
                <SortableHeader
                  label="Duration"
                  sortKey="duration"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  textAlign="center"
                  sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
                  customSort={(a, b, direction) => {
                    const durationA = parseInt(a.duration) || 0;
                    const durationB = parseInt(b.duration) || 0;
                    return direction === 'asc' ? durationA - durationB : durationB - durationA;
                  }}
                />
                <SortableHeader
                  label="Type"
                  sortKey="type"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  textAlign="center"
                  sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
                />
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  textAlign="center"
                  sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
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
              overflow: visibleServices.length > 5 ? 'auto' : 'hidden',
              '&::-webkit-scrollbar': {
                width: '6px',
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
              {visibleServices.length > 0 ? (
                visibleServices.map((service) => (
                  <Box 
                    key={service.id}
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
                    onClick={() => handleViewService(service)}
                  >
                   <Box sx={{ flex: '2', textAlign: 'left' }}>
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
    {service.name || '-'}
  </Typography>
  {service.type === 'Package Treatment' && (
    <Typography
      sx={{
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 300,
        fontSize: '12px',
        color: '#9e9e9e',
        fontStyle: 'italic',
        mt: 0.5,
      }}
    >
      Package (contains multiple services)
    </Typography>
  )}
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
                        {typeof service.price === 'number' || !isNaN(Number(service.price))
      ? `₱${Number(service.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '₱0.00'}
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
                        {service.duration ? `${service.duration} mins` : '-'}
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
                        {service.type || '-'}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: '1', textAlign: 'center' }}>
                      <Chip
                        label={service.status === 'Active' ? 'Active' : 'Inactive'}
                        sx={{
                          backgroundColor: service.status === 'Active' ? '#4CAF50' : '#F44336',
                          color: 'white',
                          fontWeight: 500,
                          fontSize: '12.5px',
                          fontFamily: 'Roboto, sans-serif',
                          borderRadius: '17px',
                          height: '26px',
                          minWidth: '72px',
                          '& .MuiChip-label': {
                            px: 1.6,
                          }
                        }}
                      />
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
                    No services found.
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
        data={services}
        onFilteredData={setCategoryFilteredServices}
        activeFilters={activeFilters}
        showFilterBox={showFilterBox}
      />

      {/* QuickActionButton */}
      <QuickActionButton 
        onAddPatientRecord={handleAddPatientRecord}
        onAddAppointment={handleAddAppointment}
      />

      {/* View Service Dialog */}
      <ViewService
  open={viewDialogOpen}
  onClose={() => setViewDialogOpen(false)}
  service={selectedService}
  onServiceUpdated={() => {
    // Refresh the list after edit using new endpoint
    fetch(`${API_BASE}/services-and-packages`)
      .then(res => res.json())
      .then(data => {
        const allItems = [...(data.services || []), ...(data.packages || [])];
        setServices(allItems);
      })
      .catch(error => {
        console.error('Error refreshing services:', error);
      });
  }}
/>

      {/* Service Modal */}
      <AddService
        open={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        handleAddService={handleAddService}
      />

      {/* Package Modal */}
      <AddPackage
        open={showPackageModal}
        onClose={() => setShowPackageModal(false)}
        onAddPackage={handleAddPackage}
      />

      {/* Patient Modal */}
      <AddPatientRecord open={showPatientModal} onClose={() => setShowPatientModal(false)} />
    </Box>
  );
}

export default ServiceList;
