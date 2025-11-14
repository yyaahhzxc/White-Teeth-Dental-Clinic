import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  IconButton,
  Paper,
  Grid,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
    const printContent = document.getElementById('invoice-content');
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore the page
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
          backgroundColor: "#f5f7fa",
          maxWidth: 800,
          zoom: "75%",
        },
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
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent
        dividers
        sx={{
          backgroundColor: "#f5f7fa",
          p: 5,
        }}
      >
        <Paper
          id="invoice-content" // Add this ID for print targeting
          elevation={3}
          sx={{
            p: 4,
            backgroundColor: "#fff",
          }}
        >
          {/* Clinic Header */}
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <Box
                component="img"
                src="/White-Teeth-Logo.png"
                alt="Clinic Logo"
                sx={{ width: 60, height: 60 }}
              />
            </Grid>
            <Grid item>
              <Typography variant="h6" fontWeight={600} color="primary">
                White Teeth Dental Clinic
              </Typography>
              <Typography variant="body2">
                whiteteethdavao@gmail.com
              </Typography>
              <Typography variant="body2">0970 550 3902</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Invoice Info */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Billed to
              </Typography>
              <Typography fontWeight={600}>{data.billedTo}</Typography>
            </Grid>
            <Grid item xs={3} textAlign="center" pl={"32%"} pr={"22%"}>
              <Typography variant="subtitle2" color="text.secondary">
                Invoice number
              </Typography>
              <Typography fontWeight={600}>{data.invoiceNumber}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Invoice of (PHP)
              </Typography>
              <Typography fontWeight={600}>
                {(invoice.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP
              </Typography>
            </Grid>
            <Grid item xs={6} mt={2} pr={"70%"} pt={"5%"} pb={"5%"}>
              <Typography variant="subtitle2" color="text.secondary">
                Dentist Name
              </Typography>
              <Typography fontWeight={600}>{data.dentist}</Typography>
            </Grid>
            <Grid item xs={6} mt={2}  pt={"5%"} pb={"5%"}> 
              <Typography variant="subtitle2" color="text.secondary">
                Invoice date
              </Typography>
              <Typography fontWeight={600}>{data.date}</Typography>
            </Grid>
          </Grid>

          {/* SINGLE COMBINED TABLE */}
          <TableContainer sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f0f0f0ad" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    SERVICES AVAILED
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    QTY
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    RATE (IN PHP)
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    AMOUNT (IN PHP)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Services */}
                {invoice.services && invoice.services.map((service, index) => (
                  <TableRow key={index}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell align="center">{service.quantity || 1}</TableCell>
                    <TableCell align="center">{parseFloat(service.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell align="center">{(parseFloat(service.price) * (service.quantity || 1)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
                
                {/* Subtotal Row */}
                <TableRow sx={{ pb: "20%" }}>
                  <TableCell colSpan={3} align="left" sx={{ pb: "10%", fontWeight: 600 }}>
                    Subtotal:
                  </TableCell>
                  <TableCell align="center" sx={{ pb: "10%", fontWeight: 600 }}>
                    {(invoice.servicesTotal || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>

                {/* Additional Charges Section - Only show if there are charges */}
                {invoice.additionalCharges && invoice.additionalCharges.length > 0 && (
                  <>
                    {/* Additional Charges Section Header */}
                    <TableRow sx={{ borderTop: "2px solid #dddddd11" }}>
                      <TableCell colSpan={4} sx={{ 
                        fontWeight: 600, 
                        backgroundColor: "#f9f9f9",
                        borderTop: "1px solid #ddd"
                      }}>
                        Additional Charges
                      </TableCell>
                    </TableRow>

                    {/* Additional Charges */}
                    {invoice.additionalCharges.map((charge, index) => (
                      <TableRow key={index} sx={{ borderTop: "2px solid #dddddd11" }}>
                        <TableCell>{charge.name}</TableCell>
                        <TableCell align="center">{charge.quantity || 1}</TableCell>
                        <TableCell align="center">{parseFloat(charge.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell align="center">{(parseFloat(charge.price) * (charge.quantity || 1)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </>
                )}

                {/* Discount Section - Only show if there are discounts */}
                {invoice.discounts && invoice.discounts.length > 0 && (
                  <>
                    {/* Discount Section Header */}
                    <TableRow sx={{ borderTop: "2px solid #dddddd11" }}>
                      <TableCell colSpan={4} sx={{ 
                        fontWeight: 600, 
                        backgroundColor: "#f9f9f9",
                        borderTop: "1px solid #ddd"
                      }}>
                        Discount
                      </TableCell>
                    </TableRow>

                    {/* Discount */}
                    {invoice.discounts.map((discount, index) => (
                      <TableRow key={index} sx={{ borderTop: "2px solid #dddddd11" }}>
                        <TableCell>{discount.name}</TableCell>
                        <TableCell align="center">{discount.quantity || 1}</TableCell>
                        <TableCell align="center">-{parseFloat(discount.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell align="center">-{(parseFloat(discount.price) * (discount.quantity || 1)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </>
                )}

                {/* Space between discount and total */}
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 1, border: 'none' }}></TableCell>
                </TableRow>

                {/* Total Section */}
                <TableRow sx={{ borderTop: "2px solid #dddddd11" }}>
                  <TableCell colSpan={3} align="left" sx={{ fontWeight: 600, py: 0.5 }}>
                    Total:
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, py: 0.5 }}>
                    {(invoice.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>

                {/* Paid Row */}
                <TableRow sx={{ borderTop: "2px solid #dddddd11" }}>
                  <TableCell colSpan={3} align="left" sx={{ fontWeight: 600, py: 0.5 }}>
                    Paid:
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, py: 0.5 }}>
                    {(invoice.amountPaid || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>

                {/* Balance Row */}
                <TableRow sx={{ borderTop: "2px solid #dddddd11", borderBottom: "2px solid #dddddd11" }}>
                  <TableCell colSpan={3} align="left" sx={{ fontWeight: 600, py: 0.5 }}>
                    BALANCE:
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, py: 0.5 }}>
                    {(invoice.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Print Button - Outside the Paper component */}
        <Box textAlign="center" mt={4}>
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
