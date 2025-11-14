import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import Header from '../components/header';
import QuickActionButton from '../components/QuickActionButton';
import AddPatientRecord from './add-record';
import DataTable from '../components/DataTable';
import SortableHeader, { sortData } from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import { API_BASE } from '../apiConfig';

function Logs() {
  // Dynamic logs data (connected to backend)
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const navigate = useNavigate();
  const [showPatientModal, setShowPatientModal] = useState(false);

  // Fetch logs from backend
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/logs`);
      const data = await response.json();
      setLogs(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Fallback to mock data if backend fails
      setLogs([
        { 
          id: 1, 
          timestamp: '2024-01-15 10:30:25', 
          action: 'Login', 
          description: 'User admin logged into the system', 
          viewStatus: 'Viewed' 
        },
        { 
          id: 2, 
          timestamp: '2024-01-15 10:35:42', 
          action: 'Patient Added', 
          description: 'New patient record created for John Doe', 
          viewStatus: 'Unviewed' 
        },
        { 
          id: 3, 
          timestamp: '2024-01-15 11:20:15', 
          action: 'Appointment Scheduled', 
          description: 'Appointment scheduled for Jane Smith on 2024-01-20', 
          viewStatus: 'Viewed' 
        },
        { 
          id: 4, 
          timestamp: '2024-01-15 14:45:30', 
          action: 'Service Updated', 
          description: 'Dental cleaning service price updated to ₱1,500', 
          viewStatus: 'Unviewed' 
        },
        { 
          id: 5, 
          timestamp: '2024-01-15 16:12:08', 
          action: 'Invoice Generated', 
          description: 'Invoice INV-2024-001 generated for patient ID 123', 
          viewStatus: 'Viewed' 
        },
        { 
          id: 6, 
          timestamp: '2024-01-16 09:15:33', 
          action: 'System Backup', 
          description: 'Automated system backup completed successfully', 
          viewStatus: 'Unviewed' 
        },
      ]);
      setLoading(false);
    }
  };

  // Real-time log updates using polling (check for new logs every 5 seconds)
  useEffect(() => {
    fetchLogs();
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000); // Poll every 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Alternative: WebSocket connection for real-time updates
  useEffect(() => {
    // Uncomment this section if you implement WebSocket on your backend
    /*
    const ws = new WebSocket(`ws://localhost:3001/logs`);
    
    ws.onmessage = (event) => {
      const newLog = JSON.parse(event.data);
      setLogs(prevLogs => [newLog, ...prevLogs]);
    };

    ws.onopen = () => {
      console.log('WebSocket connected for logs');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
    */
  }, []);

  // Handle sort changes
  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  // Pagination calculations with sorting
  const sortedLogs = sortData(logs, sortConfig);
  const totalPages = Math.ceil(sortedLogs.length / rowsPerPage);
  const visibleLogs = sortedLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handler to view log details and mark as viewed
  const handleViewLog = async (log) => {
    console.log('View log:', log);
    
    try {
      // Update view status in backend
      await fetch(`${API_BASE}/logs/${log.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...log, viewStatus: 'Viewed' })
      });

      // Update local state
      setLogs(prevLogs => 
        prevLogs.map(l => 
          l.id === log.id ? { ...l, viewStatus: 'Viewed' } : l
        )
      );
    } catch (error) {
      console.error('Error updating log view status:', error);
      // Still update local state even if backend call fails
      setLogs(prevLogs => 
        prevLogs.map(l => 
          l.id === log.id ? { ...l, viewStatus: 'Viewed' } : l
        )
      );
    }
  };

  const handleAddPatientRecord = () => setShowPatientModal(true);
  const handleAddAppointment = () => navigate('/add-appointment');

  // Format timestamp for better display
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return timestamp;
    }
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
      
      {/* Logs Title */}
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
          Logs
        </Typography>
      </Box>

      {/* Add spacing container */}
      <Box sx={{ height: '32px' }}></Box>

      {/* Main Content Container */}
      <DataTable
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
                  label="Timestamp"
                  sortKey="timestamp"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  textAlign="left"
                  sx={{ flex: '2' }}
                />
                <SortableHeader
                  label="Action"
                  sortKey="action"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  textAlign="center"
                  sx={{ flex: '1.5', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
                />
                <SortableHeader
                  label="Description"
                  sortKey="description"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  textAlign="center"
                  sx={{ flex: '3', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
                />
                <SortableHeader
                  label="View Status"
                  sortKey="viewStatus"
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
              overflow: visibleLogs.length > 5 ? 'auto' : 'hidden',
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
              {loading ? (
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
                    Loading logs...
                  </Typography>
                </Box>
              ) : visibleLogs.length > 0 ? (
                visibleLogs.map((log) => (
                  <Box 
                    key={log.id}
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
                    onClick={() => handleViewLog(log)}
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
                        {formatTimestamp(log.timestamp) || '-'}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: '1.5', textAlign: 'center' }}>
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
                        {log.action || '-'}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: '3', textAlign: 'center' }}>
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
                        {log.description || '-'}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: '1', textAlign: 'center' }}>
                      <Chip
                        label={log.viewStatus}
                        sx={{
                          backgroundColor: 
                            log.viewStatus === 'Viewed' ? '#4CAF50' : '#FF9800',
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
                    No logs found.
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
        grayMinHeight={'560px'}
        whiteMinHeight={'620px'}
      />

      {/* QuickActionButton */}
      <QuickActionButton 
        onAddPatientRecord={handleAddPatientRecord}
        onAddAppointment={handleAddAppointment}
      />

      {/* Patient Modal */}
      <AddPatientRecord open={showPatientModal} onClose={() => setShowPatientModal(false)} />
    </Box>
  );
}

export default Logs;
