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

console.log('Attempting database connection with:', {
    host: MYSQL_HOST,
    user: MYSQL_USER,
    database: MYSQL_DATABASE,
    port: MYSQL_PORT
});

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Successfully connected to database!');
    connection.release();
});

// Convert pool to use promises
const promisePool = pool.promise();

module.exports = promisePool; 