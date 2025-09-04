import React from 'react';
import { Box, Paper } from '@mui/material';

/**
 * Reusable DataTable component
 * Props:
 * - topContent: React node (search bar, filter buttons, etc.)
 * - tableHeader: React node (table header row)
 * - tableRows: React node (table rows)
 * - pagination: React node (pagination controls)
 * - grayMinHeight: string (minHeight for gray area)
 * - whiteMinHeight: string (minHeight for white area)
 */
export default function DataTable({
  topContent,
  tableHeader,
  tableRows,
  pagination,
  grayMinHeight = '560px',
  whiteMinHeight = '620px',
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        pb: 2,
      }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 'calc(100vw - 32px)',
          minHeight: whiteMinHeight,
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          transition: 'min-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Top controls (search/filter/add user) */}
        {topContent}
        {/* Table gray area */}
        <Box
          sx={{
            mx: 3,
            mt: 1,
            mb: 3,
            backgroundColor: '#dfdfdf',
            borderRadius: '10px',
            overflow: 'hidden',
            minHeight: grayMinHeight,
            display: 'flex',
            flexDirection: 'column',
            transition: 'min-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateZ(0)',
          }}
        >
          {/* Table header */}
          {tableHeader}
          {/* Table rows */}
          {tableRows}
          {/* Pagination */}
          {pagination}
        </Box>
      </Paper>
    </Box>
  );
}