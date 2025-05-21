const db = require('../config/database');

async function removeColumns() {
    try {
        console.log('Checking and removing columns from UserProfile table...');
        
        // Check if columns exist first
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'UserProfile' 
            AND COLUMN_NAME IN ('username', 'level');
        `);
        
        for (const column of columns) {
            console.log(`Removing ${column.COLUMN_NAME} column...`);
            await db.query(`
                ALTER TABLE UserProfile
                DROP COLUMN ${column.COLUMN_NAME};
            `);
        }
        
        console.log('Columns removed successfully!');
    } catch (error) {
        console.error('Error removing columns:', error);
    } finally {
        process.exit();
    }
}

removeColumns();
