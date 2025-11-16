// CREATE THIS NEW FILE

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PrintIcon from '@mui/icons-material/Print';

const API_BASE = 'http://localhost:3001';

function InvoiceGallery({ open, onClose, billingId, billingData }) {
  const [invoices, setInvoices] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && billingId) {
      fetchInvoices();
    }
  }, [open, billingId]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/billings/${billingId}/invoices`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      const data = await response.json();
      console.log('📄 Fetched invoices:', data);
      setInvoices(data);
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : invoices.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < invoices.length - 1 ? prev + 1 : 0));
  };

  const handlePrint = () => {
    window.print();
  };

  const currentInvoice = invoices[currentIndex];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '90vh',
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            color: '#1a1a1a',
          }}
        >
          Invoice Gallery
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
            }}
          >
            <CircularProgress />
          </Box>
        ) : invoices.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '18px',
                color: '#666',
              }}
            >
              No invoices found for this billing
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#999',
              }}
            >
              Click the billing to create an invoice
            </Typography>
          </Box>
        ) : (
          <>
            {/* Invoice Display */}
            <Box sx={{ p: 4, minHeight: '500px' }}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                }}
              >
                {/* Invoice Header */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 800,
                      color: '#2148c0',
                      mb: 1,
                    }}
                  >
                    INVOICE
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      color: '#666',
                    }}
                  >
                    {currentInvoice?.invoiceNumber || 'N/A'}
                  </Typography>
                </Box>

                {/* Patient & Date Info */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 4,
                    pb: 3,
                    borderBottom: '2px solid #e0e0e0',
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#999',
                        mb: 1,
                      }}
                    >
                      PATIENT
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#1a1a1a',
                      }}
                    >
                      {billingData?.firstName} {billingData?.lastName}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      sx={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#999',
                        mb: 1,
                      }}
                    >
                      INVOICE DATE
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#1a1a1a',
                      }}
                    >
                      {currentInvoice?.invoiceDate
                        ? new Date(currentInvoice.invoiceDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                {/* Payment Details */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    sx={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#1a1a1a',
                      mb: 2,
                    }}
                  >
                    Payment Details
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 2,
                      p: 3,
                      backgroundColor: '#f9fafc',
                      borderRadius: '8px',
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: '#666',
                          mb: 0.5,
                        }}
                      >
                        Amount Paid
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '20px',
                          fontWeight: 700,
                          color: '#4CAF50',
                        }}
                      >
                        ₱{Number(currentInvoice?.amountPaid || 0).toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: '#666',
                          mb: 0.5,
                        }}
                      >
                        Payment Method
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#1a1a1a',
                        }}
                      >
                        {currentInvoice?.paymentMethod || 'N/A'}
                      </Typography>
                    </Box>
                    {currentInvoice?.dueDate && (
                      <Box>
                        <Typography
                          sx={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            color: '#666',
                            mb: 0.5,
                          }}
                        >
                          Due Date
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1a1a1a',
                          }}
                        >
                          {new Date(currentInvoice.dueDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Notes */}
                {currentInvoice?.notes && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      sx={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#1a1a1a',
                        mb: 1,
                      }}
                    >
                      Notes
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#666',
                        p: 2,
                        backgroundColor: '#f9fafc',
                        borderRadius: '8px',
                      }}
                    >
                      {currentInvoice.notes}
                    </Typography>
                  </Box>
                )}

                {/* Total Bill Summary */}
                <Box
                  sx={{
                    mt: 4,
                    pt: 3,
                    borderTop: '2px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#666',
                    }}
                  >
                    Total Bill
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#1a1a1a',
                    }}
                  >
                    ₱{Number(billingData?.totalBill || 0).toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#666',
                    }}
                  >
                    Remaining Balance
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '24px',
                      fontWeight: 700,
                      color: billingData?.balance > 0 ? '#F44336' : '#4CAF50',
                    }}
                  >
                    ₱{Number(billingData?.balance || 0).toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>
              </Paper>
            </Box>

            {/* Navigation Controls */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 3,
                borderTop: '1px solid #e0e0e0',
                backgroundColor: '#f9fafc',
              }}
            >
              <IconButton
                onClick={handlePrevious}
                disabled={invoices.length <= 1}
                sx={{
                  backgroundColor: '#2148c0',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1a3ba8',
                  },
                  '&:disabled': {
                    backgroundColor: '#e0e0e0',
                    color: '#999',
                  },
                }}
              >
                <ChevronLeftIcon />
              </IconButton>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#666',
                  }}
                >
                  Invoice {currentIndex + 1} of {invoices.length}
                </Typography>
                <IconButton
                  onClick={handlePrint}
                  sx={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#45a049',
                    },
                  }}
                >
                  <PrintIcon />
                </IconButton>
              </Box>

              <IconButton
                onClick={handleNext}
                disabled={invoices.length <= 1}
                sx={{
                  backgroundColor: '#2148c0',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1a3ba8',
                  },
                  '&:disabled': {
                    backgroundColor: '#e0e0e0',
                    color: '#999',
                  },
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default InvoiceGallery;