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
app.get('/api/debug', async (req, res) => {
  try {
    // Import database connection
    const db = require('../backend/config/database');
    
    // Test database connection
    let dbStatus = 'unknown';
    let dbError = null;
    
    try {
      // Simple query to test connection
      await db.query('SELECT 1');
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'error';
      dbError = err.message;
    }
    
    res.json({
      message: 'API Debug Endpoint',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      vercelEnv: process.env.VERCEL_ENV || 'not-set',
      database: {
        status: dbStatus,
        error: dbError,
        host: process.env.MYSQL_HOST ? `${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT || '3306'}` : 'not-configured',
        database: process.env.MYSQL_DATABASE || 'not-configured'
      },
      auth: {
        jwtConfigured: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

// Use the backend server as middleware
// This ensures all routes defined in server.js are accessible
app.use('/', (req, res, next) => {
  const url = req.url;
  console.log(`[Vercel API] ${req.method} ${url}`);
  
  // Add some debugging for common routes
  if (url.includes('/auth/')) {
    console.log(`[Debug] Auth request: ${req.method} ${url}`);
  } else if (url.includes('/userprofile/')) {
    console.log(`[Debug] UserProfile request: ${req.method} ${url}`);
  } else if (url.includes('/users/')) {
    console.log(`[Debug] Users request: ${req.method} ${url}`);
  } else if (url.includes('/daily-rewards/')) {
    console.log(`[Debug] Daily rewards request: ${req.method} ${url}`);
  }
  
  // Error handler to catch any serverApp errors
  try {
    return serverApp(req, res, next);
  } catch (error) {
    console.error(`[API Error] ${error.message}`);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      path: url
    });
  }
});

// Export the app for Vercel serverless
module.exports = app;
