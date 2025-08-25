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
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    { label: "Home", section: "home" },
    { label: "Dentist", section: "dentist" },
    { label: "Services", section: "services" },
    { label: "Location", section: "location" },
    { label: "Contact", section: "contact" },
];

export default function HomePage() {
    const navigate = useNavigate();
    const homeRef = useRef(null);
    const heroContentRef = useRef(null);
    const circleRef = useRef(null);
    const rightBoxRef = useRef(null);
    const [groupOffset, setGroupOffset] = useState(0);
    const dentistRef = useRef(null);
    const servicesRef = useRef(null);
    const locationRef = useRef(null);
    const contactRef = useRef(null);
    const headerRef = useRef(null);
    const manualScrollRef = useRef(false);
    const manualScrollTimerRef = useRef(null);
        const [activeSection, setActiveSection] = useState('home'); 
        // change this value to adjust the dentist section height (e.g. '68vh', '50vh')
        const [dentistSectionHeight, setDentistSectionHeight] = useState('88vh'); 

    const sectionRefs = {
        home: homeRef,
        dentist: dentistRef,
        services: servicesRef,
        location: locationRef,
        contact: contactRef,
    };

    // split services into two vertical columns for desktop
    const halfIndex = Math.ceil(servicesData.length / 2);
    const leftServices = servicesData.slice(0, halfIndex);
    const rightServices = servicesData.slice(halfIndex);

    const handleNavClick = (section) => {
        setActiveSection(section);
        const refEl = sectionRefs[section]?.current;
        if (!refEl) return;

        const headerHeight = headerRef.current?.getBoundingClientRect().height || 0;

    // When we trigger programmatic scrolling, briefly suppress IntersectionObserver updates
    // so the activeSection doesn't flicker while the browser scrolls between sections.
    manualScrollRef.current = true;
    if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    manualScrollTimerRef.current = setTimeout(() => { manualScrollRef.current = false; manualScrollTimerRef.current = null; }, 700);

    // Prefer using scrollIntoView for smooth scrolling, then nudge up by header height.
    refEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // After the scroll starts, adjust so the top of the section is not hidden under the header.
        // Small timeout lets the smooth scroll begin; 200ms is a reasonable compromise.
        setTimeout(() => {
            window.scrollBy({ top: -headerHeight, left: 0, behavior: 'smooth' });
        }, 200);
    };

    const [rectStyle, setRectStyle] = useState({ left: 0, top: 0, width: 0, height: 0 });
        const [isFixed, setIsFixed] = useState(false);
        const [fixedTop, setFixedTop] = useState(null);
        const [fixedTranslate, setFixedTranslate] = useState(0);

    // compute rectangle position so left edge aligns to circle center and right edge touches hero right edge
    useEffect(() => {
        const parentEl = rightBoxRef.current;
        const circleEl = circleRef.current;

        const computeRect = () => {
            const circle = circleRef.current;
            const parent = rightBoxRef.current;
            if (!circle || !parent) return;

            const circleRect = circle.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            const heroRect = homeRef.current?.getBoundingClientRect();
            const circleCenterX = circleRect.left + circleRect.width / 2;

            // compute coordinates relative to parent so rectangle moves with parent
            const left = Math.max(0, Math.round(circleCenterX - parentRect.left));
            const top = Math.max(0, Math.round(circleRect.top - parentRect.top));

            // width should reach viewport right edge from circle center. Use original shorten values.
            const shorten = window.innerWidth >= 900 ? 80 : 40; // md:80px, xs:40px
            const width = Math.max(0, Math.round(window.innerWidth - circleCenterX - shorten));
            const height = Math.round(circleRect.height);

            // compute current transform on parent to get untransformed coordinates and how much to move
            const style = window.getComputedStyle(parent);
            const transform = style.transform || style.webkitTransform || 'none';
            let currentTx = 0;
            if (transform && transform !== 'none') {
                const m = transform.match(/matrix3d?\(([^)]+)\)/);
                if (m) {
                    const parts = m[1].split(',').map(s => parseFloat(s.trim()));
                    if (parts.length === 6) currentTx = parts[4] || 0;
                    else if (parts.length === 16) currentTx = parts[12] || 0;
                }
            }

            const parentLeftUntransformed = parentRect.left - currentTx;
            const parentRightUntransformed = Math.round(parentLeftUntransformed + parentRect.width);
            const delta = Math.max(0, Math.round(window.innerWidth - parentRightUntransformed));

            // keep non-fixed behavior
            setFixedTop(null);
            setFixedTranslate(0);

            // only update state when values changed to avoid rerenders that can cause layout loops
            setRectStyle((prev) => {
                const changed = prev.left !== left || prev.top !== top || prev.width !== width || prev.height !== height;
                return changed ? { left, top, width, height } : prev;
            });

            setGroupOffset((prev) => {
                if (Math.abs(prev - delta) > 0.5) return delta;
                return prev;
            });
        };

        // compute now and on resize. Use rAF to ensure layout has settled once.
        const raf = requestAnimationFrame(() => computeRect());
        window.addEventListener('resize', computeRect);

        // also observe size changes on the parent and circle (images/fonts can change layout)
        let ro;
        try {
            ro = new ResizeObserver(() => computeRect());
            if (parentEl) ro.observe(parentEl);
            if (circleEl) ro.observe(circleEl);
        } catch (e) {
            // ResizeObserver not available -> fallback to resize event only
        }

        return () => {
            window.removeEventListener('resize', computeRect);
            cancelAnimationFrame(raf);
            if (ro) ro.disconnect();
        };
    }, []);
    // update activeSection on scroll using IntersectionObserver
    useEffect(() => {
        const headerHeight = headerRef.current?.getBoundingClientRect().height || 80;
        const obsOptions = {
            root: null,
            rootMargin: `-${headerHeight + 20}px 0px -40% 0px`,
            threshold: 0.1,
        };
        const observer = new IntersectionObserver((entries) => {
            if (manualScrollRef.current) return; // ignore observer while we're manually scrolling
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // find which section this is
                    const found = Object.keys(sectionRefs).find((key) => sectionRefs[key].current === entry.target);
                    if (found) setActiveSection(found);
                }
            });
        }, obsOptions);

        Object.values(sectionRefs).forEach((r) => {
            if (r.current) observer.observe(r.current);
        });

        return () => observer.disconnect();
    }, []);







    // header
    return (
    <Box sx={{ bgcolor: "primary.main", minHeight: '100vh' }}>
            <AppBar
                ref={headerRef}
                position="sticky"
                sx={{
                    bgcolor: "white",
                    boxShadow: "none",
                    top: 0,
                    zIndex: 1100,
                }}
            >
                <Toolbar sx={{ justifyContent: "space-between", px: '2%', minHeight: { xs: '64px', md: '12vh' } }}>
                    <Box sx={{ display: "flex", alignItems: "center", ml: 0 }}>
                        <img
                            src="/White-Teeth-Logo.png"
                            alt="White Teeth Dental Clinic Logo"
                            style={{ height: '8vh', marginLeft: '2%' }}
                        />
                    </Box>
                    <Stack direction="row" spacing={4} sx={{ mr: '2%' }}>
                        {navigationItems.map((item, index) => (
                            <Box key={index}>
                                <Button
                                    onClick={() => handleNavClick(item.section)}
                                    variant={activeSection === item.section ? "contained" : "text"}
                                    sx={{
                                        bgcolor: activeSection === item.section ? "primary.main" : "transparent",
                                        color: activeSection === item.section ? "white" : "black",
                                        px: { xs: '2vw', md: '1.2vw' },
                                        py: { xs: '0.8vh', md: '1vh' },
                                        borderRadius: '0.5vw',
                                        textTransform: "none",
                                        fontSize: { xs: '3.2vw', md:  '1.4vw' },
                                        fontWeight: 600,
                                        transition: 'background 0.3s, color 0.3s, transform 0.25s',
                                        boxShadow: activeSection === item.section ? 3 : 0,
                                        '&:hover': { transform: 'translateY(-0.2vh)' },
                                    }}
                                >
                                    {item.label}
                                </Button>
                            </Box>
                        ))}
                    </Stack>
                </Toolbar>
            </AppBar>





            {/*Title / Hero section - split into two columns */}

            {/*scroll to this section function */}
            <Box ref={homeRef} sx={{ bgcolor: "#f2f2f2", position: 'relative', py: { xs: 8, md: 12 }, scrollMarginTop: '12vh' }}>
            
               
                <Container maxWidth="l">
                    <Box ref={heroContentRef} sx={{ minHeight: { xs: 'auto', md: '68vh' }, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <Box sx={{ml:'2vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, width: '100vw' }}>
                        {/* Left column: title, subtitle, button */}
                        <Box sx={{ flex: '1 1 50%', textAlign: { xs: 'center', md: 'left' }, pr: { md: '2vh' } }}>
                            <Typography
                                variant="h1"
                                sx={{
                                    color: 'primary.main',
                                    fontSize: { xs: 40, md: '12vh' },
                                    fontWeight: 900,
                                    lineHeight: 1,
                                    mb: 2,
                                }}
                            >
                                White Teeth
                                <br />
                                Dental Clinic
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: 'primary.main',
                                    fontSize: { xs: 18, md: 28 },
                                    fontWeight: 500,
                                    mb: 4,
                                }}
                            >
                                Creating better smiles.
                            </Typography>
                            <Box sx={{ display: { xs: 'flex', md: 'block' }, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                                <Button
                                    variant="contained"
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        borderRadius: 2.5,
                                        fontSize: 16,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                    }}
                                    onClick={() => navigate('/login')}
                                >
                                    Start Session
                                </Button>
                            </Box>
                        </Box>

                        {/* Right column (visual placeholder) */}
                        <Box sx={{ flex: '0 0 48%', display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, overflow: 'visible' }} />
                        </Box>
                    </Box>
                </Container>

                {/* Absolute image group anchored to the hero and aligned to the screen right */}
                <Box
                    ref={rightBoxRef}
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: { xs: 260, md: 420 },
                        height: { xs: 160, md: 220 },
                        pointerEvents: 'none',
                        overflow: 'visible',
                        zIndex: 0,
                    }}
                >
                    {/* rectangle image (zIndex 0) */}
                    <Box
                        component="img"
                        src="/Homepage-Home-Rectangle.png"
                        alt="rectangle"
                        sx={{
                            position: 'absolute',
                            left: rectStyle.left,
                            top: rectStyle.top,
                            width: `calc(100% - ${rectStyle.left}px)`,
                            height: rectStyle.height,
                            objectFit: 'cover',
                            zIndex: 0,
                        }}
                    />

                    {/* circle (wrapper) with logo centered (zIndex 1/2) */}
                    <Box
                        ref={circleRef}
                        sx={{
                            position: 'absolute',
                            left: { xs: 10, md: 40 },
                            top: { xs: 0, md: 10 },
                            width: { xs: 140, md: 220 },
                            height: { xs: 140, md: 220 },
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundImage: 'url(/Homepage-Home-Circle.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            zIndex: 2,
                        }}
                    >
                        <Box component="img" src="/Homepage-Home-Logo.png" alt="logo" sx={{ width: '80%', height: '80%', zIndex: 3, pointerEvents: 'auto' }} />
                    </Box>
                </Box>
            </Box>

            {/*Dentist*/}
            <Box
                ref={dentistRef}
                sx={{
                    position: 'relative',
                    bgcolor: "primary.main",
                    py: 0,
                    height: dentistSectionHeight,
                    minHeight: dentistSectionHeight,
                    overflow: 'hidden',
                    scrollMarginTop: '12vh'
                }}
            >
                {/* background image as an absolutely positioned img so it crops to the section height */}
                <Box
                    component="img"
                    src="/White-Teeth-BG.png"
                    alt="Dentist background"
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 0,
                        pointerEvents: 'none'
                    }}
                />
                {/* content sits above the image */}
                <Container maxWidth="xl" sx={{ height: '100%', position: 'relative', zIndex: 0 }}>
                        <Grid container spacing={2} alignItems="stretch" sx={{ height: '100%' }}>
                            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
                                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-end', height: '100%', width: '100%', }}>

                                <Box
                                    component="img"
                                    src={encodeURI('/Dr-Sarah-Gerona.png')}
                                    alt="Dr sarah gerona"
                                    sx={{
                                        display: 'block',
                                        width: { xs: '60vw', md: '40vw' },
                                        height: 'auto',
                                        maxHeight: '100%',
                                        position: "absolute",
                                        bottom: 0,
                                        left: { xs: '2vw', md: '-5vw' },
                                        objectFit: "cover",
                                        pointerEvents: 'none',
                                        zIndex: 2,
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', height: '100%', overflow: 'visible', pr: { md: 14 } }}>
                            <Stack spacing={1} alignItems="flex-end" sx={{ transform: { xs: 'none', md: 'translateX(30vw)' }, width: '100%', maxWidth: { md: '60%' } }}>
                                <Typography
                                    variant="h2"
                                    sx={{
                                        color: "white",
                                        fontSize: 'clamp(20px, 3.5vw, 50px)',
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
                                        fontSize: 'clamp(28px, 6vw, 100px)',
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
                                        fontSize: 'clamp(14px, 1.8vw, 24px)',
                                        fontWeight: 500,
                                        textAlign: "right",
                                    }}
                                >
                                    Trusted dental professional in Davao for 15 years
                                </Typography>
                            </Stack>
                            {/* vector image removed - background image now used for this section */}
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/*Services*/}
            <Box ref={servicesRef} sx={{ bgcolor: "#f2f2f2", height: '88vh', minHeight: '68vh', py: 0, scrollMarginTop: '11.9vh' }}>
                {/* ...existing code for Services section... */}
                <Container maxWidth="xl" sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', py: { xs: 4, md: 6 } }}>
            <Typography
                        variant="h1"
                        sx={{
                            color: "primary.main",
                            fontSize: 75,
                            fontWeight: 900,
                textAlign: "center",
                mb: { xs: '4vw', md: '3.5vw' },
                        }}
                    >
                        What we offer
                    </Typography>
            <Grid container spacing={6} justifyContent="center" sx={{ width: '100%' }}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={3} alignItems="flex-start">
                                {leftServices.map((service, i) => (
                                    <Stack key={i} direction="row" spacing={3} alignItems="center" justifyContent="flex-start">
                                        <Box component="img" src="/White-Teeth-Logo.png" alt="Service icon" sx={{ width: { xs: '12vw', md: '4vw' }, height: 'auto', maxWidth: { md: 80 } }} />
                                        <Typography sx={{ color: "primary.main", fontSize: { xs: '5.5vw', md: '2.5vw' }, fontWeight: 500, textAlign: 'left' }}>{service.name}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Stack spacing={3} alignItems="flex-start">
                                {rightServices.map((service, i) => (
                                    <Stack key={i} direction="row" spacing={3} alignItems="center" justifyContent="flex-start">
                                        <Box component="img" src="/White-Teeth-Logo.png" alt="Service icon" sx={{ width: { xs: '12vw', md: '4vw' }, height: 'auto', maxWidth: { md: 80 } }} />
                                        <Typography sx={{ color: "primary.main", fontSize: { xs: '5.5vw', md: '2.5vw' }, fontWeight: 500, textAlign: 'left' }}>{service.name}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/*Location*/}
            <Box
                ref={locationRef}
                sx={{
                    position: 'relative',
                    color: 'white',
                    height: dentistSectionHeight,
                    minHeight: dentistSectionHeight,
                    overflow: 'hidden',
                    scrollMarginTop: '12vh',
                }}
            >
                {/* background image as an absolutely positioned img so it crops to the section height */}
                <Box
                    component="img"
                    src="/White-Teeth-BG.png"
                    alt="Location background"
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 0,
                        pointerEvents: 'none'
                    }}
                />
                <Container maxWidth="xl" sx={{ height: '100%', position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={4} alignItems="center" sx={{ height: '100%' }}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ pr: { md: 8 }, pl: { xs: 2, md: 4 } }}>
                                <Typography variant="h3" sx={{ color: 'white', fontSize: { xs: '6.2vw', md: '1.9vw' }, fontWeight: 700, mb: 1 }}>
                                    Where we are
                                </Typography>

                                <Typography sx={{ color: 'white', fontSize: { xs: '8.5vw', md: '3.6vw' }, fontWeight: 900, lineHeight: 1.05, mb: 2 }}>
                                    Door #22, 2nd Floor
                                    <br />Woolrich Building
                                    <br />Km.5 Buhangin
                                    <br />Davao City
                                </Typography>

                                <Typography sx={{ color: 'white', fontSize: { xs: '3.8vw', md: '1.1vw' }, opacity: 0.95 }}>
                                    Operating since 2019
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, position: 'relative', height: '100%', alignItems: 'center' }}>
                            <Box
                                component="img"
                                src="/Clinic-Location.png"
                                alt="Clinic Location"
                                sx={{
                                    width: { xs: '90%', md: '100%' },
                                    maxWidth: { md: '28vw' },
                                    height: 'auto',
                                    maxHeight: '90%',
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                    boxShadow: 6,
                                    zIndex: 2,
                                    ml: { xs: 0, md: '2vw' },
                                }}
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/*Contact*/}
            <Box ref={contactRef} sx={{ bgcolor: "#f2f2f2", py: 8, scrollMarginTop: '12vh' }}>
                {/* ...existing code for Contact section... */}
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
                            onClick={() => navigate('/login')}
                        >
                            Enter Clinic System
                        </Button>
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
}
