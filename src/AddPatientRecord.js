import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  MenuItem,
  Grid
} from '@mui/material';

const ToothSVG = ({ selected }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill={selected ? '#1976d2' : 'none'}
    stroke="#000"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2C8 2 7 6 7 8c0 1 .5 3.5 1 5s.5 6 1.5 8c.5 1 2.5 1 3 0C13.5 19 14 15 14 13s1-4 1-5c0-2-1-6-5-6z" />
  </svg>
);

const AddPatientRecord = () => {
  const [selectedTeeth, setSelectedTeeth] = useState([]);

  const toggleTooth = (toothNumber) => {
    setSelectedTeeth((prev) =>
      prev.includes(toothNumber)
        ? prev.filter((t) => t !== toothNumber)
        : [...prev, toothNumber]
    );
  };

  const teeth = Array.from({ length: 32 }, (_, i) => i + 1);

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
        Add Patient Record
      </Typography>
      <Grid container spacing={4}>
        {/* Left Column - Patient Information */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold">Patient Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={8}><TextField fullWidth label="First Name" /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Suffix" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Middle Name" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Last Name" /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Contact Number" /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Occupation" /></Grid>
            <Grid item xs={4}>
              <Typography>Sex</Typography>
              <RadioGroup row>
                <FormControlLabel value="M" control={<Radio />} label="M" />
                <FormControlLabel value="F" control={<Radio />} label="F" />
              </RadioGroup>
            </Grid>
            <Grid item xs={8}><TextField fullWidth label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" /></Grid>
          </Grid>

          <Box mt={4}>
            <Typography variant="h6" fontWeight="bold">Contact Person</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth label="Name" /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Relationship" /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Contact Number" /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Address" /></Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Right Column - Medical Info */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold">Medical Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth label="Allergies" /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Bloodborne Diseases" /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Medications" /></Grid>
            <Grid item xs={3}><TextField fullWidth label="Blood Type" /></Grid>
            <Grid item xs={3}>
              <TextField fullWidth label="Pregnancy Status" select>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={3} /></Grid>
          </Grid>

          <Box mt={4}>
            <Typography variant="h6" fontWeight="bold">Tooth Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField fullWidth label="Tooth Number" /></Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Tooth Condition" select>
                  <MenuItem value="Healthy">Healthy</MenuItem>
                  <MenuItem value="Cavity">Cavity</MenuItem>
                  <MenuItem value="Missing">Missing</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Box mt={2}><Button>Add Tooth</Button></Box>
            <Box mt={2}><TextField fullWidth label="Tooth X-Ray Directory" /></Box>
          </Box>

          {/* Dental Chart */}
          <Box mt={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Dental Chart</Typography>
            <Grid container spacing={1} justifyContent="center">
              {teeth.map((tooth) => (
                <Grid item xs={1} key={tooth} display="flex" justifyContent="center">
                  <Button
                    variant="outlined"
                    onClick={() => toggleTooth(tooth)}
                    size="small"
                    sx={{ minWidth: '36px', padding: '6px', fontSize: '10px', borderRadius: '50%' }}
                  >
                    <ToothSVG selected={selectedTeeth.includes(tooth)} />
                    <Box component="span" ml={0.5}>{tooth}</Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>
      </Grid>

      <Box mt={4} display="flex" justifyContent="center">
        <Button variant="contained" color="primary">Add</Button>
      </Box>
    </Box>
  );
};

export default AddPatientRecord;
