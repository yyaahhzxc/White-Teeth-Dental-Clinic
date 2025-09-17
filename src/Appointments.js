import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Button, 
  Select, 
  MenuItem, 
  FormControl,
  Paper
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight,
  ArrowDropDown,
  Circle
} from '@mui/icons-material';
import Header from './header';
import QuickActionButton from './QuickActionButton';
import { API_BASE } from './apiConfig';

export default function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    fetchAppointmentsForWeek();
  }, [currentDate]);

 // Update the fetchAppointmentsForWeek function
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
          comments: apt.comments
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

 // Update the getAppointmentsForSlot function to handle overlapping appointments better
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
    
    // Check if appointment starts within this hour slot
    // This ensures each appointment only appears in one slot (where it starts)
    return aptStartMinutes >= slotStartMinutes && aptStartMinutes < slotEndMinutes;
  });
  
  console.log(`Appointments for day ${dayIndex}, slot ${timeSlot} (${hour24}:00):`, slotAppointments);
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

  // Debug: Show appointments count
  console.log('Current appointments state:', appointments);
  console.log('Appointments count:', appointments.length);

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
                onClick={() => navigateWeek(-1)} 
                disabled={loading}
                sx={{ color: '#5f6368', borderRadius: '50%', width: 40, height: 40 }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton 
                onClick={() => navigateWeek(1)} 
                disabled={loading}
                sx={{ color: '#5f6368', borderRadius: '50%', width: 40, height: 40 }}
              >
                <ChevronRight />
              </IconButton>
              <Typography variant="h6" sx={{ color: '#70757a', fontSize: '22px', fontWeight: '400', fontFamily: 'Inter, sans-serif', ml: 1 }}>
                {formatWeekRange(weekDates)}
                {loading && <Typography component="span" sx={{ ml: 1, fontSize: '14px', color: '#999' }}>Loading...</Typography>}
              </Typography>
              {/* Debug info */}
              <Typography variant="caption" sx={{ ml: 2, color: '#999' }}>
                Appointments: {appointments.length}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl variant="outlined" size="small">
                <Select
                  value="Week"
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
                                '&:hover': {
                                  opacity: 0.9
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
                      {dayIndex === todayIndex && timeIndicatorPosition !== null && (
                        <Box sx={{
                          position: 'absolute',
                          top: `${timeIndicatorPosition + 20}px`, // Add 20px to account for padding
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
        </Paper>
      </Box>
      
      <QuickActionButton />
    </Box>
  );
}