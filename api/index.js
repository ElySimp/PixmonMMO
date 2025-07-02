// api/index.js - Serverless API handler for Vercel
// This file redirects all API requests to our Express app

// Import Express app from backend
const express = require('express');
const serverApp = require('../backend/server');

// Create a new Express app for Vercel serverless handling
const app = express();

// Log deployment info
console.log('🚀 API serverless handler initialized for Vercel');

// Add a debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'API Debug Endpoint',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    vercelEnv: process.env.VERCEL_ENV || 'not-set'
  });
});

// Use the backend server as middleware
// This ensures all routes defined in server.js are accessible
app.use('/', (req, res) => {
  console.log(`[Vercel API] ${req.method} ${req.url}`);
  return serverApp(req, res);
});

// Export the app for Vercel serverless
module.exports = app;
