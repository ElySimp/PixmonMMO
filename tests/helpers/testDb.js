/**
 * tests/helpers/testDb.js
 * 
 * Test database lifecycle manager for PixmonMMO.
 * Handles test DB isolation, connection timeouts, collection cleanup, and socket teardown.
 */

/**
 * Derives an isolated test MongoDB URI from environment variables or defaults.
 * Guarantees that production/development databases are never targeted by tests.
 * @returns {string}
 */
function getTestDbUri() {
  if (process.env.TEST_MONGODB_URI) return process.env.TEST_MONGODB_URI;
  if (process.env.MONGODB_URI_TEST) return process.env.MONGODB_URI_TEST;
  const baseUri = process.env.MONGODB_URI || 'mongodb+srv://faldomaxwell123:Faldo@pixmonmmo.dlsixio.mongodb.net/pixmonmmo';
  if (baseUri.includes('_test')) return baseUri;
  if (baseUri.includes('?')) {
    const [pathPart, queryPart] = baseUri.split('?');
    const cleanPath = pathPart.endsWith('/') ? `${pathPart}pixmonmmo_test` : `${pathPart}_test`;
    return `${cleanPath}?${queryPart}`;
  }
  return baseUri.endsWith('/') ? `${baseUri}pixmonmmo_test` : `${baseUri}_test`;
}

/**
 * Connects to the test database via Mongoose with short timeouts.
 * @param {string} [uri]
 * @returns {Promise<object|null>}
 */
async function connect(uri = getTestDbUri()) {
  process.env.MONGODB_URI = uri;
  let mongoose;
  try {
    mongoose = require('mongoose');
  } catch (err) {
    // Mongoose not yet installed in early infrastructure phase
    return null;
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    return await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
  } catch (connectError) {
    // Return null on connection error so tests can decide whether DB is required
    return null;
  }
}

/**
 * Disconnects Mongoose and cleanly terminates any legacy MySQL pools if loaded.
 * Ensures zero dangling sockets prevent test runners from exiting.
 * @returns {Promise<void>}
 */
async function disconnect() {
  // 1. Disconnect Mongoose
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (err) {
    // Ignore if mongoose not available
  }

  if (global.mongooseCache) {
    global.mongooseCache = { conn: null, promise: null };
  }

  // 2. Terminate legacy MySQL connection pool only if already loaded in cache
  try {
    const dbModulePath = require.resolve('../../backend/config/database');
    if (require.cache[dbModulePath]) {
      const mysqlDb = require('../../backend/config/database');
      if (typeof mysqlDb.end === 'function') {
        await mysqlDb.end();
      } else if (mysqlDb.pool && typeof mysqlDb.pool.end === 'function') {
        await new Promise((resolve) => mysqlDb.pool.end(resolve));
      }
    }
  } catch (err) {
    // Ignore if legacy db not active
  }
}

/**
 * Clears all documents across all collections in the test database.
 * Preserves collection structures and indexes.
 * @returns {Promise<void>}
 */
async function clearDatabase() {
  let mongoose;
  try {
    mongoose = require('mongoose');
  } catch (err) {
    return;
  }

  if (!mongoose.connection || mongoose.connection.readyState !== 1) return;

  const collections = mongoose.connection.collections;
  if (!collections) return;

  const clearPromises = Object.keys(collections).map(key => collections[key].deleteMany({}));
  await Promise.all(clearPromises);
}

/**
 * Clears specific collections by name.
 * @param {...string} collectionNames
 * @returns {Promise<void>}
 */
async function clearCollections(...collectionNames) {
  let mongoose;
  try {
    mongoose = require('mongoose');
  } catch (err) {
    return;
  }

  if (!mongoose.connection || mongoose.connection.readyState !== 1) return;

  const collections = mongoose.connection.collections;
  if (!collections) return;

  const promises = collectionNames
    .filter(name => collections[name])
    .map(name => collections[name].deleteMany({}));
  await Promise.all(promises);
}

/**
 * Full teardown hook suitable for afterAll.
 * @returns {Promise<void>}
 */
async function teardown() {
  await clearDatabase();
  await disconnect();
}

module.exports = {
  getTestDbUri,
  connect,
  connectTestDb: connect,
  disconnect,
  disconnectTestDb: disconnect,
  clearDatabase,
  clearTestCollections: clearDatabase,
  clearCollections,
  teardown
};
