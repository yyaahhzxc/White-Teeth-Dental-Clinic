import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

/**
 * Reusable Pagination Component
 * @param {Object} props
 * @param {number} props.page - Current page (0-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {function} props.onPageChange - Callback when page changes
 * @param {Object} props.sx - Additional styling
 */
import { FormControl, Select, MenuItem } from '@mui/material';

function Pagination({ page, totalPages, onPageChange, rowsPerPage, onRowsPerPageChange, rowsPerPageOptions = [5, 10, 25, 50], sx = {} }) {
  // Generate page items with ellipsis logic
  function getPageItems(current, total) {
    const pages = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (current <= 4) {
      for (let i = 2; i <= 5; i++) pages.push(i);
      pages.push('ellipsis');
      pages.push(total);
      return pages;
    }
    if (current >= total - 3) {
      pages.push('ellipsis');
      for (let i = total - 4; i <= total; i++) pages.push(i);
      return pages;
    }
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
  }

  const pageItems = getPageItems(page + 1, totalPages);

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only 1 page or less
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, ...sx }}>
      {/* Show by dropdown */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '14px', color: '#7f7f7f', fontWeight: 500 }}>
          Show by:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 70 }}>
          <Select
            value={rowsPerPage}
            onChange={e => onRowsPerPageChange(e.target.value)}
            sx={{
              height: '32px',
              backgroundColor: '#f3edf7',
              borderRadius: '8px',
              fontSize: '14px',
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #2148c0',
              },
            }}
          >
            {rowsPerPageOptions.map(opt => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Button
          size="small"
          startIcon={<KeyboardArrowLeftIcon />}
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          sx={{ textTransform: 'none', mr: 1 }}
        >
          Previous
        </Button>
        {pageItems.map((item, idx) => {
          if (item === 'ellipsis') {
            return (
              <Typography key={`ellipsis-${idx}`} sx={{ mx: 0.5, color: 'text.secondary' }}>
                ...
              </Typography>
            );
          }
          const pageNumber = Number(item);
          const zeroBased = pageNumber - 1;
          const isActive = zeroBased === page;
          return (
            <Button
              key={pageNumber}
              size="small"
              variant={isActive ? 'contained' : 'outlined'}
              onClick={() => onPageChange(zeroBased)}
              sx={{
                minWidth: 36,
                mx: 0.5,
                py: 0.5,
                px: 1,
                backgroundColor: isActive ? '#1746A2' : 'transparent',
                color: isActive ? 'white' : 'inherit',
                borderColor: '#ddd',
                '&:hover': {
                  backgroundColor: isActive ? '#1746A2' : '#f4f4f4',
                },
                textTransform: 'none',
                fontSize: '0.9rem',
              }}
            >
              {pageNumber}
            </Button>
          );
        })}
        <Button
          size="small"
          endIcon={<KeyboardArrowRightIcon />}
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          sx={{ textTransform: 'none', ml: 1 }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}

export default Pagination;
