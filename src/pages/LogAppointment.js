import React, { useState, useEffect} from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Popover,
  InputAdornment
} from '@mui/material';
import { Close, AccessTime, CalendarToday, Edit } from '@mui/icons-material';
import TeethChart from '../components/TeethChart';
import Toast from '../components/Toast';
import DateCalendar from '../components/DateCalendar';
const API_BASE = 'http://localhost:3001';




function LogAppointment({ open, onClose, appointment, onAppointmentLogged }) {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visitDateCalendarAnchor, setVisitDateCalendarAnchor] = useState(null);
  
  // Toast state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    type: 'info'
  });

  const showToast = (message, type = 'info') => {
    setToast({ open: true, message, type });
  };

   // Initialize patientData with empty object to avoid null errors
   const [patientData, setPatientData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    contactNumber: '',
    dateOfBirth: '',
    sex: '',
    address: '',
    notes: ''
  });
  
  const [teethData, setTeethData] = useState({
    selectedTeeth: [],
    toothSummaries: {},
    xrayFiles: [],
    loadTimestamp: null // Add this
  });

  const [visitLog, setVisitLog] = useState({
    date: '',
    timeStart: '',
    timeEnd: '',
    concern: '',
    attendingDentist: 'Dr. Sarah Gerona',
    proceduresDone: '',
    progressNotes: '',
    notes: ''
  });

 // Fetch patient data when modal opens
