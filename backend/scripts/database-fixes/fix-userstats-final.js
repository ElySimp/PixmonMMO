// Script to completely clean up UserStats table by rebuilding it with only one entry per user
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function fixUserStatsComplete() {
  try {
    console.log('Starting complete cleanup of UserStats table...');
    
    // First, fetch all unique users with their latest stats
    const [uniqueUsers] = await db.query(`
      SELECT DISTINCT user_id 
      FROM UserStats
    `);
    
    console.log(`Found ${uniqueUsers.length} unique users in UserStats table.`);
    
    // For each user, get the latest record
    const latestRecords = [];
    
    for (const user of uniqueUsers) {
      const userId = user.user_id;
      
      const [records] = await db.query(`
        SELECT * FROM UserStats 
        WHERE user_id = ? 
        ORDER BY updated_at DESC 
        LIMIT 1
      `, [userId]);
      
      if (records.length > 0) {
        latestRecords.push(records[0]);
      }
    }
    
    console.log(`Retrieved ${latestRecords.length} latest records to keep.`);
    
    // Count original records
    const [beforeCount] = await db.query('SELECT COUNT(*) as count FROM UserStats');
    console.log(`Total records in UserStats before cleanup: ${beforeCount[0].count}`);
    
    // Delete all records
    await db.query('DELETE FROM UserStats');
    console.log('Deleted all records from UserStats table.');
    
    // Re-insert only the latest records for each user
    let reinserted = 0;
    
    for (const record of latestRecords) {
      const { 
        id, // Exclude the old ID
        user_id, 
        level, 
        xp, 
        gold, 
        created_at,
        updated_at,
        cooldownEnd 
      } = record;
      
      // Format dates for MySQL
      const formattedCreatedAt = created_at ? new Date(created_at).toISOString().slice(0, 19).replace('T', ' ') : null;
      const formattedUpdatedAt = updated_at ? new Date(updated_at).toISOString().slice(0, 19).replace('T', ' ') : null;
      const formattedCooldownEnd = cooldownEnd ? new Date(cooldownEnd).toISOString().slice(0, 19).replace('T', ' ') : null;
      
      await db.query(`
        INSERT INTO UserStats (user_id, level, xp, gold, created_at, updated_at, cooldownEnd)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        user_id, 
        level || 1, 
        xp || 0, 
        gold || 0, 
        formattedCreatedAt, 
        formattedUpdatedAt,
        formattedCooldownEnd
      ]);
      
      reinserted++;
    }
    
    console.log(`Re-inserted ${reinserted} records (one per user).`);
    
    // Count final records
    const [afterCount] = await db.query('SELECT COUNT(*) as count FROM UserStats');
    console.log(`Total records in UserStats after cleanup: ${afterCount[0].count}`);
    console.log(`Removed ${beforeCount[0].count - afterCount[0].count} duplicate records.`);
    
    // Verify the cleanup
    const [usersAfter] = await db.query(`
      SELECT us.user_id, ul.username, us.xp, us.gold, us.level, us.cooldownEnd, us.updated_at
      FROM UserStats us
      JOIN UserLogin ul ON us.user_id = ul.id
      ORDER BY us.user_id
    `);
    
    console.log('Current UserStats records after cleanup:');
    console.table(usersAfter);
    
    console.log('UserStats table cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during complete UserStats cleanup:', error);
    process.exit(1);
  }
}

fixUserStatsComplete();
