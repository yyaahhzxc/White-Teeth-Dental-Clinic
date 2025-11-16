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
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import TeethChart from '../components/TeethChart';
import Toast from '../components/Toast';
import { API_BASE } from '../apiConfig';
// This should resolve to 'http://localhost:3001'


const bloodTypes = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const ViewRecord = ({ open, onClose, patient, medInfo, onRecordUpdated }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast({ open: false, message: '', type: 'info' }), 2000);
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


// Add these state variables at the top of your ViewRecord component (around line 25)
const [originalPatientData, setOriginalPatientData] = useState(null);
const [originalMedicalData, setOriginalMedicalData] = useState(null);
const [originalToothChartData, setOriginalToothChartData] = useState({ selectedTeeth: [], toothSummaries: {} });

// Tooth chart state
const [toothChartData, setToothChartData] = useState({
  selectedTeeth: [],
  toothSummaries: {}
});

 

  // Load tooth chart data
const loadToothChart = async (patientId) => {
  try {
    const response = await fetch(`${API_BASE}/tooth-chart/${patientId}`);
    const data = await response.json();
    const chartData = data || { selectedTeeth: [], toothSummaries: {} };
    setToothChartData(chartData);
    setOriginalToothChartData(chartData); // Store original for comparison
  } catch (error) {
    console.error('Error loading tooth chart:', error);
    const emptyChart = { selectedTeeth: [], toothSummaries: {} };
    setToothChartData(emptyChart);
    setOriginalToothChartData(emptyChart);
  }
};

  useEffect(() => {
    if (open) setTabIndex(0);
    setEditMode(false);

     // Store original data for comparison
  setOriginalPatientData(patient);
  setOriginalMedicalData(medInfo);

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

    if (patient && patient.id) {
      loadToothChart(patient.id);
    }
  }, [open, patient, medInfo]);

  

  const handleTabChange = (event, newValue) => setTabIndex(newValue);

  const handleEditClick = () => setEditMode(true);




  // Replace your existing handleSaveClick function
