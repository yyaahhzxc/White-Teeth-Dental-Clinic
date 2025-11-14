import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  TextField,
  Button,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Badge,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Info as InfoIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import Header from '../components/header';
import QuickActionButton from '../components/QuickActionButton';
import AddPatientRecord from './add-record';
import DataTable from '../components/DataTable';
import SortableHeader, { sortData } from '../components/SortableHeader';
import Pagination from '../components/Pagination';
import { API_BASE } from '../apiConfig';

function Logs() {
  // Logs data and pagination
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filtering and sorting
  const [filters, setFilters] = useState({
    action: '',
    viewStatus: '',
    username: '',
    startDate: '',
    endDate: '',
    tableName: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  // UI states
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);
  const [logDetailOpen, setLogDetailOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigate = useNavigate();

  // Action type options for filtering
  const actionTypes = [
    'Patient Added',
    'Patient Updated', 
    'Medical Info Added',
    'Medical Info Updated',
    'Tooth Chart Added',
    'Tooth Chart Updated',
    'Appointment Added',
    'Appointment Updated',
    'Service Added',
    'Service Updated',
    'User Login',
    'User Logout'
  ];

  const tableTypes = [
    'patients',
    'MedicalInformation', 
    'tooth_charts',
    'appointments',
    'services',
    'users'
  ];

  // Fetch logs from backend
  const fetchLogs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      });

      const response = await fetch(`${API_BASE}/logs?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        setLogs(data.logs || []);
        setTotalLogs(data.total || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        console.error('Error fetching logs:', data.error);
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/logs/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Initial load and refresh on dependency changes
  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    fetchStats();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchLogs(false); // Don't show loading spinner for background refresh
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPage(0); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      action: '',
      viewStatus: '',
      username: '',
      startDate: '',
      endDate: '',
      tableName: ''
    });
    setPage(0);
  };

  // Handle sort changes
  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
    // Note: Sorting is handled by backend, you might want to add sorting to API
  };

  // Handle page changes
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // View log details and mark as viewed
  const handleViewLog = async (log) => {
    setSelectedLog(log);
    setLogDetailOpen(true);
    
    // Mark as viewed if it's unviewed
    if (log.viewStatus === 'Unviewed') {
      try {
        await fetch(`${API_BASE}/logs/${log.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ viewStatus: 'Viewed' })
        });

        // Update local state
        setLogs(prevLogs => 
          prevLogs.map(l => 
            l.id === log.id ? { ...l, viewStatus: 'Viewed' } : l
          )
        );
        
        // Refresh stats
        fetchStats();
      } catch (error) {
        console.error('Error marking log as viewed:', error);
      }
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
    fetchStats();
  };

  // Export logs (basic implementation)
  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE}/logs?limit=1000`);
      const data = await response.json();
      
      if (response.ok) {
        const csvContent = [
          'Timestamp,Action,Description,Username,View Status',
          ...data.logs.map(log => 
            `"${log.timestamp}","${log.action}","${log.description}","${log.username || 'System'}","${log.viewStatus}"`
          )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timestamp;
    }
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
      
      {/* Logs Title and Stats */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pt: 2,
          pb: 2,
          px: 4,
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
          Activity Logs
        </Typography>
        
        {/* Quick Stats */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Card sx={{ minWidth: 100, textAlign: 'center' }}>
            <CardContent sx={{ py: 1 }}>
              <Typography variant="h6" color="primary">
                {stats.totalLogs || 0}
              </Typography>
              <Typography variant="caption">Total Logs</Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ minWidth: 100, textAlign: 'center' }}>
            <CardContent sx={{ py: 1 }}>
              <Badge badgeContent={stats.unviewedLogs || 0} color="error">
                <Typography variant="h6" color="warning.main">
                  {stats.unviewedLogs || 0}
                </Typography>
              </Badge>
              <Typography variant="caption">Unviewed</Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ minWidth: 100, textAlign: 'center' }}>
            <CardContent sx={{ py: 1 }}>
              <Typography variant="h6" color="success.main">
                {stats.todayLogs || 0}
              </Typography>
              <Typography variant="caption">Today</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters Section */}
      <Box sx={{ px: 4, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
          >
            Filters
          </Button>
          
          <Tooltip title="Refresh Logs">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ color: 'white' }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export to CSV">
            <IconButton onClick={handleExport} sx={{ color: 'white' }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {showFilters && (
          <Card sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.95)' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Action Type"
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {actionTypes.map(action => (
                    <MenuItem key={action} value={action}>{action}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="View Status"
                  value={filters.viewStatus}
                  onChange={(e) => handleFilterChange('viewStatus', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="Viewed">Viewed</MenuItem>
                  <MenuItem value="Unviewed">Unviewed</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Username"
                  value={filters.username}
                  onChange={(e) => handleFilterChange('username', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={clearFilters}
                  size="small"
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Card>
        )}
      </Box>

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
                label="User"
                sortKey="username"
                currentSort={sortConfig}
                onSort={handleSort}
                textAlign="center"
                sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
              />
              <SortableHeader
                label="Status"
                sortKey="viewStatus"
                currentSort={sortConfig}
                onSort={handleSort}
                textAlign="center"
                sx={{ flex: '1', textAlign: 'center', justifyContent: 'center', display: 'flex' }}
              />
              <Box sx={{ flex: '0.5', textAlign: 'center' }}>
                <Typography
                  sx={{
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 600,
                    fontSize: '15px',
                    color: '#5f6368',
                  }}
                >
                  Actions
                </Typography>
              </Box>
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
            overflow: logs.length > rowsPerPage ? 'auto' : 'hidden',
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
                    {refreshing ? 'Refreshing logs...' : 'Loading logs...'}
                  </Typography>
                </Box>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <Box 
                    key={log.id}
                    sx={{ 
                      display: 'flex', 
                      px: 2,
                      py: 1,
                      alignItems: 'center',
                      backgroundColor: log.viewStatus === 'Unviewed' ? '#fff3cd' : '#f9fafc',
                      borderRadius: '10px',
                      minHeight: 60,
                      border: log.viewStatus === 'Unviewed' ? '1px solid #ffc107' : '1px solid transparent',
                      '&:hover': { 
                        backgroundColor: log.viewStatus === 'Unviewed' ? '#fff2b3' : '#f0f4f8',
                        cursor: 'pointer'
                      }
                    }}
                  >
                    <Box sx={{ flex: '2', textAlign: 'left' }}>
                      <Typography
                        sx={{
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 400,
                          fontSize: '14px',
                          color: '#6d6b80',
                          lineHeight: '18px',
                        }}
                      >
                        {formatTimestamp(log.timestamp)}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: '1.5', textAlign: 'center' }}>
                      <Chip
                        label={log.action}
                        size="small"
                        sx={{
                          backgroundColor: 
                            log.action.includes('Added') ? '#4caf50' :
                            log.action.includes('Updated') ? '#2196f3' :
                            log.action.includes('Deleted') ? '#f44336' :
                            log.action.includes('Login') ? '#9c27b0' :
                            '#757575',
                          color: 'white',
                          fontWeight: 500,
                          fontSize: '11px',
                          fontFamily: 'Roboto, sans-serif',
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: '3', textAlign: 'left', px: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 400,
                          fontSize: '14px',
                          color: '#6d6b80',
                          lineHeight: '18px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {log.description}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: '1', textAlign: 'center' }}>
                      <Typography
                        sx={{
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 400,
                          fontSize: '13px',
                          color: '#6d6b80',
                        }}
                      >
                        {log.username || 'System'}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: '1', textAlign: 'center' }}>
                      <Chip
                        label={log.viewStatus}
                        size="small"
                        sx={{
                          backgroundColor: 
                            log.viewStatus === 'Viewed' ? '#4CAF50' : '#FF9800',
                          color: 'white',
                          fontWeight: 500,
                          fontSize: '11px',
                          fontFamily: 'Roboto, sans-serif',
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: '0.5', textAlign: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewLog(log);
                          }}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
              totalItems={totalLogs}
            />
          </Box>
        }
        grayMinHeight={showFilters ? '480px' : '560px'}
        whiteMinHeight={showFilters ? '720px' : '620px'}
      />

      {/* Log Detail Modal */}
      <Dialog
        open={logDetailOpen}
        onClose={() => setLogDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Timestamp</Typography>
                  <Typography variant="body1">{formatTimestamp(selectedLog.timestamp)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Action</Typography>
                  <Typography variant="body1">{selectedLog.action}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">User</Typography>
                  <Typography variant="body1">{selectedLog.username || 'System'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Table</Typography>
                  <Typography variant="body1">{selectedLog.tableName || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                  <Typography variant="body1">{selectedLog.description}</Typography>
                </Grid>
                {selectedLog.oldValues && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Previous Values</Typography>
                    <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                      <pre style={{ margin: 0, fontSize: '12px' }}>
                        {JSON.stringify(JSON.parse(selectedLog.oldValues), null, 2)}
                      </pre>
                    </Box>
                  </Grid>
                )}
                {selectedLog.newValues && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">New Values</Typography>
                    <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                      <pre style={{ margin: 0, fontSize: '12px' }}>
                        {JSON.stringify(JSON.parse(selectedLog.newValues), null, 2)}
                      </pre>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* QuickActionButton */}
      <QuickActionButton 
        onAddPatientRecord={handleAddPatientRecord}
        onAddAppointment={handleAddAppointment}
      />

      {/* Patient Modal */}
      <AddPatientRecord 
        open={showPatientModal} 
        onClose={() => setShowPatientModal(false)} 
      />
    </Box>
  );
}

export default Logs;