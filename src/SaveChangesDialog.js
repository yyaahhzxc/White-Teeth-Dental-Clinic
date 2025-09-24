import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

/**
 * Reusable Save Changes confirmation dialog component
 * Used to ask users if they want to save changes before closing/discarding
 */
const SaveChangesDialog = ({
  open,
  onClose,
  onSave,
  onDiscard,
  title = "Save changes?",
  message = "Do you want to save your changes before closing?",
  saveButtonText = "Save",
  discardButtonText = "Discard"
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDiscard} color="error">
          {discardButtonText}
        </Button>
        <Button onClick={onSave} color="primary" variant="contained">
          {saveButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveChangesDialog;