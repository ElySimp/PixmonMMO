/**
 * Script to add last_played_at column to UserPets table for cooldown tracking
 */

const db = require('../../config/database');

async function addLastPlayedAtColumn() {
    try {
        console.log('Adding last_played_at column to UserPets table...');
        
        // Check if the column exists first
        const [columns] = await db.query(`
            SHOW COLUMNS FROM UserPets LIKE 'last_played_at'
        `);
        
        if (columns.length === 0) {
            // Add the column
            await db.query(`
                ALTER TABLE UserPets
                ADD COLUMN last_played_at TIMESTAMP NULL
            `);
            console.log('Successfully added last_played_at column to UserPets table');
        } else {
            console.log('last_played_at column already exists in UserPets table');
        }
        
        console.log('Operation completed successfully');
    } catch (error) {
        console.error('Error adding last_played_at column:', error);
    } finally {
        process.exit();
    }
}

// Run the function
addLastPlayedAtColumn();
