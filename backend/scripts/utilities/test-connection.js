// Simple database connection test
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');

async function testConnection() {
  // Create a connection directly without using the pool
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    port: process.env.MYSQL_PORT
  });

  console.log('Connected to MySQL server successfully!');
  
  try {
    // Try to use the database
    await connection.query(`USE ${process.env.MYSQL_DATABASE}`);
    console.log(`Successfully connected to database: ${process.env.MYSQL_DATABASE}`);
    
    // List all databases the user has access to
    const [dbs] = await connection.query('SHOW DATABASES');
    console.log('Available databases:');
    dbs.forEach(db => console.log(`- ${db.Database}`));
    
    // List all tables in the current database
    try {
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`\nTables in ${process.env.MYSQL_DATABASE}:`);
      if (tables.length === 0) {
        console.log('No tables found (empty database)');
      } else {
        tables.forEach(table => {
          const tableName = table[`Tables_in_${process.env.MYSQL_DATABASE}`];
          console.log(`- ${tableName}`);
        });
      }
    } catch (error) {
      console.log(`Cannot list tables: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error accessing database ${process.env.MYSQL_DATABASE}: ${error.message}`);
    console.log('\nAttempting to create the database...');
    
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE}`);
      console.log(`Database ${process.env.MYSQL_DATABASE} created successfully!`);
      
      // Try to grant privileges
      try {
        await connection.query(`GRANT ALL PRIVILEGES ON ${process.env.MYSQL_DATABASE}.* TO '${process.env.MYSQL_USER}'@'%'`);
        await connection.query('FLUSH PRIVILEGES');
        console.log(`Privileges granted to ${process.env.MYSQL_USER} on ${process.env.MYSQL_DATABASE}`);
      } catch (grantError) {
        console.log(`Note: Could not grant privileges. This may require root access: ${grantError.message}`);
      }
    } catch (createError) {
      console.error(`Could not create database: ${createError.message}`);
    }
  }
  
  // Close the connection
  await connection.end();
}

// Run the test
testConnection()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err));
