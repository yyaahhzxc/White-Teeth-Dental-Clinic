import React, { useState } from "react";
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

export default function Profile() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    role: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
            position: "relative", // Add this for absolute positioning inside Paper
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
              >
                <FaUserCircle color="#7e57c2" />
              </Avatar>
              <Box mt={2} display="flex" justifyContent="center" gap={20}>
                <Button variant="contained" size="small">
                  Change Photo
                </Button>
                <Button variant="outlined" size="small">
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
                  name="role"
                  value={formData.role}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Button
            variant="outlined"
            color="error"
            sx={{
              position: "absolute",
              bottom: 24,
              right: 24,
              borderRadius: 2,
              fontWeight: "bold",
            }}
            onClick={() => {
              // Add your logout logic here
              alert("Logged out!");
            }}
          >
            Logout
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}

