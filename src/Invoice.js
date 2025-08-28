import React from 'react';
import { Box, Typography } from '@mui/material';
import Header from './header';

export default function Invoice() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: 'url("/White-Teeth-BG.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />
      <Box sx={{ p: 4, flex: 1 }}>
        <Typography variant="h4" sx={{ color: '#2148C0', fontWeight: 700 }}>
          Invoice
        </Typography>
        <Typography sx={{ mt: 2 }}>This is the invoice page placeholder.</Typography>
      </Box>
    </Box>
  );
}
