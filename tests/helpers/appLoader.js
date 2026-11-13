/**
 * tests/helpers/appLoader.js
 * 
 * Provides a clean Express app singleton for Supertest execution.
 * Guarantees zero port collisions, prevents hanging background daemons,
 * and manages test database connectivity.
 */

const path = require('path');

// Ensure test environment is configured before any module loads
process.env.NODE_ENV = 'test';

let cachedApp = null;

/**
 * Loads and returns the Express app singleton for Supertest.
 * @returns {Promise<import('express').Application>}
 */
async function getApp() {
  if (cachedApp) {
    return cachedApp;
  }

  // 1. Connect to test database if testDb helper is available
  try {
    const { connect, connectTestDb } = require('./testDb');
    const dbConnectFn = connect || connectTestDb;
    if (typeof dbConnectFn === 'function') {
      await dbConnectFn();
    }
  } catch (dbErr) {
    // If testDb is not yet connected or DB is optional for early smoke tests,
    // allow tests to proceed (specific DB tests will assert connectivity).
  }

  // 2. Defensive guard against any accidental app.listen() call in server.js
  const express = require('express');
  const originalListen = express.application.listen;
  express.application.listen = function mockListen(...args) {
    const dummyServer = {
      address: () => ({ port: 0, address: '127.0.0.1' }),
      close: (callback) => {
        if (typeof callback === 'function') callback();
        return dummyServer;
      },
      on: () => dummyServer,
      once: () => dummyServer,
      addListener: () => dummyServer,
      removeListener: () => dummyServer
    };
    return dummyServer;
  };

  try {
    // 3. Require Express app from backend/server.js
    const serverPath = path.resolve(__dirname, '../../backend/server');
    const app = require(serverPath);
    cachedApp = app;
  } finally {
    // 4. Restore original listen method so Supertest internal server can operate
    express.application.listen = originalListen;
  }

  return cachedApp;
}

/**
 * Reset cached app instance and purge server from require cache to isolate module state.
 */
function resetApp() {
  cachedApp = null;
  try {
    const serverPath = require.resolve('../../backend/server');
    delete require.cache[serverPath];
  } catch (err) {
    // Ignore resolution errors if module wasn't loaded
  }
}

module.exports = {
  getApp,
  resetApp
};
