import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

const GlobalToast = () => {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    const handleShowToast = (event) => {
      const { message, severity } = event.detail;
      setToast({ open: true, message, severity });
    };

    window.addEventListener('showGlobalToast', handleShowToast);
    return () => {
      window.removeEventListener('showGlobalToast', handleShowToast);
    };
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setToast((prev) => ({ ...prev, open: false }));
  };

  return (
    <Snackbar
      open={toast.open}
      autoHideDuration={3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ zIndex: 20000 }} // Highest z-index to be safe
    >
      <Alert onClose={handleClose} severity={toast.severity} sx={{ width: '100%' }}>
        {toast.message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalToast;
