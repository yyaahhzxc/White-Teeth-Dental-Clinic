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
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import FilterComponent, { FilterButton, FilterContent } from '../components/FilterComponent';
import SortableHeader, { sortData } from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import ViewInvoice from '../view-invoice';

function Invoice() {
  // Mock invoice data (not connected to backend)
  const [invoices, setInvoices] = useState([
    { id: 1, invoiceNumber: 'INV-2024-001', date: '2024-01-15', total: 2500.00, status: 'Paid' },
    { id: 2, invoiceNumber: 'INV-2024-002', date: '2024-01-16', total: 1800.50, status: 'Pending' },
    { id: 3, invoiceNumber: 'INV-2024-003', date: '2024-01-17', total: 3200.75, status: 'Paid' },
    { id: 4, invoiceNumber: 'INV-2024-004', date: '2024-01-18', total: 950.00, status: 'Overdue' },
    { id: 5, invoiceNumber: 'INV-2024-005', date: '2024-01-19', total: 4100.25, status: 'Pending' },
    { id: 6, invoiceNumber: 'INV-2024-006', date: '2024-01-20', total: 1500.00, status: 'Paid' },
  ]);

  const [categoryFilteredInvoices, setCategoryFilteredInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
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
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewInvoice, setShowViewInvoice] = useState(false);

  // Filter categories for invoices
  const filterCategories = [
    { label: 'Total Range', value: 'totalRange', types: ['0-1000', '1001-2000', '2001-3000', '3001-5000', '5000+'] },
    { label: 'Status', value: 'status', types: ['Paid', 'Pending', 'Overdue'] },
    { label: 'Date Range', value: 'dateRange', types: ['Last 7 days', 'Last 30 days', 'Last 90 days'] },
  ];

  // Initialize data
  useEffect(() => {
    setCategoryFilteredInvoices(invoices);
  }, [invoices]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [activeFilters, showFilterBox]);

  // Search filter
  useEffect(() => {
    if (!search) {
      setFilteredInvoices(categoryFilteredInvoices);
      setPage(0);
    } else {
      const filtered = categoryFilteredInvoices.filter(invoice => {
        return invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase());
      });
      setFilteredInvoices(filtered);
      setPage(0);
    }
  }, [search, categoryFilteredInvoices]);

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
  const sortedInvoices = sortData(filteredInvoices, sortConfig);
  const totalPages = Math.ceil(sortedInvoices.length / rowsPerPage);
  const visibleInvoices = sortedInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handler to view invoice (placeholder)
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewInvoice(true);
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
      
      {/* Invoices Title */}
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
          Invoices
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
                placeholder="Search by invoice number"
                searchFields={['invoiceNumber']}
                data={categoryFilteredInvoices}
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
                  label="Invoice Number"
                  sortKey="invoiceNumber"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  textAlign="left"
                  sx={{ flex: '2' }}
                />
                <SortableHeader
                  label="Date"
                  sortKey="date"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  textAlign="center"
                  sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
                />
                <SortableHeader
                  label="Total"
                  sortKey="total"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  textAlign="center"
                  sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
                  customSort={(a, b, direction) => {
                    const totalA = parseFloat(a.total) || 0;
                    const totalB = parseFloat(b.total) || 0;
                    return direction === 'asc' ? totalA - totalB : totalB - totalA;
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
              overflow: visibleInvoices.length > 5 ? 'auto' : 'hidden',
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
              {visibleInvoices.length > 0 ? (
                visibleInvoices.map((invoice) => (
                  <Box 
                    key={invoice.id}
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
                    onClick={() => handleViewInvoice(invoice)}
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
                        {invoice.invoiceNumber || '-'}
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
                        {invoice.date || '-'}
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
                        {typeof invoice.total === 'number' || !isNaN(Number(invoice.total))
                          ? `₱${Number(invoice.total).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '₱0.00'}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: '1', textAlign: 'center' }}>
                      <Chip
                        label={invoice.status}
                        sx={{
                          backgroundColor: 
                            invoice.status === 'Paid' ? '#4CAF50' : 
                            invoice.status === 'Pending' ? '#FF9800' : 
                            '#F44336',
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
                    No invoices found.
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
        data={invoices}
        onFilteredData={setCategoryFilteredInvoices}
        activeFilters={activeFilters}
        showFilterBox={showFilterBox}
      />

      {/* QuickActionButton */}
      <QuickActionButton 
        onAddPatientRecord={handleAddPatientRecord}
        onAddAppointment={handleAddAppointment}
      />

      {/* Patient Modal */}
      <AddPatientRecord open={showPatientModal} onClose={() => setShowPatientModal(false)} />

      {/* View Invoice Modal */}
      <ViewInvoice 
        open={showViewInvoice} 
        onClose={() => setShowViewInvoice(false)}
        invoice={selectedInvoice}
      />
    </Box>
  );
}

export default Invoice;
