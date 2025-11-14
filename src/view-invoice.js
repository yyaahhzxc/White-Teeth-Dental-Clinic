import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  IconButton,
  Paper,
  Button,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const ViewInvoice = ({ open, onClose, invoice }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState(null);

  useEffect(() => {
    if (invoice) {
      setEditedInvoice({ ...invoice });
    }
  }, [invoice]);

  const handleDialogClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handlePrint = () => {
    // Get only the invoice content, excluding modal elements
    const printContent = document.getElementById('invoice-content');
    if (!printContent) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px;
              font-family: Inter, sans-serif;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!invoice) return null;
  const data = editedInvoice || {};

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 3,
          backgroundColor: "#f9fafc",
          maxWidth: 595,
          zoom: "100%",
        },
        zIndex: 1500, // Invoice Receipt Modal (third highest)
      }}
    >
      {/* Close Button */}
      <IconButton
        aria-label="close"
        onClick={handleDialogClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: "#2148C0",
          zIndex: 10,
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent
        sx={{
          backgroundColor: "#f9fafc",
          p: 0,
          overflow: 'hidden',
        }}
      >
        <Paper
          id="invoice-content"
          elevation={0}
          sx={{
            p: 0,
            backgroundColor: "#fff",
            border: '0.5px solid #d7dae0',
            borderRadius: 0,
          }}
        >
          {/* Clinic Header - Outside main content */}
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
                  {data.billedTo}
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
                  {data.invoiceNumber}
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
                  {(invoice.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}PHP
                </Typography>
              </Box>
            </Box>

            {/* Second Row: Dentist Name and Invoice date */}
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
                  Dentist Name
                </Typography>
                <Typography sx={{ 
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#1a1c21',
                  lineHeight: '14px'
                }}>
                  {data.dentist}
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
                  {data.date}
                </Typography>
              </Box>
            </Box>

            {/* Divider before table */}
            <Divider sx={{ borderColor: '#e0e0e0', mb: '8px' }} />

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

            <Divider sx={{ borderColor: '#e0e0e0', mb: '14px' }} />

            {/* Services */}
            {invoice.services && invoice.services.map((service, index) => (
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
                  {parseFloat(service.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  {(parseFloat(service.price) * (service.quantity || 1)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                {(invoice.servicesTotal || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            {/* Additional Charges Section */}
            {invoice.additionalCharges && invoice.additionalCharges.length > 0 && (
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

                {invoice.additionalCharges.map((charge, index) => (
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
                      {parseFloat(charge.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      {(parseFloat(charge.price) * (charge.quantity || 1)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                ))}
              </>
            )}

            {/* Discount Section */}
            {invoice.discounts && invoice.discounts.length > 0 && (
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

                {invoice.discounts.map((discount, index) => (
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
                      -{parseFloat(discount.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      -{(parseFloat(discount.price) * (discount.quantity || 1)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                ))}
              </>
            )}

            {/* Divider before totals */}
            <Divider sx={{ borderColor: '#e0e0e0', my: '20px' }} />

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
                {(invoice.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                {(invoice.amountPaid || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                {(invoice.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Print Button - Outside the Paper component */}
        <Box textAlign="center" mt={3} mb={2}>
          <Button
            variant="contained"
            color="primary"
            sx={{
              borderRadius: "30px",
              textTransform: "none",
              px: 4,
              py: 1,
              fontSize: "1rem",
            }}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ViewInvoice;
