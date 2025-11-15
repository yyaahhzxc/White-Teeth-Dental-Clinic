import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function AddExpenseDialog({ open = false, onClose = () => {}, onSubmit = () => {} }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('General');

  useEffect(() => {
    if (open) {
      // reset fields when opened
      setDescription('');
      setAmount('');
      setDate('');
      setCategory('General');
    }
  }, [open]);

  const handleSubmit = async () => {
    const parsedAmt = Number(String(amount).replace(/[^0-9.-]+/g, '')) || 0;
    const payload = { expense: description.trim(), amount: parsedAmt, date, category };

    try {
      // POST to backend expenses endpoint
      const res = await fetch('http://localhost:3001/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json && json.expense) {
        // return saved expense row to caller so UI can update from DB
        onSubmit(json.expense);
      } else {
        console.error('Failed to save expense', json);
        // still call onSubmit with payload as fallback
        onSubmit(payload);
      }
    } catch (e) {
      console.error('Error saving expense', e);
      onSubmit(payload);
    } finally {
      onClose();
    }
  };

  const isValid = () => {
    const parsedAmt = Number(String(amount).replace(/[^0-9.-]+/g, '')) || 0;
    return description.trim().length > 0 && parsedAmt > 0 && date;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ bgcolor: '#2148c0', color: 'white', borderTopLeftRadius: 6, borderTopRightRadius: 6, mb: 4, fontSize: '1.25rem' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 'inherit' }}>Add Expense</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, fontSize: '1rem' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Expense Name" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth variant="outlined" />
          <TextField label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} fullWidth variant="outlined" placeholder="0.00" />
          <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth variant="outlined" />
          <FormControl fullWidth>
            <InputLabel id="expense-category-label">Category</InputLabel>
            <Select labelId="expense-category-label" label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <MenuItem value="General">General</MenuItem>
              <MenuItem value="Supplies">Supplies</MenuItem>
              <MenuItem value="Rent">Rent</MenuItem>
              <MenuItem value="Utilities">Utilities</MenuItem>
              <MenuItem value="Payroll">Payroll</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, fontSize: '1rem' }}>
        <Button onClick={onClose} variant="text" sx={{ color: '#2148c0', textTransform: 'none', fontSize: 'inherit' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!isValid()} sx={{ backgroundColor: '#2148c0', '&:hover': { backgroundColor: '#173b8a' }, textTransform: 'none', fontSize: 'inherit' }}>Add Expense</Button>
      </DialogActions>
    </Dialog>
  );
}
