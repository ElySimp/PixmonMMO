const db = require('../config/database');

async function fixUserProfileTable() {
    try {
        // Start transaction
        await db.query('START TRANSACTION');

        // Check if columns exist and drop them one by one
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'UserProfile' 
            AND TABLE_SCHEMA = DATABASE()
            AND COLUMN_NAME IN ('id','username', 'level')
        `);

        // Drop columns if they exist
        for (const column of columns) {
            await db.query(`ALTER TABLE UserProfile DROP COLUMN ${column.COLUMN_NAME}`);
            console.log(`Dropped column ${column.COLUMN_NAME}`);
        }

        // Ensure status_message column exists and is TEXT
        const [statusMessageColumn] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'UserProfile' 
            AND TABLE_SCHEMA = DATABASE()
            AND COLUMN_NAME = 'status_message'
        `);

        if (statusMessageColumn.length === 0) {
            await db.query('ALTER TABLE UserProfile ADD COLUMN status_message TEXT');
            console.log('Added status_message column');
        } else {
            await db.query('ALTER TABLE UserProfile MODIFY COLUMN status_message TEXT');
            console.log('Modified status_message column to TEXT');
        }

        // Commit changes
        await db.query('COMMIT');
        console.log('Successfully fixed UserProfile table structure');
        process.exit(0);
    } catch (error) {
        // Rollback on error
        await db.query('ROLLBACK');
        console.error('Error fixing UserProfile table:', error);
        process.exit(1);
    }
}

fixUserProfileTable();
