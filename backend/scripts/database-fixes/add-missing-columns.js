const db = require('../config/database');

async function addMissingColumns() {
    try {
        // Add missing columns to UserProfile table
        const alterQueries = [
            `ALTER TABLE UserProfile
             ADD COLUMN IF NOT EXISTS username VARCHAR(255) NOT NULL DEFAULT 'Player',
             ADD COLUMN IF NOT EXISTS level INT DEFAULT 1,
             ADD COLUMN IF NOT EXISTS status_message TEXT DEFAULT NULL`,
        ];

        for (const query of alterQueries) {
            await db.query(query);
        }

        console.log('Successfully added missing columns to UserProfile table');
        process.exit(0);
    } catch (error) {
        console.error('Error adding missing columns:', error);
        process.exit(1);
    }
}

addMissingColumns();
