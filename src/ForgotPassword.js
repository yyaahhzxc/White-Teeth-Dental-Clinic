import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, InputAdornment, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Security questions and answers (desktop-only app)
// Q1: What year was White Teeth Dental Clinic founded? -> 2019
// Q2: What is the name of the city from which did the dentist graduate for their college? -> Davao or Davao City
// Q3: What is the first name of the dentist's son? -> Jan or Kenneth or Jan Kenneth

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=questions, 2=new-password
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwErrors, setPwErrors] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  const validateAnswers = async () => {
    setError('');
    setStatus('');
    try {
  const res = await fetch(`${API_BASE}/forgot-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q1, q2, q3 }),
      });
      if (res.ok) {
        setStep(2);
      } else {
        setError('Incorrect answers, try again');
      }
    } catch (err) {
      setError('Unable to contact server.');
    }
  };

  const passwordMeetsPolicy = (pw) => {
    const errors = [];
    if (!/[A-Z]/.test(pw)) errors.push('Password must contain at least one uppercase letter.');
    if (!/[0-9]/.test(pw)) errors.push('Password must contain at least one number.');
    if (!/[!@#$%^&*(),.?"':{}|<>]/.test(pw)) errors.push('Password must contain at least one special character.');
    return errors;
  };

  const handleReset = async () => {
    setPwErrors([]);
    setError('');
    setStatus('');

    if (!newPassword || !confirmPassword) {
      setPwErrors(['Please enter and confirm your new password.']);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwErrors(['New password and confirm password do not match.']);
      return;
    }
    // Client-side policy checks
    const policyErrs = passwordMeetsPolicy(newPassword);
    if (policyErrs.length > 0) {
      setPwErrors(policyErrs);
      return;
    }

  // Server will enforce that the new password is not the same as the stored password.

    try {
  const res = await fetch(`${API_BASE}/forgot-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('Password updated. Redirecting to login...');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setPwErrors([data.message || 'Unable to reset password.']);
      }
    } catch (err) {
      setPwErrors(['Unable to contact server.']);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 4, width: 480, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Forgot Password
        </Typography>
        <Typography sx={{ mb: 2 }}>
          To change password, contact main dentist to answer the questions below.
        </Typography>

        {step === 1 && (
          <Box>
            <Typography sx={{ textAlign: 'left', fontWeight: 'bold' }}>
              1. What year was White Teeth Dental Clinic founded?
            </Typography>
            <TextField fullWidth value={q1} onChange={(e) => setQ1(e.target.value)} margin="normal" />

            <Typography sx={{ textAlign: 'left', fontWeight: 'bold' }}>
              2. What is the name of the city from which did the dentist graduate for their college?
            </Typography>
            <TextField fullWidth value={q2} onChange={(e) => setQ2(e.target.value)} margin="normal" />

            <Typography sx={{ textAlign: 'left', fontWeight: 'bold' }}>
              3. What is the first name of the dentist's son?
            </Typography>
            <TextField fullWidth value={q3} onChange={(e) => setQ3(e.target.value)} margin="normal" />

            {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}

            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={validateAnswers}>
              Submit Answers
            </Button>
            <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => navigate('/login')}>
              Back to login
            </Button>
          </Box>
        )}

        {step === 2 && (
          <Box>
            <Typography sx={{ mb: 1, fontWeight: 'bold' }}>Set a new password</Typography>

            <TextField
              fullWidth
              label="New password"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              onBlur={() => setPwErrors(passwordMeetsPolicy(newPassword))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={() => setShowNew(s => !s)}>
                      {showNew ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm new password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={() => setShowConfirm(s => !s)}>
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {pwErrors.length > 0 && (
              <Box sx={{ textAlign: 'left', mt: 1 }}>
                {pwErrors.map((p, i) => (
                  <Typography key={i} color="error">{p}</Typography>
                ))}
              </Box>
            )}

            {status && <Typography color="primary" sx={{ mt: 1 }}>{status}</Typography>}

            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleReset}>
              Confirm Password
            </Button>

            <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => setStep(1)}>
              Back to questions
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default ForgotPassword;
