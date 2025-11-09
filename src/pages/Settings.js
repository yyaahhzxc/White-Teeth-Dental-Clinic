import React, { useState } from 'react'; // Single import with useState
import { Box, Typography } from '@mui/material';
import Header from '../components/header';

export default function Settings() {
  // Move useState hooks INSIDE the component
  const [textSize, setTextSize] = useState(3);
  const [background, setBackground] = useState("Light");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useState("1:00 PM");
  const [startWeekOn, setStartWeekOn] = useState("Monday");

  const textSizeMarks = ["Aa", "•", "•", "•", "Aa"];

  return (
    <>
      <style>{`
        .settings-container {
          max-width: 600px;
          margin: 20px auto;
          font-family: system-ui, sans-serif;
          border: 1px solid #ccc;
          border-radius: 15px;
          padding: 20px 30px;
          background: white;
          box-shadow: 0 0 5px rgba(0,0,0,0.1);
        }
        .settings-heading {
          font-size: 1.8rem;
          font-weight: 900;
          margin-bottom: 15px;
          color: #222;
        }
        .section {
          border: 1px solid #ccc;
          border-radius: 12px;
          padding: 15px 20px;
          margin-top: 15px;
        }
        .section-label {
          font-weight: 700;
          margin-bottom: 10px;
          font-size: 1.1rem;
          color: #222;
        }
        hr {
          border: none;
          border-top: 1px solid #ccc;
          margin: 10px 0;
        }
        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          font-size: 1rem;
          color: #222;
        }
        .slider-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          min-width: 150px;
          user-select: none;
        }
        .slider-label {
          font-weight: 700;
          font-size: 1rem;
          flex: 1;
        }
        input[type="range"] {
          -webkit-appearance: none;
          width: 120px;
          height: 10px;
          background: #1e88e5;
          border-radius: 5px;
          outline: none;
          cursor: pointer;
          margin: 0 4px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: white;
          cursor: pointer;
          border-radius: 50%;
          border: 3px solid #1976d2;
          box-shadow: 0 0 5px rgb(25 118 210 / 0.8);
          margin-top: -4px;
          transition: background 0.3s ease;
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: white;
          cursor: pointer;
          border-radius: 50%;
          border: 3px solid #1976d2;
          box-shadow: 0 0 5px rgb(25 118 210 / 0.8);
          transition: background 0.3s ease;
        }
        select {
          padding: 5px 10px;
          border-radius: 5px;
          border: 1px solid #ccc;
          min-width: 110px;
          font-size: 1rem;
          color: #222;
          cursor: pointer;
          background: white;
        }
        .slider-label-left {
          font-weight: 700;
          font-size: 1rem;
          margin-right: 10px;
        }
        .text-size-marks {
          display: flex;
          justify-content: space-between;
          width: 120px;
          margin-top: 3px;
          font-weight: 700;
          color: #fff;
          font-size: 0.75rem;
        }
        .text-size-marks span {
          filter: drop-shadow(0 0 3px #0d47a1);
        }
      `}</style>
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: 'url("/White-Teeth-BG.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header />
        <Box sx={{ p: 4, flex: 1, marginTop: '70px' }}>
          {/* Settings Container */}
          <div className="settings-container" role="region" aria-label="Settings">
            <h1 className="settings-heading">Settings</h1>

            <div className="section" aria-labelledby="appearance-section-label">
              <h2 id="appearance-section-label" className="section-label">
                Appearance
              </h2>

              <div className="setting-row">
                <div className="slider-label">Text Size</div>
                <div className="slider-wrapper" aria-label="Text size control" role="slider" aria-valuemin={1} aria-valuemax={5} aria-valuenow={textSize} tabIndex={0}>
                  <span style={{ color: "#999", fontWeight: "700" }} aria-hidden="true">Aa</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                    aria-valuetext={`Text size level ${textSize}`}
                  />
                  <span style={{ color: "#999", fontWeight: "700" }} aria-hidden="true">Aa</span>
                </div>
              </div>

              <hr />

              <div className="setting-row">
                <label htmlFor="background-select">Theme</label>
                <select
                  id="background-select"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                >
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>

            </div>

            <div className="section" aria-labelledby="date-time-section-label">
              <h2 id="date-time-section-label" className="section-label">Date and Time</h2>

              <div className="setting-row">
                <label htmlFor="date-format-select">Date Format</label>
                <select
                  id="date-format-select"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                >
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>

              <hr />

              <div className="setting-row">
                <label htmlFor="time-format-select">Time Format</label>
                <select
                  id="time-format-select"
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value)}
                >
                  <option>12-hour</option>
                  <option>24-hour</option>
                </select>
              </div>

              <hr />

              <div className="setting-row">
                <label htmlFor="start-week-select">Start Week On</label>
                <select
                  id="start-week-select"
                  value={startWeekOn}
                  onChange={(e) => setStartWeekOn(e.target.value)}
                >
                  <option>Monday</option>
                  <option>Sunday</option>
                  <option>Saturday</option>
                </select>
              </div>

            </div>
          </div>
        </Box>
      </Box>
    </>
  );
}
