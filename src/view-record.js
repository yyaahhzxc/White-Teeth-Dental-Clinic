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
  MenuItem,
  Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { API_BASE } from './apiConfig';


const bloodTypes = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const ViewRecord = ({ open, onClose, patient, medInfo, onRecordUpdated }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const showSnackbar = (msg) => {
    setSnackbarMsg(msg);
    setSnackbarOpen(true);
    setTimeout(() => setSnackbarOpen(false), 2000);
  };

  // Patient Info State
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

  // Medical Info State
  const [allergies, setAllergies] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [bloodborneDiseases, setBloodborneDiseases] = useState('');
  const [pregnancyStatus, setPregnancyStatus] = useState('');
  const [medications, setMedications] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [diabetic, setDiabetic] = useState('');
  const [xrayFile, setXrayFile] = useState('');

  useEffect(() => {
    if (open) setTabIndex(0);
    setEditMode(false);

    // Fill patient info
    setFirstName(patient?.firstName || '');
    setLastName(patient?.lastName || '');
    setMiddleName(patient?.middleName || '');
    setSuffix(patient?.suffix || '');
    setMaritalStatus(patient?.maritalStatus || '');
    setContactNumber(patient?.contactNumber || '');
    setOccupation(patient?.occupation || '');
    setAddress(patient?.address || '');
    setDateOfBirth(patient?.dateOfBirth || '');
    setSex(patient?.sex || '');
    setContactPersonName(patient?.contactPersonName || '');
    setContactPersonRelationship(patient?.contactPersonRelationship || '');
    setContactPersonNumber(patient?.contactPersonNumber || '');
    setContactPersonAddress(patient?.contactPersonAddress || '');

    // Fill medical info
    setAllergies(medInfo?.allergies || '');
    setBloodType(medInfo?.bloodType || '');
    setBloodborneDiseases(medInfo?.bloodborneDiseases || '');
    setPregnancyStatus(medInfo?.pregnancyStatus || '');
    setMedications(medInfo?.medications || '');
    setAdditionalNotes(medInfo?.additionalNotes || '');
    setBloodPressure(medInfo?.bloodPressure || '');
    setDiabetic(medInfo?.diabetic || '');
    setXrayFile(medInfo?.xrayFile || '');
  }, [open, patient, medInfo]);

  

  const handleTabChange = (event, newValue) => setTabIndex(newValue);

  const handleEditClick = () => setEditMode(true);

  const handleSaveClick = async () => {
    if (!patient || !patient.id) {
  showSnackbar('Cannot save. No patient selected.');
      return;
    }
    try {
      // Update patient info
  await fetch(`${API_BASE}/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, middleName, suffix, maritalStatus,
          contactNumber, occupation, address, dateOfBirth, sex,
          contactPersonName, contactPersonRelationship, contactPersonNumber, contactPersonAddress
        })
      });

      // Update medical info using the patient's ID
  await fetch(`${API_BASE}/medical-information/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allergies, bloodType, bloodborneDiseases, pregnancyStatus,
          medications, additionalNotes, bloodPressure, diabetic
        })
      });

      setEditMode(false); // Exit edit mode on successful save
      
      if (onRecordUpdated) onRecordUpdated(); // Refresh the list in the parent component

    } catch (err) {
      console.error("Save Error:", err);
  showSnackbar('Failed to save changes. Please try again.');
    }
  };

  const handleDialogClose = () => {
    if (editMode) {
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
    // Revert changes by re-populating state from original props
    if (patient) {
      setFirstName(patient?.firstName || '');
    setLastName(patient?.lastName || '');
    setMiddleName(patient?.middleName || '');
    setSuffix(patient?.suffix || '');
    setMaritalStatus(patient?.maritalStatus || '');
    setContactNumber(patient?.contactNumber || '');
    setOccupation(patient?.occupation || '');
    setAddress(patient?.address || '');
    setDateOfBirth(patient?.dateOfBirth || '');
    setSex(patient?.sex || '');
    setContactPersonName(patient?.contactPersonName || '');
    setContactPersonRelationship(patient?.contactPersonRelationship || '');
    setContactPersonNumber(patient?.contactPersonNumber || '');
    setContactPersonAddress(patient?.contactPersonAddress || '');
    }
    if (medInfo) {
      setAllergies(medInfo?.allergies || '');
    setBloodType(medInfo?.bloodType || '');
    setBloodborneDiseases(medInfo?.bloodborneDiseases || '');
    setPregnancyStatus(medInfo?.pregnancyStatus || '');
    setMedications(medInfo?.medications || '');
    setAdditionalNotes(medInfo?.additionalNotes || '');
    setBloodPressure(medInfo?.bloodPressure || '');
    setDiabetic(medInfo?.diabetic || '');
    setXrayFile(medInfo?.xrayFile || '');
    }
    setConfirmOpen(false);
    setEditMode(false);
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth={false}
      sx={{ '& .MuiDialog-paper': { width: '70%' } }}
    >
      <DialogTitle
        sx={{
          color: '#2148C0',
          fontSize: 32,
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: -4,
        }}
      >
        View Patient Record
        <IconButton
          aria-label="close"
          onClick={handleDialogClose}
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
          backgroundColor: '#f5f7fa',
          minHeight: 200,
          px: 4,
          py: 3,
          borderRadius: 3,
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
            <Grid maxWidth="48%" padding={1}>
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
                    onChange={e => setFirstName(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Suffix"
                    sx={{ width: 90, backgroundColor: '#ffffff9e' }}
                    value={suffix}
                    onChange={e => setSuffix(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Middle Name"
                    sx={{ width: 498, backgroundColor: '#ffffff9e' }}
                    value={middleName}
                    onChange={e => setMiddleName(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    sx={{ width: 350, backgroundColor: '#ffffff9e' }}
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Marital Status"
                    sx={{ width: 140, backgroundColor: '#ffffff9e' }}
                    value={maritalStatus}
                    onChange={e => setMaritalStatus(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
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
                    onChange={e => setContactNumber(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Occupation"
                    sx={{ width: 245, backgroundColor: '#ffffff9e' }}
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
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
                    onChange={e => setAddress(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
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
                    onChange={e => setDateOfBirth(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
                  />
                </Grid>
                <Grid item xs={4} sx={{ ml: 3 }}>
                  <Typography variant="body2">Sex</Typography>
                  <RadioGroup
                    row
                    value={sex}
                    onChange={e => setSex(e.target.value)}
                  >
                    <FormControlLabel value="M" control={<Radio />} label="M" disabled={!editMode} />
                    <FormControlLabel value="F" control={<Radio />} label="F" disabled={!editMode} />
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
                    onChange={e => setContactPersonName(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Relationship"
                    sx={{ width: 245, backgroundColor: '#ffffff9e' }}
                    value={contactPersonRelationship}
                    onChange={e => setContactPersonRelationship(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    sx={{ width: 245, backgroundColor: '#ffffff9e' }}
                    value={contactPersonNumber}
                    onChange={e => setContactPersonNumber(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
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
                    onChange={e => setContactPersonAddress(e.target.value)}
                    InputProps={{ readOnly: !editMode }}
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
                  <Grid item xs={8}>
                    <TextField
                      fullWidth
                      label="Allergies"
                      sx={{ width: 350, backgroundColor: '#ffffff9e' }}
                      value={allergies}
                      onChange={e => setAllergies(e.target.value)}
                      InputProps={{ readOnly: !editMode }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      select
                      fullWidth
                      label="Blood Type"
                      sx={{ width: 140, backgroundColor: '#ffffff9e' }}
                      value={bloodType}
                      onChange={e => setBloodType(e.target.value)}
                      InputProps={{ readOnly: !editMode }}
                    >
                      {bloodTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bloodborne Diseases"
                      sx={{ width: 350, backgroundColor: '#ffffff9e' }}
                      value={bloodborneDiseases}
                      onChange={e => setBloodborneDiseases(e.target.value)}
                      InputProps={{ readOnly: !editMode }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Pregnancy Status"
                      sx={{ width: 140, backgroundColor: '#ffffff9e' }}
                      value={pregnancyStatus}
                      onChange={e => setPregnancyStatus(e.target.value)}
                      InputProps={{ readOnly: !editMode }}
                    >
                      <MenuItem value="Pregnant">Pregnant</MenuItem>
                      <MenuItem value="Not Pregnant">Not Pregnant</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Medications"
                      sx={{ width: 498, backgroundColor: '#ffffff9e' }}
                      value={medications}
                      onChange={e => setMedications(e.target.value)}
                      InputProps={{ readOnly: !editMode }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Additional Notes"
                      multiline
                      rows={3}
                      sx={{ width: 498, backgroundColor: '#ffffff9e' }}
                      value={additionalNotes}
                      onChange={e => setAdditionalNotes(e.target.value)}
                      InputProps={{ readOnly: !editMode }}
                    />
                  </Grid>
                  <Grid item xs={4} sx={{ ml: 3 }}>
                    <Typography variant="body2">Blood Pressure</Typography>
                    <RadioGroup
                      row
                      value={bloodPressure}
                      onChange={e => setBloodPressure(e.target.value)}
                    >
                      <FormControlLabel value="High" control={<Radio />} label="High" disabled={!editMode} />
                      <FormControlLabel value="Normal" control={<Radio />} label="Normal" disabled={!editMode} />
                      <FormControlLabel value="Low" control={<Radio />} label="Low" disabled={!editMode} />
                    </RadioGroup>
                  </Grid>
                  <Grid item xs={4} sx={{ ml: 6, mb: 4 }}>
                    <Typography variant="body2">Diabetic</Typography>
                    <RadioGroup
                      row
                      value={diabetic}
                      onChange={e => setDiabetic(e.target.value)}
                    >
                      <FormControlLabel value="Yes" control={<Radio />} label="Yes" disabled={!editMode} />
                      <FormControlLabel value="No" control={<Radio />} label="No" disabled={!editMode} />
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
                    disabled={!editMode}
                  >
                    Upload File
                    <input
                      type="file"
                      hidden
                      // onChange={handleFileChange}
                    />
                  </Button>
                </Grid>
              </Grid>
              {/* Right: Tooth Chart */}
              <Grid item xs={12} md={5}>
                {/* You can add your ToothChart component here if needed */}
              </Grid>
            </Grid>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <IconButton
          color="primary"
          onClick={editMode ? handleSaveClick : handleEditClick}
          sx={{
            borderRadius: 8,
            backgroundColor: '#2148C0',
            color: '#fff',
            px: 2,
            fontWeight: 'bold',
            fontSize: 18,
            mt: 1,
            mb: 1,
            mr: 2
          }}
        >
          {editMode ? <SaveIcon /> : <EditIcon />}
        </IconButton>
      </DialogActions>
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>Save changes?</DialogTitle>
        <DialogContent>
      <Snackbar open={snackbarOpen} message={snackbarMsg} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />
          <Typography>Do you want to save your changes before closing?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDiscard} color="error">Discard</Button>
          <Button onClick={handleConfirmSave} color="primary" variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ViewRecord;
