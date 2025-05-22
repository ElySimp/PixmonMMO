// Script to remove duplicate UserStats entries, keeping only the most recent for each user
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function fixUserStatsDuplicates() {
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
    
    // Create a temporary table with only the latest record for each user
    console.log('Creating temporary table with latest records...');
    await db.query(`
      CREATE TEMPORARY TABLE latest_user_stats
      SELECT us1.*
      FROM UserStats us1
      JOIN (
          SELECT user_id, MAX(updated_at) as max_updated
          FROM UserStats
          GROUP BY user_id
      ) us2 ON us1.user_id = us2.user_id AND us1.updated_at = us2.max_updated
    `);
    
    // Count records before cleanup
    const [beforeCount] = await db.query('SELECT COUNT(*) as count FROM UserStats');
    console.log(`Total records in UserStats before cleanup: ${beforeCount[0].count}`);
    
    // Delete all records from UserStats
    console.log('Deleting all records from UserStats...');
    await db.query('DELETE FROM UserStats');
    
    // Insert only the latest records back
    console.log('Inserting only the latest records for each user...');
    await db.query(`
      INSERT INTO UserStats
      SELECT * FROM latest_user_stats
    `);
    
    // Count records after cleanup
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
    console.error('Error fixing UserStats duplicates:', error);
    process.exit(1);
  }
}

fixUserStatsDuplicates();
