const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://faldomaxwell123:Faldo@pixmonmmo.dlsixio.mongodb.net/pixmonmmo';

/**
 * Global cache for Mongoose connection to survive server reloads
 * and prevent connection pool exhaustion in serverless and cluster environments.
 */
let cached = global.mongooseCache;
if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Connect to MongoDB Atlas with connection caching.
 * @returns {Promise<mongoose.Connection>}
 */
async function connectDB() {
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4,
            dbName: 'pixmonmmo'
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
            return mongooseInstance.connection;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        throw err;
    }

    return cached.conn;
}

/**
 * Get MongoDB Atlas connection health and status for healthcheck endpoints.
 * @returns {Object} Connection details
 */
function getConnectionStatus() {
    const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    const readyState = mongoose.connection.readyState;
    return {
        isConnected: readyState === 1,
        readyState,
        stateName: stateMap[readyState] || 'unknown',
        host: mongoose.connection.host || null,
        dbName: mongoose.connection.name || 'pixmonmmo'
    };
}

/**
 * Disconnect from MongoDB (for test teardowns and graceful shutdown).
 */
async function disconnectDB() {
    if (cached.conn || mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        cached.conn = null;
        cached.promise = null;
    }
}

module.exports = {
    connectDB,
    getConnectionStatus,
    disconnectDB
};
