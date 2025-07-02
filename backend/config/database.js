const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Load environment variables
const {
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
    MYSQL_PORT
} = process.env;

// Validate required environment variables
if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    throw new Error('Missing required database configuration. Please check your .env file.');
}

// Optimized configuration for serverless environment
const config = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
    waitForConnections: true,
    connectionLimit: process.env.NODE_ENV === 'production' ? 1 : 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
}

// In serverless environments, we should use a smaller connection pool
const pool = mysql.createPool(config);

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    // Connection successful - no need to log, server logger will handle this
    connection.release();
});

// Convert pool to use promises
const promisePool = pool.promise();

module.exports = promisePool; 