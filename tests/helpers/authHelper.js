/**
 * tests/helpers/authHelper.js
 * 
 * Provides JWT generation, header formatting, and test user provisioning
 * for PixmonMMO test suites across all tiers.
 */

const jwt = require('jsonwebtoken');

// Ensure JWT_SECRET is available for test execution
const JWT_SECRET = process.env.JWT_SECRET || 'as9d8f7a98sdf7a9s8df7a9s8d7fa8sd7f89a7sdf';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = JWT_SECRET;
}

/**
 * Generates a valid signed JWT for testing.
 * @param {object} [payload={}]
 * @param {object} [options={}]
 * @returns {string}
 */
function generateToken(payload = {}, options = {}) {
  const safePayload = (payload && typeof payload === 'object') ? payload : {};
  const normalizedPayload = {
    id: safePayload.id ?? safePayload._id ?? 1,
    username: safePayload.username || 'testuser',
    ...safePayload
  };
  return jwt.sign(normalizedPayload, JWT_SECRET, {
    expiresIn: options.expiresIn || '24h',
    ...options
  });
}

/**
 * Formats standard Authorization and Content-Type headers from a token or payload.
 * @param {string|object} tokenOrPayload
 * @returns {{ Authorization: string, 'Content-Type': string }}
 */
function getAuthHeaders(tokenOrPayload) {
  const token = typeof tokenOrPayload === 'string'
    ? tokenOrPayload
    : generateToken(tokenOrPayload);
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Alias for getAuthHeaders for compatibility across test suites.
 */
const getAuthHeader = getAuthHeaders;

/**
 * Generates an expired JWT for Tier 2 boundary testing.
 * @param {object} [payload={}]
 * @returns {string}
 */
function generateExpiredToken(payload = {}) {
  const safePayload = (payload && typeof payload === 'object') ? payload : {};
  const normalizedPayload = {
    id: safePayload.id ?? safePayload._id ?? 1,
    username: safePayload.username || 'expired_testuser',
    ...safePayload
  };
  return jwt.sign(normalizedPayload, JWT_SECRET, { expiresIn: '-10s' });
}

/**
 * Generates an invalid token (signed with wrong secret) for Tier 2 boundary testing.
 * @param {object} [payload={}]
 * @returns {string}
 */
function generateInvalidToken(payload = {}) {
  const safePayload = (payload && typeof payload === 'object') ? payload : {};
  const normalizedPayload = {
    id: safePayload.id ?? safePayload._id ?? 1,
    username: safePayload.username || 'invalid_testuser',
    ...safePayload
  };
  return jwt.sign(normalizedPayload, 'wrong_unauthorized_secret_99999', { expiresIn: '1h' });
}

/**
 * Returns a malformed JWT string for Tier 2 boundary testing.
 * @returns {string}
 */
function generateMalformedToken() {
  return 'invalid.malformed.jwt.token';
}

/**
 * Opaque-box helper: Registers a fresh user via HTTP endpoint.
 * @param {Function|object} appOrRequest - Express app or Supertest agent
 * @param {object} [customData={}]
 * @returns {Promise<{ user: object, token: string, headers: object, response: object, userData: object }>}
 */
async function registerTestUser(appOrRequest, customData = {}) {
  const supertest = require('supertest');
  const request = typeof appOrRequest === 'function' ? supertest(appOrRequest) : appOrRequest;
  
  const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const userData = {
    username: customData.username || `testuser_${uniqueId}`,
    email: customData.email || `test_${uniqueId}@example.com`,
    password: customData.password || 'TestPassword123!',
    ...customData
  };

  const response = await request
    .post('/api/auth/register')
    .send(userData);

  const token = response.body?.data?.token || response.body?.token;
  const user = response.body?.data?.user || response.body?.user;

  return {
    user,
    token,
    headers: token ? getAuthHeaders(token) : {},
    response,
    userData
  };
}

/**
 * Opaque-box helper: Logs in an existing user via HTTP endpoint.
 * @param {Function|object} appOrRequest - Express app or Supertest agent
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ user: object, token: string, headers: object, response: object }>}
 */
async function loginTestUser(appOrRequest, username, password) {
  const supertest = require('supertest');
  const request = typeof appOrRequest === 'function' ? supertest(appOrRequest) : appOrRequest;

  const response = await request
    .post('/api/auth/login')
    .send({ username, password });

  const token = response.body?.data?.token || response.body?.token;
  const user = response.body?.data?.user || response.body?.user;

  return {
    user,
    token,
    headers: token ? getAuthHeaders(token) : {},
    response
  };
}

module.exports = {
  JWT_SECRET,
  generateToken,
  getAuthHeaders,
  getAuthHeader,
  generateExpiredToken,
  generateInvalidToken,
  generateMalformedToken,
  registerTestUser,
  loginTestUser
};
