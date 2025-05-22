const db = require('../config/database');

async function fixUserStats() {
    try {
        console.log('Starting UserStats cleanup...');
        
        // Start transaction
        await db.query('START TRANSACTION');

        // Get all users
        const [users] = await db.query('SELECT id FROM UserLogin');
        
        for (const user of users) {
            // Get all stats for this user
            const [stats] = await db.query(
                'SELECT * FROM UserStats WHERE user_id = ? ORDER BY updated_at DESC',
                [user.id]
            );
            
            if (stats.length > 1) {
                console.log(`Found ${stats.length} entries for user ${user.id}, keeping most recent...`);
                
                // Keep the most recent entry (first one due to ORDER BY DESC)
                const mostRecent = stats[0];
                
                // Delete all other entries
                await db.query(
                    'DELETE FROM UserStats WHERE user_id = ? AND id != ?',
                    [user.id, mostRecent.id]
                );
                
                console.log(`Cleaned up duplicate entries for user ${user.id}`);
            }
        }

        // Commit transaction
        await db.query('COMMIT');
        console.log('UserStats cleanup completed successfully');

    } catch (error) {
        // Rollback on error
        await db.query('ROLLBACK');
        console.error('Error during UserStats cleanup:', error);
        throw error;
    }
}

// Run the fix
fixUserStats()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
