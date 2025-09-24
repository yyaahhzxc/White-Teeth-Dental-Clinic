import React from 'react';
import { Box, TextField, Button, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import './TeethChart.css';

function ToothSummary({ selectedTeeth = [], toothSummaries = {}, editingTooth, editValue, onEdit, onEditSave, onDelete, setEditValue, readOnly = false }) {
  return (
    <Box sx={{ mt: 3, maxHeight: 150, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafafa' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Tooth Number</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Tooth Summary</th>
            {!readOnly && <th style={{ width: 80 }}></th>}
          </tr>
        </thead>
        <tbody>
          {selectedTeeth.length === 0 ? (
            <tr>
              <td colSpan={readOnly ? 2 : 3} style={{ textAlign: 'center', color: '#aaa', padding: 16 }}>
                No teeth selected.
              </td>
            </tr>
          ) : (
            selectedTeeth.map((num) => (
              <tr key={num} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{num}</td>
                <td style={{ padding: 8 }}>
                  {editingTooth === num ? (
                    <Box display="flex" alignItems="center">
                      <TextField
                        size="small"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                        sx={{ mr: 1, width: 120 }}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => onEditSave(num)}
                        sx={{ minWidth: 32, px: 1, fontSize: 12 }}
                      >
                        Save
                      </Button>
                    </Box>
                  ) : (
                    toothSummaries[num] || <span style={{ color: '#aaa' }}>No summary</span>
                  )}
                </td>
                {!readOnly && (
                  <td>
                    <IconButton size="small" onClick={() => onEdit(num)} disabled={editingTooth === num}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDelete(num)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Box>
  );
}

export default ToothSummary;
