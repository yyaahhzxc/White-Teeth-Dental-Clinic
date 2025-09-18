import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

// FilterButton component - just the button
export function FilterButton({ onClick }) {
  return (
    <Button
      variant="contained"
      startIcon={<TuneIcon />}
      onClick={onClick}
      sx={{
        backgroundColor: '#4A69BD',
        color: 'white',
        border: '1px solid #4A69BD',
        borderRadius: '10px',
        height: '38px',
        px: 2,
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '16px',
        fontFamily: 'DM Sans, sans-serif',
        minWidth: 99,
        boxShadow: 1,
        '&:hover': {
          backgroundColor: '#2148c0',
          border: '1px solid #2148c0',
        },
      }}
    >
      Filter
    </Button>
  );
}

// FilterContent component - the filter form content
export function FilterContent({
  filterCategories = [],
  activeFilters = [{ category: '', type: '' }],
  onFilterChange
}) {
  // Handle filter category change
  const handleFilterCategoryChange = (idx, value) => {
    const newFilters = activeFilters.map((f, i) => 
      i === idx ? { category: value, type: '' } : f
    );
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Handle filter type change
  const handleFilterTypeChange = (idx, value) => {
    const newFilters = activeFilters.map((f, i) => 
      i === idx ? { ...f, type: value } : f
    );
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Add new filter
  const handleAddFilter = () => {
    const newFilters = [...activeFilters, { category: '', type: '' }];
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Remove filter
  const handleRemoveFilter = (idx) => {
    const newFilters = activeFilters.filter((_, i) => i !== idx);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  return (
    <Box sx={{
      background: '#f8f9fa',
      borderRadius: 2,
      mx: 3,
      mb: 2,
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
      transform: 'translateZ(0)', // Force hardware acceleration
      willChange: 'height', // Optimize for height changes
    }}>
      {activeFilters.map((filter, idx) => {
        const categoryObj = filterCategories.find(c => c.value === filter.category);
        return (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 1 }}>
            <Box sx={{ minWidth: 140 }}>
              <Typography variant="caption" sx={{ color: '#333', mb: 0.5 }}>Category</Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={filter.category}
                  onChange={e => handleFilterCategoryChange(idx, e.target.value)}
                  displayEmpty
                  sx={{ bgcolor: '#f5f5f5', color: '#333', borderRadius: 1 }}
                >
                  <MenuItem value="" disabled>Select category</MenuItem>
                  {filterCategories.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 180 }}>
              <Typography variant="caption" sx={{ color: '#333', mb: 0.5 }}>Type</Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={filter.type}
                  onChange={e => handleFilterTypeChange(idx, e.target.value)}
                  displayEmpty
                  sx={{ bgcolor: '#f5f5f5', color: '#333', borderRadius: 1 }}
                  disabled={!filter.category}
                >
                  <MenuItem value="" disabled>Select type</MenuItem>
                  {categoryObj && categoryObj.types.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', height: '40px' }}>
              <IconButton
                onClick={() => handleRemoveFilter(idx)}
                sx={{ bgcolor: '#B71C1C', color: '#fff', borderRadius: 1, '&:hover': { bgcolor: '#C62828' } }}
                size="small"
                disabled={activeFilters.length === 1}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        );
      })}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
        <Button
          onClick={handleAddFilter}
          startIcon={<AddIcon />}
          sx={{ 
            bgcolor: '#f5f5f5', 
            color: '#333', 
            borderRadius: 1, 
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            px: 2,
            py: 1,
            '&:hover': { bgcolor: '#e0e0e0' } 
          }}
          size="small"
        >
          Add Filter
        </Button>
      </Box>
    </Box>
  );
}

// Main FilterComponent that applies filters to data
export default function FilterComponent({
  filterCategories = [],
  data = [],
  onFilteredData,
  activeFilters = [{ category: '', type: '' }],
  showFilterBox = false
}) {
  // Helper function to compute age
  const computeAge = (birthDate) => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Apply filters to data
  useEffect(() => {
    if (onFilteredData && data.length > 0) {
      const validFilters = activeFilters.filter(f => f.category && f.type);
      
      if (validFilters.length === 0 || !showFilterBox) {
        onFilteredData(data);
        return;
      }

      const filtered = data.filter(item => {
        return validFilters.every(filter => {
          if (filter.category === 'ageRange') {
            const age = computeAge(item.dateOfBirth);
            const range = filter.type;
            switch (range) {
              case '0-18': return age >= 0 && age <= 18;
              case '19-35': return age >= 19 && age <= 35;
              case '36-50': return age >= 36 && age <= 50;
              case '51-65': return age >= 51 && age <= 65;
              case '65+': return age > 65;
              default: return true;
            }
          } else if (filter.category === 'priceRange') {
            const price = parseFloat(item.price) || 0;
            const range = filter.type;
            switch (range) {
              case '0-500': return price >= 0 && price <= 500;
              case '501-1000': return price >= 501 && price <= 1000;
              case '1001-2000': return price >= 1001 && price <= 2000;
              case '2001-5000': return price >= 2001 && price <= 5000;
              case '5000+': return price > 5000;
              default: return true;
            }
          } else if (filter.category === 'durationRange') {
            const duration = parseInt(item.duration) || 0;
            const range = filter.type;
            switch (range) {
              case '0-30 mins': return duration >= 0 && duration <= 30;
              case '31-60 mins': return duration >= 31 && duration <= 60;
              case '61-90 mins': return duration >= 61 && duration <= 90;
              case '91-120 mins': return duration >= 91 && duration <= 120;
              case '120+ mins': return duration > 120;
              default: return true;
            }
          } else {
            // Handle direct field matching (like status, type, sex, etc.)
            const itemValue = item[filter.category];
            return itemValue === filter.type;
          }
        });
      });

      onFilteredData(filtered);
    }
  }, [activeFilters, data, onFilteredData, showFilterBox]);

  return null; // This component only handles data filtering logic
}