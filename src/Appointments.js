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

export default function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date('2025-09-16T14:30:00'));
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  
  const appointments = [
    {
      id: 1,
      patientName: 'Haytham Reyes',
      procedure: 'Wisdom Tooth',
      time: '12:00',
      day: 1, // Monday  
      status: 'ongoing',
      duration: 1
    },
    {
      id: 2,
      patientName: 'Drake Lamar',
      procedure: 'Halitosis',
      time: '14:00',
      day: 1, // Monday
      status: 'cancelled',
      duration: 1
    },
    {
      id: 3,
      patientName: 'Jan Kenneth Andao',
      procedure: 'Braces',
      time: '16:00',
      day: 2, // Tuesday
      status: 'ongoing',
      duration: 1
    },
    {
      id: 4,
      patientName: 'Vince Valmores',
      procedure: 'Tooth Replacement',
      time: '14:00',
      day: 3, // Wednesday
      status: 'done',
      duration: 2
    }
  ];

  const statusColors = {
    cancelled: '#ea4335',
    'partial paid': '#fbbc04', 
    done: '#0d652d',
    ongoing: '#1a73e8',
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

  const getAppointmentsForSlot = (dayIndex, timeSlot) => {
    // Parse time slot like "2 PM" or "11 AM"
    const [timeStr, period] = timeSlot.split(' ');
    const hour = parseInt(timeStr, 10);
    
    // Convert to 24-hour format
    let hour24;
    if (period === 'AM') {
      hour24 = hour === 12 ? 0 : hour;
    } else { // PM
      hour24 = hour === 12 ? 12 : hour + 12;
    }
    
    const timeString = `${hour24.toString().padStart(2, '0')}:00`;
    
    return appointments.filter(apt => 
      apt.day === dayIndex && apt.time === timeString
    );
  };

  const calculateCurrentTimePosition = () => {
    const now = currentTime;
    const startHour = 7; // 7 AM
    const slotHeight = 80; // 80px per slot
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    // Only show time indicator if current time is within business hours
    if (currentHour >= startHour && currentHour <= 22) {
      // Calculate which time slot we're in (0-based index)
      const slotIndex = currentHour - startHour;
      // Calculate position within the current hour (0-1)
      const progressWithinHour = currentMinutes / 60;
      // Compute pixel position relative to the top of the time grid container (no header offset)
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
              <IconButton onClick={() => navigateWeek(-1)} sx={{ color: '#5f6368', borderRadius: '50%', width: 40, height: 40 }}>
                <ChevronLeft />
              </IconButton>
              <IconButton onClick={() => navigateWeek(1)} sx={{ color: '#5f6368', borderRadius: '50%', width: 40, height: 40 }}>
                <ChevronRight />
              </IconButton>
              <Typography variant="h6" sx={{ color: '#70757a', fontSize: '22px', fontWeight: '400', fontFamily: 'Inter, sans-serif', ml: 1 }}>
                {formatWeekRange(weekDates)}
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
              
              {Object.entries(statusColors).map(([status, color]) => (
                <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Circle sx={{ color, fontSize: 16 }} />
                  <Typography variant="caption" sx={{ textTransform: 'capitalize', color: '#3c4043', fontWeight: '500', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                    {status}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Day Headers (Fixed/Sticky) */}
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
            {/* Combined scrollable area for entire calendar */}
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
              {/* Time Column */}
              <Box sx={{ width: '80px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                 {/* Add padding above first time slot to prevent header overlap */}
                 <Box sx={{ height: '20px', flexShrink: 0 }} />
                 {timeSlots.map((timeSlot, idx) => (
                   // removed borderTop here; long horizontal lines are drawn from the day columns and extend into this time column
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
                         zIndex: 3 // keep label above the shortened line
                       }}
                     >
                       {timeSlot}
                     </Typography>
                   </Box>
                 ))}
              </Box>

              {/* Day Columns */}
              <Box sx={{ flex: 1, display: 'flex', minHeight: '1280px' }}> {/* Fixed minimum height to ensure full coverage */}
                {weekDates.map((date, dayIndex) => (
                  <Box key={dayIndex} sx={{ 
                    flex: 1, 
                    borderLeft: '1px solid #e0e0e0', // Add border to all columns including Sunday
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    minHeight: '100%'
                  }}>
                    <Box sx={{ flex: 1, position: 'relative', minHeight: '1280px' }}>
                      {/* Add padding above first time slot to prevent header overlap */}
                      <Box sx={{ height: '20px', flexShrink: 0 }} />
                      {timeSlots.map((timeSlot, timeIndex) => (
                        <Box key={timeSlot} sx={{ height: '80px', p: 0, position: 'relative', flexShrink: 0 }}>
                          {/* long horizontal line that extends into the time column (left) so it becomes the main time/grid line */}
                          <Box sx={{ position: 'absolute', top: 0, left: '-24px', right: '12px', height: '1px', bgcolor: '#e0e0e0', zIndex: 1 }} />
                          {getAppointmentsForSlot(dayIndex, timeSlot).map((appointment) => (
                            <Paper
                              key={appointment.id}
                              elevation={0}
                              sx={{
                                p: '8px 12px',
                                backgroundColor: statusColors[appointment.status],
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
                                zIndex: 20, // above grid lines but below sticky header
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
                      
                      {/* Current Time Indicator - only show on today's column */}
                      {dayIndex === todayIndex && timeIndicatorPosition !== null && (
                        <Box sx={{
                          position: 'absolute',
                          top: `${timeIndicatorPosition}px`,
                          left: 0,
                          right: 0,
                          height: '2px',
                          bgcolor: '#ea4335',
                          zIndex: 10,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {/* Red circle indicator */}
                          <Box sx={{
                            position: 'absolute',
                            left: '-6px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            bgcolor: '#ea4335'
                          }}/>
                          {/* Red line extending across the column */}
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
