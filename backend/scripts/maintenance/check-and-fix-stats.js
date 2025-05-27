// Script to check for and fix duplicate UserStats records
// This will be imported and run when the server starts

const db = require('../config/database');

async function checkAndFixDuplicateStats() {
  try {
    console.log('Checking for duplicate UserStats records on server startup...');
    
    // Find users with multiple stats records
    const [duplicates] = await db.query(`
      SELECT user_id, COUNT(*) as count
      FROM UserStats
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length === 0) {
      console.log('No duplicate UserStats records found.');
      return;
    }
    
    console.log(`Found ${duplicates.length} users with duplicate stats records. Fixing...`);
    
    for (const dupe of duplicates) {
      const userId = dupe.user_id;
      
      console.log(`User ${userId} has ${dupe.count} stat records. Keeping only the most recent.`);
      
      // Get ID of the most recent record
      const [latestRecord] = await db.query(`
        SELECT id
        FROM UserStats
        WHERE user_id = ?
        ORDER BY updated_at DESC
        LIMIT 1
      `, [userId]);
      
      if (latestRecord.length > 0) {
        const latestId = latestRecord[0].id;
        
        // Delete all other records
        const [deleteResult] = await db.query(`
          DELETE FROM UserStats
          WHERE user_id = ? AND id != ?
        `, [userId, latestId]);
        
        console.log(`Deleted ${deleteResult.affectedRows} duplicate records for user ${userId}`);
      }
    }
    
    console.log('Duplicate UserStats cleanup completed successfully.');
  } catch (error) {
    console.error('Error checking for duplicate stats:', error);
  }
}

module.exports = checkAndFixDuplicateStats;
