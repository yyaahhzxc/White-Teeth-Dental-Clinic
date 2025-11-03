import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

function BillingAppointmentSummary({ 
  open = true, 
  onClose = () => {}, 
  billingData = {} 
}) {
  // Initialize with default billing data if not provided
  const initialBillingData = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    dateCreated: 'October 30, 2025',
    ...billingData,
  };

  // Left side form state (modifiable)
  const [services, setServices] = useState([
    { id: 1, name: 'Wisdom Tooth Extraction', quantity: 1, price: 1000.00 }
  ]);
  const [additionalCharges, setAdditionalCharges] = useState([
    { id: 1, name: 'Anaesthetic Carpule', quantity: 1, price: 500.00 },
    { id: 2, name: 'Retainer Case', quantity: 1, price: 200.00 }
  ]);
  const [discounts, setDiscounts] = useState([
    { id: 1, name: 'Employee Family', quantity: 1, price: 200.00 }
  ]);

  // Calculate totals dynamically
  const calculations = useMemo(() => {
    // Filter out items with empty name or price
    const validServices = services.filter(s => s.name.trim() !== '' && s.price !== '');
    const validCharges = additionalCharges.filter(c => c.name.trim() !== '' && c.price !== '');
    const validDiscounts = discounts.filter(d => d.name.trim() !== '' && d.price !== '');
    
    const servicesTotal = validServices.reduce((sum, s) => sum + ((parseFloat(s.price) || 0) * (s.quantity || 1)), 0);
    const chargesTotal = validCharges.reduce((sum, c) => sum + ((parseFloat(c.price) || 0) * (c.quantity || 1)), 0);
    const discountsTotal = validDiscounts.reduce((sum, d) => sum + ((parseFloat(d.price) || 0) * (d.quantity || 1)), 0);
    
    const subtotalAfterServices = servicesTotal;
    const subtotalAfterCharges = subtotalAfterServices + chargesTotal;
    const total = subtotalAfterCharges - discountsTotal;

    return {
      servicesTotal,
      chargesTotal,
      discountsTotal,
      subtotalAfterServices,
      subtotalAfterCharges,
      total,
      validServices,
      validCharges,
      validDiscounts,
    };
  }, [services, additionalCharges, discounts]);

  // Add service handler
  const handleAddService = () => {
    const newId = Math.max(...services.map(s => s.id), 0) + 1;
    setServices([...services, { id: newId, name: '', quantity: 1, price: '' }]);
  };

  // Update service handler
  const handleUpdateService = (id, field, value) => {
    if (field === 'price') {
      // Only allow numbers and decimals
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setServices(services.map(s => 
          s.id === id ? { ...s, [field]: value } : s
        ));
      }
    } else if (field === 'quantity') {
      // Only allow positive integers
      if (value === '' || /^\d+$/.test(value)) {
        setServices(services.map(s => 
          s.id === id ? { ...s, [field]: value === '' ? '' : parseInt(value) } : s
        ));
      }
    } else {
      setServices(services.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      ));
    }
  };

  // Delete service handler
  const handleDeleteService = (id) => {
    setServices(services.filter(s => s.id !== id));
  };

  // Add charge handler
  const handleAddCharge = () => {
    const newId = Math.max(...additionalCharges.map(c => c.id), 0) + 1;
    setAdditionalCharges([...additionalCharges, { id: newId, name: '', quantity: 1, price: '' }]);
  };

  // Update charge handler
  const handleUpdateCharge = (id, field, value) => {
    if (field === 'price') {
      // Only allow numbers and decimals
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setAdditionalCharges(additionalCharges.map(c => 
          c.id === id ? { ...c, [field]: value } : c
        ));
      }
    } else if (field === 'quantity') {
      // Only allow positive integers
      if (value === '' || /^\d+$/.test(value)) {
        setAdditionalCharges(additionalCharges.map(c => 
          c.id === id ? { ...c, [field]: value === '' ? '' : parseInt(value) } : c
        ));
      }
    } else {
      setAdditionalCharges(additionalCharges.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      ));
    }
  };

  // Delete charge handler
  const handleDeleteCharge = (id) => {
    setAdditionalCharges(additionalCharges.filter(c => c.id !== id));
  };

  // Add discount handler
  const handleAddDiscount = () => {
    const newId = Math.max(...discounts.map(d => d.id), 0) + 1;
    setDiscounts([...discounts, { id: newId, name: '', quantity: 1, price: '' }]);
  };

  // Update discount handler
  const handleUpdateDiscount = (id, field, value) => {
    if (field === 'price') {
      // Only allow numbers and decimals
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setDiscounts(discounts.map(d => 
          d.id === id ? { ...d, [field]: value } : d
        ));
      }
    } else if (field === 'quantity') {
      // Only allow positive integers
      if (value === '' || /^\d+$/.test(value)) {
        setDiscounts(discounts.map(d => 
          d.id === id ? { ...d, [field]: value === '' ? '' : parseInt(value) } : d
        ));
      }
    } else {
      setDiscounts(discounts.map(d => 
        d.id === id ? { ...d, [field]: value } : d
      ));
    }
  };

  // Delete discount handler
  const handleDeleteDiscount = (id) => {
    setDiscounts(discounts.filter(d => d.id !== id));
  };

  const handlePayBill = () => {
    // To be implemented later
    console.log('Pay bill functionality to be added');
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
          width: '1450px',
          maxHeight: '90vh',
          overflow: 'hidden', // Prevent content from breaking border radius
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
          Billing Appointment Summary
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
        gap: 2, 
        px: 4, 
        pb: 4, 
        pt: 1,
        maxHeight: 'calc(90vh - 120px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        // Custom scrollbar styling to maintain rounded corners
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
        {/* Left Side - Editable Form */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <Typography 
            sx={{ 
              color: '#2148c0',
              fontWeight: 'bold',
              fontSize: '32px',
              fontFamily: 'Inter, sans-serif',
              mb: 1,
              lineHeight: 'normal',
            }}
          >
            Review Billing Information
          </Typography>

          {/* All sections in one container */}
          <Box sx={{ 
            backgroundColor: '#dfdfdf', 
            borderRadius: '10px', 
            p: 3, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3,
            overflow: 'visible',
            minHeight: 'auto',
            width: '100%',
            mb: 3,
          }}>
            {/* Services Section */}
            <Box>
              <Typography 
                sx={{ 
                  color: 'black',
                  fontWeight: 500,
                  fontSize: '14.81px',
                  fontFamily: 'Raleway, sans-serif',
                  mb: 1.5,
                }}
              >
                Service/Package
              </Typography>
              
              {/* Column Headers */}
              <Box sx={{ display: 'flex', gap: 3, mb: 1.5, alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '12.81px', fontWeight: 'bold', color: '#666' }}>
                    Service
                  </Typography>
                </Box>
                <Box sx={{ width: 60 }}>
                  <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '12.81px', fontWeight: 'bold', color: '#666', textAlign: 'center' }}>
                    Quantity
                  </Typography>
                </Box>
                <Box sx={{ width: 120 }}>
                  <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '12.81px', fontWeight: 'bold', color: '#666', textAlign: 'center' }}>
                    Amount
                  </Typography>
                </Box>
                <Box sx={{ width: 40 }} />
              </Box>
              
              {services.map((service) => (
                <Box key={service.id} sx={{ display: 'flex', gap: 3, mb: 1.5, alignItems: 'center' }}>
                  <TextField
                    placeholder="Service/Package"
                    value={service.name}
                    onChange={(e) => handleUpdateService(service.id, 'name', e.target.value)}
                    size="small"
                    sx={{ 
                      flex: 1,
                      minWidth: 200,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        fontSize: '14.81px',
                        fontFamily: 'Raleway, sans-serif',
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', ml: 'auto' }}>
                    <TextField
                      placeholder="1"
                      type="text"
                      value={service.quantity}
                      onChange={(e) => handleUpdateService(service.id, 'quantity', e.target.value)}
                      size="small"
                      sx={{ 
                        width: 60,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          fontSize: '14.81px',
                          fontFamily: 'Raleway, sans-serif',
                        },
                        '& input': {
                          textAlign: 'center',
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 120 }}>
                      <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '14.81px', fontWeight: 500 }}>
                        ₱
                      </Typography>
                      <TextField
                        placeholder="0.00"
                        type="text"
                        value={service.price}
                        onChange={(e) => handleUpdateService(service.id, 'price', e.target.value)}
                        size="small"
                        sx={{ 
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            fontSize: '14.81px',
                            fontFamily: 'Raleway, sans-serif',
                          }
                        }}
                      />
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteService(service.id)}
                      sx={{ color: '#d32f2f', ml: 0.5 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              
              <Button 
                onClick={handleAddService}
                sx={{ 
                  color: '#274fc7',
                  fontWeight: 'bold',
                  fontSize: '14.81px',
                  fontFamily: 'Roboto, sans-serif',
                  textTransform: 'none',
                  mt: 0.5,
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': { backgroundColor: 'transparent' }
                }}
              >
                Add Service
              </Button>
            </Box>

            {/* Additional Charges Section */}
            <Box>
              <Typography 
                sx={{ 
                  color: 'black',
                  fontWeight: 500,
                  fontSize: '14.81px',
                  fontFamily: 'Raleway, sans-serif',
                  mb: 1.5,
                }}
              >
                Additional Charge/s
              </Typography>
              
              {/* Column Headers */}
              <Box sx={{ display: 'flex', gap: 3, mb: 1.5, alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '12.81px', fontWeight: 'bold', color: '#666' }}>
                    Charge Type
                  </Typography>
                </Box>
                <Box sx={{ width: 60 }}>
                  <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '12.81px', fontWeight: 'bold', color: '#666', textAlign: 'center' }}>
                    Quantity
                  </Typography>
                </Box>
                <Box sx={{ width: 120 }}>
                  <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '12.81px', fontWeight: 'bold', color: '#666', textAlign: 'center' }}>
                    Amount
                  </Typography>
                </Box>
                <Box sx={{ width: 40 }} />
              </Box>
              
              {additionalCharges.map((charge) => (
                <Box key={charge.id} sx={{ display: 'flex', gap: 3, mb: 1.5, alignItems: 'center' }}>
                  <TextField
                    placeholder="Charge Type"
                    value={charge.name}
                    onChange={(e) => handleUpdateCharge(charge.id, 'name', e.target.value)}
                    size="small"
                    sx={{ 
                      flex: 1,
                      minWidth: 200,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        fontSize: '14.81px',
                        fontFamily: 'Raleway, sans-serif',
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', ml: 'auto' }}>
                    <TextField
                      placeholder="1"
                      type="text"
                      value={charge.quantity}
                      onChange={(e) => handleUpdateCharge(charge.id, 'quantity', e.target.value)}
                      size="small"
                      sx={{ 
                        width: 60,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          fontSize: '14.81px',
                          fontFamily: 'Raleway, sans-serif',
                        },
                        '& input': {
                          textAlign: 'center',
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 120 }}>
                      <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '14.81px', fontWeight: 500 }}>
                        ₱
                      </Typography>
                      <TextField
                        placeholder="0.00"
                        type="text"
                        value={charge.price}
                        onChange={(e) => handleUpdateCharge(charge.id, 'price', e.target.value)}
                        size="small"
                        sx={{ 
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            fontSize: '14.81px',
                            fontFamily: 'Raleway, sans-serif',
                          }
                        }}
                      />
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteCharge(charge.id)}
                      sx={{ color: '#d32f2f', ml: 0.5 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              
              <Button 
                onClick={handleAddCharge}
                sx={{ 
                  color: '#274fc7',
                  fontWeight: 'bold',
                  fontSize: '14.81px',
                  fontFamily: 'Roboto, sans-serif',
                  textTransform: 'none',
                  mt: 0.5,
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': { backgroundColor: 'transparent' }
                }}
              >
                Add Additional Charge
              </Button>
            </Box>

            {/* Discounts Section */}
            <Box>
              <Typography 
                sx={{ 
                  color: 'black',
                  fontWeight: 500,
                  fontSize: '14.81px',
                  fontFamily: 'Raleway, sans-serif',
                  mb: 1.5,
                }}
              >
                Discount/s
              </Typography>
              
              {/* Column Headers */}
              <Box sx={{ display: 'flex', gap: 3, mb: 1.5, alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '12.81px', fontWeight: 'bold', color: '#666' }}>
                    Discount Type
                  </Typography>
                </Box>
                <Box sx={{ width: 60 }}>
                  <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '12.81px', fontWeight: 'bold', color: '#666', textAlign: 'center' }}>
                    Quantity
                  </Typography>
                </Box>
                <Box sx={{ width: 120 }}>
                  <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '12.81px', fontWeight: 'bold', color: '#666', textAlign: 'center' }}>
                    Amount
                  </Typography>
                </Box>
                <Box sx={{ width: 40 }} />
              </Box>
              
              {discounts.map((discount) => (
                <Box key={discount.id} sx={{ display: 'flex', gap: 3, mb: 1.5, alignItems: 'center' }}>
                  <TextField
                    placeholder="Discount Type"
                    value={discount.name}
                    onChange={(e) => handleUpdateDiscount(discount.id, 'name', e.target.value)}
                    size="small"
                    sx={{ 
                      flex: 1,
                      minWidth: 200,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        fontSize: '14.81px',
                        fontFamily: 'Raleway, sans-serif',
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', ml: 'auto' }}>
                    <TextField
                      placeholder="1"
                      type="text"
                      value={discount.quantity}
                      onChange={(e) => handleUpdateDiscount(discount.id, 'quantity', e.target.value)}
                      size="small"
                      sx={{ 
                        width: 60,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          fontSize: '14.81px',
                          fontFamily: 'Raleway, sans-serif',
                        },
                        '& input': {
                          textAlign: 'center',
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 120 }}>
                      <Typography sx={{ fontFamily: 'Raleway, sans-serif', fontSize: '14.81px', fontWeight: 500 }}>
                        ₱
                      </Typography>
                      <TextField
                        placeholder="0.00"
                        type="text"
                        value={discount.price}
                        onChange={(e) => handleUpdateDiscount(discount.id, 'price', e.target.value)}
                        size="small"
                        sx={{ 
                          flex: 1,
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            fontSize: '14.81px',
                            fontFamily: 'Raleway, sans-serif',
                          }
                        }}
                      />
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteDiscount(discount.id)}
                      sx={{ color: '#d32f2f', ml: 0.5 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              
              <Button 
                onClick={handleAddDiscount}
                sx={{ 
                  color: '#274fc7',
                  fontWeight: 'bold',
                  fontSize: '14.81px',
                  fontFamily: 'Roboto, sans-serif',
                  textTransform: 'none',
                  mt: 0.5,
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': { backgroundColor: 'transparent' }
                }}
              >
                Add Discount
              </Button>
            </Box>
          </Box>
          
          {/* Spacer to ensure bottom padding when scrollbar appears */}
          <Box sx={{ height: '24px', flexShrink: 0 }} />
        </Box>

        {/* Right Side - Summary (Readonly) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0, pb: 4, pl: 6 }}>
          <Typography 
            sx={{ 
              color: '#2148c0',
              fontWeight: 'bold',
              fontSize: '32px',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 'normal',
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
                  1
                </Typography>
                <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 500, width: 90, textAlign: 'right' }}>
                  {parseFloat(service.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            ))}

            {/* Subtotal after Services */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold' }}>
                Subtotal
              </Typography>
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold', width: 90, textAlign: 'right' }}>
                {calculations.servicesTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      1
                    </Typography>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 500, width: 90, textAlign: 'right' }}>
                      {parseFloat(charge.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold' }}>
                    Subtotal
                  </Typography>
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold', width: 90, textAlign: 'right' }}>
                    {calculations.subtotalAfterCharges.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      1
                    </Typography>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 500, width: 90, textAlign: 'right' }}>
                      -{parseFloat(discount.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold' }}>
                    Subtotal
                  </Typography>
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'bold', width: 90, textAlign: 'right' }}>
                    {calculations.subtotalAfterCharges.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </>
            )}

            {/* Total */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
              pt: 1.5,
            }}>
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 800 }}>
                TOTAL
              </Typography>
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '15.117px', color: '#1a1c21', fontWeight: 'black', width: 90, textAlign: 'right' }}>
                {calculations.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>

          {/* Pay Bill Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, pt: 2, pb: 2 }}>
            <Button
              variant="contained"
              onClick={handlePayBill}
              sx={{
                backgroundColor: '#2148c0',
                color: 'white',
                fontWeight: 800,
                fontSize: '20.1px',
                fontFamily: 'Inter, sans-serif',
                textTransform: 'capitalize',
                borderRadius: '10px',
                py: 1.5,
                px: 3,
                width: '180px',
                mb: 1,
                '&:hover': {
                  backgroundColor: '#1a3a9c',
                }
              }}
            >
              Pay Bill
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

export default BillingAppointmentSummary;
