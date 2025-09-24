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
import { FaTooth } from 'react-icons/fa';
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
      setToothChartData(data);
    } catch (error) {
      console.error('Error loading tooth chart:', error);
      setToothChartData({ selectedTeeth: [], toothSummaries: {} });
    }
  };

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

    if (patient && patient.id) {
      loadToothChart(patient.id);
    }
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
  await fetch(`${API_BASE}/tooth-chart/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          selectedTeeth: toothChartData.selectedTeeth, // <-- fixed key
          toothSummaries: toothChartData.toothSummaries 
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
      sx={{ '& .MuiDialog-paper': { width: '70%', borderRadius: 3 } }}
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
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Suffix"
                    sx={{ width: 90, backgroundColor: '#ffffff9e' }}
                    value={suffix}
                    onChange={e => setSuffix(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Middle Name"
                    sx={{ width: 498, backgroundColor: '#ffffff9e' }}
                    value={middleName}
                    onChange={e => setMiddleName(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    sx={{ width: 350, backgroundColor: '#ffffff9e' }}
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    disabled={!editMode}
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
                    disabled={!editMode}
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
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Occupation"
                    sx={{ width: 245, backgroundColor: '#ffffff9e' }}
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    disabled={!editMode}
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
                    disabled={!editMode}
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
                    label="Name"
                    sx={{ width: 498, backgroundColor: '#ffffff9e' }}
                    value={contactPersonName}
                    onChange={e => setContactPersonName(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Relationship"
                    sx={{ width: 245, backgroundColor: '#ffffff9e' }}
                    value={contactPersonRelationship}
                    onChange={e => setContactPersonRelationship(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    sx={{ width: 245, backgroundColor: '#ffffff9e' }}
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
                    sx={{ width: 498, backgroundColor: '#ffffff9e' }}
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
      bgcolor: '#ddd',
      borderRadius: 4,
      p: 3,
      display: 'flex',
      gap: 2,
      alignItems: 'stretch',
      maxHeight: '100%'
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
              sx={{ width: 350, backgroundColor: '#ffffff9e' }}
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              select
              fullWidth
              label="Blood Type"
              sx={{ width: 140, backgroundColor: '#ffffff9e' }}
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
              sx={{ width: 350, backgroundColor: '#ffffff9e' }}
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
              sx={{ width: 140, backgroundColor: '#ffffff9e' }}
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
              sx={{ width: 498, backgroundColor: '#ffffff9e' }}
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
              sx={{ width: 498, backgroundColor: '#ffffff9e' }}
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

      {/* **ADD THIS: Right: Tooth Chart** */}
      <Grid item xs={12} md={5}>
        <ToothChart 
          onDataChange={editMode ? setToothChartData : undefined}
          initialData={toothChartData}
          readOnly={!editMode}
        />
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
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 3 }}>
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
                    backgroundColor: selectedTeeth.includes(num) ? "#f45252d4" : "transparent",
                    "&:hover": readOnly ? {} : { backgroundColor: "#e3f2fd" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                  }}
                >
                  <FaTooth 
                    size={16} 
                    color={selectedTeeth.includes(num) ? "#fff" : "#666"}
                  />
                </Box>
                <Typography 
                  variant="caption" 
                  display="block" 
                  align="center" 
                  sx={{ 
                    mt: 0.5,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                >
                  {num}
                </Typography>
              </Grid>
            ))}
          </Grid>
        ))}
      </Box>
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
