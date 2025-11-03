import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  TextField,
  MenuItem,
  Select,
  FormControl,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function CreateInvoice({ 
  open = true, 
  onClose = () => {}, 
  billingData = {} 
}) {
  // State for payment information
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');

  // Calculate the total from billing data
  const calculations = useMemo(() => {
    // Filter out items with empty name or price
    const validServices = (billingData.services || []).filter(s => s.name && s.name.trim() !== '' && s.price !== '');
    const validCharges = (billingData.additionalCharges || []).filter(c => c.name && c.name.trim() !== '' && c.price !== '');
    const validDiscounts = (billingData.discounts || []).filter(d => d.name && d.name.trim() !== '' && d.price !== '');
    
    const servicesTotal = validServices.reduce((sum, s) => sum + ((parseFloat(s.price) || 0) * (s.quantity || 1)), 0);
    const chargesTotal = validCharges.reduce((sum, c) => sum + ((parseFloat(c.price) || 0) * (c.quantity || 1)), 0);
    const discountsTotal = validDiscounts.reduce((sum, d) => sum + ((parseFloat(d.price) || 0) * (d.quantity || 1)), 0);
    
    const subtotalAfterServices = servicesTotal;
    const subtotalAfterCharges = subtotalAfterServices + chargesTotal;
    const total = subtotalAfterCharges - discountsTotal;
    
    // Calculate remaining balance
    const paid = parseFloat(amountPaid) || 0;
    const remainingBalance = total - paid;

    return {
      servicesTotal,
      chargesTotal,
      discountsTotal,
      subtotalAfterServices,
      subtotalAfterCharges,
      total,
      remainingBalance,
      validServices,
      validCharges,
      validDiscounts,
    };
  }, [billingData, amountPaid]);

  const handleAmountPaidChange = (value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmountPaid(value);
    }
  };

  const handleCreateInvoice = () => {
    console.log('Creating invoice with:', {
      paymentMethod,
      amountPaid,
      remainingBalance: calculations.remainingBalance,
      billingData,
    });
    // TODO: Implement create invoice functionality
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth={false}
      disablePortal
      PaperProps={{
        sx: {
          backgroundColor: '#f9f9f9',
          borderRadius: '10px',
          p: 0,
          width: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
        }
      }}
    >
      {/* Header */}
      <Box sx={{ pt: 3.5, pb: 2, px: 4, textAlign: 'center', position: 'relative' }}>
        <Typography 
          variant="h4" 
          sx={{ 
            color: '#2148c0',
            fontWeight: 800,
            fontSize: '32px',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 'normal',
          }}
        >
          Create Invoice
        </Typography>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ 
            position: 'absolute',
            right: 16,
            top: 16,
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        px: 4, 
        pb: 4, 
        pt: 1,
        maxHeight: 'calc(90vh - 120px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#c1c1c1',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#a8a8a8',
        },
      }}>
        {/* Billing Summary Section */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            sx={{ 
              color: '#2148c0',
              fontWeight: 'bold',
              fontSize: '32px',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 'normal',
              mb: 2,
            }}
          >
            Billing Summary
          </Typography>

          {/* Summary Content */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            mb: 2,
          }}>
            {/* Header Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '15.117px', fontFamily: 'Inter, sans-serif', color: '#1a1c21', flex: 1 }}>
                Service
              </Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '15.117px', fontFamily: 'Inter, sans-serif', color: '#1a1c21', width: 70, textAlign: 'center' }}>
                Quantity
              </Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '15.117px', fontFamily: 'Inter, sans-serif', color: '#1a1c21', width: 90, textAlign: 'right' }}>
                Amount
              </Typography>
            </Box>

            {/* Services Summary */}
            {calculations.validServices.map((service) => (
              <Box key={service.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 3 }}>
                <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 500, flex: 1 }}>
                  {service.name}
                </Typography>
                <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 500, width: 70, textAlign: 'center' }}>
                  {service.quantity}
                </Typography>
                <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 500, width: 90, textAlign: 'right' }}>
                  ₱{(parseFloat(service.price) * (service.quantity || 1)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            ))}

            {/* Subtotal after Services */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold' }}>
                Subtotal
              </Typography>
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold', width: 90, textAlign: 'right' }}>
                ₱{calculations.servicesTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            {/* Additional Charges */}
            {calculations.validCharges.length > 0 && (
              <>
                <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold', mt: 1 }}>
                  Additional Charge/s
                </Typography>
                {calculations.validCharges.map((charge) => (
                  <Box key={charge.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 3 }}>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 500, flex: 1 }}>
                      {charge.name}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 500, width: 70, textAlign: 'center' }}>
                      {charge.quantity}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 500, width: 90, textAlign: 'right' }}>
                      ₱{(parseFloat(charge.price) * (charge.quantity || 1)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold' }}>
                    Subtotal
                  </Typography>
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold', width: 90, textAlign: 'right' }}>
                    ₱{calculations.subtotalAfterCharges.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </>
            )}

            {/* Discounts */}
            {calculations.validDiscounts.length > 0 && (
              <>
                <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold', mt: 1 }}>
                  Discount/s
                </Typography>
                {calculations.validDiscounts.map((discount) => (
                  <Box key={discount.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 3 }}>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 500, flex: 1 }}>
                      {discount.name}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 500, width: 70, textAlign: 'center' }}>
                      {discount.quantity}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 500, width: 90, textAlign: 'right' }}>
                      -₱{(parseFloat(discount.price) * (discount.quantity || 1)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold' }}>
                    Subtotal
                  </Typography>
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold', width: 90, textAlign: 'right' }}>
                    ₱{(calculations.subtotalAfterCharges - calculations.discountsTotal).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </>
            )}

            {/* Total */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #e0e0e0', pt: 2 }}>
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold' }}>
                TOTAL
              </Typography>
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold', width: 90, textAlign: 'right' }}>
                ₱{calculations.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Pay Bill Section */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            sx={{ 
              color: '#2148c0',
              fontWeight: 600,
              fontSize: '32px',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 'normal',
              mb: 2,
            }}
          >
            Pay Bill
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {/* Payment Method Dropdown */}
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '14.81px', fontWeight: 500, mb: 0.75 }}>
                Payment Method
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  sx={{
                    backgroundColor: 'white',
                    fontFamily: 'Raleway, sans-serif',
                    fontSize: '14.81px',
                  }}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Card">Card</MenuItem>
                  <MenuItem value="GCash">GCash</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Amount Paid Field */}
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '14.81px', fontWeight: 500, mb: 0.75 }}>
                Amount
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '14.81px', fontWeight: 500 }}>
                  ₱
                </Typography>
                <TextField
                  placeholder="0.00"
                  type="text"
                  value={amountPaid}
                  onChange={(e) => handleAmountPaidChange(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      fontSize: '14.81px',
                      fontFamily: 'Raleway, sans-serif',
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Remaining Balance */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold' }}>
              Remaining Balance:
            </Typography>
            <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold' }}>
              ₱{calculations.remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>

        {/* Create Invoice Button */}
        <Button
          onClick={handleCreateInvoice}
          sx={{
            backgroundColor: '#2148c0',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '20.1px',
            fontFamily: 'Inter, sans-serif',
            textTransform: 'none',
            py: 1.5,
            borderRadius: '25px',
            '&:hover': {
              backgroundColor: '#1a36a0',
            }
          }}
        >
          Create Invoice
        </Button>
      </Box>
    </Dialog>
  );
}

export default CreateInvoice;