useEffect(() => {
  if (open && appointment && appointment.patientId) {
    fetchPatientData();
    fetchToothChart();
    initializeVisitLog();
  }
}, [open, appointment]);

  const fetchPatientData = async () => {
    try {
      const response = await fetch(`${API_BASE}/patients/${appointment.patientId}/for-logging`);
      if (!response.ok) throw new Error('Failed to fetch patient data');
      const data = await response.json();
      setPatientData(data);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
  };

  const fetchToothChart = async () => {
    try {
      console.log('🔄 Fetching tooth chart for patient:', appointment.patientId);
      
      const response = await fetch(`${API_BASE}/tooth-chart/${appointment.patientId}/for-logging`);
      
      if (!response.ok) {
        console.warn('No tooth chart found, using empty data');
        setTeethData({
          selectedTeeth: [],
          toothSummaries: {},
          xrayFiles: [],
          loadTimestamp: Date.now()
        });
        return;
      }
      
      const data = await response.json();
      console.log('✅ Tooth chart data received:', data);
      console.log('Selected teeth:', data.selectedTeeth);
      console.log('Tooth summaries:', data.toothSummaries);
      
      setTeethData({
        selectedTeeth: Array.isArray(data.selectedTeeth) ? data.selectedTeeth : [],
        toothSummaries: typeof data.toothSummaries === 'object' ? data.toothSummaries : {},
        xrayFiles: Array.isArray(data.xrayFiles) ? data.xrayFiles : [],
        loadTimestamp: Date.now() // Add this
      });
      
      console.log('✅ Teeth data state updated');
    } catch (error) {
      console.error('❌ Error fetching tooth chart:', error);
      setTeethData({
        selectedTeeth: [],
        toothSummaries: {},
        xrayFiles: [],
        loadTimestamp: Date.now()
      });
    }
  };


  const initializeVisitLog = () => {
    if (!appointment) return;
  
    // Format date to YYYY-MM-DD for date input
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
  
    console.log('🔄 Initializing visit log with appointment data:', appointment);
  
    setVisitLog({
      date: appointment.appointmentDate ? formatDateForInput(appointment.appointmentDate) : '',
      timeStart: appointment.timeStart || '', // Keep 24h format for time input
      timeEnd: appointment.timeEnd || '',     // Keep 24h format for time input
      concern: appointment.comments || '',
      attendingDentist: 'Dr. Sarah Gerona',
      proceduresDone: '',
      progressNotes: '',
      notes: ''
    });
  
    console.log('✅ Visit log initialized');
  };






  const handleLog = async () => {
    setLoading(true);
    
    console.log('📝 Logging appointment...');
    console.log('Appointment ID:', appointment?.id);
    console.log('Visit Log Data:', visitLog);
    console.log('Teeth Data:', teethData);
    
    if (!appointment?.id) {
      showToast('No appointment selected', 'error');
      setLoading(false);
      return;
    }
    
    try {
      const url = `${API_BASE}/appointments/${appointment.id}/log`;
      console.log('🔄 POST request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visitLog,
          teethData
        })
      });
  
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Server error:', errorData);
        throw new Error(errorData.error || 'Failed to log appointment');
      }
      
      const result = await response.json();
      console.log('✅ Appointment logged successfully:', result);
      
      // Show success message
      showToast('Appointment logged successfully!', 'success');
      
      // Close modal and notify parent after delay
      setTimeout(() => {
        onClose();
        if (onAppointmentLogged) {
          onAppointmentLogged();
        }
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error logging appointment:', error);
      showToast(`Failed to log appointment: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };


  

  

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };



  

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '10px',
          backgroundColor: '#f9f9f9',
          maxWidth: '1200px',
          minHeight: '650px'
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {/* Title */}
        <Typography
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            fontSize: '32px',
            color: '#2148c0',
            textAlign: 'center',
            pt: 3,
            pb: 2
          }}
        >
          Log Appointment
        </Typography>

        {/* Tabs */}
        <Box sx={{ px: 3, mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab
              label="Patient Summary"
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: '20px',
                textTransform: 'none',
                borderRadius: '16px',
                border: '1px solid #2148c0',
                mr: 2,
                minHeight: '39px',
                backgroundColor: activeTab === 0 ? '#274fc7' : 'transparent',
                color: activeTab === 0 ? '#ffffff !important' : '#274fc7',
                '&:hover': {
                  backgroundColor: activeTab === 0 ? '#274fc7' : 'rgba(39, 79, 199, 0.1)'
                },
                '&.Mui-selected': {
                  color: '#ffffff !important'
                }
              }}
            />
            <Tab
              label="Visit Log"
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: '20px',
                textTransform: 'none',
                borderRadius: '16px',
                border: '1px solid #274fc7',
                mr: 2,
                minHeight: '39px',
                backgroundColor: activeTab === 1 ? '#274fc7' : 'transparent',
                color: activeTab === 1 ? '#ffffff !important' : '#274fc7',
                '&:hover': {
                  backgroundColor: activeTab === 1 ? '#274fc7' : 'rgba(39, 79, 199, 0.1)'
                },
                '&.Mui-selected': {
                  color: '#ffffff !important'
                }
              }}
            />
            <Tab
              label="Teeth Information"
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: '20px',
                textTransform: 'none',
                borderRadius: '16px',
                border: '1px solid #2148c0',
                minHeight: '39px',
                backgroundColor: activeTab === 2 ? '#274fc7' : 'transparent',
                color: activeTab === 2 ? '#ffffff !important' : '#274fc7',
                '&:hover': {
                  backgroundColor: activeTab === 2 ? '#274fc7' : 'rgba(39, 79, 199, 0.1)'
                },
                '&.Mui-selected': {
                  color: '#ffffff !important'
                }
              }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ px: 3, mb: 2 }}>
          {/* Patient Summary Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 800,
                  fontSize: '32px',
                  color: '#2148c0',
                  mb: 2
                }}
              >
                Patient Summary
              </Typography>
              
              <Box
                sx={{
                  backgroundColor: '#dfdfdf',
                  borderRadius: '10px',
                  p: 4,
                  minHeight: '492px'
                }}
              >
                <Box sx={{ display: 'grid', gap: 2 }}>
                  {/* First Name and Suffix */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '16.919px', mb: 0.5 }}>
                        First Name
                      </Typography>
                      <TextField
                        value={patientData.firstName}
                        disabled
                        fullWidth
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'white',
                            borderRadius: '5px'
                          }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '16.919px', mb: 0.5 }}>
                        Suffix
                      </Typography>
                      <TextField
                        value={patientData?.suffix || ''}
                        disabled
                        fullWidth
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'white',
                            borderRadius: '5px'
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Middle Name */}
                  <Box>
                    <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '16.919px', mb: 0.5 }}>
                      Middle Name
                    </Typography>
                    <TextField
                      value={patientData?.middleName || '' }
                      disabled
                      fullWidth
                      sx={{
                        '& .MuiInputBase-root': {
                          backgroundColor: 'white',
                          borderRadius: '5px'
                        }
                      }}
                    />
                  </Box>

                  {/* Last Name */}
                  <Box>
                    <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '16.919px', mb: 0.5 }}>
                      Last Name
                    </Typography>
                    <TextField
                      value={patientData?.lastName || ''}
                      disabled
                      fullWidth
                      sx={{
                        '& .MuiInputBase-root': {
                          backgroundColor: 'white',
                          borderRadius: '5px'
                        }
                      }}
                    />
                  </Box>

                  {/* Contact Number, Date of Birth, Sex */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.5fr', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '16.919px', mb: 0.5 }}>
                        Contact Number
                      </Typography>
                      <TextField
                        value={patientData?.contactNumber || ''}
                        disabled
                        fullWidth
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'white',
                            borderRadius: '5px'
                          }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '16.919px', mb: 0.5 }}>
                        Date of Birth
                      </Typography>
                      <TextField
                        value={patientData?.dateOfBirth || ''}
                        disabled
                        fullWidth
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'white',
                            borderRadius: '5px'
                          }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '16.919px', mb: 0.5 }}>
                        Sex
                      </Typography>
                      <TextField
                        value={patientData?.sex || ''}
                        disabled
                        fullWidth
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'white',
                            borderRadius: '5px'
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Address */}
                  <Box>
                    <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '16.919px', mb: 0.5 }}>
                      Address
                    </Typography>
                    <TextField
                      value={patientData?.address || ''}
                      disabled
                      fullWidth
                      sx={{
                        '& .MuiInputBase-root': {
                          backgroundColor: 'white',
                          borderRadius: '5px'
                        }
                      }}
                    />
                  </Box>

                  {/* Notes */}
                  <Box>
                    <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '16.919px', mb: 0.5 }}>
                      Notes
                    </Typography>
                    <TextField
                      value={patientData?.notes || ''}
                      disabled
                      fullWidth
                      multiline
                      rows={3}
                      sx={{
                        '& .MuiInputBase-root': {
                          backgroundColor: 'white',
                          borderRadius: '5px'
                        }
                      }}
                    />
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  sx={{
                    mt: 3,
                    backgroundColor: '#2148c0',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 800,
                    fontSize: '20.1px',
                    textTransform: 'capitalize',
                    borderRadius: '8px',
                    px: 3,
                    '&:hover': {
                      backgroundColor: '#1a3a9a'
                    }
                  }}
                >
                  View All
                </Button>
              </Box>
            </Box>
          )}

          {/* Visit Log Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography
                sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 800,
                  fontSize: '32px',
                  color: '#2148c0',
                  mb: 2
                }}
              >
                Visit Log
              </Typography>
              
              <Box
                sx={{
                  backgroundColor: '#dfdfdf',
                  borderRadius: '10px',
                  p: 4,
                  minHeight: '492px'
                }}
              >
                <Box sx={{ display: 'grid', gap: 3 }}>
                  {/* Date, Time Start, Time End */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    {/* Date */}
                    <Box>
                      <Box
                        sx={{
                          backgroundColor: '#274fc7',
                          borderRadius: '4px',
                          px: 1,
                          py: 0.5,
                          mb: 0.5,
                          display: 'inline-block'
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '12px',
                            color: '#fff',
                            fontWeight: 500
                          }}
                        >
                          Date
                        </Typography>
                      </Box>
                      <TextField
                        value={visitLog.date ? (() => {
                          const [yyyy, mm, dd] = visitLog.date.split('-');
                          return `${mm}-${dd}-${yyyy}`;
                        })() : ''}
                        onClick={(e) => setVisitDateCalendarAnchor(e.currentTarget)}
                        fullWidth
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={(e) => setVisitDateCalendarAnchor(e.currentTarget)} edge="end">
                                <CalendarToday sx={{ fontSize: 18 }} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                        placeholder="mm-dd-yyyy"
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'transparent',
                            border: '4px solid #274fc7',
                            borderRadius: '4px'
                          }
                        }}
                      />
                      <Popover
                        open={Boolean(visitDateCalendarAnchor)}
                        anchorEl={visitDateCalendarAnchor}
                        onClose={() => setVisitDateCalendarAnchor(null)}
                        anchorOrigin={{
                          vertical: (() => {
                            if (!visitDateCalendarAnchor) return 'bottom';
                            const rect = visitDateCalendarAnchor.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const spaceAbove = rect.top;
                            return spaceBelow > spaceAbove ? 'bottom' : 'top';
                          })(),
                          horizontal: 'left',
                        }}
                        transformOrigin={{
                          vertical: (() => {
                            if (!visitDateCalendarAnchor) return 'top';
                            const rect = visitDateCalendarAnchor.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const spaceAbove = rect.top;
                            return spaceBelow > spaceAbove ? 'top' : 'bottom';
                          })(),
                          horizontal: 'left',
                        }}
                      >
                        <Box sx={{ p: 2 }}>
                          <DateCalendar
                            value={visitLog.date ? new Date(visitLog.date) : null}
                            onChange={(date) => {
                              const yyyy = date.getFullYear();
                              const mm = String(date.getMonth() + 1).padStart(2, '0');
                              const dd = String(date.getDate()).padStart(2, '0');
                              setVisitLog({ ...visitLog, date: `${yyyy}-${mm}-${dd}` });
                              setVisitDateCalendarAnchor(null);
                            }}
                            maxDate={new Date()}
                          />
                        </Box>
                      </Popover>
                    </Box>

                    {/* Time Start */}
                    <Box>
                      <Box
                        sx={{
                          backgroundColor: '#274fc7',
                          borderRadius: '4px',
                          px: 1,
                          py: 0.5,
                          mb: 0.5,
                          display: 'inline-block'
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '12px',
                            color: '#fff',
                            fontWeight: 500
                          }}
                        >
                          Time Start
                        </Typography>
                      </Box>
                      <TextField
                        type="time"
                        value={visitLog.timeStart}
                        onChange={(e) => setVisitLog({ ...visitLog, timeStart: e.target.value })}
                        fullWidth
                        InputProps={{
                          endAdornment: <AccessTime sx={{ color: '#757575' }} />
                        }}
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'transparent',
                            border: '4px solid #274fc7',
                            borderRadius: '4px'
                          }
                        }}
                      />
                    </Box>

                    {/* Time End */}
                    <Box>
                      <Box
                        sx={{
                          backgroundColor: '#274fc7',
                          borderRadius: '4px',
                          px: 1,
                          py: 0.5,
                          mb: 0.5,
                          display: 'inline-block'
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '12px',
                            color: '#fff',
                            fontWeight: 500
                          }}
                        >
                          Time End
                        </Typography>
                      </Box>
                      <TextField
                        type="time"
                        value={visitLog.timeEnd}
                        onChange={(e) => setVisitLog({ ...visitLog, timeEnd: e.target.value })}
                        fullWidth
                        InputProps={{
                          endAdornment: <AccessTime sx={{ color: '#757575' }} />
                        }}
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'transparent',
                            border: '4px solid #274fc7',
                            borderRadius: '4px'
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Concern and Attending Dentist */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '14.81px', mb: 0.5 }}>
                        Concern
                      </Typography>
                      <TextField
                        value={visitLog.concern}
                        onChange={(e) => setVisitLog({ ...visitLog, concern: e.target.value })}
                        fullWidth
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'white',
                            borderRadius: '5px'
                          }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '14.81px', mb: 0.5 }}>
                        Attending Dentist
                      </Typography>
                      <TextField
                        value={visitLog.attendingDentist}
                        onChange={(e) => setVisitLog({ ...visitLog, attendingDentist: e.target.value })}
                        fullWidth
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'white',
                            borderRadius: '5px'
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Procedures Done and Progress Notes */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '14.81px', mb: 0.5 }}>
                        Procedures Done
                      </Typography>
                      <TextField
                        value={visitLog.proceduresDone}
                        onChange={(e) => setVisitLog({ ...visitLog, proceduresDone: e.target.value })}
                        fullWidth
                        multiline
                        rows={4}
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'white',
                            borderRadius: '5px'
                          }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '14.81px', mb: 0.5 }}>
                        Progress Notes
                      </Typography>
                      <TextField
                        value={visitLog.progressNotes}
                        onChange={(e) => setVisitLog({ ...visitLog, progressNotes: e.target.value })}
                        fullWidth
                        multiline
                        rows={4}
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'white',
                            borderRadius: '5px'
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Notes */}
                  <Box>
                    <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '14.81px', mb: 0.5 }}>
                      Notes
                    </Typography>
                    <TextField
                      value={visitLog.notes}
                      onChange={(e) => setVisitLog({ ...visitLog, notes: e.target.value })}
                      fullWidth
                      multiline
                      rows={3}
                      sx={{
                        '& .MuiInputBase-root': {
                          backgroundColor: 'white',
                          borderRadius: '5px'
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* Teeth Information Tab */}
  {activeTab === 2 && (
  <Box>
    <Typography
      sx={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 800,
        fontSize: '32px',
        color: '#2148c0',
        mb: 2
      }}
    >
      Teeth Information
    </Typography>


    
    <Box
      sx={{
        backgroundColor: '#dfdfdf',
        borderRadius: '10px',
        p: 4,
        minHeight: '492px'
      }}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {/* Left Column - Teeth Chart */}
        <Box>
          <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '20px', mb: 2, fontWeight: 500 }}>
            Teeth Chart
          </Typography>
          
          {open && appointment?.patientId && teethData.loadTimestamp ? (
            <TeethChart
              key={`${appointment.patientId}-${teethData.loadTimestamp}`}
              selectedTeeth={teethData.selectedTeeth}
              toothSummaries={teethData.toothSummaries}
              onTeethChange={(updatedTeeth) => {
                console.log('🔄 TeethChart update received:', updatedTeeth);
                setTeethData({
                  ...teethData,
                  selectedTeeth: updatedTeeth || []
                });
              }}
              readOnly={false}
            />
          ) : (
            <Box sx={{ backgroundColor: 'white', borderRadius: '8px', p: 2 }}>
              <Typography sx={{ textAlign: 'center', py: 4, color: '#666' }}>
                Loading tooth chart...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right Column - X-Ray Directory */}
        <Box>
          <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '20px', mb: 2, fontWeight: 500 }}>
            Teeth X-Ray Directory
          </Typography>
          
          <Box
            sx={{
              border: '2px dashed #999',
              borderRadius: '5px',
              p: 3,
              textAlign: 'center',
              minHeight: '150px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white'
            }}
          >
            {teethData.xrayFiles && teethData.xrayFiles.length > 0 ? (
              <Box sx={{ width: '100%' }}>
                {teethData.xrayFiles.map((file, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      mb: 1,
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px'
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: 'Raleway, sans-serif',
                          fontSize: '14.81px',
                          fontWeight: 500
                        }}
                      >
                        {file}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Raleway, sans-serif',
                          fontSize: '12px',
                          fontWeight: 300,
                          color: '#666'
                        }}
                      >
                        492kb
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small"
                      onClick={() => {
                        setTeethData({
                          ...teethData,
                          xrayFiles: teethData.xrayFiles.filter((_, i) => i !== index)
                        });
                      }}
                      sx={{
                        width: '20px',
                        height: '20px',
                        p: 0
                      }}
                    >
                      <Close sx={{ fontSize: '10px' }} />
                    </IconButton>
                  </Box>
                ))}
                <Box
                  sx={{
                    borderTop: '1px solid #ccc',
                    pt: 2,
                    mt: 2
                  }}
                >
                  <Button
                    variant="contained"
                    component="label"
                    sx={{
                      backgroundColor: '#2148c0',
                      fontSize: '10.813px',
                      textTransform: 'none',
                      fontFamily: 'Raleway, sans-serif',
                      fontWeight: 500,
                      mr: 1,
                      py: 0.5,
                      px: 2,
                      minWidth: 'auto',
                      '&:hover': {
                        backgroundColor: '#1a3a9a'
                      }
                    }}
                  >
                    Browse...
                    <input 
                      type="file" 
                      hidden 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setTeethData({
                            ...teethData,
                            xrayFiles: [...(teethData.xrayFiles || []), file.name]
                          });
                        }
                      }}
                    />
                  </Button>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: '10.813px',
                      fontWeight: 500
                    }}
                  >
                    or drop files here
                  </Typography>
                </Box>
              </Box>
            ) : (
              <>
                <Button
                  variant="contained"
                  component="label"
                  sx={{
                    backgroundColor: '#2148c0',
                    fontSize: '10.813px',
                    textTransform: 'none',
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 500,
                    mb: 1,
                    py: 0.5,
                    px: 2,
                    '&:hover': {
                      backgroundColor: '#1a3a9a'
                    }
                  }}
                >
                  Browse...
                  <input 
                    type="file" 
                    hidden 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setTeethData({
                          ...teethData,
                          xrayFiles: [file.name]
                        });
                      }
                    }}
                  />
                </Button>
                <Typography
                  sx={{
                    fontFamily: 'Raleway, sans-serif',
                    fontSize: '10.813px',
                    fontWeight: 500
                  }}
                >
                  or drop files here
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
)}
        </Box>

        {/* Log Button - Fixed to bottom */}
        <Box
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#f9f9f9'
          }}
        >
          <Button
            variant="contained"
            onClick={handleLog}
            sx={{
              backgroundColor: '#2148c0',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: '20.1px',
              textTransform: 'capitalize',
              borderRadius: '8px',
              px: 4,
              py: 1,
              '&:hover': {
                backgroundColor: '#1a3a9a'
              }
            }}
          >
            Log
          </Button>
        </Box>
      </DialogContent>

      {/* Toast */}
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Dialog>
  );
}

export default LogAppointment;
