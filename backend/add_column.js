// Add cooldownEnd column to UserStats table
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mysql = require('mysql2');

// Create a simple connection (not using the pool)
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT
});

console.log('Database connection settings:', {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT
});

connection.connect(function(err) {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  
  console.log('Connected to database');
  
  // Try to add the cooldownEnd column
  connection.query(
    'ALTER TABLE UserStats ADD COLUMN IF NOT EXISTS cooldownEnd DATETIME NULL',
    function(error, results) {
      if (error) {
        if (error.code === 'ER_PARSE_ERROR') {
          // If IF NOT EXISTS is not supported, try checking if column exists first
          console.log('IF NOT EXISTS not supported, trying alternative approach...');
          
          connection.query(
            "SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'UserStats' AND COLUMN_NAME = 'cooldownEnd'",
            [process.env.MYSQL_DATABASE],
            function(err, results) {
              if (err) {
                console.error('Error checking if column exists:', err);
                connection.end();
                process.exit(1);
              }
              
              if (results[0].count === 0) {
                // Column does not exist, add it
                connection.query(
                  'ALTER TABLE UserStats ADD COLUMN cooldownEnd DATETIME NULL',
                  function(err) {
                    if (err) {
                      console.error('Error adding cooldownEnd column:', err);
                    } else {
                      console.log('CooldownEnd column added successfully!');
                    }
                    connection.end();
                    process.exit(err ? 1 : 0);
                  }
                );
              } else {
                console.log('CooldownEnd column already exists.');
                connection.end();
                process.exit(0);
              }
            }
          );
        } else {
          console.error('Error adding cooldownEnd column:', error);
          connection.end();
          process.exit(1);
        }
      } else {
        console.log('CooldownEnd column added successfully!');
        connection.end();
        process.exit(0);
      }
    }
  );
});
