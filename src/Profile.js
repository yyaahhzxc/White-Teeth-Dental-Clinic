import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  TextField,
  Grid,
  IconButton,
} from "@mui/material";
import { FaUserCircle } from "react-icons/fa";
import { Edit } from "@mui/icons-material";
import Header from "./header";
import QuickActionButton from "./QuickActionButton";

export default function Profile() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    employeeRole: "",
    userRole: "",
    status: ""
  });
  const [photo, setPhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Get current user data
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      // First try to get user from localStorage (same as header)
      const userStr = localStorage.getItem('user');
      let username = 'admin';
      let currentUser = null;
      if (userStr) {
        currentUser = JSON.parse(userStr);
        username = currentUser.username || 'admin';
      }
      // Always fetch actual info from backend
      let userInfo = null;
      try {
        const response = await fetch(`http://localhost:3001/users`);
        if (response.ok) {
          const users = await response.json();
          userInfo = users.find(user => user.username === username) || users[0];
        }
      } catch (err) {
        // fallback to localStorage info if backend fails
        userInfo = currentUser;
      }
      if (userInfo) {
        setFormData({
          firstName: userInfo.firstName || "",
          lastName: userInfo.lastName || "",
          username: userInfo.username || "",
          password: "••••••••", // Hide actual password
          employeeRole: userInfo.employeeRole || "",
          userRole: userInfo.userRole || userInfo.role || "",
          status: userInfo.status || ""
        });
      }
      // Fetch photo from backend
      if (username) {
        try {
          const photoRes = await fetch(`http://localhost:3001/user-photo/${username}`);
          if (photoRes.ok) {
            const { photo: photoData } = await photoRes.json();
            setPhoto(photoData || "");
          }
        } catch (err) {
          setPhoto("");
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle photo upload
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      try {
        await fetch(`http://localhost:3001/user-photo/${formData.username || 'admin'}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo: base64 })
        });
        setPhoto(base64);
      } catch (err) {
        // handle error
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle photo removal
  const handleRemovePhoto = async () => {
    setUploading(true);
    try {
      await fetch(`http://localhost:3001/user-photo/${formData.username || 'admin'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: '' })
      });
      setPhoto("");
    } catch (err) {
      // handle error
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundImage: 'url("/White-Teeth-BG.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: 'url("/White-Teeth-BG.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navbar */}
      <Header />

      {/* Profile Settings */}
      <Box sx={{ p: 4, flex: 1, display: "flex", justifyContent: "center" }}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 3,
            width: "100%",
            bgcolor: "white",
            display: "flex",
            alignContent: "center",
            position: "relative",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: "#2148C0",
              fontWeight: 700,
              mb: 4,
              position: "absolute",
            }}
          >
            Profile Settings
          </Typography>

          <Grid container spacing={4}>
            {/* Profile Picture */}
            <Grid
              item
              xs={12}
              md={4}
              width="40%"
              height="100%"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
            >
              <Avatar
                sx={{
                  bgcolor: "#ede7f6",
                  width: "68%",
                  height: "60%",
                  fontSize: 100,
                  mb: 2,
                }}
                src={photo || undefined}
              >
                {!photo && <FaUserCircle color="#7e57c2" />}
              </Avatar>
              <Box mt={2} display="flex" justifyContent="center" gap={2}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="profile-photo-upload"
                  type="file"
                  onChange={handlePhotoChange}
                  disabled={uploading}
                />
                <label htmlFor="profile-photo-upload">
                  <Button variant="contained" size="small" component="span" disabled={uploading}>
                    Change Photo
                  </Button>
                </label>
                <Button variant="outlined" size="small" onClick={handleRemovePhoto} disabled={uploading || !photo}>
                  Remove Photo
                </Button>
              </Box>
            </Grid>

            {/* Form Fields */}
            <Grid
              item
              xs={12}
              md={8}
              container
              spacing={2}
              width="57%"
              height="100%"
              alignContent="center"
              pb="7%"
            >
              <Grid item xs={12} md={6} width="45%" mt={7}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 0.5, fontWeight: 600 }}
                >
                  First Name
                </Typography>
                <TextField
                  fullWidth
                  name="firstName"
                  InputProps={{ readOnly: true }}
                  value={formData.firstName}
                />
              </Grid>
              <Grid item xs={12} md={6} width="45%" mt={7}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 0.5, fontWeight: 600 }}
                >
                  Last Name
                </Typography>
                <TextField
                  fullWidth
                  name="lastName"
                  value={formData.lastName}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6} width="45%" mt={7}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 0.5, fontWeight: 600 }}
                >
                  Username
                </Typography>
                <TextField
                  fullWidth
                  name="username"
                  value={formData.username}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} md={6} width="45%" mt={7}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 0.5, fontWeight: 600 }}
                >
                  Employee Role
                </Typography>
                <TextField
                  fullWidth
                  name="employeeRole"
                  InputProps={{ readOnly: true }}
                  value={formData.employeeRole}
                />
              </Grid>
              <Grid item xs={12} md={6} width="50%" mt={7}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 0.5, fontWeight: 600 }}
                >
                  Password
                </Typography>
                <Box display="flex" alignItems="center">
                  <TextField
                    fullWidth
                    type="password"
                    name="password"
                    value={formData.password}
                    InputProps={{ readOnly: true }}
                  />
                  <IconButton>
                    <Edit color="primary" />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12} mt={7}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 0.5, fontWeight: 600 }}
                >
                  User Role
                </Typography>
                <TextField
                  fullWidth
                  name="userRole"
                  value={formData.userRole}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} mt={2}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 0.5, fontWeight: 600 }}
                >
                  Account Status
                </Typography>
                <TextField
                  fullWidth
                  name="status"
                  value={formData.status}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* QuickActionButton */}
      <QuickActionButton 
        onAddPatientRecord={() => {
          // Handle add patient record
          console.log("Add patient record clicked");
        }}
        onAddAppointment={() => {
          // Handle add appointment
          console.log("Add appointment clicked");
        }}
      />
    </Box>
  );
}

