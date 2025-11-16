import React, { useState, useEffect } from 'react';
import Toast from './Toast';

const GlobalToast = () => {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    const handleShowToast = (event) => {
      const { message, type } = event.detail;
      setToast({ open: true, message, type: type || 'success' });
    };

    window.addEventListener('showGlobalToast', handleShowToast);
    return () => {
      window.removeEventListener('showGlobalToast', handleShowToast);
    };
  }, []);

  return (
    <Toast 
      open={toast.open} 
      message={toast.message} 
      type={toast.type}
      onClose={() => setToast({ ...toast, open: false })}
    />
  );
};

export default GlobalToast;
