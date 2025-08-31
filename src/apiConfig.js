// Centralized API configuration. Uses Vite-compatible environment variables when available.
// Vite exposes environment variables via import.meta.env. We support both VITE_* and
// legacy REACT_APP_* names as fallbacks, then default to localhost.
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta.env.VITE_API || import.meta.env.REACT_APP_API)) || 'http://localhost:3001';
const MASTER_PASSWORD = (typeof import.meta !== 'undefined' && (import.meta.env.VITE_MASTER_PASSWORD || import.meta.env.REACT_APP_MASTER_PASSWORD)) || 'admin123';

export { API_BASE, MASTER_PASSWORD };
