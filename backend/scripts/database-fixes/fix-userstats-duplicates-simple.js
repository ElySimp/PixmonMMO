// Script to remove duplicate UserStats entries without using temporary tables
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const db = require('../../config/database');

async function fixUserStatsDuplicatesSimple() {
  try {
    console.log('Checking for duplicates in UserStats table...');
    
    // First, let's see how many entries we have for each user
    const [userCounts] = await db.query(`
      SELECT user_id, COUNT(*) as count, MAX(updated_at) as latest_update
      FROM UserStats
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `);
    
    if (userCounts.length === 0) {
      console.log('No duplicates found in UserStats table.');
      process.exit(0);
    }
    
    console.log(`Found ${userCounts.length} users with duplicate stats records:`);
    console.table(userCounts);
    
    // Count records before cleanup
    const [beforeCount] = await db.query('SELECT COUNT(*) as count FROM UserStats');
    console.log(`Total records in UserStats before cleanup: ${beforeCount[0].count}`);
    
    // For each user with duplicates, keep only the latest record
    let totalRemoved = 0;
    
    for (const user of userCounts) {
      const userId = user.user_id;
      const latestUpdate = user.latest_update;
      
      // Get all records for this user except the latest one
      const [records] = await db.query(`
        SELECT id
        FROM UserStats
        WHERE user_id = ? AND updated_at < ?
        ORDER BY updated_at DESC
      `, [userId, latestUpdate]);
      
      console.log(`User ID ${userId} has ${records.length} older records to remove.`);
      
      // Delete older records one by one
      for (const record of records) {
        await db.query('DELETE FROM UserStats WHERE id = ?', [record.id]);
        totalRemoved++;
      }
    }
    
    // Count records after cleanup
    const [afterCount] = await db.query('SELECT COUNT(*) as count FROM UserStats');
    console.log(`Total records in UserStats after cleanup: ${afterCount[0].count}`);
    console.log(`Removed ${totalRemoved} duplicate records.`);
    
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
    console.error('Error fixing UserStats duplicates:', error);
    process.exit(1);
  }
}

fixUserStatsDuplicatesSimple();
