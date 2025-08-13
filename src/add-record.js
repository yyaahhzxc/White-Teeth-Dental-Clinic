import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Button,
  Tabs,
  Tab,
  Typography,
  Paper,
  Box,
  IconButton,
  Divider,
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

const AddPatientRecord = ({ open, onClose }) => {
  const [tabIndex, setTabIndex] = useState(0);

// Add state for every field
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [middleName, setMiddleName] = useState('');
const [suffix, setSuffix] = useState('');
const [maritalStatus, setMaritalStatus] = useState('');
const [contactNumber, setContactNumber] = useState('');
const [occupation, setOccupation] = useState('');
const [address, setAddress] = useState('');
const [dateOfBirth, setDateOfBirth] = useState('');
const [sex, setSex] = useState('');
const [contactPersonName, setContactPersonName] = useState('');
const [contactPersonRelationship, setContactPersonRelationship] = useState('');
const [contactPersonNumber, setContactPersonNumber] = useState('');
const [contactPersonAddress, setContactPersonAddress] = useState('');

const handleTabChange = (event, newValue) => setTabIndex(newValue);

useEffect(() => {
  if (open) setTabIndex(0);
}, [open]);

// Backend connection for Add Patient button
const handleAddPatient = async () => {
  const patient = {
    firstName,
    lastName,
    middleName,
    suffix,
    maritalStatus,
    contactNumber,
    occupation,
    address,
    dateOfBirth,
    sex,
    contactPersonName,
    contactPersonRelationship,
    contactPersonNumber,
    contactPersonAddress
  };
  await fetch('http://localhost:3001/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient),
  });
  onClose();
  setFirstName('');
  setLastName('');
  setMiddleName('');
  setSuffix('');
  setMaritalStatus('');
  setContactNumber('');
  setOccupation('');
  setAddress('');
  setDateOfBirth('');
  setSex('');
  setContactPersonName('');
  setContactPersonRelationship('');
  setContactPersonNumber('');
  setContactPersonAddress('');
  setTabIndex(0);
};

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      sx={{ '& .MuiDialog-paper': { width: '70%' } }}
    >
      <DialogTitle
        sx={{
          color: '#2148C0',
          // fontFamily: 'Inter',
          fontSize: 32,
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: -4,

        }}
      >
        Add Patient Record
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[700],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Box display="flex" sx={{ borderBottom: 1, borderColor: 'divider', pl: 2 }}>
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Patient Information" sx={{ fontWeight: 'bold', borderRadius: 8, backgroundColor: tabIndex === 0 ? '#2149c06d' : '#ffffffff', color: tabIndex === 0 ? '#fff' : '#000' }} />
          <Tab label="Medical Information" sx={{ fontWeight: 'bold', borderRadius: 8, backgroundColor: tabIndex === 1 ? '#2149c06d' : '#ffffffff', color: tabIndex === 1 ? '#fff' : '#000' }} />
        </Tabs>
      </Box>
      <DialogContent
        dividers
        sx={{
          backgroundColor: '#f5f7fa', // Change background color
          minHeight: 200,             // Set a minimum height
          px: 4,                      // Horizontal padding
          py: 3,                      // Vertical padding
          borderRadius: 3,            // Rounded corners (if you want)
          // Add any other styles you want here
        }}
      >
        {tabIndex === 0 && (
          <Paper
            elevation={0}
            sx={{
              bgcolor: '#ddd',
              borderRadius: 4,
              p: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'stretch',
            }}
          >
          <Grid
  maxWidth="48%"
  padding={1}
>
  <Typography variant="subtitle1" fontWeight="bold" mb={2}>
    Personal Information
  </Typography>
  <Grid container spacing={1}>
    <Grid item xs={8}>
      <TextField 
        fullWidth 
        label="First Name" 
        sx={{ width: 400, backgroundColor: '#ffffff9e' }} 
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
    </Grid>
    <Grid item xs={4}>
      <TextField 
        fullWidth 
        label="Suffix" 
        sx={{ width: 90, backgroundColor: '#ffffff9e' }} 
        value={suffix}
        onChange={(e) => setSuffix(e.target.value)}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField 
        fullWidth 
        label="Middle Name" 
        sx={{ width: 498, backgroundColor: '#ffffff9e' }} 
        value={middleName}
        onChange={(e) => setMiddleName(e.target.value)}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField 
        fullWidth 
        label="Last Name" 
        sx={{ width: 350, backgroundColor: '#ffffff9e' }} 
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        select
        fullWidth
        label="Marital Status"
        sx={{ width: 140, backgroundColor: '#ffffff9e' }}
        value={maritalStatus}
        onChange={(e) => setMaritalStatus(e.target.value)}
      >
        <MenuItem value="Married">Married</MenuItem>
        <MenuItem value="Single">Single</MenuItem>
      </TextField>
    </Grid>
    <Grid item xs={6}>
      <TextField 
        fullWidth 
        label="Contact Number" 
        sx={{ width: 245, backgroundColor: '#ffffff9e' }} 
        value={contactNumber}
        onChange={(e) => setContactNumber(e.target.value)}
      />
    </Grid>
    <Grid item xs={6}>
      <TextField 
        fullWidth 
        label="Occupation" 
        sx={{ width: 245, backgroundColor: '#ffffff9e' }} 
        value={occupation}
        onChange={(e) => setOccupation(e.target.value)}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField 
        fullWidth 
        label="Address" 
        multiline 
        rows={3} 
        sx={{ mb: 0.8, width: 498, backgroundColor: '#ffffff9e' }} 
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField 
        fullWidth 
        label="Date of Birth" 
        type="date" 
        sx={{ width: 250, backgroundColor: '#ffffff9e' }} 
        InputLabelProps={{ shrink: true }}
        value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
      />
    </Grid>
    <Grid item xs={4} sx={{ ml: 3 }}>
      <Typography variant="body2">Sex</Typography>
      <RadioGroup 
        row
        value={sex}
        onChange={(e) => setSex(e.target.value)}
      >
        <FormControlLabel value="M" control={<Radio />} label="M" />
        <FormControlLabel value="F" control={<Radio />} label="F" />
      </RadioGroup>
    </Grid>
  </Grid>
</Grid>

{/* Contact Person */}
<Grid
  item
  xs={12}
  md={6}
  sx={{ pl: { md: 2 }, pt: 1 }}
  maxWidth="48%"
>
  <Typography variant="subtitle1" fontWeight="bold" mb={2}>
    Contact Person
  </Typography>
  <Grid container spacing={1}>
    <Grid item xs={12}>
      <TextField 
        fullWidth 
        label="Name" 
        sx={{ width: 498, backgroundColor: '#ffffff9e' }} 
        value={contactPersonName}
        onChange={(e) => setContactPersonName(e.target.value)}
      />
    </Grid>
    <Grid item xs={6}>
      <TextField 
        fullWidth 
        label="Relationship" 
        sx={{ width: 245, backgroundColor: '#ffffff9e' }} 
        value={contactPersonRelationship}
        onChange={(e) => setContactPersonRelationship(e.target.value)}
      />
    </Grid>
    <Grid item xs={6}>
      <TextField 
        fullWidth 
        label="Contact Number" 
        sx={{ width: 245, backgroundColor: '#ffffff9e' }} 
        value={contactPersonNumber}
        onChange={(e) => setContactPersonNumber(e.target.value)}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField 
        fullWidth 
        label="Address" 
        multiline 
        rows={3} 
        sx={{ width: 498, backgroundColor: '#ffffff9e' }} 
        value={contactPersonAddress}
        onChange={(e) => setContactPersonAddress(e.target.value)}
      />
    </Grid>
  </Grid>
</Grid>


          </Paper>
        )}
        {tabIndex === 1 && (
          <Paper
            elevation={0}
            sx={{
              bgcolor: '#ddd',
              borderRadius: 4,
              p: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'stretch',
            }}
          >
            <Grid container spacing={2}>
              {/* Left: Health Profile */}
              <Grid item xs={12} md={7} maxWidth="48%">
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                  Health Profile
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={8}><TextField fullWidth label="Allergies" sx={{ width: 350, backgroundColor: '#ffffff9e' }} /></Grid>
                  <Grid item xs={4}>
                    <TextField
                      select
                      fullWidth
                      label="Blood Type"
                      sx={{ width: 140, backgroundColor: '#ffffff9e' }}
                      defaultValue=""
                    >
                      <MenuItem value="A+">A+</MenuItem>
                      <MenuItem value="A-">A-</MenuItem>
                      <MenuItem value="B+">B+</MenuItem>
                      <MenuItem value="B-">B-</MenuItem>
                      <MenuItem value="AB+">AB+</MenuItem>
                      <MenuItem value="AB-">AB-</MenuItem>
                      <MenuItem value="O+">O+</MenuItem>
                      <MenuItem value="O-">O-</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}><TextField fullWidth label="Bloodborne Diseases" sx={{ width: 350, backgroundColor: '#ffffff9e' }} /></Grid>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Pregnancy Status"
                      sx={{ width: 140, backgroundColor: '#ffffff9e' }}
                      defaultValue=""
                    >
                      <MenuItem value="Pregnant">Pregnant</MenuItem>
                      <MenuItem value="Not Pregnant">Not Pregnant</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={6}><TextField fullWidth label="Medications" sx={{ width: 498, backgroundColor: '#ffffff9e' }} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Additional Notes" multiline rows={3} sx={{ width: 498, backgroundColor: '#ffffff9e' }} /></Grid>
                 <Grid item xs={4} sx={{ ml: 3 }}>
                    <Typography variant="body2">Blood Pressure</Typography>
                    <RadioGroup row>
                      <FormControlLabel value="High" control={<Radio />} label="High" />
                      <FormControlLabel value="Normal" control={<Radio />} label="Normal" />
                      <FormControlLabel value="Low" control={<Radio />} label="Low" />
                    </RadioGroup>
                  </Grid>
                  <Grid item xs={4} sx={{ ml:6, mb: 4}}>
                    <Typography variant="body2">Diabetic</Typography>
                    <RadioGroup row>
                      <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                      <FormControlLabel value="No" control={<Radio />} label="No" />
                    </RadioGroup>
                  </Grid>
                </Grid>

                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                X-Ray Uploads
              </Typography>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ mt: 2 }}
                >
                  Upload File
                  <input
                    type="file"
                    hidden
                  // onChange={handleFileChange} // Optional: add a handler if you want to process the file
                  />
                </Button>
              </Grid>
              </Grid>
              {/* Right: Tooth Chart */}
              <Grid item xs={12} md={5}>
                <ToothChart />
              </Grid>
            </Grid>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
      <Button
  variant="contained"
  color="primary"
  sx={{ borderRadius: 8, px: 2, fontWeight: 'bold', fontSize: 18, mt: 1, mb: 1, mr: 2, backgroundColor: '#2148C0' }}
  onClick={handleAddPatient} // <-- added this
