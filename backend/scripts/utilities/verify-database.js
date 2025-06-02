// Verify database tables including table data
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const db = require('../../config/database');

async function verifyDatabase() {
  try {
    console.log('Verifying database structure and content...');
    
    // Get all tables in the database
    const [tables] = await db.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [process.env.MYSQL_DATABASE]);
    
    console.log('All tables in the database:');
    console.table(tables);
    
    // For each table, get its structure
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      const [tableStructure] = await db.query(`
        SELECT COLUMN_NAME, DATA_TYPE, COLUMN_KEY, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [process.env.MYSQL_DATABASE, tableName]);
      
      console.log(`\n${tableName} table structure:`);
      console.table(tableStructure);
    }
    
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
    
    // Show content of all tables
    console.log('\n=== TABLE CONTENTS ===');
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      try {
        // Get a sample of data (limit to 10 rows to avoid overwhelming output)
        const [rows] = await db.query(`SELECT * FROM ${tableName} LIMIT 10`);
        
        console.log(`\nContent of ${tableName} (up to 10 rows):`);
        if (rows.length > 0) {
          console.table(rows);
        } else {
          console.log('  (No data in table)');
        }
      } catch (error) {
        console.error(`Error fetching data from ${tableName}:`, error.message);
      }
    }
    
    // Check for foreign key constraints
    const [foreignKeys] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.MYSQL_DATABASE]);
    
    console.log('\nForeign key constraints:');
    console.table(foreignKeys);
    
    process.exit(0);
  } catch (error) {
    console.error('Error verifying database:', error);
    process.exit(1);
  }
}

verifyDatabase();
