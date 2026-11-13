/**
 * tests/helpers/smoke.test.js
 * 
 * Test Infrastructure Smoke Test Suite
 * Validates test runner assertion engine, environment configuration, in-memory app loader,
 * Supertest integration, auth helper token generation, and database lifecycle fixtures.
 */

const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const { getApp, resetApp } = require('./appLoader');
const {
  JWT_SECRET,
  generateToken,
  getAuthHeaders,
  getAuthHeader,
  generateExpiredToken,
  generateInvalidToken,
  generateMalformedToken,
  registerTestUser,
  loginTestUser
} = require('./authHelper');
const {
  getTestDbUri,
  connect,
  connectTestDb,
  disconnect,
  disconnectTestDb,
  clearDatabase,
  clearTestCollections,
  teardown
} = require('./testDb');

describe('PixmonMMO Test Infrastructure Smoke Test', () => {
  let app;

  beforeAll(async () => {
    app = await getApp();
  });

  afterAll(async () => {
    await disconnect();
  });

  // Pillar 1: Assertion Engine & Runtime Environment
  describe('Pillar 1: Assertion Engine & Runtime Environment', () => {
    it('executes basic assertions accurately', () => {
      expect(1 + 1).toBe(2);
      expect(true).toBe(true);
      expect({ game: 'PixmonMMO' }).toEqual({ game: 'PixmonMMO' });
    });

    it('confirms NODE_ENV is set to test', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });
  });

  // Pillar 2: In-Memory Express App Loader
  describe('Pillar 2: Express App Loader (In-Memory Isolation)', () => {
    it('loads Express application singleton without throwing', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
      expect(typeof app.use).toBe('function');
    });

    it('returns the same cached app instance on subsequent calls', async () => {
      const secondCallApp = await getApp();
      expect(secondCallApp).toBe(app);
    });
  });

  // Pillar 3: Supertest In-Memory Request Dispatch
  describe('Pillar 3: Supertest In-Memory HTTP Execution', () => {
    it('dispatches an in-memory HTTP request to /api/health cleanly', async () => {
      const response = await request(app).get('/api/health');
      expect(response).toBeDefined();
      expect(typeof response.status).toBe('number');
      // Status is 200 (healthy) or 500 (db pending during early migration phase)
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.status).toBe('ok');
      } else {
        expect(response.body).toBeDefined();
      }
    });

    it('returns 404 for unknown endpoints without hanging', async () => {
      const response = await request(app).get('/api/non-existent-test-endpoint-canary');
      expect(response.status).toBe(404);
    });
  });

  // Pillar 4: Authentication Helper
  describe('Pillar 4: Authentication Helper & JWT Generation', () => {
    it('generates a valid JWT token with default and custom payloads', () => {
      // Default payload
      const defaultToken = generateToken();
      expect(typeof defaultToken).toBe('string');
      const decodedDefault = jwt.verify(defaultToken, JWT_SECRET);
      expect(decodedDefault.id).toBe(1);
      expect(decodedDefault.username).toBe('testuser');

      // Custom payload with preserved claims
      const token = generateToken({ id: 42, username: 'tester_smoke', role: 'admin' });
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(42);
      expect(decoded.username).toBe('tester_smoke');
      expect(decoded.role).toBe('admin');
    });

    it('formats standard Authorization and Content-Type headers', () => {
      const headers = getAuthHeaders({ id: 100, username: 'hero' });
      expect(headers).toBeDefined();
      expect(headers.Authorization).toMatch(/^Bearer\s[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(headers['Content-Type']).toBe('application/json');

      // Test alias getAuthHeader
      const aliasHeaders = getAuthHeader('custom_token_string');
      expect(aliasHeaders.Authorization).toBe('Bearer custom_token_string');
    });

    it('generates expired token for Tier 2 boundary tests', () => {
      const expiredToken = generateExpiredToken({ id: 1 });
      expect(typeof expiredToken).toBe('string');
      const decoded = jwt.decode(expiredToken);
      expect(decoded.exp).toBeLessThan(Math.floor(Date.now() / 1000) + 1);
      expect(() => jwt.verify(expiredToken, JWT_SECRET)).toThrow(/expired/i);
    });

    it('generates invalid token signed with unauthorized secret', () => {
      const invalidToken = generateInvalidToken({ id: 1 });
      expect(typeof invalidToken).toBe('string');
      expect(() => jwt.verify(invalidToken, JWT_SECRET)).toThrow(/invalid signature/i);
    });

    it('generates malformed token and rejects on verification', () => {
      const malformedToken = generateMalformedToken();
      expect(typeof malformedToken).toBe('string');
      expect(malformedToken.split('.').length).toBe(4);
      expect(() => jwt.verify(malformedToken, JWT_SECRET)).toThrow(/jwt/i);
    });
  });

  // Pillar 5: Test Database Lifecycle Interfaces
  describe('Pillar 5: Test Database Lifecycle Manager', () => {
    it('derives an isolated test database URI containing _test', () => {
      const uri = getTestDbUri();
      expect(typeof uri).toBe('string');
      expect(uri).toContain('test');
    });

    it('exposes connect, disconnect, clearDatabase, and teardown interfaces', () => {
      expect(typeof connect).toBe('function');
      expect(typeof connectTestDb).toBe('function');
      expect(typeof disconnect).toBe('function');
      expect(typeof disconnectTestDb).toBe('function');
      expect(typeof clearDatabase).toBe('function');
      expect(typeof clearTestCollections).toBe('function');
      expect(typeof teardown).toBe('function');
    });

    it('safely handles disconnect when no database connection is active', async () => {
      await expect(disconnect()).resolves.toBeUndefined();
    });
  });

  // Pillar 6: User Provisioning & Authentication Workflow
  describe('Pillar 6: User Provisioning & Authentication Workflow', () => {
    it('exposes registerTestUser and loginTestUser helper functions', () => {
      expect(typeof registerTestUser).toBe('function');
      expect(typeof loginTestUser).toBe('function');
    });

    it('safely handles null and unexpected input types in auth helpers', () => {
      const nullToken = generateToken(null);
      expect(typeof nullToken).toBe('string');
      const decoded = jwt.verify(nullToken, JWT_SECRET);
      expect(decoded.id).toBe(1);

      const nullHeaders = getAuthHeaders(null);
      expect(nullHeaders.Authorization).toMatch(/^Bearer\s/);
    });

    it('preserves boundary id 0 without coercing to default 1', () => {
      const zeroToken = generateToken({ id: 0, username: 'guest_zero' });
      const decoded = jwt.verify(zeroToken, JWT_SECRET);
      expect(decoded.id).toBe(0);
      expect(decoded.username).toBe('guest_zero');
    });
  });
});
