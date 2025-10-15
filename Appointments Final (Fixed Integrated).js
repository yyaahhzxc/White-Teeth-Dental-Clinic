import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Snackbar,
  Alert,
  TextField,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  ArrowDropDown,
  Circle,
  Close,
  CalendarToday,
  AccessTime,
  Person,
  MedicalServices,
  Edit as EditIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import Header from "../components/header";
import QuickActionButton from "../components/QuickActionButton";
import { API_BASE } from "../apiConfig";

// --- Utility fixes from Appointments.js ---
const normalizeDateFromStorage = (dateString) => {
  if (!dateString) return new Date();
  const date = new Date(dateString + "T00:00:00");
  return date;
};

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// --- Fixed MonthGrid ---
function MonthGrid({ appointments, currentDate, statusColors, onAppointmentClick }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const gridStart = new Date(year, month, 1 - firstDayOfWeek);
  const gridEnd = new Date(year, month, daysInMonth + (6 - lastDay.getDay()));
  const gridDates = [];
  let d = new Date(gridStart.getTime());
  while (d <= gridEnd) {
    gridDates.push(new Date(d.getTime()));
    d.setDate(d.getDate() + 1);
  }

  const getEventsForDate = (date) => {
    const targetDateStr = date.toISOString().split("T")[0];
    return appointments.filter((apt) => {
      const aptDate = parseLocalDate(apt.appointmentDate.split("T")[0]);
      const aptDateStr = aptDate.toISOString().split("T")[0];
      return aptDateStr === targetDateStr;
    });
  };

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0,
          background: "white",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <Box
            key={day}
            sx={{
              p: 1.5,
              textAlign: "center",
              fontWeight: 700,
              color: "#70757a",
              fontSize: "15px",
              borderBottom: "1px solid #e0e0e0",
              background: "#fff",
            }}
          >
            {day}
          </Box>
        ))}
        {gridDates.map((date, idx) => {
          const events = getEventsForDate(date);
          const isCurrentMonth = date.getMonth() === month;
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <Box
              key={idx}
              sx={{
                minHeight: "120px",
                p: 1,
                borderBottom: "1px solid #e0e0e0",
                borderRight: idx % 7 !== 6 ? "1px solid #e0e0e0" : "none",
                background: isCurrentMonth ? "#fff" : "#f8f9fa",
              }}
            >
              <Typography
                sx={{
                  fontWeight: isToday ? 700 : 400,
                  color: isToday
                    ? "#1a73e8"
                    : isCurrentMonth
                    ? "#202124"
                    : "#5f6368",
                  fontSize: "14px",
                  mb: 0.5,
                }}
              >
                {date.getDate()}
              </Typography>
              {events.slice(0, 3).map((event, eventIdx) => (
                <Box
                  key={eventIdx}
                  onClick={() => onAppointmentClick && onAppointmentClick(event)}
                  sx={{
                    backgroundColor:
                      statusColors[event.status] || statusColors.scheduled,
                    color: "white",
                    p: 0.5,
                    mb: 0.5,
                    borderRadius: "4px",
                    fontSize: "11px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  {event.patientName}
                </Box>
              ))}
              {events.length > 3 && (
                <Typography sx={{ fontSize: "10px", color: "#5f6368" }}>
                  +{events.length - 3} more
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// --- Main Component ---
function Appointments() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("Week");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedAppointment, setEditedAppointment] = useState(null);

  // Auto-refresh event listener from Appointments.js
  useEffect(() => {
    const handleAppointmentAdded = () => refreshAppointments();
    window.addEventListener("appointmentAdded", handleAppointmentAdded);
    window.addEventListener("appointmentUpdated", handleAppointmentAdded);
    return () => {
      window.removeEventListener("appointmentAdded", handleAppointmentAdded);
      window.removeEventListener("appointmentUpdated", handleAppointmentAdded);
    };
  }, [calendarView]);

  const statusColors = {
    cancelled: "#ea4335",
    done: "#0d652d",
    ongoing: "#1a73e8",
    scheduled: "#e8710a",
  };

  const timeSlots = [
    "7 AM","8 AM","9 AM","10 AM","11 AM","12 PM","1 PM",
    "2 PM","3 PM","4 PM","5 PM","6 PM","7 PM","8 PM","9 PM","10 PM",
  ];
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  // --- Fetch appointments ---
  const refreshAppointments = () => {
    if (calendarView === "Week") fetchAppointmentsForWeek();
    else fetchAppointmentsForMonth();
  };

  const fetchAppointmentsForWeek = async () => {
    setLoading(true);
    try {
      const weekDates = getWeekDates(currentDate);
      const startDate = weekDates[0].toISOString().split("T")[0];
      const endDate = weekDates[6].toISOString().split("T")[0];
      const res = await fetch(
        `${API_BASE}/appointments/date-range?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error("Failed week fetch");
      const data = await res.json();
      setAppointments(
        data.map((apt) => ({
          ...apt,
          appointmentDate: apt.appointmentDate,
          patientName: apt.patientName || `${apt.firstName} ${apt.lastName}`,
          status: apt.status?.toLowerCase() || "scheduled",
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentsForMonth = async () => {
    setLoading(true);
    try {
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth();
      const start = new Date(y, m, 1).toISOString().split("T")[0];
      const end = new Date(y, m + 1, 0).toISOString().split("T")[0];
      const res = await fetch(
        `${API_BASE}/appointments/date-range?startDate=${start}&endDate=${end}`
      );
      if (!res.ok) throw new Error("Failed month fetch");
      const data = await res.json();
      setAppointments(
        data.map((apt) => ({
          ...apt,
          appointmentDate: apt.appointmentDate,
          patientName: apt.patientName || `${apt.firstName} ${apt.lastName}`,
          status: apt.status?.toLowerCase() || "scheduled",
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = (date) => {
    const week = [];
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      week.push(d);
    }
    return week;
  };

  // --- Fixed getAppointmentsForSlot ---
  const getAppointmentsForSlot = (dayIndex, timeSlot) => {
    const [t, period] = timeSlot.split(" ");
    let h = parseInt(t);
    h = period === "PM" && h !== 12 ? h + 12 : h === 12 && period === "AM" ? 0 : h;
    const targetDateStr = getWeekDates(currentDate)[dayIndex].toISOString().split("T")[0];

    return appointments.filter((apt) => {
      const aptDate = apt.appointmentDate.split("T")[0];
      if (aptDate !== targetDateStr) return false;
      const [ah, am] = apt.timeStart.split(":").map(Number);
      const mins = ah * 60 + am;
      const slotStart = h * 60;
      return mins >= slotStart && mins < slotStart + 60;
    });
  };

  const weekDates = getWeekDates(currentDate);

  return (
    <Box sx={{ bgcolor: "#2148c0", minHeight: "100vh" }}>
      <Header />
      <Box sx={{ display: "flex", justifyContent: "center", px: 2, pb: 2, pt: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: "white",
            borderRadius: "20px",
            width: "100%",
            height: "calc(100vh - 140px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button variant="outlined" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <IconButton onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}>
                <ChevronLeft />
              </IconButton>
              <IconButton onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}>
                <ChevronRight />
              </IconButton>
              <Typography>{calendarView === "Week" ? "Week View" : "Month View"}</Typography>
            </Box>
            <FormControl size="small">
              <Select value={calendarView} onChange={(e) => setCalendarView(e.target.value)}>
                <MenuItem value="Week">Week</MenuItem>
                <MenuItem value="Month">Month</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {calendarView === "Month" ? (
            <MonthGrid
              appointments={appointments}
              currentDate={currentDate}
              statusColors={statusColors}
              onAppointmentClick={(a) => {
                setSelectedAppointment(a);
                setModalOpen(true);
              }}
            />
          ) : (
            <Box sx={{ display: "flex", flex: 1 }}>
              <Box sx={{ width: "80px" }}>
                {timeSlots.map((t) => (
                  <Typography key={t} sx={{ height: 80, fontSize: 11, color: "#70757a" }}>
                    {t}
                  </Typography>
                ))}
              </Box>
              <Box sx={{ display: "flex", flex: 1 }}>
                {weekDates.map((_, i) => (
                  <Box key={i} sx={{ flex: 1, borderLeft: "1px solid #eee", position: "relative" }}>
                    {timeSlots.map((slot) =>
                      getAppointmentsForSlot(i, slot).map((a) => (
                        <Paper
                          key={a.id}
                          onClick={() => {
                            setSelectedAppointment(a);
                            setModalOpen(true);
                          }}
                          sx={{
                            position: "absolute",
                            left: 4,
                            right: 4,
                            top: 4,
                            background: statusColors[a.status],
                            color: "white",
                            borderRadius: 1,
                            p: 1,
                            fontSize: 12,
                          }}
                        >
                          {a.patientName}
                        </Paper>
                      ))
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default Appointments;
