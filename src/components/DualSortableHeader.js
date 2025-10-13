import React from 'react';
import { Box, Typography } from '@mui/material';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';

/**
 * DualSortableHeader Component
 * 
 * A specialized component for a column header with two independent sorting options.
 * Used for "First Name / Last Name" column where each name part can be sorted independently.
 * 
 * @param {string} firstSortKey - The key used for sorting the first part
 * @param {string} secondSortKey - The key used for sorting the second part
 * @param {object} currentSort - Current sort state {key, direction}
 * @param {function} onSort - Callback function when sort is triggered
 * @param {string} textAlign - Text alignment: 'left', 'center', 'right'
 * @param {object} sx - Additional styling
 */
export default function DualSortableHeader({ 
  firstSortKey, 
  secondSortKey, 
  currentSort, 
  onSort, 
  textAlign = 'center',
  sx = {} 
}) {
  const handleFirstSort = (e) => {
    e.stopPropagation();
    
    let newDirection = 'asc';
    
    if (currentSort.key === firstSortKey) {
      if (currentSort.direction === 'asc') {
        newDirection = 'desc';
      } else if (currentSort.direction === 'desc') {
        newDirection = null; // Reset to no sort
      }
    }
    
    onSort(newDirection ? { key: firstSortKey, direction: newDirection } : { key: null, direction: null });
  };

  const handleSecondSort = (e) => {
    e.stopPropagation();
    
    let newDirection = 'asc';
    
    if (currentSort.key === secondSortKey) {
      if (currentSort.direction === 'asc') {
        newDirection = 'desc';
      } else if (currentSort.direction === 'desc') {
        newDirection = null; // Reset to no sort
      }
    }
    
    onSort(newDirection ? { key: secondSortKey, direction: newDirection } : { key: null, direction: null });
  };

  const isFirstActive = currentSort.key === firstSortKey;
  const isSecondActive = currentSort.key === secondSortKey;
  const firstDirection = isFirstActive ? currentSort.direction : null;
  const secondDirection = isSecondActive ? currentSort.direction : null;

  return (
    <Box 
      sx={{ 
        flex: '1', 
        textAlign,
        display: 'flex',
        alignItems: 'center',
        justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
        userSelect: 'none',
        ...sx
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center', 
        width: '100%',
        gap: 0.5
      }}>
        {/* First Name Sortable Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': {
              '& .dual-first-header-text': {
                color: '#5a5a5a',
              }
            }
          }}
          onClick={handleFirstSort}
        >
          <Typography 
            className="dual-first-header-text"
            sx={{ 
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 500,
              fontSize: '18px',
              color: isFirstActive ? '#4A69BD' : '#6d6b80',
              lineHeight: '24px',
              letterSpacing: '0.5px',
              transition: 'color 0.2s ease',
            }}
          >
            First Name
          </Typography>
          
          {/* Only render icon when actively sorting */}
          {isFirstActive && (
            <Box 
              className="dual-first-sort-icon"
              sx={{ 
                ml: 0.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '20px',
                height: '20px',
                position: 'relative',
              }}
            >
              {firstDirection === 'asc' && (
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
              {firstDirection === 'desc' && (
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
          )}
        </Box>

        {/* Separator */}
        <Typography 
          sx={{ 
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 500,
            fontSize: '18px',
            color: '#6d6b80',
            lineHeight: '24px',
            letterSpacing: '0.5px',
          }}
        >
          /
        </Typography>

        {/* Last Name Sortable Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': {
              '& .dual-second-header-text': {
                color: '#5a5a5a',
              }
            }
          }}
          onClick={handleSecondSort}
        >
          <Typography 
            className="dual-second-header-text"
            sx={{ 
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 500,
              fontSize: '18px',
              color: isSecondActive ? '#4A69BD' : '#6d6b80',
              lineHeight: '24px',
              letterSpacing: '0.5px',
              transition: 'color 0.2s ease',
            }}
          >
            Last Name
          </Typography>
          
          {/* Only render icon when actively sorting */}
          {isSecondActive && (
            <Box 
              className="dual-second-sort-icon"
              sx={{ 
                ml: 0.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '20px',
                height: '20px',
                position: 'relative',
              }}
            >
              {secondDirection === 'asc' && (
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
              {secondDirection === 'desc' && (
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
          )}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Utility function to sort data with dual sorting support
 * Works with both regular sortData and dual sorting
 * 
 * @param {array} data - Array of objects to sort
 * @param {object} sortConfig - Sort configuration {key, direction}
 * @returns {array} - Sorted array
 */
export const sortDualData = (data, sortConfig) => {
  if (!sortConfig.key || !sortConfig.direction) {
    return data;
  }

  return [...data].sort((a, b) => {
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