// Replace your entire handleSaveClick function
const handleSaveClick = async () => {
  console.log('🚀 Save button clicked!'); // Debug log
  
  if (!patient || !patient.id) {
    showToast('Cannot save. No patient selected.', 'error');
    return;
  }
  
  try {
    console.log('📋 Checking what changed...');
    
    // Compare with original data and count changed fields
    let changedFieldsCount = 0;
    
    // Patient data field comparison
    const patientFields = [
      { current: firstName, original: originalPatientData?.firstName },
      { current: lastName, original: originalPatientData?.lastName },
      { current: middleName, original: originalPatientData?.middleName },
      { current: suffix, original: originalPatientData?.suffix },
      { current: maritalStatus, original: originalPatientData?.maritalStatus },
      { current: contactNumber, original: originalPatientData?.contactNumber },
      { current: occupation, original: originalPatientData?.occupation },
      { current: address, original: originalPatientData?.address },
      { current: dateOfBirth, original: originalPatientData?.dateOfBirth },
      { current: sex, original: originalPatientData?.sex },
      { current: contactPersonName, original: originalPatientData?.contactPersonName },
      { current: contactPersonRelationship, original: originalPatientData?.contactPersonRelationship },
      { current: contactPersonNumber, original: originalPatientData?.contactPersonNumber },
      { current: contactPersonAddress, original: originalPatientData?.contactPersonAddress }
    ];
    
    patientFields.forEach(field => {
      if ((field.current || '') !== (field.original || '')) {
        changedFieldsCount++;
      }
    });
    
    const patientDataChanged = changedFieldsCount > 0;

    // Medical data field comparison
    let medicalChangedCount = 0;
    const medicalFields = [
      { current: allergies, original: originalMedicalData?.allergies },
      { current: bloodType, original: originalMedicalData?.bloodType },
      { current: bloodborneDiseases, original: originalMedicalData?.bloodborneDiseases },
      { current: pregnancyStatus, original: originalMedicalData?.pregnancyStatus },
      { current: medications, original: originalMedicalData?.medications },
      { current: additionalNotes, original: originalMedicalData?.additionalNotes },
      { current: bloodPressure, original: originalMedicalData?.bloodPressure },
      { current: diabetic, original: originalMedicalData?.diabetic }
    ];
    
    medicalFields.forEach(field => {
      if ((field.current || '') !== (field.original || '')) {
        medicalChangedCount++;
      }
    });
    
    changedFieldsCount += medicalChangedCount;
    const medicalDataChanged = medicalChangedCount > 0;

 // Proper tooth chart change detection
 const toothChartChanged = (
  JSON.stringify(toothChartData.selectedTeeth.sort()) !== JSON.stringify((originalToothChartData.selectedTeeth || []).sort()) ||
  JSON.stringify(toothChartData.toothSummaries) !== JSON.stringify(originalToothChartData.toothSummaries || {})
);

console.log('🔍 Change Detection:', {
  patientDataChanged,
  medicalDataChanged,
  toothChartChanged
});

let updateCount = 0;
let hasAnyChanges = patientDataChanged || medicalDataChanged || toothChartChanged;

if (!hasAnyChanges) {
  showToast('No changes detected.', 'info');
  setEditMode(false);
  return;
}

       // Only update what actually changed
       if (patientDataChanged) {
        console.log('📝 Updating patient data...');
        const response = await fetch(`${API_BASE}/patients/${patient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName, lastName, middleName, suffix, maritalStatus,
            contactNumber, occupation, address, dateOfBirth, sex,
            contactPersonName, contactPersonRelationship, contactPersonNumber, contactPersonAddress
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update patient information: ${errorText}`);
        }
        updateCount++;
      }
  
      if (medicalDataChanged) {
        console.log('🏥 Updating medical data...');
        const response = await fetch(`${API_BASE}/medical-information/${patient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            allergies, bloodType, bloodborneDiseases, pregnancyStatus,
            medications, additionalNotes, bloodPressure, diabetic,
            skipLogging: patientDataChanged
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update medical information: ${errorText}`);
        }
        updateCount++;
      }



  if (toothChartChanged) {
      console.log('🦷 Updating tooth chart...');
      const response = await fetch(`${API_BASE}/tooth-chart/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          selectedTeeth: toothChartData.selectedTeeth,
          toothSummaries: toothChartData.toothSummaries,
          skipLogging: patientDataChanged || medicalDataChanged
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update tooth chart: ${errorText}`);
      }
      updateCount++;
    }

    console.log('✅ All updates completed!');
    setEditMode(false);
    if (onRecordUpdated) onRecordUpdated();
    showToast(`Successfully updated ${changedFieldsCount} field${changedFieldsCount > 1 ? 's' : ''}.`, 'success');

    setTimeout(() => {
      onClose();
    }, 1000);


  } catch (err) {
    console.error("💥 Save Error:", err);
    showToast(`Failed to save changes: ${err.message}`, 'error');
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
      sx={{ '& .MuiDialog-paper': { width: '70%', borderRadius: 3 } }}
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle
        sx={{
          color: (theme) => theme.palette.mode === 'dark' ? theme.palette.primary.main : '#2148C0',
          fontSize: 32,
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: -2,
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
            color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.grey[700]),
            '&:hover': { backgroundColor: 'transparent' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Box display="flex" sx={{ borderBottom: 1, borderColor: 'divider', pl: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          TabIndicatorProps={{ style: { display: 'none' } }}
          sx={{ ml: 1 }}
        >
          <Tab
            label="Patient Information"
            sx={(theme) => ({
              fontWeight: 'bold',
              borderRadius: 2,
              px: 2,
              textTransform: 'none',
              zIndex: 2,
              // default (unselected)
              color: theme.palette.mode === 'dark' ? theme.palette.text.primary : '#000',
              backgroundColor: 'transparent',
              // selected state
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.getContrastText(theme.palette.primary.main),
              },
              '&.Mui-selected:hover': {
                backgroundColor: theme.palette.primary.dark || theme.palette.primary.main,
              },
            })}
          />
          <Tab
            label="Medical Information"
            sx={(theme) => ({
              fontWeight: 'bold',
              borderRadius: 2,
              px: 2,
              textTransform: 'none',
              zIndex: 2,
              color: theme.palette.mode === 'dark' ? theme.palette.text.primary : '#000',
              backgroundColor: 'transparent',
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.getContrastText(theme.palette.primary.main),
              },
              '&.Mui-selected:hover': {
                backgroundColor: theme.palette.primary.dark || theme.palette.primary.main,
              },
            })}
          />
        </Tabs>
      </Box>
      <DialogContent
        dividers
        sx={{
          backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#f5f7fa'),
          minHeight: 200,
          maxHeight: 'calc(90vh - 180px)',
          overflowY: 'auto',
          px: 4,
          py: 3,
          borderRadius: 3,
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
        }}
      >
        {tabIndex === 0 && (
          <Paper
            elevation={0}
            sx={{
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ddd'),
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
                    label="First Name *"
                    sx={{ width: 400, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Suffix"
                    sx={{ width: 90, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    value={suffix}
                    onChange={e => setSuffix(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Middle Name"
                    sx={{ width: 498, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    value={middleName}
                    onChange={e => setMiddleName(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Last Name *"
                    sx={{ width: 350, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Marital Status *"
                    sx={{ width: 140, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    value={maritalStatus}
                    onChange={e => setMaritalStatus(e.target.value)}
                    disabled={!editMode}
                  >
                    <MenuItem value="Married">Married</MenuItem>
                    <MenuItem value="Single">Single</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Contact Number *"
                    sx={{ width: 245, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Occupation *"
                    sx={{ width: 245, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address *"
                    multiline
                    rows={3}
                    sx={{ mb: 0.8, width: 498, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Date of Birth *"
                    type="date"
                    sx={{ width: 250, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    InputLabelProps={{ shrink: true }}
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={4} sx={{ ml: 3 }}>
                  <Typography variant="body2">Sex</Typography>
                  <RadioGroup
                    row
                    value={sex}
                    onChange={e => setSex(e.target.value)}
                  >
                    <FormControlLabel value="M" control={<Radio disabled={!editMode} />} label="M" />
                    <FormControlLabel value="F" control={<Radio disabled={!editMode} />} label="F" />
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
                    label="Name *"
                    sx={{ width: 245, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    value={contactPersonName}
                    onChange={e => setContactPersonName(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Relationship *"
                    sx={{ width: 245, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    value={contactPersonRelationship}
                    onChange={e => setContactPersonRelationship(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    sx={{ width: 245, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    value={contactPersonNumber}
                    onChange={e => setContactPersonNumber(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    rows={3}
                    sx={{ width: 498, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
                    value={contactPersonAddress}
                    onChange={e => setContactPersonAddress(e.target.value)}
                    disabled={!editMode}
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
      bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ddd'),
      borderRadius: 4,
      p: 3,
      display: 'flex',
      gap: 2,
      alignItems: 'flex-start',
      minHeight: `${Math.max(600, 300 + (Object.keys(toothChartData.toothSummaries || {}).length * 60))}px`,
      height: 'auto'
    }}
  >
    <Grid container spacing={2}>
      {/* Left: Medical Information */}
      <Grid item xs={12} md={7} maxWidth="48%">
        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
          Health Profile
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={8}>
            <TextField
              fullWidth
              label="Allergies"
              sx={{ width: 350, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              select
              fullWidth
              label="Blood Type *"
              sx={{ width: 140, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              disabled={!editMode}
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
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bloodborne Diseases"
              sx={{ width: 350, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
              value={bloodborneDiseases}
              onChange={(e) => setBloodborneDiseases(e.target.value)}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Pregnancy Status"
              sx={{ width: 140, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
              value={pregnancyStatus}
              onChange={(e) => setPregnancyStatus(e.target.value)}
              disabled={!editMode}
            >
              <MenuItem value="Pregnant">Pregnant</MenuItem>
              <MenuItem value="Not Pregnant">Not Pregnant</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Medications"
              sx={{ width: 498, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Additional Notes"
              multiline
              rows={3}
              sx={{ width: 498, backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff9e') }}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={4} sx={{ ml: 3 }}>
            <Typography variant="body2">Blood Pressure</Typography>
            <RadioGroup row value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)}>
              <FormControlLabel value="High" control={<Radio disabled={!editMode} />} label="High" />
              <FormControlLabel value="Normal" control={<Radio disabled={!editMode} />} label="Normal" />
              <FormControlLabel value="Low" control={<Radio disabled={!editMode} />} label="Low" />
            </RadioGroup>
          </Grid>
          <Grid item xs={4} sx={{ ml: 6, mb: 4 }}>
            <Typography variant="body2">Diabetic</Typography>
            <RadioGroup row value={diabetic} onChange={(e) => setDiabetic(e.target.value)}>
              <FormControlLabel value="Yes" control={<Radio disabled={!editMode} />} label="Yes" />
              <FormControlLabel value="No" control={<Radio disabled={!editMode} />} label="No" />
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
            />
          </Button>
        </Grid>
      </Grid>

      {/* **RIGHT: Tooth Chart** */}
      <Grid item xs={12} md={5}>
        <Box>
          <TeethChart 
            selectedTeeth={toothChartData.selectedTeeth}
            toothSummaries={toothChartData.toothSummaries}
            onTeethChange={(updatedTeeth) => {
              if (editMode) {
                setToothChartData(prev => ({
                  ...prev,
                  selectedTeeth: updatedTeeth
                }));
              }
            }}
            readOnly={!editMode}
          />
        </Box>
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
            backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.primary.main : '#2148C0'),
            color: (theme) => (theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : '#fff'),
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
          <Typography>Do you want to save your changes before closing?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDiscard} color="error">Discard</Button>
          <Button onClick={handleConfirmSave} color="primary" variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      <Toast 
        open={toast.open} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Dialog>
  );
};

// **ADD THIS: Tooth Chart Component**
const teethNumbers = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26],
  [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36],
];

function ToothChart({ onDataChange, initialData = { selectedTeeth: [], toothSummaries: {} }, readOnly = false }) {
  const [selectedTeeth, setSelectedTeeth] = useState(initialData.selectedTeeth || []);
  const [toothSummaries, setToothSummaries] = useState(initialData.toothSummaries || {});
  const [editingTooth, setEditingTooth] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setSelectedTeeth(initialData.selectedTeeth || []);
    setToothSummaries(initialData.toothSummaries || {});
  }, [initialData]);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        selectedTeeth,
        toothSummaries
      });
    }
  }, [selectedTeeth, toothSummaries, onDataChange]);

  const toggleTooth = (num) => {
    if (readOnly) return;
    setSelectedTeeth((prev) => {
      const newSelected = prev.includes(num) 
        ? prev.filter((t) => t !== num) 
        : [...prev, num];
      
      if (prev.includes(num)) {
        setToothSummaries((prevSummaries) => {
          const copy = { ...prevSummaries };
          delete copy[num];
          return copy;
        });
      }
      
      return newSelected;
    });
  };

  const handleEdit = (num) => {
    if (readOnly) return;
    setEditingTooth(num);
    setEditValue(toothSummaries[num] || '');
  };

  const handleEditSave = (num) => {
    setToothSummaries((prev) => ({ ...prev, [num]: editValue }));
    setEditingTooth(null);
    setEditValue('');
  };

  const handleDelete = (num) => {
    if (readOnly) return;
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
    <Paper sx={{ p: 2, borderRadius: 3, bgcolor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : 'transparent') }}>
      <Box sx={{ backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.default : 'white'), p: 2, borderRadius: 3 }}>
         {teethNumbers.map((row, rowIndex) => (
           <Grid container justifyContent="center" spacing={1} key={rowIndex} sx={{ mb: 2 }}>
             {row.map((num) => (
               <Grid item key={num}>
                 <Box
                   onClick={() => toggleTooth(num)}
                   sx={{
                     width: 27,
                     height: 35,
                     borderRadius: 1,
                     cursor: readOnly ? "default" : "pointer",
                     backgroundColor: (theme) => selectedTeeth.includes(num)
                       ? (theme.palette.mode === 'dark' ? theme.palette.error.main : '#f45252d4')
                       : 'transparent',
                     "&:hover": readOnly
                       ? {}
                       : (theme) => ({ backgroundColor: theme.palette.action.hover || (theme.palette.mode === 'dark' ? theme.palette.action.hover : '#e3f2fd') }),
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     fontSize: 12,
                   }}
                 >
                   ⊠
                 </Box>
                 <Typography variant="caption" display="block" align="center" sx={{ mt: 0.5, color: (theme) => theme.palette.text.primary }}>
                   {num}
                 </Typography>
               </Grid>
             ))}
           </Grid>
         ))}
       </Box>
      <Box
        sx={{
          mt: 3,
          maxHeight: 150,
          overflowY: 'auto',
          // ensure the inner table and cells use theme colors
          '& table': {
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: (theme) => (theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafafa'),
          },
          '& th, & td': {
            padding: 1,
            color: (theme) => theme.palette.text.primary,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          },
          '& thead th': {
            textAlign: 'left',
            padding: 1,
            fontWeight: 600,
            color: (theme) => theme.palette.text.primary,
          }
        }}
      >
        <table>
           <thead>
             <tr>
              <th>Tooth Number</th>
              <th>Tooth Summary</th>
              {!readOnly && <th style={{ width: 80 }}></th>}
             </tr>
           </thead>
           <tbody>
             {selectedTeeth.length === 0 ? (
               <tr>
                <td colSpan={readOnly ? 2 : 3} style={{ textAlign: 'center', color: 'var(--no-teeth-color, #aaa)', padding: 16 }}>
                  No teeth selected.
                </td>
               </tr>
             ) : (
               selectedTeeth.map((num) => (
                 <tr key={num} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{num}</td>
                  <td>
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
                   {!readOnly && (
                     <td>
                       <IconButton size="small" onClick={() => handleEdit(num)} disabled={editingTooth === num}>
                         <EditIcon fontSize="small" />
                       </IconButton>
                       <IconButton size="small" onClick={() => handleDelete(num)}>
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
     </Paper>
   );
 }


export default ViewRecord;
