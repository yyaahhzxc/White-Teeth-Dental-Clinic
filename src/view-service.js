import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  MenuItem,
  Dialog as MuiDialog
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

const serviceTypes = [
  'Single Treatment',
  'Package Treatment',
];

const statusOptions = [
  'Active',
  'Inactive'
];

const ViewService = ({ open, onClose, service, onServiceUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedService, setEditedService] = useState(service || {});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const showSnackbar = (msg) => {
    setSnackbarMsg(msg);
    setSnackbarOpen(true);
    setTimeout(() => setSnackbarOpen(false), 2000);
  };

  useEffect(() => {
    setEditedService(service || {});
    setIsEditing(false);
  }, [service, open]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    // Send PUT request to backend to update service
    try {
  await fetch(`${API_BASE}/service-table/${editedService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedService)
      });
      setIsEditing(false);
      if (onServiceUpdated) onServiceUpdated();
    } catch (err) {
      console.error('Save Error:', err);
  showSnackbar('Failed to save changes');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedService(prev => ({ ...prev, [name]: value }));
  };

  const handleDialogClose = () => {
    if (isEditing) {
      setConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const handleConfirmSave = async () => {
    await handleSaveClick();
    setConfirmOpen(false);
    onClose();
  };

  const handleConfirmDiscard = () => {
    setConfirmOpen(false);
    setIsEditing(false);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
        sx={{
          '& .MuiDialog-paper': {
            width: '100%',
            maxWidth: 500,
            minHeight: 400,
            borderRadius: 3,
            backgroundColor: '#2148C0',
          }
        }}
      >
        <DialogTitle
          sx={{
            color: '#ffffffff',
            fontSize: 28,
            fontWeight: 800,
            textAlign: 'center',
            position: 'relative'
          }}
        >
          View Service
          <IconButton
            aria-label="close"
            onClick={handleDialogClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: '#ffffffff',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            backgroundColor: '#f5f7fa',
            px: 4,
            py: 3,
            borderRadius: 2,
          }}
        >
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              fullWidth
              label="Service Name"
              name="name"
              value={editedService?.name || ''}
              onChange={handleChange}
              InputProps={{ readOnly: !isEditing }}
              sx={{ backgroundColor: '#ffffff9e' }}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={editedService?.description || ''}
              onChange={handleChange}
              multiline
              rows={2}
              InputProps={{ readOnly: !isEditing }}
              sx={{ backgroundColor: '#ffffff9e' }}
            />
            <TextField
              fullWidth
              label="Price"
              name="price"
              value={editedService?.price || ''}
              onChange={handleChange}
              type="number"
              InputProps={{ readOnly: !isEditing }}
              sx={{ backgroundColor: '#ffffff9e' }}
            />
            <TextField
              fullWidth
              label="Service Duration (minutes)"
              name="duration"
              value={editedService?.duration || ''}
              onChange={handleChange}
              type="number"
              InputProps={{ readOnly: !isEditing }}
              sx={{ backgroundColor: '#ffffff9e' }}
            />
            <TextField
              select
              fullWidth
              label="Service Type"
              name="type"
              value={editedService?.type || ''}
              onChange={handleChange}
              InputProps={{ readOnly: !isEditing }}
              sx={{ backgroundColor: '#ffffff9e' }}
            >
              {serviceTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="Status"
              name="status"
              value={editedService?.status || ''}
              onChange={handleChange}
              InputProps={{ readOnly: !isEditing }}
              sx={{ backgroundColor: '#ffffff9e' }}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <IconButton
            color="primary"
            onClick={isEditing ? handleSaveClick : handleEditClick}
            sx={{
              borderRadius: 2,
              backgroundColor: '#ffffffff',
              color: '#2148C0',
              mr: 2,
              '&:hover': {
                backgroundColor: '#ffffffff', // Remove hover effect
              }
            }}
          >
            {isEditing ? <SaveIcon /> : <EditIcon />}
          </IconButton>
        </DialogActions>
      </Dialog>
      <MuiDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>Save changes?</DialogTitle>
        <DialogContent>
          <Typography>Do you want to save your changes before closing?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDiscard} color="error">Discard</Button>
          <Button onClick={handleConfirmSave} color="primary" variant="contained">Save</Button>
        </DialogActions>
      </MuiDialog>
    <Snackbar open={snackbarOpen} message={snackbarMsg} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />
    </>
  );
};

export default ViewService;