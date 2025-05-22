// Script to add a unique constraint to the UserStats table
const db = require('../config/database');

async function addUniqueConstraint() {
  try {
    console.log('Adding unique constraint to UserStats table...');
      // Check if the index already exists
    const [indexes] = await db.query(`
      SELECT INDEX_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'UserStats'
      AND INDEX_NAME = 'idx_userstats_user_id_unique'
    `);
    
    if (indexes.length > 0) {
      console.log('Unique index already exists on UserStats table.');
      return;
    }
    
    // First make sure there are no duplicates
    const [duplicates] = await db.query(`
      SELECT user_id, COUNT(*) as count
      FROM UserStats
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} users with duplicate stats records. Fixing before adding constraint...`);
      
      // Fix duplicates before adding constraint
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
          await db.query(`
            DELETE FROM UserStats
            WHERE user_id = ? AND id != ?
          `, [userId, latestId]);
          
          console.log(`Deleted duplicate records for user ${userId}`);
        }
      }
    }
      // Create a new unique index instead of constraint
    await db.query(`
      CREATE UNIQUE INDEX idx_userstats_user_id_unique ON UserStats (user_id)
    `);
    
    console.log('Successfully added unique index on user_id column in UserStats table.');
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('Error: Duplicate entries exist. Run fix-duplicates script first.');
    } else {
      console.error('Error adding unique constraint:', error);
    }
  }
}

// Run if this script is executed directly
if (require.main === module) {
  addUniqueConstraint()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = addUniqueConstraint;
}
