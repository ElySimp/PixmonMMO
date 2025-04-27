const mysql = require('mysql2');
require('dotenv').config();

console.log('Attempting database connection with:', {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT
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