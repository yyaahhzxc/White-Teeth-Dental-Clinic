import React, { useState } from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

/**
 * Custom DateCalendar component
 * @param {Date} value - Currently selected date
 * @param {function} onChange - Callback when date is selected
 * @param {Date} minDate - Minimum selectable date
 * @param {Date} maxDate - Maximum selectable date
 */
const DateCalendar = ({ value, onChange, minDate, maxDate }) => {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState(value);
  const [pressedDates, setPressedDates] = useState(new Set());
  const [view, setView] = useState('day'); // 'day', 'month', 'year'
  const [animationOrigin, setAnimationOrigin] = useState('center');
  const [animationKey, setAnimationKey] = useState(0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isToday = (year, month, day) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === month &&
           today.getFullYear() === year;
  };

  const isWeekend = (dayIndex) => {
    return dayIndex === 0 || dayIndex === 6;
  };

  const isDisabled = (year, month, day) => {
    const date = new Date(year, month, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handleDateClick = (day, event) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    if (isDisabled(year, month, day)) return;

    // Calculate click position for animation
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const parentRect = event.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
      if (parentRect) {
        const x = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
        const y = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
        setAnimationOrigin(`${x}% ${y}%`);
      }
    }

    const newDate = new Date(year, month, day);
    setSelectedDate(newDate);
    
    const dateKey = `${year}-${month}-${day}`;
    setPressedDates(prev => new Set(prev).add(dateKey));
    
    if (onChange) {
      onChange(newDate);
    }
  };

  const handlePrevMonth = (event) => {
    // Set animation origin to the left for prev navigation
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const parentRect = event.currentTarget.parentElement.getBoundingClientRect();
      const x = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
      const y = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
      setAnimationOrigin(`${x}% ${y}%`);
    }
    
    setAnimationKey(prev => prev + 1);
    
    if (view === 'day') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    } else if (view === 'month') {
      setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth()));
    } else if (view === 'year') {
      const currentYear = currentMonth.getFullYear();
      const startYear = Math.floor(currentYear / 12) * 12;
      setCurrentMonth(new Date(startYear - 12, currentMonth.getMonth()));
    }
  };

  const handleNextMonth = (event) => {
    // Set animation origin to the right for next navigation
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const parentRect = event.currentTarget.parentElement.getBoundingClientRect();
      const x = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
      const y = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
      setAnimationOrigin(`${x}% ${y}%`);
    }
    
    setAnimationKey(prev => prev + 1);
    
    if (view === 'day') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    } else if (view === 'month') {
      setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth()));
    } else if (view === 'year') {
      const currentYear = currentMonth.getFullYear();
      const startYear = Math.floor(currentYear / 12) * 12;
      setCurrentMonth(new Date(startYear + 12, currentMonth.getMonth()));
    }
  };

  const handleHeaderClick = (event) => {
    // Calculate click position relative to the calendar container
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setAnimationOrigin(`${x}% ${y}%`);
    
    setAnimationKey(prev => prev + 1);
    
    if (view === 'day') {
      setView('month');
    } else if (view === 'month') {
      setView('year');
    }
  };

  const handleMonthClick = (monthIndex, event) => {
    // Calculate click position for zoom animation
    const rect = event.currentTarget.getBoundingClientRect();
    const parentRect = event.currentTarget.parentElement.getBoundingClientRect();
    const x = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
    const y = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
    setAnimationOrigin(`${x}% ${y}%`);
    
    setAnimationKey(prev => prev + 1);
    
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex));
    setView('day');
  };

  const handleYearClick = (year, event) => {
    // Calculate click position for zoom animation
    const rect = event.currentTarget.getBoundingClientRect();
    const parentRect = event.currentTarget.parentElement.getBoundingClientRect();
    const x = ((rect.left + rect.width / 2 - parentRect.left) / parentRect.width) * 100;
    const y = ((rect.top + rect.height / 2 - parentRect.top) / parentRect.height) * 100;
    setAnimationOrigin(`${x}% ${y}%`);
    
    setAnimationKey(prev => prev + 1);
    
    setCurrentMonth(new Date(year, currentMonth.getMonth()));
    setView('month');
  };

  const renderMonthView = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const isCurrentMonth = currentMonth.getMonth() === i;
      months.push(
        <Box
          key={i}
          onClick={(e) => handleMonthClick(i, e)}
          sx={{
            width: 70,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            cursor: 'pointer',
            bgcolor: isCurrentMonth ? '#2148c0' : 'transparent',
            color: isCurrentMonth ? '#fff' : '#000',
            fontWeight: isCurrentMonth ? 600 : 400,
            fontSize: '0.9rem',
            '&:hover': {
              bgcolor: isCurrentMonth ? '#2148c0' : 'rgba(33, 72, 192, 0.1)'
            },
            transition: 'all 0.2s'
          }}
        >
          {monthNames[i].substring(0, 3)}
        </Box>
      );
    }
    return months;
  };

  const renderYearView = () => {
    const currentYear = currentMonth.getFullYear();
    const startYear = Math.floor(currentYear / 12) * 12;
    const years = [];
    
    for (let i = 0; i < 12; i++) {
      const year = startYear + i;
      const isCurrentYear = currentYear === year;
      years.push(
        <Box
          key={year}
          onClick={(e) => handleYearClick(year, e)}
          sx={{
            width: 70,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            cursor: 'pointer',
            bgcolor: isCurrentYear ? '#2148c0' : 'transparent',
            color: isCurrentYear ? '#fff' : '#000',
            fontWeight: isCurrentYear ? 600 : 400,
            fontSize: '0.9rem',
            '&:hover': {
              bgcolor: isCurrentYear ? '#2148c0' : 'rgba(33, 72, 192, 0.1)'
            },
            transition: 'all 0.2s'
          }}
        >
          {year}
        </Box>
      );
    }
    return years;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    
    // Get previous and next month info
    const prevMonth = new Date(year, month - 1);
    const nextMonth = new Date(year, month + 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);

    const days = [];
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Start with Sunday

    // Week day headers
    for (let i = 0; i < 7; i++) {
      days.push(
        <Box
          key={`header-${i}`}
          sx={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: i === 0 ? '#d13858' : '#000'
          }}
        >
          {weekDays[i]}
        </Box>
      );
    }

    // Empty cells / Previous month dates (Sunday = 0)
    const adjustedFirstDay = firstDay; // No adjustment needed for Sunday start
    for (let i = 0; i < adjustedFirstDay; i++) {
      const prevDay = daysInPrevMonth - adjustedFirstDay + i + 1;
      days.push(
        <Box 
          key={`prev-${i}`} 
          sx={{ 
            width: 32, 
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ccc',
            opacity: 0.5,
            fontSize: '0.85rem'
          }}
        >
          {prevDay}
        </Box>
      );
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const isSelected = isSameDay(date, selectedDate);
      const isTodayDate = isToday(year, month, day);
      const disabled = isDisabled(year, month, day);
      const dateKey = `${year}-${month}-${day}`;
      const isPressed = pressedDates.has(dateKey);

      days.push(
        <Box
          key={day}
          onClick={(e) => handleDateClick(day, e)}
          sx={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: disabled ? '#ccc' : (dayOfWeek === 0 ? '#d13858' : '#000'),
            bgcolor: isPressed && !isSelected
              ? '#2148c0'
              : isSelected
              ? '#2148c0'
              : isTodayDate
              ? '#2196f3'
              : 'transparent',
            fontWeight: (isSelected || isTodayDate || isPressed) ? 600 : 400,
            fontSize: '0.85rem',
            '&:hover': disabled ? {} : {
              bgcolor: isSelected ? '#2148c0' : isPressed ? '#1e3aa0' : 'rgba(33, 72, 192, 0.1)'
            },
            transition: 'all 0.2s',
            opacity: disabled ? 0.3 : 1
          }}
        >
          {day}
        </Box>
      );
    }
    
    // Add next month dates to fill the grid
    const totalCells = adjustedFirstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
      days.push(
        <Box 
          key={`next-${i}`} 
          sx={{ 
            width: 32, 
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ccc',
            opacity: 0.5,
            fontSize: '0.85rem'
          }}
        >
          {i}
        </Box>
      );
    }

    return days;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 2,
        width: 'fit-content',
        minWidth: '260px',
        minHeight: '320px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Month/Year Header with Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton size="small" onClick={handlePrevMonth}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'color 0.2s',
            '&:hover': {
              color: '#2148c0'
            }
          }}
          onClick={handleHeaderClick}
        >
          {view === 'day' && `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}
          {view === 'month' && currentMonth.getFullYear()}
          {view === 'year' && `${Math.floor(currentMonth.getFullYear() / 12) * 12} - ${Math.floor(currentMonth.getFullYear() / 12) * 12 + 11}`}
        </Typography>
        <IconButton size="small" onClick={handleNextMonth}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Calendar Grid with animation */}
      <Box
        key={animationKey}
        sx={{
          display: 'grid',
          gridTemplateColumns: view === 'day' ? 'repeat(7, 32px)' : 'repeat(3, 70px)',
          gap: view === 'day' ? '4px' : '8px',
          justifyContent: 'center',
          minHeight: '240px',
          animation: view !== 'day' ? 'zoomOut 0.3s ease-out' : 'zoomIn 0.3s ease-out',
          transformOrigin: animationOrigin,
          '@keyframes zoomOut': {
            '0%': {
              transform: 'scale(1)',
              opacity: 0.8
            },
            '100%': {
              transform: 'scale(1)',
              opacity: 1
            }
          },
          '@keyframes zoomIn': {
            '0%': {
              transform: 'scale(0.8)',
              opacity: 0.8
            },
            '100%': {
              transform: 'scale(1)',
              opacity: 1
            }
          }
        }}
      >
        {view === 'day' && renderCalendar()}
        {view === 'month' && renderMonthView()}
        {view === 'year' && renderYearView()}
      </Box>
    </Paper>
  );
};

export default DateCalendar;
