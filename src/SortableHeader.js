import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';

/**
 * SortableHeader Component
 * 
 * A reusable component for sortable table column headers.
 * Cycles through: normal -> ascending -> descending -> normal
 * 
 * @param {string} label - The text to display in the header
 * @param {string} sortKey - The key used for sorting the data
 * @param {object} currentSort - Current sort state {key, direction}
 * @param {function} onSort - Callback function when sort is triggered
 * @param {string} textAlign - Text alignment: 'left', 'center', 'right'
 * @param {function} customSort - Optional custom sort function (a, b, direction) => number
 * @param {boolean} sortable - Whether this column is sortable (default: true)
 * @param {object} sx - Additional styling
 */
export default function SortableHeader({ 
  label, 
  sortKey, 
  currentSort, 
  onSort, 
  textAlign = 'center',
  customSort = null,
  sortable = true,
  sx = {} 
}) {
  const handleSort = () => {
    if (!sortable) return;
    
    let newDirection = 'asc';
    
    if (currentSort.key === sortKey) {
      if (currentSort.direction === 'asc') {
        newDirection = 'desc';
      } else if (currentSort.direction === 'desc') {
        newDirection = null; // Reset to no sort
      }
    }
    
    onSort(newDirection ? { key: sortKey, direction: newDirection, customSort } : { key: null, direction: null, customSort: null });
  };

  const isActive = sortable && currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  return (
    <Box 
      sx={{ 
        flex: '1', 
        textAlign,
        display: 'flex',
        alignItems: 'center',
        justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
        cursor: sortable ? 'pointer' : 'default',
        userSelect: 'none',
        '&:hover': sortable ? {
          '& .sort-icon': {
            opacity: isActive ? 1 : 0.5,
          },
          '& .header-text': {
            color: '#5a5a5a',
          }
        } : {},
        ...sx
      }}
      onClick={sortable ? handleSort : undefined}
    >
      <Typography 
        className="header-text"
        sx={{ 
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 500,
          fontSize: '18px',
          color: isActive ? '#4A69BD' : '#6d6b80',
          lineHeight: '24px',
          letterSpacing: '0.5px',
          transition: 'color 0.2s ease',
        }}
      >
        {label}
      </Typography>
      
      <Box 
        className="sort-icon"
        sx={{ 
          ml: 0.5,
          display: sortable ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: isActive ? 1 : 0,
          transition: 'opacity 0.2s ease',
          width: '20px',
          height: '20px',
          position: 'relative',
        }}
      >
        {direction === 'asc' && (
          <KeyboardArrowDown 
            sx={{ 
              fontSize: '20px', 
              color: '#4A69BD',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }} 
          />
        )}
        {direction === 'desc' && (
          <KeyboardArrowUp 
            sx={{ 
              fontSize: '20px', 
              color: '#4A69BD',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }} 
          />
        )}
      </Box>
    </Box>
  );
}

/**
 * Utility function to sort data based on sort configuration
 * 
 * @param {array} data - Array of objects to sort
 * @param {object} sortConfig - Sort configuration {key, direction, customSort}
 * @returns {array} - Sorted array
 */
export const sortData = (data, sortConfig) => {
  if (!sortConfig.key || !sortConfig.direction) {
    return data;
  }

  return [...data].sort((a, b) => {
    // Use custom sort function if provided
    if (sortConfig.customSort && typeof sortConfig.customSort === 'function') {
      return sortConfig.customSort(a, b, sortConfig.direction);
    }
    
    const aValue = getNestedValue(a, sortConfig.key);
    const bValue = getNestedValue(b, sortConfig.key);
    
    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
    if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
    
    // Convert to strings for comparison (handles mixed types)
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Helper function to get nested object values
 * Supports dot notation like 'user.profile.name'
 */
const getNestedValue = (obj, key) => {
  return key.split('.').reduce((o, k) => (o || {})[k], obj);
};
