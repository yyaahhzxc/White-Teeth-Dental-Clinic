import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Collapse,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import Header from '../components/header';
import QuickActionButton from '../components/QuickActionButton';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import FilterComponent, { FilterButton, FilterContent } from '../components/FilterComponent';
import SortableHeader, { sortData } from '../components/SortableHeader';
import DualSortableHeader, { sortDualData } from '../components/DualSortableHeader';
import Pagination from '../components/Pagination';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';

function Billing() {
  // Mock billing data (not connected to backend)
  const [billings, setBillings] = useState([
    { id: 1, dateCreated: 'October 30, 2025', firstName: 'Vince', lastName: 'Valmores', totalBill: 2500.00, amountPaid: 2500.00, balance: 0.00, status: 'Paid' },
    { id: 2, dateCreated: 'October 30, 2025', firstName: 'Jane', lastName: 'Foster', totalBill: 500.00, amountPaid: 500.00, balance: 0.00, status: 'Paid' },
    { id: 3, dateCreated: 'October 25, 2025', firstName: 'Thor', lastName: 'Odinson', totalBill: 600.00, amountPaid: 450.00, balance: 150.00, status: 'Partial' },
    { id: 4, dateCreated: 'October 17, 2025', firstName: 'Jan', lastName: 'Gerona', totalBill: 1000.00, amountPaid: 700.00, balance: 300.00, status: 'Partial' },
    { id: 5, dateCreated: 'October 16, 2025', firstName: 'Warlter', lastName: 'Andao', totalBill: 1400.00, amountPaid: 950.00, balance: 450.00, status: 'Partial' },
    { id: 6, dateCreated: 'October 10, 2025', firstName: 'Ben', lastName: 'Dover', totalBill: 1000.00, amountPaid: 1000.00, balance: 0.00, status: 'Paid' },
  ]);

  const [categoryFilteredBillings, setCategoryFilteredBillings] = useState([]);
  const [filteredBillings, setFilteredBillings] = useState([]);
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

  // Filter categories for billing
  const filterCategories = [
    { label: 'Status', value: 'status', types: ['Paid', 'Partial'] },
    { label: 'Date Range', value: 'dateRange', types: ['Last 7 days', 'Last 30 days', 'Last 90 days'] },
  ];

  // Initialize data
  useEffect(() => {
    setCategoryFilteredBillings(billings);
  }, [billings]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [activeFilters, showFilterBox]);

  // Search filter
  useEffect(() => {
    if (!search) {
      setFilteredBillings(categoryFilteredBillings);
      setPage(0);
    } else {
      const filtered = categoryFilteredBillings.filter(billing => {
        const fullName = `${billing.firstName || ''} ${billing.lastName || ''}`.toLowerCase();
        return fullName.includes(search.toLowerCase());
      });
      setFilteredBillings(filtered);
      setPage(0);
    }
  }, [search, categoryFilteredBillings]);

  // Handle filter changes
  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
  };

  // Handle sort changes
  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  // Reset page when search or filters change
  useEffect(() => {
    setPage(0);
  }, [search, activeFilters, rowsPerPage]);

  // Pagination calculations with sorting
  const sortedBillings = sortDualData(filteredBillings, sortConfig);
  const totalPages = Math.ceil(sortedBillings.length / rowsPerPage);
  const visibleBillings = sortedBillings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handlers for view actions (placeholders)
  const handleViewInvoice = (billing) => {
    console.log('View invoice for:', billing);
  };

  const handleViewAppointment = (billing) => {
    console.log('View appointment for:', billing);
  };

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
      
      {/* Billing Title */}
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
          Billing
        </Typography>
      </Box>

      {/* Main Content Container */}
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
                placeholder="Search by patient name"
                searchFields={['firstName', 'lastName']}
                data={categoryFilteredBillings}
              />
              {/* Filter button only */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', width: 'auto', p: 0, m: 0, flex: 1 }}>
                <FilterButton onClick={() => setShowFilterBox(v => !v)} />
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
                label="Date Created"
                sortKey="dateCreated"
                currentSort={sortConfig}
                onSort={handleSort}
                textAlign="left"
                sx={{ flex: '1.5' }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', flex: '1' }}>
                <DualSortableHeader
                  firstSortKey="firstName"
                  secondSortKey="lastName"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  textAlign="center"
                />
              </Box>
              <SortableHeader
                label="Total Bill"
                sortKey="totalBill"
                currentSort={sortConfig}
                onSort={handleSort}
                textAlign="center"
                sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
                customSort={(a, b, direction) => {
                  const totalA = parseFloat(a.totalBill) || 0;
                  const totalB = parseFloat(b.totalBill) || 0;
                  return direction === 'asc' ? totalA - totalB : totalB - totalA;
                }}
              />
              <SortableHeader
                label="Amount Paid"
                sortKey="amountPaid"
                currentSort={sortConfig}
                onSort={handleSort}
                textAlign="center"
                sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
                customSort={(a, b, direction) => {
                  const paidA = parseFloat(a.amountPaid) || 0;
                  const paidB = parseFloat(b.amountPaid) || 0;
                  return direction === 'asc' ? paidA - paidB : paidB - paidA;
                }}
              />
              <SortableHeader
                label="Balance"
                sortKey="balance"
                currentSort={sortConfig}
                onSort={handleSort}
                textAlign="center"
                sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
                customSort={(a, b, direction) => {
                  const balA = parseFloat(a.balance) || 0;
                  const balB = parseFloat(b.balance) || 0;
                  return direction === 'asc' ? balA - balB : balB - balA;
                }}
              />
              <SortableHeader
                label="Status"
                sortKey="status"
                currentSort={sortConfig}
                onSort={handleSort}
                textAlign="center"
                sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
              />
              <SortableHeader
                label="Invoice"
                textAlign="center"
                sortable={false}
                sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
              />
              <SortableHeader
                label="Appointment"
                textAlign="center"
                sortable={false}
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
            overflow: visibleBillings.length > 5 ? 'auto' : 'hidden',
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
              {visibleBillings.length > 0 ? (
                visibleBillings.map((billing, index) => (
                  <Box 
                    key={billing.id}
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
                  >
                    <Box sx={{ flex: '1.5', textAlign: 'left' }}>
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
                        {billing.dateCreated || '-'}
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
                        {`${billing.firstName || ''} ${billing.lastName || ''}`}
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
                        {typeof billing.totalBill === 'number' || !isNaN(Number(billing.totalBill))
                          ? `₱${Number(billing.totalBill).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
                        {typeof billing.amountPaid === 'number' || !isNaN(Number(billing.amountPaid))
                          ? `₱${Number(billing.amountPaid).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
                        {typeof billing.balance === 'number' || !isNaN(Number(billing.balance))
                          ? `₱${Number(billing.balance).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '₱0.00'}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: '1', textAlign: 'center' }}>
                      <Chip
                        label={billing.status}
                        sx={{
                          backgroundColor: 
                            billing.status === 'Paid' ? '#4CAF50' : 
                            billing.status === 'Partial' ? '#FF9800' : 
                            '#F44336',
                          color: 'white',
                          fontWeight: 500,
                          fontSize: '12.5px',
                          fontFamily: 'Roboto, sans-serif',
                          borderRadius: '17px',
                          height: '26px',
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: '1', textAlign: 'center' }}>
                      <Button
                        variant="text"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewInvoice(billing);
                        }}
                        sx={{
                          textTransform: 'none',
                          fontFamily: 'Roboto, sans-serif',
                          fontSize: '13.3px',
                          color: '#2148c0',
                          fontWeight: 500,
                          textDecoration: 'none',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            textDecoration: 'underline',
                          }
                        }}
                      >
                        View Invoice(s)
                      </Button>
                    </Box>

                    <Box sx={{ flex: '1', textAlign: 'center' }}>
                      <Button
                        variant="text"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewAppointment(billing);
                        }}
                        sx={{
                          textTransform: 'none',
                          fontFamily: 'Roboto, sans-serif',
                          fontSize: '13.3px',
                          color: '#2148c0',
                          fontWeight: 500,
                          textDecoration: 'none',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            textDecoration: 'underline',
                          }
                        }}
                      >
                        View Log
                      </Button>
                    </Box>
                  </Box>
                ))
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  minHeight: '200px',
                  color: '#6d6b80'
                }}>
                  <Typography>No billing records found</Typography>
                </Box>
              )}
            </Box>
          </Box>
        }
        pagination={
          <Box sx={{ px: 3, pb: 3 }}>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(newRowsPerPage) => {
                setRowsPerPage(newRowsPerPage);
                setPage(0);
              }}
            />
          </Box>
        }
      />
      <QuickActionButton />
    </Box>
  );
}

export default Billing;