>
  Add Patient
</Button>

      </DialogActions>
    </Dialog>
  );
};

const teethNumbers = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26],
  [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36],
];

function ToothChart() {
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [toothSummaries, setToothSummaries] = useState({}); // { [toothNumber]: summary }
  const [editingTooth, setEditingTooth] = useState(null);
  const [editValue, setEditValue] = useState('');

  const toggleTooth = (num) => {
    setSelectedTeeth((prev) =>
      prev.includes(num) ? prev.filter((t) => t !== num) : [...prev, num]
    );
    // Remove summary if tooth is deselected
    if (selectedTeeth.includes(num)) {
      setToothSummaries((prev) => {
        const copy = { ...prev };
        delete copy[num];
        return copy;
      });
    }
  };

  const handleEdit = (num) => {
    setEditingTooth(num);
    setEditValue(toothSummaries[num] || '');
  };

  const handleEditSave = (num) => {
    setToothSummaries((prev) => ({ ...prev, [num]: editValue }));
    setEditingTooth(null);
    setEditValue('');
  };

  const handleDelete = (num) => {
    setSelectedTeeth((prev) => prev.filter((t) => t !== num));
    setToothSummaries((prev) => {
      const copy = { ...prev };
      delete copy[num];
      return copy;
    });
    if (editingTooth === num) {
      setEditingTooth(null);
      setEditValue('');
    }
  };

  return (
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 3 }}>
        {teethNumbers.map((row, rowIndex) => (
          <Grid
            container
            justifyContent="center"
            spacing={1}
            key={rowIndex}
            sx={{ mb: 2 }}
          >
            {row.map((num) => (
              <Grid item key={num}>
                <Box
                  onClick={() => toggleTooth(num)}
                  sx={{
                    width: 27,
                    height: 35,
                    borderRadius: 1,
                    cursor: "pointer",
                    backgroundColor: selectedTeeth.includes(num)
                      ? "#f45252d4"
                      : "transparent",
                    "&:hover": { backgroundColor: "#e3f2fd" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                  }}
                >
                  ⊠
                </Box>
                <Typography
                  variant="caption"
                  display="block"
                  align="center"
                  marginTop={-3}
                  sx={{ mt: 0.5 }}
                >
                  {num}
                </Typography>
              </Grid>
            ))}
          </Grid>
        ))}
      </Box>
      {/* Tooth List Table */}
      <Box sx={{ mt: 3, maxHeight: 150, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafafa' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Tooth Number</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Tooth Summary</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {selectedTeeth.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: '#aaa', padding: 16 }}>
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
                          onClick={() => handleEditSave(num)}
                          sx={{ minWidth: 32, px: 1, fontSize: 12 }}
                        >
                          Save
                        </Button>
                      </Box>
                    ) : (
                      toothSummaries[num] || <span style={{ color: '#aaa' }}>No summary</span>
                    )}
                  </td>
                  <td>
                    <IconButton size="small" onClick={() => handleEdit(num)} disabled={editingTooth === num}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(num)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Box>
    </Paper>
  );
}

export default AddPatientRecord;