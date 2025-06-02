// Test database connection
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const db = require('../../config/database');

async function testConnection() {
  try {
    console.log('Testing database connection with these settings:');
    console.log({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT
    });
    
    const [rows] = await db.query('SELECT 1 as test');
    console.log('Database connection successful!', rows);
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();