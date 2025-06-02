// Script to check UserStats table columns
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const db = require('../../config/database');

async function checkUserStatsTable() {
  try {
    console.log('Checking UserStats table structure...');
    
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'UserStats'
      ORDER BY ORDINAL_POSITION
    `, [process.env.MYSQL_DATABASE]);
    
    console.table(columns);
    
    // If cooldownEnd column doesn't exist, add it
    if (!columns.some(col => col.COLUMN_NAME === 'cooldownEnd')) {
      console.log('cooldownEnd column is missing. Adding it now...');
      
      await db.query(`
        ALTER TABLE UserStats 
        ADD COLUMN cooldownEnd DATETIME NULL
      `);
      
      console.log('Successfully added cooldownEnd column to UserStats table');
    } else {
      console.log('cooldownEnd column already exists in UserStats table');
    }
    
    console.log('Database check completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error checking UserStats table:', error);
    process.exit(1);
  }
}

checkUserStatsTable();
