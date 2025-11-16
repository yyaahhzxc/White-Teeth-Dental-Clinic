import React, { useEffect } from 'react';
import { Box, Fade } from '@mui/material';

/**
 * Toast notification component
 * @param {boolean} open - Whether the toast is visible
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
 * @param {function} onClose - Callback to close the toast
 */
const Toast = ({ open, message, type = 'info', onClose }) => {
  useEffect(() => {
    if (open && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return { bgcolor: '#e8f5e9', color: '#4caf50' };
      case 'error':
        return { bgcolor: '#ffcdd2', color: '#c62828' };
      case 'warning':
        return { bgcolor: '#FFE0B2', color: '#e65100' };
      case 'info':
        return { bgcolor: '#bbdefb', color: '#1565c0' };
      default:
        return { bgcolor: '#e0e0e0', color: '#424242' };
    }
  };

  // Parse message for list items (lines starting with -)
  const renderMessage = () => {
    if (typeof message !== 'string') return message;
    
    const lines = message.split('\n');
    if (lines.length === 1) {
      return message;
    }
    
    return (
      <Box>
        {lines.map((line, index) => {
          if (line.trim().startsWith('-')) {
            return (
              <Box key={index} sx={{ ml: 2 }}>
                {line}
              </Box>
            );
          }
          return (
            <Box key={index} sx={{ fontWeight: line.includes(':') ? 600 : 400 }}>
              {line}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Fade in={open} timeout={{ enter: 400, exit: 400 }}>
      <Box
        sx={{
          position: 'fixed',
          top: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          ...getToastStyles(),
          borderRadius: 2,
          py: 1,
          px: 3,
          fontWeight: 500,
          fontSize: '1.1rem',
          boxShadow: 3,
          zIndex: 2000,
          maxWidth: '500px',
          textAlign: 'center'
        }}
      >
        {renderMessage()}
      </Box>
    </Fade>
  );
};

export default Toast;
