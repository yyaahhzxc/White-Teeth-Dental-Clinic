import React, { useState } from 'react';
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
  Snackbar,
  Alert
} from '@mui/material';
import { Close, AccessTime, CalendarToday, Edit } from '@mui/icons-material';
import TeethChart from '../components/TeethChart';

function LogAppointment({ open, onClose, appointment }) {
  const [activeTab, setActiveTab] = useState(0);
  const [editingField, setEditingField] = useState(null);
  const [successMessage, setSuccessMessage] = useState(false);
  
  // Mock patient data - will be replaced with actual data later
  const patientData = {
    firstName: 'Vince Demeer',
    middleName: 'Cauilan',
    lastName: 'Valmores',
    suffix: '',
    contactNumber: '09057274009',
    dateOfBirth: '11/14/2002',
    sex: 'M',
    address: 'Door #21, 2nd Floor Woolrich Bldg., Km. 5 Buhangin, Davao City',
    notes: 'Patient reports no major medical concerns affecting dental care. Noted impaction in the upper left and presence of a root fragment in the lower right. Routine monitoring and regular check-ups recommended.'
  };

  // Mock visit log data - will be replaced with actual data later
  const [visitLog, setVisitLog] = useState({
    date: '12/31/2025',
    timeStart: '1:00 PM',
    timeEnd: '1:00 PM',
    concern: 'Wisdom Tooth Extraction',
    attendingDentist: 'Dr. Sarah Gerona',
    proceduresDone: '',
    progressNotes: '',
    notes: ''
  });

  // Mock teeth data - will be replaced with actual data later
  const [teethData, setTeethData] = useState({
    selectedTeeth: [],
    toothSummaries: {},
    xrayFiles: ['Valmores-X-Ray-08-07-2025.png'],
    toothHistory: [
      { date: '08-12-2025', condition: 'Broken' },
      { date: '02-05-2025', condition: 'Malfunctioning tooth' }
    ]
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleLog = () => {
    // Create billing entry directly without opening the modal
    const billingEntry = {
      id: Date.now(), // Generate a unique ID
      dateCreated: visitLog.date,
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      totalBill: 1000.00, // Default amount, can be adjusted
      amountPaid: 0,
      balance: 1000.00,
      status: 'Unpaid',
      service: visitLog.concern,
    };

    // Save billing entry to local storage (frontend only)
    try {
      const existingBillings = JSON.parse(localStorage.getItem('billings') || '[]');
      existingBillings.push(billingEntry);
      localStorage.setItem('billings', JSON.stringify(existingBillings));
      console.log('Billing entry saved:', billingEntry);
      
      // Trigger custom event for billing table to refresh
      window.dispatchEvent(new CustomEvent('billingCreated', { detail: billingEntry }));
      
      // Show success message
      setSuccessMessage(true);
      
      // Close modal after a brief delay
      setTimeout(() => {
        setSuccessMessage(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error saving billing entry:', error);
    }
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
                        value={patientData.suffix}
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
                      value={patientData.middleName}
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
                      value={patientData.lastName}
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
                        value={patientData.contactNumber}
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
                        value={patientData.dateOfBirth}
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
                        value={patientData.sex}
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
                      value={patientData.address}
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
                      value={patientData.notes}
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
                        type="date"
                        value={visitLog.date}
                        onChange={(e) => setVisitLog({ ...visitLog, date: e.target.value })}
                        fullWidth
                        sx={{
                          '& .MuiInputBase-root': {
                            backgroundColor: 'transparent',
                            border: '4px solid #274fc7',
                            borderRadius: '4px'
                          }
                        }}
                      />
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
                  {/* Left Column - Teeth Chart Component (handles all three sections internally) */}
                  <Box>
                    <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '20px', mb: 2, fontWeight: 500 }}>
                      Teeth Chart
                    </Typography>
                    
                    {/* TeethChart component now handles: odontogram, selected teeth list, and tooth history */}
                    <TeethChart
                      selectedTeeth={teethData.selectedTeeth}
                      toothSummaries={teethData.toothSummaries}
                      onTeethChange={(selected) => setTeethData({ ...teethData, selectedTeeth: selected })}
                      readOnly={false}
                    />
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
                      {teethData.xrayFiles.length > 0 ? (
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
                              <input type="file" hidden accept="image/*" />
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
                            <input type="file" hidden accept="image/*" />
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

      {/* Success Message Snackbar */}
      <Snackbar 
        open={successMessage} 
        autoHideDuration={2000}
        onClose={() => setSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(false)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          Appointment logged successfully!
        </Alert>
      </Snackbar>
    </Dialog>
  );
}

export default LogAppointment;
