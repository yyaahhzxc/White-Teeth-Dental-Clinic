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

  const handleDateClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    if (isDisabled(year, month, day)) return;

    const newDate = new Date(year, month, day);
    setSelectedDate(newDate);
    
    const dateKey = `${year}-${month}-${day}`;
    setPressedDates(prev => new Set(prev).add(dateKey));
    
    if (onChange) {
      onChange(newDate);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
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
    const weekDays = ['S', 'S', 'M', 'T', 'W', 'T', 'F']; // Start with Saturday

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
            color: i === 1 ? '#d13858' : '#000'
          }}
        >
          {weekDays[i]}
        </Box>
      );
    }

    // Empty cells / Previous month dates (Saturday = 0)
    const adjustedFirstDay = (firstDay + 1) % 7; // Adjust for Saturday start
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
          onClick={() => handleDateClick(day)}
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
        width: 'fit-content'
      }}
    >
      {/* Month/Year Header with Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton size="small" onClick={handlePrevMonth}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Typography>
        <IconButton size="small" onClick={handleNextMonth}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Calendar Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 32px)',
          gap: '4px',
          justifyContent: 'center'
        }}
      >
        {renderCalendar()}
      </Box>
    </Paper>
  );
};

export default DateCalendar;
