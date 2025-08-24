import CallEnd from "@mui/icons-material/CallEnd";
import Email from "@mui/icons-material/Email";
import {
    AppBar,
    Box,
    Button,
    Container,
    Grid,
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";
import React from "react";

const servicesData = [
    { name: "Consultation", icon: "🦷" },
    { name: "Dentures", icon: "🦷" },
    { name: "Oral Phophylaxis", icon: "🦷" },
    { name: "Orthodonics (Braces)", icon: "🦷" },
    { name: "Tooth Extraction", icon: "🦷" },
    { name: "Crowns and Veneers", icon: "🦷" },
    { name: "Tooth Restoration", icon: "🦷" },
    { name: "Teeth Whitening", icon: "🦷" },
];

const navigationItems = [
    { label: "Home", active: true },
    { label: "About", active: false },
    { label: "Services", active: false },
    { label: "Contact", active: false },
];

export default function Homepage() {
    return (
        <Box sx={{ bgcolor: "primary.main", minHeight: "100vh" }}>
            <AppBar position="static" sx={{ bgcolor: "white", boxShadow: "none" }}>
                <Toolbar sx={{ justifyContent: "space-between", px: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", ml: 0 }}>
                        <Box
                            sx={{
                                width: 86,
                                height: 86,
                                bgcolor: "#d9d9d9",
                                borderRadius: "50%",
                                ml: 3,
                                position: "relative",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 132,
                                    height: 70,
                                    position: "absolute",
                                    top: 8,
                                    left: -23,
                                    backgroundImage:
                                        "url(/screenshot-2025-02-10-193158-removebg-preview-1.png)",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }}
                            />
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={4} sx={{ mr: 4 }}>
                        {navigationItems.map((item, index) => (
                            <Box key={index}>
                                {item.active ? (
                                    <Button
                                        variant="contained"
                                        sx={{
                                            bgcolor: "primary.main",
                                            color: "white",
                                            px: 5,
                                            py: 1.5,
                                            borderRadius: 2,
                                            textTransform: "none",
                                            fontSize: 16,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {item.label}
                                    </Button>
                                ) : (
                                    <Typography
                                        sx={{
                                            color: "black",
                                            fontSize: 16,
                                            py: 1.5,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {item.label}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Stack>
                </Toolbar>
            </AppBar>

            <Box sx={{ bgcolor: "#f2f2f2", py: 12 }}>
                <Container maxWidth="xl">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography
                                variant="h1"
                                sx={{
                                    color: "primary.main",
                                    fontSize: 100,
                                    fontWeight: 900,
                                    lineHeight: 1,
                                    mb: 2,
                                }}
                            >
                                White Teeth Dental Clinic
                            </Typography>
                            <Typography
                                variant="h2"
                                sx={{
                                    color: "primary.main",
                                    fontSize: 50,
                                    fontWeight: 500,
                                    mb: 4,
                                }}
                            >
                                Creating better smiles.
                            </Typography>
                            <Button
                                variant="contained"
                                sx={{
                                    bgcolor: "primary.main",
                                    color: "white",
                                    px: 4,
                                    py: 2,
                                    borderRadius: 2.5,
                                    fontSize: 20,
                                    fontWeight: 600,
                                    textTransform: "none",
                                }}
                            >
                                Enter Clinic System
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box
                                sx={{
                                    position: "relative",
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 379,
                                        height: 355,
                                        bgcolor: "primary.main",
                                        borderRadius: "50%",
                                        position: "relative",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 348,
                                            height: 355,
                                            bgcolor: "primary.main",
                                            position: "absolute",
                                            right: -188,
                                            top: 0,
                                        }}
                                    />
                                    <Box
                                        component="img"
                                        src="https://via.placeholder.com/279x279"
                                        alt="White teeth logo"
                                        sx={{
                                            width: 279,
                                            height: 279,
                                            position: "absolute",
                                            top: 38,
                                            left: 50,
                                            borderRadius: "50%",
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Box sx={{ bgcolor: "primary.main", py: 12 }}>
                <Container maxWidth="xl">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Box sx={{ position: "relative" }}>
                                <Box
                                    sx={{
                                        width: 544,
                                        height: 539,
                                        bgcolor: "#264ec9",
                                        borderRadius: "50%",
                                        position: "relative",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 430,
                                            height: 426,
                                            bgcolor: "#234bc5",
                                            borderRadius: "50%",
                                            position: "absolute",
                                            top: 57,
                                            left: 57,
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            width: 329,
                                            height: 326,
                                            bgcolor: "primary.main",
                                            borderRadius: "50%",
                                            position: "absolute",
                                            top: 107,
                                            left: 120,
                                        }}
                                    />
                                </Box>
                                <Box
                                    component="img"
                                    src="https://via.placeholder.com/543x1121"
                                    alt="Dr sarah gerona"
                                    sx={{
                                        width: 543,
                                        height: 1121,
                                        position: "absolute",
                                        top: -267,
                                        left: 31,
                                        objectFit: "cover",
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={4} alignItems="flex-end">
                                <Typography
                                    variant="h2"
                                    sx={{
                                        color: "white",
                                        fontSize: 50,
                                        fontWeight: 700,
                                        textAlign: "right",
                                    }}
                                >
                                    Our dental expert
                                </Typography>
                                <Typography
                                    variant="h1"
                                    sx={{
                                        color: "white",
                                        fontSize: 100,
                                        fontWeight: 900,
                                        lineHeight: 1,
                                        textAlign: "right",
                                    }}
                                >
                                    Dr. Sarah Gerona
                                </Typography>
                                <Typography
                                    sx={{
                                        color: "white",
                                        fontSize: 24,
                                        fontWeight: 500,
                                        textAlign: "right",
                                    }}
                                >
                                    Trusted dental professional in Davao for 15 years
                                </Typography>
                            </Stack>
                            <Box
                                component="img"
                                src="https://via.placeholder.com/649x537"
                                alt="Vector"
                                sx={{
                                    width: 649,
                                    height: 537,
                                    mt: 4,
                                }}
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Box sx={{ bgcolor: "#f2f2f2", py: 8 }}>
                <Container maxWidth="xl">
                    <Typography
                        variant="h1"
                        sx={{
                            color: "primary.main",
                            fontSize: 75,
                            fontWeight: 900,
                            textAlign: "center",
                            mb: 6,
                        }}
                    >
                        What we offer
                    </Typography>
                    <Grid container spacing={4}>
                        {servicesData.map((service, index) => (
                            <Grid item xs={12} sm={6} key={index}>
                                <Stack direction="row" spacing={3} alignItems="center">
                                    <Box
                                        component="img"
                                        src="https://via.placeholder.com/59x59"
                                        alt="Service icon"
                                        sx={{ width: 59, height: 59 }}
                                    />
                                    <Typography
                                        sx={{
                                            color: "primary.main",
                                            fontSize: 42,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {service.name}
                                    </Typography>
                                </Stack>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            <Box sx={{ bgcolor: "primary.main", py: 12 }}>
                <Container maxWidth="xl">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Stack spacing={4}>
                                <Typography
                                    variant="h2"
                                    sx={{
                                        color: "white",
                                        fontSize: 50,
                                        fontWeight: 700,
                                    }}
                                >
                                    Where we are
                                </Typography>
                                <Typography
                                    sx={{
                                        color: "white",
                                        fontSize: 55,
                                        fontWeight: 900,
                                        lineHeight: 1,
                                        letterSpacing: 1.1,
                                    }}
                                >
                                    Door #22, 2nd Floor
                                    <br />
                                    Woolrich Building
                                    <br />
                                    Km.5 Buhangin
                                    <br />
                                    Davao City
                                </Typography>
                                <Typography
                                    sx={{
                                        color: "white",
                                        fontSize: 24,
                                        fontWeight: 500,
                                    }}
                                >
                                    Operating since 2019
                                </Typography>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box
                                component="img"
                                src="https://via.placeholder.com/621x350"
                                alt="Company presentation"
                                sx={{
                                    width: "100%",
                                    maxWidth: 621,
                                    height: 350,
                                    objectFit: "cover",
                                    borderRadius: 2,
                                }}
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Box sx={{ bgcolor: "#f2f2f2", py: 8 }}>
                <Container maxWidth="xl">
                    <Typography
                        variant="h1"
                        sx={{
                            color: "primary.main",
                            fontSize: 75,
                            fontWeight: 900,
                            textAlign: "center",
                            mb: 6,
                        }}
                    >
                        Contact our clinic
                    </Typography>

                    <Stack spacing={4} alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                            <CallEnd sx={{ fontSize: 77, color: "primary.main" }} />
                            <Typography
                                sx={{
                                    color: "primary.main",
                                    fontSize: 50,
                                    fontWeight: 700,
                                }}
                            >
                                +63 970 550 3902
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Email sx={{ fontSize: 52, color: "primary.main" }} />
                            <Typography
                                sx={{
                                    color: "primary.main",
                                    fontSize: 50,
                                    fontWeight: 700,
                                }}
                            >
                                whiteteethdavao@gmail.com
                            </Typography>
                        </Stack>

                        <Button
                            variant="contained"
                            sx={{
                                bgcolor: "primary.main",
                                color: "white",
                                px: 6,
                                py: 3,
                                borderRadius: 3,
                                fontSize: 24,
                                fontWeight: 600,
                                textTransform: "none",
                                mt: 4,
                            }}
                        >
                            Enter Clinic System
                        </Button>
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
}
