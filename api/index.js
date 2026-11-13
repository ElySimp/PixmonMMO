// api/index.js - Serverless API handler for Vercel
// Redirects all API requests to the Express app

const express = require('express');
const serverApp = require('../backend/server');
const { connectDB, getConnectionStatus } = require('../backend/config/mongodb');

const app = express();

// Debug endpoint for Vercel serverless diagnostics
app.get('/api/debug', async (req, res) => {
  try {
    await connectDB();
    const status = getConnectionStatus();

    res.json({
      message: 'API Debug Endpoint',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      vercelEnv: process.env.VERCEL_ENV || 'not-set',
      database: {
        status: status.isConnected ? 'connected' : 'disconnected',
        stateName: status.stateName,
        host: status.host,
        databaseName: status.dbName
      },
      auth: {
        jwtConfigured: Boolean(process.env.JWT_SECRET)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

// Forward all API requests to the Express backend app
app.use('/', async (req, res, next) => {
  try {
    await connectDB();
    return serverApp(req, res, next);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      path: req.url
    });
  }
});

module.exports = app;
