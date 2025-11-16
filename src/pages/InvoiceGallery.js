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


const printStyles = `
  @media print {
    /* Hide everything */
    body * {
      visibility: hidden;
    }
    
    /* Show only printable content */
    #printable-invoice,
    #printable-invoice * {
      visibility: visible;
    }
    
    /* Position printable content at top of page */
    #printable-invoice {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    
    /* Hide MUI dialog chrome */
    .MuiDialog-root .MuiBackdrop-root,
    .MuiDialog-paper {
      box-shadow: none !important;
      background: white !important;
    }
  }
`;

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
          width: '650px', // Fixed width instead of maxWidth="md"
      maxWidth: '90vw', // Responsive on smaller screens
        }
      }}
    >
        {/* ADD THIS STYLE TAG */}
  <style>{printStyles}</style>

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
    id="printable-invoice"
    elevation={0}
    sx={{
      p: 0,
      backgroundColor: '#fff',
      border: '0.5px solid #d7dae0',
      borderRadius: 0,
    }}
  >
    {/* Clinic Header */}
    <Box sx={{ 
      p: '20px 32px',
      backgroundColor: '#fff',
      borderBottom: '1px solid #d9d9d9'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Box
          component="img"
          src="/White-Teeth-Logo.png"
          alt="Clinic Logo"
          sx={{ 
            width: 56, 
            height: 56, 
            objectFit: 'contain',
            flexShrink: 0
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            fontWeight: 600,
            color: '#2148c0',
            lineHeight: 'normal'
          }}>
            White Teeth Dental Clinic
          </Typography>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 400,
            color: '#5e6470',
            lineHeight: '14px'
          }}>
            whiteteethdavao@gmail.com
          </Typography>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 400,
            color: '#5e6470',
            lineHeight: '14px'
          }}>
            0970 550 3902
          </Typography>
        </Box>
      </Box>
      <Typography sx={{ 
        fontFamily: 'Raleway, sans-serif',
        fontSize: '8px',
        fontWeight: 500,
        color: '#5e6470',
        textAlign: 'right',
        lineHeight: 'normal'
      }}>
        Door #21, 2nd Floor Woolrich Bldg., Km. 5 Buhangin, Davao City
      </Typography>
    </Box>

    {/* Main Invoice Content */}
    <Box sx={{ p: '20px 16px' }}>
      {/* Top Row: Billed to, Invoice number, Invoice of */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '56px' }}>
        <Box>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            color: '#5e6470',
            lineHeight: '14px',
            mb: '4px'
          }}>
            Billed to
          </Typography>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            color: '#1a1c21',
            lineHeight: '14px'
          }}>
            {billingData?.firstName} {billingData?.lastName}
          </Typography>
        </Box>
        
        <Box>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            color: '#5e6470',
            lineHeight: '14px',
            mb: '4px'
          }}>
            Invoice number
          </Typography>
          <Typography sx={{ 
            fontFamily: 'Roboto, sans-serif',
            fontSize: '16px',
            fontWeight: 400,
            color: '#6d6b80',
            lineHeight: '24px',
            letterSpacing: '0.5px'
          }}>
            {currentInvoice?.invoiceNumber || 'N/A'}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            color: '#5e6470',
            lineHeight: '14px',
            mb: '2px'
          }}>
            Invoice of (PHP)
          </Typography>
          <Typography sx={{ 
            fontFamily: 'Roboto, sans-serif',
            fontSize: '16px',
            fontWeight: 400,
            color: '#6d6b80',
            lineHeight: '24px',
            letterSpacing: '0.5px'
          }}>
            {Number(currentInvoice?.amountPaid || 0).toLocaleString('en-PH', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}PHP
          </Typography>
        </Box>
      </Box>

      {/* Second Row: Dentist Name and Invoice date */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '16px' }}>
        <Box>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            color: '#5e6470',
            lineHeight: '14px',
            mb: '4px'
          }}>
            Dentist Name
          </Typography>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            color: '#1a1c21',
            lineHeight: '14px'
          }}>
            {currentInvoice?.dentist || 'N/A'}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            color: '#5e6470',
            lineHeight: '14px',
            mb: '4px'
          }}>
            Invoice date
          </Typography>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            color: '#1a1c21',
            lineHeight: '14px'
          }}>
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

      {/* Third Row: Payment Method and Reference Number */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '24px' }}>
        <Box>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            color: '#5e6470',
            lineHeight: '14px',
            mb: '4px'
          }}>
            Payment Method
          </Typography>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            color: '#1a1c21',
            lineHeight: '14px'
          }}>
            {currentInvoice?.paymentMethod || 'N/A'}
          </Typography>
        </Box>

        {currentInvoice?.referenceNumber && (
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ 
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              fontWeight: 500,
              color: '#5e6470',
              lineHeight: '14px',
              mb: '4px'
            }}>
              Reference Number
            </Typography>
            <Typography sx={{ 
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              fontWeight: 600,
              color: '#1a1c21',
              lineHeight: '14px'
            }}>
              {currentInvoice.referenceNumber}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Divider before table */}
      <Box sx={{ borderTop: '1px solid #e0e0e0', mb: '8px' }} />

      {/* Table Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        mb: '12px'
      }}>
        <Typography sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '8px',
          fontWeight: 600,
          color: '#5e6470',
          letterSpacing: '0.32px',
          textTransform: 'uppercase',
          width: '180px'
        }}>
          Services Availed
        </Typography>
        <Typography sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '8px',
          fontWeight: 600,
          color: '#5e6470',
          letterSpacing: '0.32px',
          textTransform: 'uppercase',
          width: '40px',
          textAlign: 'center'
        }}>
          Qty
        </Typography>
        <Typography sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '8px',
          fontWeight: 600,
          color: '#5e6470',
          letterSpacing: '0.32px',
          textTransform: 'uppercase',
          width: '100px',
          textAlign: 'right'
        }}>
          Rate (in PHP)
        </Typography>
        <Typography sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '8px',
          fontWeight: 600,
          color: '#5e6470',
          letterSpacing: '0.32px',
          textTransform: 'uppercase',
          width: '100px',
          textAlign: 'right'
        }}>
          Amount (in PHP)
        </Typography>
      </Box>

      <Box sx={{ borderTop: '1px solid #e0e0e0', mb: '14px' }} />

      {/* Services */}
      {currentInvoice?.services && currentInvoice.services.map((service, index) => (
        <Box key={index} sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          mb: '14px'
        }}>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            color: '#1a1c21',
            lineHeight: '14px',
            width: '180px'
          }}>
            {service.name}
          </Typography>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            color: '#1a1c21',
            lineHeight: '14px',
            width: '40px',
            textAlign: 'center'
          }}>
            {service.quantity || 1}
          </Typography>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            color: '#1a1c21',
            lineHeight: '14px',
            width: '100px',
            textAlign: 'right'
          }}>
            {parseFloat(service.price).toLocaleString('en-PH', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </Typography>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            color: '#1a1c21',
            lineHeight: '14px',
            width: '100px',
            textAlign: 'right'
          }}>
            {(parseFloat(service.price) * (service.quantity || 1)).toLocaleString('en-PH', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </Typography>
        </Box>
      ))}

      {/* Subtotal */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        mb: '24px',
        mt: '20px'
      }}>
        <Typography sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontWeight: 500,
          color: '#1a1c21',
          lineHeight: '14px'
        }}>
          Subtotal
        </Typography>
        <Typography sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontWeight: 500,
          color: '#1a1c21',
          lineHeight: '14px',
          width: '100px',
          textAlign: 'right'
        }}>
          {(currentInvoice?.servicesTotal || 0).toLocaleString('en-PH', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </Typography>
      </Box>

      {/* Additional Charges */}
      {currentInvoice?.additionalCharges && currentInvoice.additionalCharges.length > 0 && (
        <>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 800,
            color: '#1a1c21',
            lineHeight: '14px',
            mb: '12px'
          }}>
            Additional Charges
          </Typography>

          {currentInvoice.additionalCharges.map((charge, index) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mb: '12px'
            }}>
              <Typography sx={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                color: '#1a1c21',
                lineHeight: '14px',
                width: '180px'
              }}>
                {charge.name}
              </Typography>
              <Typography sx={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                color: '#1a1c21',
                lineHeight: '14px',
                width: '40px',
                textAlign: 'center'
              }}>
                {charge.quantity || 1}
              </Typography>
              <Typography sx={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                color: '#1a1c21',
                lineHeight: '14px',
                width: '100px',
                textAlign: 'right'
              }}>
                {parseFloat(charge.price).toLocaleString('en-PH', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </Typography>
              <Typography sx={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                color: '#1a1c21',
                lineHeight: '14px',
                width: '100px',
                textAlign: 'right'
              }}>
                {(parseFloat(charge.price) * (charge.quantity || 1)).toLocaleString('en-PH', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </Typography>
            </Box>
          ))}
        </>
      )}

      {/* Discounts */}
      {currentInvoice?.discounts && currentInvoice.discounts.length > 0 && (
        <>
          <Typography sx={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 700,
            color: '#1a1c21',
            lineHeight: '14px',
            mb: '12px',
            mt: '24px'
          }}>
            Discount
          </Typography>

          {currentInvoice.discounts.map((discount, index) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mb: '12px'
            }}>
              <Typography sx={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                color: '#1a1c21',
                lineHeight: '14px',
                width: '180px'
              }}>
                {discount.name}
              </Typography>
              <Typography sx={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                color: '#1a1c21',
                lineHeight: '14px',
                width: '40px',
                textAlign: 'center'
              }}>
                {discount.quantity || 1}
              </Typography>
              <Typography sx={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                color: '#1a1c21',
                lineHeight: '14px',
                width: '100px',
                textAlign: 'right'
              }}>
                -{parseFloat(discount.price).toLocaleString('en-PH', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </Typography>
              <Typography sx={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                color: '#1a1c21',
                lineHeight: '14px',
                width: '100px',
                textAlign: 'right'
              }}>
                -{(parseFloat(discount.price) * (discount.quantity || 1)).toLocaleString('en-PH', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </Typography>
            </Box>
          ))}
        </>
      )}

      {/* Divider before totals */}
      <Box sx={{ borderTop: '1px solid #e0e0e0', my: '20px' }} />

      {/* Total */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        mb: '18px'
      }}>
        <Typography sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          color: '#1a1c21',
          lineHeight: '14px'
        }}>
          Total
        </Typography>
        <Typography sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          color: '#1a1c21',
          lineHeight: '14px',
          width: '100px',
          textAlign: 'right'
        }}>
          {(billingData?.totalBill || 0).toLocaleString('en-PH', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </Typography>
      </Box>

      {/* Paid */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        mb: '18px'
      }}>
        <Typography sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          color: '#1a1c21',
          lineHeight: '14px'
        }}>
          Paid
        </Typography>
        <Typography sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          color: '#1a1c21',
          lineHeight: '14px',
          width: '100px',
          textAlign: 'right'
        }}>
          {Number(currentInvoice?.amountPaid || 0).toLocaleString('en-PH', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </Typography>
      </Box>

      {/* Balance */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        mb: '24px'
      }}>
        <Typography sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          color: '#1a1c21',
          lineHeight: '14px'
        }}>
          BALANCE
        </Typography>
        <Typography sx={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          color: '#1a1c21',
          lineHeight: '14px',
          width: '100px',
          textAlign: 'right'
        }}>
          {(billingData?.balance || 0).toLocaleString('en-PH', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </Typography>
      </Box>
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