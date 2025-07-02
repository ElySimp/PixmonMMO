// Local production test server
// This script mimics the Vercel production environment for local testing

const express = require('express');
const path = require('path');
const apiHandler = require('./api/index.js');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set environment variables to production-like values
process.env.NODE_ENV = 'production';
process.env.VERCEL_ENV = 'production';

console.log('🔧 Starting local production test server...');

// Log all requests
app.use((req, res, next) => {
  console.log(`[Local] ${req.method} ${req.url}`);
  next();
});

// Handle API routes first (like Vercel does)
app.use('/api', (req, res) => {
  console.log(`[Local API] Forwarding ${req.method} ${req.url} to API handler`);
  // Ensure the URL starts with /api
  req.url = `/api${req.url.startsWith('/') ? req.url : '/' + req.url}`;
  return apiHandler(req, res);
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Handle SPA routing - send all remaining requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Local production test server running!

Frontend: http://localhost:${PORT}
API: http://localhost:${PORT}/api

This simulates the Vercel production environment for local testing.
`);
});
