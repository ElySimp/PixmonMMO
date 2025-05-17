// Verify database tables
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function verifyDatabase() {
  try {
    console.log('Verifying database structure...');
    
    // Check if UserLogin table exists and get its structure
    const [userLoginTable] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'UserLogin'
      ORDER BY ORDINAL_POSITION
    `, [process.env.MYSQL_DATABASE]);
    
    console.log('UserLogin table structure:');
    console.table(userLoginTable);
    
    // Check if UserStats table exists and get its structure
    const [userStatsTable] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'UserStats'
      ORDER BY ORDINAL_POSITION
    `, [process.env.MYSQL_DATABASE]);
    
    console.log('UserStats table structure:');
    console.table(userStatsTable);
    
    // Check for registered users
    const [users] = await db.query('SELECT id, username, email FROM UserLogin');
    console.log(`Found ${users.length} registered users:`);
    console.table(users);
    
    // Check for user stats
    const [stats] = await db.query(`
      SELECT us.user_id, ul.username, us.xp, us.gold, us.level, us.cooldownEnd, us.updated_at
      FROM UserStats us
      JOIN UserLogin ul ON us.user_id = ul.id
    `);
    
    console.log(`Found ${stats.length} user stats records:`);
    console.table(stats);
    
    // Check for foreign key constraints
    const [foreignKeys] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.MYSQL_DATABASE]);
    
    console.log('Foreign key constraints:');
    console.table(foreignKeys);
    
    process.exit(0);
  } catch (error) {
    console.error('Error verifying database:', error);
    process.exit(1);
  }
}

verifyDatabase();
