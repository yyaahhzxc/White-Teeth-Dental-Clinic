
import React from 'react';
import { Box, Button, Typography, FormControl, Select, MenuItem } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

const Pagination = ({ page, totalPages, onPageChange, rowsPerPage, onRowsPerPageChange, activeColor, activeHoverColor }) => {
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
  const rowsPerPageOptions = [5, 10, 20, 50];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '10px',
        py: 0.75,
        minHeight: 38,
        px: 1.5,
  // boxShadow removed for flat appearance
      }}
    >
      {/* Show by dropdown */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '14px', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#7f7f7f', fontWeight: 500 }}>
          Show by
        </Typography>
        <FormControl size="small" sx={{ minWidth: 70 }}>
          <Select
            value={rowsPerPage}
            onChange={e => onRowsPerPageChange(Number(e.target.value))}
            sx={{
              fontSize: '14px',
              background: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.paper : 'white',
              borderRadius: 1,
              color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.primary : 'inherit',
              border: (theme) => theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : '1px solid #ddd',
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.paper : 'white',
                  color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.primary : 'inherit',
                }
              }
            }}
          >
            {rowsPerPageOptions.map(opt => (
              <MenuItem
                key={opt}
                value={opt}
                sx={{
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.paper : 'white',
                  color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.primary : 'inherit',
                }}
              >
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {/* Always show page navigation, but disable when only one page */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Button
          size="small"
          startIcon={<KeyboardArrowLeftIcon />}
          disabled={page === 0 || totalPages <= 1}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          sx={{ textTransform: 'none', mr: 1 }}
        >
          Previous
        </Button>
        {/* Always show at least page 1 */}
        {totalPages > 0 ? pageItems.map((item, idx) => {
          if (item === 'ellipsis') {
            return (
              <Typography key={`ellipsis-${idx}`} sx={{ mx: 0.5, color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.secondary : 'text.secondary' }}>
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
                    backgroundColor: (theme) => isActive ? (activeColor || (theme.palette.mode === 'dark' ? theme.palette.primary.main : '#1746A2')) : 'transparent',
                    color: (theme) => isActive ? (activeColor ? 'white' : 'white') : (theme.palette.mode === 'dark' ? theme.palette.text.primary : 'inherit'),
                borderColor: (theme) => theme.palette.mode === 'dark' ? theme.palette.divider : '#ddd',
                '&:hover': {
                      backgroundColor: (theme) => isActive ? (activeHoverColor || (theme.palette.mode === 'dark' ? theme.palette.primary.dark : '#1746A2')) : (theme.palette.mode === 'dark' ? theme.palette.action.hover : '#f4f4f4'),
                },
                textTransform: 'none',
                fontSize: '0.9rem',
              }}
            >
              {pageNumber}
            </Button>
          );
        }) : (
          <Button
            size="small"
            variant="contained"
            sx={{
              minWidth: 36,
              mx: 0.5,
              py: 0.5,
              px: 1,
              backgroundColor: (theme) => activeColor || (theme.palette.mode === 'dark' ? theme.palette.primary.main : '#1746A2'),
              color: 'white',
              textTransform: 'none',
              fontSize: '0.9rem',
            }}
          >
            1
          </Button>
        )}
        <Button
          size="small"
          endIcon={<KeyboardArrowRightIcon />}
          disabled={page >= totalPages - 1 || totalPages <= 1}
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
