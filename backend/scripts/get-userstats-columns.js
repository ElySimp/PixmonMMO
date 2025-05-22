// Script to get the actual column names in the UserStats table
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function getUserStatsColumns() {
  try {
    console.log('Getting UserStats table structure...');
    
    // Get column information
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'UserStats'
      ORDER BY ORDINAL_POSITION
    `, [process.env.MYSQL_DATABASE]);
    
    console.log('UserStats table columns:');
    console.table(columns);
    
    process.exit(0);
  } catch (error) {
    console.error('Error getting UserStats columns:', error);
    process.exit(1);
  }
}

getUserStatsColumns();
