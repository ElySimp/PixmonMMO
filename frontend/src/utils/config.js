// API Configuration
// Use environment variable for API URL if available, fallback to relative path for production, or localhost for development
export const API_URL = import.meta.env.VITE_API_URL || 
                       (import.meta.env.PROD ? '' : 'http://localhost:5000/api');

// Auth Configuration
export const TOKEN_KEY = 'pixmon_auth_token'; 