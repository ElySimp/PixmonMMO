// Enhanced Local Production Test Server
// This script mimics the Vercel production environment for local testing
// with better error handling and debugging options

const express = require('express');
const path = require('path');
const fs = require('fs');
const apiHandler = require('./api/index.js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set environment variables to production-like values
process.env.NODE_ENV = 'production';
process.env.VERCEL_ENV = 'production';

console.log(`${colors.bright}${colors.cyan}
╔════════════════════════════════════════════════╗
║  ENHANCED LOCAL PRODUCTION TEST SERVER         ║
║  Simulates Vercel production environment       ║
╚════════════════════════════════════════════════╝${colors.reset}
`);

// Check if frontend is built
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
if (!fs.existsSync(frontendDistPath)) {
  console.warn(`${colors.yellow}⚠️ Frontend build not found at ${frontendDistPath}${colors.reset}`);
  console.warn(`${colors.yellow}You may need to build your frontend first with: cd frontend && npm run build${colors.reset}`);
}

// Request Logger middleware with colors
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log when request comes in
  console.log(`${colors.blue}[${new Date().toISOString()}] ${colors.bright}${req.method}${colors.reset} ${req.url}`);
  
  // Log when response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? colors.red : colors.green;
    console.log(`${colors.blue}[${new Date().toISOString()}] ${statusColor}${res.statusCode}${colors.reset} ${req.method} ${req.url} - ${duration}ms`);
  });
  
  next();
});

// Error handler for API routes
const handleApiErrors = (fn) => async (req, res, next) => {
  try {
    return await fn(req, res);
  } catch (error) {
    console.error(`${colors.red}[API Error] ${error.stack || error}${colors.reset}`);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
    });
  }
};

// Handle API routes first (like Vercel does)
app.use('/api', handleApiErrors((req, res) => {
  console.log(`${colors.magenta}[API]${colors.reset} Forwarding ${req.method} ${req.url} to API handler`);
  // Ensure the URL starts with /api
  req.url = `/api${req.url.startsWith('/') ? req.url : '/' + req.url}`;
  return apiHandler(req, res);
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Handle SPA routing - send all remaining requests to index.html
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(__dirname, 'frontend', 'dist', 'index.html'))) {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  } else {
    res.status(404).send(`
      <html>
        <head><title>Build Not Found</title></head>
        <body style="font-family: system-ui; padding: 2rem; line-height: 1.5">
          <h1 style="color: #E53E3E">Frontend build not found</h1>
          <p>The frontend build doesn't exist. Please build your frontend first:</p>
          <pre style="background: #F7FAFC; padding: 1rem; border-radius: 0.5rem">cd frontend && npm run build</pre>
          <p>Then restart this server.</p>
        </body>
      </html>
    `);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`${colors.red}[Server Error] ${err.stack || err}${colors.reset}`);
  res.status(500).send('Server Error');
});

// Start server
app.listen(PORT, () => {
  console.log(`
${colors.green}🚀 Local production test server running!${colors.reset}

${colors.bright}Frontend:${colors.reset} http://localhost:${PORT}
${colors.bright}API:${colors.reset} http://localhost:${PORT}/api

${colors.cyan}This simulates the Vercel production environment for local testing.
All API errors will be caught and displayed in the console.${colors.reset}
`);
});
