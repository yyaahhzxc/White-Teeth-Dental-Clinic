// MonthGrid component for month view
function MonthGrid({ appointments, currentDate, statusColors }) {
  // Get first day of month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  // Calculate grid: start from Sunday before first day, end on Saturday after last day
  const gridStart = new Date(year, month, 1 - firstDayOfWeek);
  const gridEnd = new Date(year, month, daysInMonth + (6 - lastDay.getDay()));
  const gridDates = [];
  let d = new Date(gridStart.getTime());
  while (d <= gridEnd) {
    gridDates.push(new Date(d.getTime()));
    d.setDate(d.getDate() + 1);
  }
  // Helper to get events for a date
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      const aptDateStr = apt.appointmentDate?.split('T')[0] || apt.appointmentDate;
      return aptDateStr === dateStr;
    });
  };
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Day names header */}
        {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((day) => (
          <Box key={day} sx={{ p: 1.5, textAlign: 'center', fontWeight: 700, color: '#70757a', fontSize: '15px', borderBottom: '1px solid #e0e0e0', background: '#fff' }}>{day}</Box>
        ))}
        {/* Month grid cells */}
        {gridDates.map((date, idx) => {
          const inMonth = date.getMonth() === month;
          const events = getEventsForDate(date);
          return (
            <Box key={idx} sx={{
              minHeight: 80,
              borderRight: (idx % 7 === 6) ? 'none' : '1px solid #e0e0e0',
              borderBottom: (idx >= gridDates.length - 7) ? 'none' : '1px solid #e0e0e0',
              background: inMonth ? '#fff' : '#f8f9fa',
              p: 1.5,
              position: 'relative',
              fontSize: '15px',
              verticalAlign: 'top',
            }}>
              <Typography sx={{ fontWeight: 600, color: inMonth ? '#3c4043' : '#bdbdbd', fontSize: '16px', mb: 0.5 }}>{date.getDate()}</Typography>
              {/* Events as simple rectangles */}
              {events.map(event => (
                <Box key={event.id} sx={{
                  mt: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '8px',
                  backgroundColor: statusColors[event.status] || '#0d652d',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  mb: 0.5,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
                }}>
                  <CalendarToday sx={{ fontSize: 16, mr: 1 }} />
                  {event.patientName ? `${event.patientName} - ${event.procedure}` : event.procedure}
                </Box>
              ))}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Button, 
  Select, 
  MenuItem, 
  FormControl,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Snackbar,
  Alert,
  TextField
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight,
  ArrowDropDown,
  Circle,
  Close,
  CalendarToday,
  AccessTime,
  Person,
  MedicalServices,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import Header from './header';
import QuickActionButton from './QuickActionButton';
import ViewRecord from './view-record';
import { API_BASE } from './apiConfig';

function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('Week');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  // Edit mode states
  const [editMode, setEditMode] = useState(false);
  const [editedAppointment, setEditedAppointment] = useState(null);
  // Services state
  const [services, setServices] = useState([]);
  // Visit log modal state
  const [visitLogModalOpen, setVisitLogModalOpen] = useState(false);
  
  // Visit log form state
  const [visitLogData, setVisitLogData] = useState({
    attendingDentist: 'Dr. Sarah Gerona',
    concern: '',
    proceduresDone: '',
    progressNotes: '',
    notes: ''
  });
  
  // Patient details modal state
  const [patientDetailsModalOpen, setPatientDetailsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientMedInfo, setPatientMedInfo] = useState(null);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState('Appointment updated successfully!');
  // Helper function to convert 24h to 12h format
  const convertTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  // Helper function to convert 12h to 24h format
  const convertTo24Hour = (time12) => {
    if (!time12) return '';
    const [time, modifier] = time12.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    fetchAppointmentsForWeek();
    fetchServices();
  }, [currentDate]);
  // Function to fetch services
  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_BASE}/service-table`);
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      } else {
        console.error('Failed to fetch services');
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  };
  // Function to fetch appointments
  const fetchAppointmentsForWeek = async () => {
    setLoading(true);
    try {
      const weekDates = getWeekDates(currentDate);
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];
      console.log('Fetching appointments for:', { startDate, endDate });
      const response = await fetch(`${API_BASE}/appointments/date-range?startDate=${startDate}&endDate=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Raw appointment data:', data);
        
        const transformedAppointments = data.map(apt => {
          const appointmentDate = new Date(apt.appointmentDate);
          const dayIndex = appointmentDate.getDay();
          
          // Calculate actual duration based on start and end times
          let calculatedDuration = 1; // Default to 1 hour
          
          if (apt.timeStart && apt.timeEnd) {
            const [startHour, startMin] = apt.timeStart.split(':').map(Number);
            const [endHour, endMin] = apt.timeEnd.split(':').map(Number);
            
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            
            const durationMinutes = endMinutes - startMinutes;
            // Convert to hours and round to nearest 0.5 hour for better display
            calculatedDuration = Math.max(0.5, Math.round((durationMinutes / 60) * 2) / 2);
          }
          
          const transformed = {
            id: apt.id,
            patientName: apt.patientName || `${apt.firstName || ''} ${apt.lastName || ''}`.trim(),
            procedure: apt.serviceName || 'No Service',
            time: apt.timeStart,
            day: dayIndex,
            status: apt.status ? apt.status.toLowerCase() : 'scheduled',
            duration: calculatedDuration,
            appointmentDate: apt.appointmentDate,
            timeStart: apt.timeStart,
            timeEnd: apt.timeEnd,
            comments: apt.comments,
            patientId: apt.patientId,
            serviceId: apt.serviceId
          };
          
          console.log('Transformed appointment:', transformed);
          return transformed;
        });
        
        console.log('All transformed appointments:', transformedAppointments);
        setAppointments(transformedAppointments);
      } else {
        console.error('Failed to fetch appointments:', response.status, response.statusText);
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit mode toggle
  const handleEditClick = () => {
    setEditMode(true);
    setEditedAppointment({ ...selectedAppointment });
  };

  // Handle saving changes
  const handleSaveClick = async () => {
    if (!editedAppointment) return;
    
    setUpdating(true);
    setUpdateError(null);
    
    try {
      const response = await fetch(`${API_BASE}/appointments/${editedAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentDate: editedAppointment.appointmentDate,
          timeStart: editedAppointment.timeStart,
          timeEnd: editedAppointment.timeEnd,
          comments: editedAppointment.comments,
          status: editedAppointment.status,
          serviceId: editedAppointment.serviceId
        }),
      });

      if (response.ok) {
        setSuccessMessage('Appointment updated successfully!');
        setUpdateSuccess(true);
        setEditMode(false);
        setEditedAppointment(null);
        
        // Refresh appointments data
        await fetchAppointmentsForWeek();
        setModalOpen(false);
        setSelectedAppointment(null);
      } else {
        const errorText = await response.text();
        console.error('Failed to update appointment:', response.status, response.statusText);
        setUpdateError(`Failed to update: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setUpdateError(`Network error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Handle input changes
  const handleEditChange = (field, value) => {
    setEditedAppointment(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle appointment click
  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAppointment(null);
    setEditMode(false);
    setEditedAppointment(null);
  };

  // Handle visit log modal
  const handleCloseVisitLogModal = () => {
    setVisitLogModalOpen(false);
  };

  // Handle opening visit log modal
  const handleOpenVisitLogModal = () => {
    if (selectedAppointment) {
      // Pre-populate form with appointment data
      setVisitLogData({
        attendingDentist: 'Dr. Sarah Gerona',
        concern: selectedAppointment.procedure || '',
        proceduresDone: '',
        progressNotes: '',
        notes: selectedAppointment.comments || ''
      });
    }
    setVisitLogModalOpen(true);
  };

  // Handle appointment logging
  const handleLogAppointment = async () => {
    if (!selectedAppointment) return;
    
    setUpdating(true);
    setUpdateError(null);
    
    try {
      // 1. Create visit log entry
      const visitLogResponse = await fetch(`${API_BASE}/visit-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedAppointment.patientId,
          appointmentId: selectedAppointment.id,
          visitDate: selectedAppointment.appointmentDate,
          timeStart: selectedAppointment.timeStart,
          timeEnd: selectedAppointment.timeEnd,
          attendingDentist: visitLogData.attendingDentist,
          concern: selectedAppointment.procedure, // Use the appointment's procedure as the concern
          proceduresDone: visitLogData.proceduresDone,
          progressNotes: visitLogData.progressNotes,
          notes: visitLogData.notes || selectedAppointment.comments
        }),
      });

      if (!visitLogResponse.ok) {
        throw new Error('Failed to create visit log');
      }

      // 2. Update appointment status to 'done'
      const appointmentResponse = await fetch(`${API_BASE}/appointments/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedAppointment,
          status: 'done'
        }),
      });

      if (appointmentResponse.ok) {
        setSuccessMessage('Appointment logged successfully!');
        setUpdateSuccess(true);
        setVisitLogModalOpen(false);
        setModalOpen(false);
        setSelectedAppointment(null);
        
        // Reset visit log form
        setVisitLogData({
          attendingDentist: 'Dr. Sarah Gerona',
          concern: '',
          proceduresDone: '',
          progressNotes: '',
          notes: ''
        });
        
        // Refresh appointments data
        await fetchAppointmentsForWeek();
      } else {
        const errorText = await appointmentResponse.text();
        console.error('Failed to update appointment status:', appointmentResponse.status, appointmentResponse.statusText);
        setUpdateError(`Failed to update appointment: ${appointmentResponse.status} ${appointmentResponse.statusText}`);
      }
    } catch (error) {
      console.error('Error logging appointment:', error);
      setUpdateError(`Error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Handler to open patient details modal
  const handleMoreInfoClick = async () => {
    if (!selectedAppointment?.patientId) return;
    
    try {
      // Fetch patient data
      const patientResponse = await fetch(`${API_BASE}/patients/${selectedAppointment.patientId}`);
      if (!patientResponse.ok) {
        throw new Error('Failed to fetch patient data');
      }
      const patientData = await patientResponse.json();
      
      // Fetch medical information
      const medResponse = await fetch(`${API_BASE}/medical-information/${selectedAppointment.patientId}`);
      let medData = null;
      if (medResponse.ok) {
        medData = await medResponse.json();
      }
      
      setSelectedPatient(patientData);
      setPatientMedInfo(medData);
      setPatientDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  // Handler to close patient details modal
  const handleClosePatientDetailsModal = () => {
    setPatientDetailsModalOpen(false);
    setSelectedPatient(null);
    setPatientMedInfo(null);
  };

  const statusColors = {
    cancelled: '#ea4335',
    canceled: '#ea4335',
    'partial paid': '#fbbc04', 
    done: '#0d652d',
    completed: '#0d652d',
    ongoing: '#1a73e8',
    scheduled: '#e8710a',
    upcoming: '#e8710a'
  };

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled', color: '#e8710a' },
    { value: 'ongoing', label: 'Ongoing', color: '#1a73e8' },
    { value: 'done', label: 'Done', color: '#0d652d' },
    { value: 'partial paid', label: 'Partial Paid', color: '#fbbc04' },
    { value: 'cancelled', label: 'Cancelled', color: '#ea4335' }
  ];

  const timeSlots = [
    '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM'
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);
  // For Day view we choose the middle day (Wednesday) of the weekDates array
  const getDisplayedDays = () => {
    if (calendarView === 'Day') {
      // Return the currently selected date (as a single-day array) so prev/next navigation
      // that modifies `currentDate` will correctly update the displayed day.
      return [new Date(currentDate)];
    }
    return weekDates;
  };
  const displayedDays = getDisplayedDays();

  const navigatePeriod = (direction) => {
    const newDate = new Date(currentDate);
    if (calendarView === 'Month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else if (calendarView === 'Day') {
      newDate.setDate(currentDate.getDate() + direction);
    } else {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatWeekRange = (dates) => {
    const start = dates[0];
    const end = dates[6];
    const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()}-${end.getDate()}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Format a single day label for Day view header
  const formatDayLabel = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getAppointmentsForSlot = (dayIndex, timeSlot) => {
    const [timeStr, period] = timeSlot.split(' ');
    const hour = parseInt(timeStr, 10);
    
    let hour24;
    if (period === 'AM') {
      hour24 = hour === 12 ? 0 : hour;
    } else {
      hour24 = hour === 12 ? 12 : hour + 12;
    }
    
    const slotAppointments = appointments.filter(apt => {
      if (apt.day !== dayIndex) return false;
      
      const [aptHour, aptMinute] = apt.time.split(':').map(Number);
      const aptStartMinutes = aptHour * 60 + aptMinute;
      const slotStartMinutes = hour24 * 60;
      const slotEndMinutes = slotStartMinutes + 60;
      
      return aptStartMinutes >= slotStartMinutes && aptStartMinutes < slotEndMinutes;
    });
    
    return slotAppointments;
  };

  const calculateCurrentTimePosition = () => {
    const now = currentTime;
    const startHour = 7;
    const slotHeight = 80;
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    if (currentHour >= startHour && currentHour <= 22) {
      const slotIndex = currentHour - startHour;
      const progressWithinHour = currentMinutes / 60;
      const pixelPosition = (slotIndex * slotHeight) + (progressWithinHour * slotHeight);
      return pixelPosition;
    }
    return null;
  };

  const timeIndicatorPosition = calculateCurrentTimePosition();
  const todayIndex = weekDates.findIndex(d => d.toDateString() === new Date().toDateString());
  const todayDay = new Date().getDay();

  return (
    <Box sx={{ bgcolor: '#2148c0', minHeight: '100vh' }}>
      <Header />
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        pb: 2,
        pt: 2
      }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 2,
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0px 60px 120px 0px rgba(38,51,77,0.05)',
            width: '100%',
            maxWidth: 'calc(100vw - 32px)',
            height: 'calc(100vh - 140px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Calendar Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button 
                variant="outlined" 
                onClick={goToToday}
                sx={{ 
                  borderColor: '#dadce0', 
                  color: '#3c4043',
                  textTransform: 'none',
                  boxShadow: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'Inter, sans-serif',
                  px: 3,
                  py: 0.5,
                  borderRadius: '4px',
                  '&:hover': {
                    bgcolor: '#f8f9fa',
                    borderColor: '#dadce0'
                  }
                }}
              >
                Today
              </Button>
              <IconButton 
                onClick={() => navigatePeriod(-1)} 
                disabled={loading}
                sx={{ color: '#5f6368', borderRadius: '50%', width: 40, height: 40 }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton 
                onClick={() => navigatePeriod(1)} 
                disabled={loading}
                sx={{ color: '#5f6368', borderRadius: '50%', width: 40, height: 40 }}
              >
                <ChevronRight />
              </IconButton>
              <Typography variant="h6" sx={{ color: '#70757a', fontSize: '22px', fontWeight: '400', fontFamily: 'Inter, sans-serif', ml: 1 }}>
                {calendarView === 'Month' ? formatMonthYear(currentDate) : (calendarView === 'Day' ? formatDayLabel(displayedDays && displayedDays[0]) : formatWeekRange(weekDates))}
                {loading && <Typography component="span" sx={{ ml: 1, fontSize: '14px', color: '#999' }}>Loading...</Typography>}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl variant="outlined" size="small">
                <Select
                  value={calendarView}
                  onChange={e => setCalendarView(e.target.value)}
                  IconComponent={ArrowDropDown}
                  sx={{ 
                    minWidth: 120,
                    borderRadius: '4px',
                    color: '#3c4043',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: '500',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: '#dadce0',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1a73e8',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#dadce0',
                    }
                  }}
                >
                  <MenuItem value="Week">Week</MenuItem>
                  <MenuItem value="Month">Month</MenuItem>
                  <MenuItem value="Day">Day</MenuItem>
                </Select>
              </FormControl>
              
              {Object.entries(statusColors).filter(([status]) => 
                !['canceled', 'completed'].includes(status)
              ).map(([status, color]) => (
                <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Circle sx={{ color, fontSize: 16 }} />
                  <Typography variant="caption" sx={{ textTransform: 'capitalize', color: '#3c4043', fontWeight: '500', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                    {status}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Day Headers or Month Grid */}
          {calendarView === 'Month' ? (
            <MonthGrid appointments={appointments} currentDate={currentDate} statusColors={statusColors} />
          ) : (
            <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'white' }}>
              <Box sx={{ width: '80px', height: '80px', flexShrink: 0, backgroundColor: 'white' }} />
              {displayedDays.map((date, dayIndex) => (
                <Box key={dayIndex} sx={{ 
                  flex: 1, 
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 0,
                  flexShrink: 0,
                  backgroundColor: 'white'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {date.toDateString() === new Date().toDateString() ? (
                      <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '20px', fontFamily: 'Inter, sans-serif' }}>{date.getDate()}</Typography>
                      </Box>
                    ) : (
                      <Typography sx={{ fontWeight: 700, fontFamily: 'Inter, sans-serif', fontSize: '28px', color: '#3c4043' }}>{date.getDate()}</Typography>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ color: '#70757a', fontFamily: 'Inter, sans-serif', fontSize: '12px', mt: 0.5, fontWeight: '600' }}>
                    {dayNames[date.getDay()]}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}


          {/* Calendar Grid */}
          {calendarView !== 'Month' && (
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
              {/* Time Column */}
              <Box sx={{ width: '80px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <Box sx={{ height: '20px', flexShrink: 0 }} />
                {timeSlots.map((timeSlot, idx) => (
                  <Box key={timeSlot} sx={{ height: '80px', position: 'relative', flexShrink: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#70757a',
                        fontWeight: '400',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '10px',
                        position: 'absolute',
                        left: 8,
                        top: 0,
                        transform: 'translateY(-50%)',
                        backgroundColor: 'white',
                        px: '6px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '2px',
                        zIndex: 3
                      }}
                    >
                      {timeSlot}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Day Columns */}
              <Box sx={{ flex: 1, display: 'flex', minHeight: '1280px' }}>
                {displayedDays.map((date, displayIdx) => (
                  <Box key={displayIdx} sx={{ 
                    flex: 1, 
                    borderLeft: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    minHeight: '100%'
                  }}>
                    <Box sx={{ flex: 1, position: 'relative', minHeight: '1280px' }}>
                      <Box sx={{ height: '20px', flexShrink: 0 }} />
                      {timeSlots.map((timeSlot, timeIndex) => (
                        <Box key={timeSlot} sx={{ height: '80px', p: 0, position: 'relative', flexShrink: 0 }}>
                          <Box sx={{ position: 'absolute', top: 0, left: '-24px', right: '12px', height: '1px', bgcolor: '#e0e0e0', zIndex: 1 }} />
                          {getAppointmentsForSlot(date.getDay(), timeSlot).map((appointment) => (
                            <Paper
                              key={appointment.id}
                              elevation={0}
                              onClick={() => handleAppointmentClick(appointment)}
                              sx={{
                                p: '8px 12px',
                                backgroundColor: statusColors[appointment.status] || statusColors.scheduled,
                                color: 'white',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                height: appointment.duration > 1 ? `calc(${appointment.duration * 80}px - 8px)` : 'calc(80px - 8px)',
                                overflow: 'hidden',
                                position: 'absolute',
                                left: '4px',
                                right: '4px',
                                top: '4px',
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                zIndex: 20,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)'
                                }
                              }}
                            >
                              <Typography sx={{ fontWeight: '500', fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: '18px' }}>
                                {appointment.patientName}
                              </Typography>
                              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', lineHeight: '16px', opacity: 0.9 }}>
                                {appointment.procedure}
                              </Typography>
                            </Paper>
                          ))}
                        </Box>
                      ))}
                      
                      {/* Current Time Indicator */}
                      {date.getDay() === todayDay && timeIndicatorPosition !== null && (
                        <Box sx={{
                          position: 'absolute',
                          top: `${timeIndicatorPosition + 20}px`,
                          left: 0,
                          right: 0,
                          height: '2px',
                          bgcolor: '#ea4335',
                          zIndex: 10,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <Box sx={{
                            position: 'absolute',
                            left: '-6px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            bgcolor: '#ea4335'
                          }}/>
                          <Box sx={{
                            width: '100%',
                            height: '2px',
                            bgcolor: '#ea4335'
                          }}/>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
          )}
        </Paper>
      </Box>
      
      {/* Appointment Details Modal */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0px 24px 48px rgba(0, 0, 0, 0.1)',
            maxWidth: '700px'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
          fontFamily: 'Inter, sans-serif',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          Appointment Details
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleOpenVisitLogModal}
              sx={{
                backgroundColor: '#2148C0',
                color: '#fff',
                textTransform: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: '600',
                px: 2,
                py: 1,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#3d5aa3'
                }
              }}
            >
              Log Appointment
            </Button>
            <IconButton
              color="primary"
              onClick={editMode ? handleSaveClick : handleEditClick}
              disabled={updating}
              sx={{
                borderRadius: 8,
                backgroundColor: '#2148C0',
                color: '#fff',
                px: 2,
                fontWeight: 'bold',
                fontSize: 18,
                '&:hover': {
                  backgroundColor: '#3d5aa3'
                }
              }}
            >
              {editMode ? <SaveIcon /> : <EditIcon />}
            </IconButton>
            <IconButton onClick={handleCloseModal} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        {selectedAppointment && (
          <DialogContent sx={{ pt: 2, pb: 3 }}>
            {/* Patient Info */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 4,
              p: 3,
              backgroundColor: '#f8f9fa',
              borderRadius: '12px'
            }}>
              <Person sx={{ color: '#5f6368', fontSize: 32 }} />
              <Box>
                <Typography variant="h6" sx={{ 
                  fontFamily: 'Inter, sans-serif', 
                  fontWeight: '600', 
                  fontSize: '20px',
                  color: '#202124'
                }}>
                  {selectedAppointment.patientName}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#5f6368', 
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px'
                }}>
                  Patient
                </Typography>
              </Box>
            </Box>

            {/* Form Fields Grid */}
            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* Date and Time Row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 3 }}>
                {/* Date */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarToday sx={{ color: '#5f6368', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ 
                      color: '#5f6368', 
                      fontFamily: 'Inter, sans-serif', 
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      Date
                    </Typography>
                  </Box>
                  {editMode ? (
                    <TextField
                      type="date"
                      value={editedAppointment?.appointmentDate || ''}
                      onChange={(e) => handleEditChange('appointmentDate', e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          fontFamily: 'Inter, sans-serif'
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ 
                      fontFamily: 'Inter, sans-serif', 
                      fontWeight: '500',
                      fontSize: '15px',
                      color: '#202124',
                      p: 1.5,
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px'
                    }}>
                      {new Date(selectedAppointment.appointmentDate).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
                
                {/* Time */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTime sx={{ color: '#5f6368', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ 
                      color: '#5f6368', 
                      fontFamily: 'Inter, sans-serif', 
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      Time
                    </Typography>
                  </Box>
                  {editMode ? (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <TextField
                        type="time"
                        value={editedAppointment?.timeStart || ''}
                        onChange={(e) => handleEditChange('timeStart', e.target.value)}
                        size="small"
                        sx={{ 
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            fontFamily: 'Inter, sans-serif'
                          }
                        }}
                      />
                      <Typography sx={{ color: '#5f6368', fontWeight: '500' }}>to</Typography>
                      <TextField
                        type="time"
                        value={editedAppointment?.timeEnd || ''}
                        onChange={(e) => handleEditChange('timeEnd', e.target.value)}
                        size="small"
                        sx={{ 
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            fontFamily: 'Inter, sans-serif'
                          }
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body1" sx={{ 
                      fontFamily: 'Inter, sans-serif', 
                      fontWeight: '500',
                      fontSize: '15px',
                      color: '#202124',
                      p: 1.5,
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px'
                    }}>
                      {convertTo12Hour(selectedAppointment.timeStart)} - {convertTo12Hour(selectedAppointment.timeEnd)}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Service and Status Row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
                {/* Service */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <MedicalServices sx={{ color: '#5f6368', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ 
                      color: '#5f6368', 
                      fontFamily: 'Inter, sans-serif', 
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      Service
                    </Typography>
                  </Box>
                  {editMode ? (
                    <FormControl size="small" fullWidth>
                      <Select
                        value={editedAppointment?.serviceId || ''}
                        onChange={(e) => {
                          const selectedService = services.find(s => s.id === e.target.value);
                          handleEditChange('serviceId', e.target.value);
                          if (selectedService) {
                            handleEditChange('procedure', selectedService.name);
                          }
                        }}
                        sx={{ 
                          borderRadius: '8px',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        {services.map((service) => (
                          <MenuItem key={service.id} value={service.id}>
                            {service.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body1" sx={{ 
                      fontFamily: 'Inter, sans-serif', 
                      fontWeight: '500',
                      fontSize: '15px',
                      color: '#202124',
                      p: 1.5,
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px'
                    }}>
                      {selectedAppointment.procedure}
                    </Typography>
                  )}
                </Box>

                {/* Status */}
                <Box>
                  <Typography variant="body2" sx={{ 
                    color: '#5f6368', 
                    fontFamily: 'Inter, sans-serif', 
                    fontSize: '13px',
                    fontWeight: '600',
                    mb: 1
                  }}>
                    Status
                  </Typography>
                  {editMode ? (
                    <FormControl size="small" fullWidth>
                      <Select
                        value={editedAppointment?.status || ''}
                        onChange={(e) => handleEditChange('status', e.target.value)}
                        sx={{ 
                          borderRadius: '8px',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        {statusOptions.map((status) => (
                          <MenuItem key={status.value} value={status.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Circle sx={{ color: status.color, fontSize: 12 }} />
                              {status.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip 
                      label={selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                      sx={{ 
                        backgroundColor: statusColors[selectedAppointment.status] || statusColors.scheduled,
                        color: 'white',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: '500',
                        width: '100%',
                        height: '40px'
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* Comments Full Width */}
              <Box>
                <Typography variant="body2" sx={{ 
                  color: '#5f6368', 
                  fontFamily: 'Inter, sans-serif', 
                  fontSize: '13px',
                  fontWeight: '600',
                  mb: 1
                }}>
                  Comments
                </Typography>
                {editMode ? (
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={editedAppointment?.comments || ''}
                    onChange={(e) => handleEditChange('comments', e.target.value)}
                    placeholder="Add comments..."
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif',
                        backgroundColor: '#f8f9fa'
                      }
                    }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ 
                    fontFamily: 'Inter, sans-serif', 
                    backgroundColor: '#f8f9fa', 
                    p: 2, 
                    borderRadius: '8px',
                    minHeight: '80px',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: selectedAppointment.comments ? '#202124' : '#5f6368'
                  }}>
                    {selectedAppointment.comments || 'No comments added'}
                  </Typography>
                )}
              </Box>
            </Box>
          </DialogContent>
        )}
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCloseModal}
            disabled={updating}
            sx={{ 
              color: '#5f6368',
              fontFamily: 'Inter, sans-serif',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success/Error Snackbars */}
      <Snackbar 
        open={updateSuccess} 
        autoHideDuration={3000} 
        onClose={() => setUpdateSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setUpdateSuccess(false)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!updateError} 
        autoHideDuration={6000} 
        onClose={() => setUpdateError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setUpdateError(null)} severity="error">
          {updateError}
        </Alert>
      </Snackbar>

      {/* Visit Log Modal */}
      <Dialog 
        open={visitLogModalOpen} 
        onClose={handleCloseVisitLogModal}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '10px',
            maxWidth: '1400px',
            width: '90vw',
            height: '85vh',
            maxHeight: 'none',
            backgroundColor: '#f9f9f9'
          }
        }}
      >
        <Box sx={{ 
          height: '100%', 
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          }
        }}>
          <Box sx={{ p: 3 }}>
            {/* Title */}
            <Typography 
              variant="h4" 
              sx={{ 
                textAlign: 'center',
                color: '#2148c0',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: '32px',
                mb: 3
              }}
            >
              Log Appointment
            </Typography>

            <Box sx={{ display: 'flex', gap: 3 }}>
              {/* Patient Summary - Left Side */}
              <Box sx={{ 
                flex: 1, 
                backgroundColor: '#dfdfdf', 
                borderRadius: '10px', 
                p: 3
              }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#2148c0',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 800,
                    fontSize: '32px',
                    mb: 3
                  }}
                >
                  Patient Summary
                </Typography>

                {selectedAppointment && (
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {/* Name Fields */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr', gap: 2 }}>
                      <Box>
                        <Typography sx={{ 
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          color: 'black',
                          mb: 0.5 
                        }}>
                          First Name
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'white', 
                          p: 1.5, 
                          borderRadius: '4px',
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          minHeight: '20px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {selectedAppointment.patientName?.split(' ')[0] || 'N/A'}
                        </Box>
                      </Box>
                      <Box>
                        <Typography sx={{ 
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          color: 'black',
                          mb: 0.5 
                        }}>
                          Suffix
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'white', 
                          p: 1.5, 
                          borderRadius: '4px',
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          minHeight: '20px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {/* Suffix would come from patient data */}
                        </Box>
                      </Box>
                    </Box>

                    <Box>
                      <Typography sx={{ 
                        fontFamily: 'Raleway, sans-serif', 
                        fontWeight: 500, 
                        fontSize: '14.81px',
                        color: 'black',
                        mb: 0.5 
                      }}>
                        Middle Name
                      </Typography>
                      <Box sx={{ 
                        backgroundColor: 'white', 
                        p: 1.5, 
                        borderRadius: '4px',
                        fontFamily: 'Raleway, sans-serif', 
                        fontWeight: 500, 
                        fontSize: '14.81px',
                        minHeight: '20px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {/* Middle name would come from patient data */}
                      </Box>
                    </Box>

                    <Box>
                      <Typography sx={{ 
                        fontFamily: 'Raleway, sans-serif', 
                        fontWeight: 500, 
                        fontSize: '14.81px',
                        color: 'black',
                        mb: 0.5 
                      }}>
                        Last Name
                      </Typography>
                      <Box sx={{ 
                        backgroundColor: 'white', 
                        p: 1.5, 
                        borderRadius: '4px',
                        fontFamily: 'Raleway, sans-serif', 
                        fontWeight: 500, 
                        fontSize: '14.81px',
                        minHeight: '20px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {selectedAppointment.patientName?.split(' ').slice(1).join(' ') || 'N/A'}
                      </Box>
                    </Box>

                    {/* Contact and Personal Info */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography sx={{ 
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          color: 'black',
                          mb: 0.5 
                        }}>
                          Contact Number
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'white', 
                          p: 1.5, 
                          borderRadius: '4px',
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          minHeight: '20px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {/* Contact would come from patient data */}
                        </Box>
                      </Box>
                      <Box>
                        <Typography sx={{ 
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          color: 'black',
                          mb: 0.5 
                        }}>
                          Date of Birth
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'white', 
                          p: 1.5, 
                          borderRadius: '4px',
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          minHeight: '20px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {/* DOB would come from patient data */}
                        </Box>
                      </Box>
                      <Box>
                        <Typography sx={{ 
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          color: 'black',
                          mb: 0.5 
                        }}>
                          Sex
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'white', 
                          p: 1.5, 
                          borderRadius: '4px',
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          minHeight: '20px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {/* Sex would come from patient data */}
                        </Box>
                      </Box>
                    </Box>

                    <Box>
                      <Typography sx={{ 
                        fontFamily: 'Raleway, sans-serif', 
                        fontWeight: 500, 
                        fontSize: '14.81px',
                        color: 'black',
                        mb: 0.5 
                      }}>
                        Address
                      </Typography>
                      <Box sx={{ 
                        backgroundColor: 'white', 
                        p: 1.5, 
                        borderRadius: '4px',
                        fontFamily: 'Raleway, sans-serif', 
                        fontWeight: 500, 
                        fontSize: '14.81px',
                        minHeight: '20px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {/* Address would come from patient data */}
                      </Box>
                    </Box>

                    <Box>
                      <Typography sx={{ 
                        fontFamily: 'Raleway, sans-serif', 
                        fontWeight: 500, 
                        fontSize: '14.81px',
                        color: 'black',
                        mb: 0.5 
                      }}>
                        Notes
                      </Typography>
                      <Box sx={{ 
                        backgroundColor: 'white', 
                        p: 1.5, 
                        borderRadius: '4px',
                        fontFamily: 'Raleway, sans-serif', 
                        fontWeight: 500, 
                        fontSize: '14.81px',
                        minHeight: '80px',
                        display: 'flex',
                        alignItems: 'flex-start'
                      }}>
                        {/* Notes would come from patient data */}
                      </Box>
                    </Box>

                    <Box>
                      <Typography sx={{ 
                        fontFamily: 'Raleway, sans-serif', 
                        fontWeight: 500, 
                        fontSize: '14.81px',
                        color: 'black',
                        mb: 1 
                      }}>
                        X-Ray Uploads
                      </Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        sx={{ 
                          mt: 1,
                          color: '#2148C0',
                          borderColor: '#2148C0',
                          textTransform: 'none',
                          fontFamily: 'Raleway, sans-serif',
                          fontWeight: 500,
                          fontSize: '14px',
                          '&:hover': {
                            borderColor: '#3d5aa3',
                            backgroundColor: '#f5f7fa'
                          }
                        }}
                      >
                        Upload File
                        <input
                          type="file"
                          hidden
                          accept=".jpg,.jpeg,.png,.pdf"
                        />
                      </Button>
                    </Box>

                    {/* More Info Button - After X-Ray Directory, flush right */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: '#2148C0',
                          color: '#fff',
                          textTransform: 'none',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '20.1px',
                          fontWeight: 800,
                          px: 3,
                          py: 1.5,
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundColor: '#3d5aa3'
                          }
                        }}
                        onClick={handleMoreInfoClick}
                      >
                        More Info
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Visit Log - Right Side */}
              <Box sx={{ 
                flex: 1, 
                backgroundColor: '#dfdfdf', 
                borderRadius: '10px', 
                p: 3
              }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#2148c0',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 800,
                    fontSize: '32px',
                    mb: 3
                  }}
                >
                  Visit Log
                </Typography>

                {selectedAppointment && (
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {/* Date and Time */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography sx={{ 
                          fontFamily: 'Roboto, sans-serif', 
                          fontWeight: 400, 
                          fontSize: '12px',
                          color: 'white',
                          backgroundColor: '#274fc7',
                          px: 1,
                          py: 0.5,
                          borderRadius: '2px',
                          mb: 0.5,
                          width: 'fit-content'
                        }}>
                          Date
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'white', 
                          p: 1.5, 
                          border: '3px solid #274fc7',
                          borderRadius: '4px',
                          fontFamily: 'Roboto, sans-serif', 
                          fontWeight: 400, 
                          fontSize: '16px',
                          minHeight: '20px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-US', {
                            month: '2-digit',
                            day: '2-digit', 
                            year: 'numeric'
                          })}
                        </Box>
                      </Box>
                      <Box>
                        <Typography sx={{ 
                          fontFamily: 'Roboto, sans-serif', 
                          fontWeight: 400, 
                          fontSize: '12px',
                          color: 'white',
                          backgroundColor: '#274fc7',
                          px: 1,
                          py: 0.5,
                          borderRadius: '2px',
                          mb: 0.5,
                          width: 'fit-content'
                        }}>
                          Time Start
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'white', 
                          p: 1.5, 
                          border: '3px solid #274fc7',
                          borderRadius: '4px',
                          fontFamily: 'Roboto, sans-serif', 
                          fontWeight: 400, 
                          fontSize: '16px',
                          minHeight: '20px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {convertTo12Hour(selectedAppointment.timeStart)}
                        </Box>
                      </Box>
                      <Box>
                        <Typography sx={{ 
                          fontFamily: 'Roboto, sans-serif', 
                          fontWeight: 400, 
                          fontSize: '12px',
                          color: 'white',
                          backgroundColor: '#274fc7',
                          px: 1,
                          py: 0.5,
                          borderRadius: '2px',
                          mb: 0.5,
                          width: 'fit-content'
                        }}>
                          Time End
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'white', 
                          p: 1.5, 
                          border: '3px solid #274fc7',
                          borderRadius: '4px',
                          fontFamily: 'Roboto, sans-serif', 
                          fontWeight: 400, 
                          fontSize: '16px',
                          minHeight: '20px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {convertTo12Hour(selectedAppointment.timeEnd)}
                        </Box>
                      </Box>
                    </Box>

                    {/* Attending Dentist and Concern */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography sx={{ 
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          color: 'black',
                          mb: 0.5 
                        }}>
                          Attending Dentist
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'white', 
                          p: 1.5, 
                          borderRadius: '4px',
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          minHeight: '20px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          Dr. Sarah Gerona
                        </Box>
                      </Box>
                      <Box>
                        <Typography sx={{ 
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          color: 'black',
                          mb: 0.5 
                        }}>
                          Concern
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: 'white', 
                          p: 1.5, 
                          borderRadius: '4px',
                          fontFamily: 'Raleway, sans-serif', 
                          fontWeight: 500, 
                          fontSize: '14.81px',
                          minHeight: '20px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {selectedAppointment.procedure}
                        </Box>
                      </Box>
                    </Box>

                    {/* Procedures Done */}
                    <Box>
                      <Typography sx={{ 
                        fontFamily: 'Raleway, sans-serif', 
                        fontWeight: 500, 
                        fontSize: '14.81px',
                        color: 'black',
                        mb: 0.5 
                      }}>
                        Procedures Done
                      </Typography>
                      <TextField
                        multiline
                        rows={3}
                        fullWidth
                        value={visitLogData.proceduresDone}
                        onChange={(e) => setVisitLogData(prev => ({
                          ...prev,
                          proceduresDone: e.target.value
                        }))}
                        placeholder="Enter procedures performed during this visit..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            fontFamily: 'Raleway, sans-serif',
                            fontSize: '14.81px',
                            minHeight: '80px'
                          }
                        }}
                      />
                    </Box>

                    {/* Progress Notes */}
                    <Box>
                      <Typography sx={{ 
                        fontFamily: 'Raleway, sans-serif', 
                        fontWeight: 500, 
                        fontSize: '14.81px',
                        color: 'black',
                        mb: 0.5 
                      }}>
                        Progress Notes
                      </Typography>
                      <TextField
                        multiline
                        rows={3}
                        fullWidth
                        value={visitLogData.progressNotes}
                        onChange={(e) => setVisitLogData(prev => ({
                          ...prev,
                          progressNotes: e.target.value
                        }))}
                        placeholder="Enter patient progress and observations..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            fontFamily: 'Raleway, sans-serif',
                            fontSize: '14.81px',
                            minHeight: '80px'
                          }
                        }}
                      />
                    </Box>

                    {/* Notes */}
                    <Box>
                      <Typography sx={{ 
                        fontFamily: 'Raleway, sans-serif', 
                        fontWeight: 500, 
                        fontSize: '14.81px',
                        color: 'black',
                        mb: 0.5 
                      }}>
                        Notes
                      </Typography>
                      <TextField
                        multiline
                        rows={4}
                        fullWidth
                        value={visitLogData.notes}
                        onChange={(e) => setVisitLogData(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        placeholder="Additional notes and comments..."
                        defaultValue={selectedAppointment?.comments || ''}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            fontFamily: 'Raleway, sans-serif',
                            fontSize: '14.81px',
                            minHeight: '100px'
                          }
                        }}
                      />
                    </Box>

                    {/* Log Button - After Notes, flush right */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        onClick={handleLogAppointment}
                        disabled={updating}
                        sx={{
                          backgroundColor: '#2148C0',
                          color: '#fff',
                          textTransform: 'none',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '20.1px',
                          fontWeight: 800,
                          px: 3,
                          py: 1.5,
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundColor: '#3d5aa3'
                          }
                        }}
                      >
                        {updating ? 'Logging...' : 'Log'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Dialog>
      
      {/* Patient Details Modal */}
      <ViewRecord
        open={patientDetailsModalOpen}
        onClose={handleClosePatientDetailsModal}
        patient={selectedPatient}
        medInfo={patientMedInfo}
        onRecordUpdated={() => {
          // Optionally refresh data if patient info is updated
          console.log('Patient record updated');
        }}
      />
      
      <QuickActionButton />
    </Box>
  );
}

export default Appointments;