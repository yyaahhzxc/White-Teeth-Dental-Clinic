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
import Header from '../components/header';
import QuickActionButton from '../components/QuickActionButton';
import { API_BASE } from '../apiConfig';


// Add this utility function at the top of Appointments.js after your imports
const normalizeDateFromStorage = (dateString) => {
  if (!dateString) return new Date();
  // Parse date in local timezone to avoid UTC conversion issues
  const date = new Date(dateString + 'T00:00:00');
  return date;
};

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// MonthGrid component for month view
function MonthGrid({ appointments, currentDate, statusColors, onAppointmentClick }) {
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
  
  // Helper to get events for a date - FIXED to use parseLocalDate
  const getEventsForDate = (date) => {
    const targetDateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      // Use parseLocalDate to avoid timezone issues
      const aptDate = parseLocalDate(apt.appointmentDate.split('T')[0]);
      const aptDateStr = aptDate.toISOString().split('T')[0];
      return aptDateStr === targetDateStr;
    });
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
        {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((day) => (
          <Box key={day} sx={{ p: 1.5, textAlign: 'center', fontWeight: 700, color: '#70757a', fontSize: '15px', borderBottom: '1px solid #e0e0e0', background: '#fff' }}>
            {day}
          </Box>
        ))}
        {gridDates.map((date, idx) => {
          const events = getEventsForDate(date);
          const isCurrentMonth = date.getMonth() === month;
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <Box key={idx} sx={{ 
              minHeight: '120px', 
              p: 1, 
              borderBottom: '1px solid #e0e0e0',
              borderRight: idx % 7 !== 6 ? '1px solid #e0e0e0' : 'none',
              background: isCurrentMonth ? '#fff' : '#f8f9fa'
            }}>
              <Typography sx={{ 
                fontWeight: isToday ? 700 : 400,
                color: isToday ? '#1a73e8' : (isCurrentMonth ? '#202124' : '#5f6368'),
                fontSize: '14px',
                mb: 0.5
              }}>
                {date.getDate()}
              </Typography>
              {events.slice(0, 3).map((event, eventIdx) => (
                <Box key={eventIdx}
                onClick={() => onAppointmentClick(event)}
                sx={{
                  backgroundColor: statusColors[event.status] || statusColors.scheduled,
                  color: 'white',
                  p: 0.5,
                  mb: 0.5,
                  borderRadius: '4px',
                  fontSize: '11px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {event.patientName}
                </Box>
              ))}
              {events.length > 3 && (
                <Typography sx={{ fontSize: '10px', color: '#5f6368' }}>
                  +{events.length - 3} more
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

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

  // ...existing code...

  const refreshAppointments = () => {
    if (calendarView === 'Week') {
      fetchAppointmentsForWeek();
    } else if (calendarView === 'Month') {
      fetchAppointmentsForMonth();
    }
  };

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

  // Function to fetch services
  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_BASE}/services`);
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

  // Function to fetch appointments for week
  const fetchAppointmentsForWeek = async () => {
    setLoading(true);
    try {
      const weekDates = getWeekDates(currentDate);
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];

      console.log('Fetching appointments for week:', { startDate, endDate });
      const response = await fetch(`${API_BASE}/appointments/date-range?startDate=${startDate}&endDate=${endDate}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw appointment data:', data);
        
        const transformedAppointments = data.map(apt => {
          const apptDate = parseLocalDate(apt.appointmentDate);
          const dayIndex = apptDate.getDay();

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

  // Function to fetch appointments for month
  const fetchAppointmentsForMonth = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      console.log('Fetching appointments for month:', { startDate, endDate });
      const response = await fetch(`${API_BASE}/appointments/date-range?startDate=${startDate}&endDate=${endDate}`);
      
      if (response.ok) {
        const data = await response.json();
        const transformedAppointments = data.map(apt => ({
          id: apt.id,
          patientName: apt.patientName || `${apt.firstName || ''} ${apt.lastName || ''}`.trim(),
          procedure: apt.serviceName || 'No Service',
          time: apt.timeStart,
          status: apt.status ? apt.status.toLowerCase() : 'scheduled',
          appointmentDate: apt.appointmentDate,
          timeStart: apt.timeStart,
          timeEnd: apt.timeEnd,
          comments: apt.comments,
          patientId: apt.patientId,
          serviceId: apt.serviceId
        }));
        
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

  // Listen for appointment updates from other components
  useEffect(() => {
    const handleAppointmentAdded = () => {
      refreshAppointments();
    };

    // Listen for custom events
    window.addEventListener('appointmentAdded', handleAppointmentAdded);
    window.addEventListener('appointmentUpdated', handleAppointmentAdded);

    return () => {
      window.removeEventListener('appointmentAdded', handleAppointmentAdded);
      window.removeEventListener('appointmentUpdated', handleAppointmentAdded);
    };
  }, [calendarView]);

  // Effect to update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Effect to fetch data when date or view changes
  useEffect(() => {
    if (calendarView === 'Week') {
      fetchAppointmentsForWeek();
    } else {
      fetchAppointmentsForMonth();
    }
    fetchServices();
  }, [currentDate, calendarView]);

  // ...existing code...

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
      const requestData = {
        appointmentDate: editedAppointment.appointmentDate,
        timeStart: editedAppointment.timeStart,
        timeEnd: editedAppointment.timeEnd,
        comments: editedAppointment.comments,
        status: editedAppointment.status,
        serviceId: editedAppointment.serviceId
      };
      
      console.log('Saving appointment with data:', requestData);
      console.log('Appointment ID:', editedAppointment.id);
      
      const response = await fetch(`${API_BASE}/appointments/${editedAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (response.ok) {
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          console.log('Response is not JSON:', responseText);
        }
        
        setUpdateSuccess(true);
        setEditMode(false);
        setEditedAppointment(null);
        
        // Refresh appointments data
        if (calendarView === 'Week') {
          await fetchAppointmentsForWeek();
        } else {
          await fetchAppointmentsForMonth();
        }
        setModalOpen(false);
        setSelectedAppointment(null);
      } else {
        console.error('Failed to update appointment:', response.status, response.statusText);
        console.error('Error response:', responseText);
        setUpdateError(`Failed to update: ${response.status} ${response.statusText}\n${responseText}`);
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

  const statusColors = {
    cancelled: '#ea4335',
    done: '#0d652d',
    ongoing: '#1a73e8',
    scheduled: '#e8710a'
  };

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled', color: '#e8710a' },
    { value: 'done', label: 'Done', color: '#0d652d' },
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

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
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

  // FIXED: Get appointments for a specific day slot using actual date comparison
  const getAppointmentsForSlot = (dayIndex, timeSlot) => {
    const [timeStr, period] = timeSlot.split(' ');
    const hour = parseInt(timeStr, 10);
    
    let hour24;
    if (period === 'AM') {
      hour24 = hour === 12 ? 0 : hour;
    } else {
      hour24 = hour === 12 ? 12 : hour + 12;
    }
    
    // Get the actual date for this day column
    const currentDisplayDate = weekDates[dayIndex];
    const targetDateStr = currentDisplayDate.toISOString().split('T')[0];
    
    const slotAppointments = appointments.filter(apt => {
      // Compare actual dates instead of day of week
      const aptDateStr = apt.appointmentDate.split('T')[0];
      if (aptDateStr !== targetDateStr) return false;
      
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
                onClick={() => calendarView === 'Week' ? navigateWeek(-1) : navigateMonth(-1)} 
                disabled={loading}
                sx={{ color: '#5f6368', borderRadius: '50%', width: 40, height: 40 }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton 
                onClick={() => calendarView === 'Week' ? navigateWeek(1) : navigateMonth(1)} 
                disabled={loading}
                sx={{ color: '#5f6368', borderRadius: '50%', width: 40, height: 40 }}
              >
                <ChevronRight />
              </IconButton>
              <Typography variant="h6" sx={{ color: '#70757a', fontSize: '22px', fontWeight: '400', fontFamily: 'Inter, sans-serif', ml: 1 }}>
                {calendarView === 'Week' ? formatWeekRange(weekDates) : formatMonthYear(currentDate)}
                {loading && <Typography component="span" sx={{ ml: 1, fontSize: '14px', color: '#999' }}>Loading...</Typography>}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl variant="outlined" size="small">
                <Select
                  value={calendarView}
                  onChange={(e) => setCalendarView(e.target.value)}
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

          {/* Render Calendar View */}
          {calendarView === 'Month' ? (
            <MonthGrid 
              appointments={appointments}
              currentDate={currentDate}
              statusColors={statusColors}
              onAppointmentClick={handleAppointmentClick}
            />
          ) : (
            <>
              {/* Day Headers */}
              <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'white' }}>
                <Box sx={{ width: '80px', height: '80px', flexShrink: 0, backgroundColor: 'white' }} />
                {weekDates.map((date, dayIndex) => (
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
                      {dayNames[dayIndex]}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Calendar Grid */}
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
                    {weekDates.map((date, dayIndex) => (
                      <Box key={dayIndex} sx={{ 
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
                              {getAppointmentsForSlot(dayIndex, timeSlot).map((appointment) => (
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
                          
                          {/* FIXED: Current Time Indicator */}
                          {date.toDateString() === new Date().toDateString() && timeIndicatorPosition !== null && (
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
            </>
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
      
      <QuickActionButton />
    </Box>
  );
}

export default Appointments;