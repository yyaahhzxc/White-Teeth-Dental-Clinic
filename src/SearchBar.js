import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Search...",
  searchFields = [],
  data = [],
  onFilteredData
}) {
  // Handle search input change
  const handleSearchChange = (e) => {
    const searchValue = e.target.value;
    onChange(searchValue);

    // Filter data based on search fields if provided
    if (onFilteredData && data.length > 0 && searchFields.length > 0) {
      const filtered = data.filter(item => {
        const searchTerm = searchValue.toLowerCase();
        return searchFields.some(field => {
          const fieldValue = getNestedValue(item, field);
          return fieldValue && fieldValue.toLowerCase().includes(searchTerm);
        });
      });
      onFilteredData(filtered);
    }
  };

  // Helper function to get nested object values (e.g., 'user.firstName')
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  };

  return (
    <TextField
      variant="outlined"
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={handleSearchChange}
      sx={{ 
        flex: 1,
        minWidth: 200,
        maxWidth: 400,
        m: 0,
        p: 0,
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#f3edf7',
          borderRadius: '10px',
          height: '38px',
          '& fieldset': {
            border: 'none',
          },
          '&:hover fieldset': {
            border: 'none',
          },
          '&.Mui-focused fieldset': {
            border: '1px solid #2148c0',
          },
        }
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search sx={{ color: '#7f7f7f' }} />
          </InputAdornment>
        ),
      }}
    />
  );
}