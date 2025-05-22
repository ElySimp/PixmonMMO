// Script to check for duplicate UserStats records
const db = require('../config/database');

async function checkDuplicates() {
  try {
    console.log('Checking for duplicate UserStats records...');
    
    // Find users with multiple stats records
    const [duplicates] = await db.query(`
      SELECT user_id, COUNT(*) as count
      FROM UserStats
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length === 0) {
      console.log('No duplicate UserStats records found. Fix is working correctly!');
    } else {
      console.log(`Found ${duplicates.length} users with duplicate stats records:`);
      
      for (const dupe of duplicates) {
        console.log(`User ${dupe.user_id} has ${dupe.count} stat records.`);
      }
    }
    
    // Check total stats records
    const [totalStats] = await db.query(`
      SELECT COUNT(*) as total 
      FROM UserStats
    `);
    
    // Check total users
    const [totalUsers] = await db.query(`
      SELECT COUNT(*) as total 
      FROM UserLogin
    `);
    
    console.log(`Total UserStats records: ${totalStats[0].total}`);
    console.log(`Total UserLogin records: ${totalUsers[0].total}`);
    
    // Check which users are missing stats
    const [missingStats] = await db.query(`
      SELECT u.id, u.username
      FROM UserLogin u
      LEFT JOIN UserStats s ON u.id = s.user_id
      WHERE s.id IS NULL
    `);
    
    if (missingStats.length > 0) {
      console.log(`Found ${missingStats.length} users missing stats records:`);
      for (const user of missingStats) {
        console.log(`User ${user.id} (${user.username}) has no stats record.`);
      }
    } else {
      console.log('All users have stats records.');
    }
    
  } catch (error) {
    console.error('Error checking for duplicate stats:', error);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

checkDuplicates();
