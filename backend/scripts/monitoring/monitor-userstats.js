// Script to monitor UserStats table for duplicates over time
// This can be run periodically to ensure duplicates don't reappear
const db = require('../../config/database');
const fs = require('fs');
const path = require('path');

async function monitorUserStats() {
  try {
    console.log(`[${new Date().toISOString()}] Running UserStats monitoring check...`);
    
    // Find users with multiple stats records
    const [duplicates] = await db.query(`
      SELECT user_id, COUNT(*) as count
      FROM UserStats
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `);
    
    // Get total counts
    const [totalStats] = await db.query(`SELECT COUNT(*) as total FROM UserStats`);
    const [totalUsers] = await db.query(`SELECT COUNT(*) as total FROM UserLogin`);
    
    // Create monitoring log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      duplicatesFound: duplicates.length,
      totalStatsRecords: totalStats[0].total,
      totalUsers: totalUsers[0].total,
      duplicateDetails: duplicates,
    };
    
    // Results summary
    const summary = [
      `[${logEntry.timestamp}]`,
      `Total users: ${logEntry.totalUsers}`,
      `Total stats records: ${logEntry.totalStatsRecords}`,
      `Duplicate stats found: ${logEntry.duplicatesFound}`,
    ];
    
    if (duplicates.length > 0) {
      summary.push('Users with duplicate stats:');
      for (const dupe of duplicates) {
        summary.push(`- User ${dupe.user_id}: ${dupe.count} records`);
      }
      
      // Fix the duplicates automatically
      console.log('Fixing duplicate records...');
      for (const dupe of duplicates) {
        const userId = dupe.user_id;
        
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
      
      // Verify the fix
      const [afterFix] = await db.query(`
        SELECT user_id, COUNT(*) as count
        FROM UserStats
        GROUP BY user_id
        HAVING COUNT(*) > 1
      `);
      
      summary.push(`After fix - Duplicate stats remaining: ${afterFix.length}`);
    } else {
      summary.push('No duplicate records found.');
    }
      // Write to log file
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    
    const logFile = path.join(logDir, 'userstats-monitoring.log');
    fs.appendFileSync(logFile, summary.join('\n') + '\n\n');
    
    console.log(summary.join('\n'));
    console.log(`Log written to ${logFile}`);
    
  } catch (error) {
    console.error('Error monitoring UserStats:', error);
  } finally {
    process.exit(0);
  }
}

monitorUserStats();
