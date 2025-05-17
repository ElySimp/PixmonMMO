// Fix the UserStats table structure
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function fixUserStatsTable() {
  try {
    console.log('Checking if cooldownEnd column exists in UserStats table...');
    
    // Check if the column exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'UserStats'
      AND COLUMN_NAME = 'cooldownEnd'
    `, [process.env.MYSQL_DATABASE]);
    
    if (columns.length === 0) {
      console.log('cooldownEnd column is missing. Adding it now...');
      
      // Add the missing column
      await db.query(`
        ALTER TABLE UserStats 
        ADD COLUMN cooldownEnd DATETIME NULL
      `);
      
      console.log('Successfully added cooldownEnd column to UserStats table');
    } else {
      console.log('cooldownEnd column already exists in UserStats table');
    }
    
    // Verify the updated table structure
    const [userStatsTable] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'UserStats'
      ORDER BY ORDINAL_POSITION
    `, [process.env.MYSQL_DATABASE]);
    
    console.log('Updated UserStats table structure:');
    console.table(userStatsTable);
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing UserStats table:', error);
    process.exit(1);
  }
}

fixUserStatsTable();
