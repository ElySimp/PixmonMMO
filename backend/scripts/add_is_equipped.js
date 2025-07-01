const db = require('../config/database');

async function addIsEquippedColumn() {
    try {
        console.log('Adding is_equipped column to UserPets table...');
        
        // Check if column exists
        const [columns] = await db.query(`SHOW COLUMNS FROM UserPets LIKE 'is_equipped'`);
        
        if (columns.length === 0) {
            await db.query(`ALTER TABLE UserPets ADD COLUMN is_equipped BOOLEAN DEFAULT FALSE`);
            console.log('is_equipped column added successfully!');
        } else {
            console.log('is_equipped column already exists.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error adding is_equipped column:', error);
        process.exit(1);
    }
}

addIsEquippedColumn();
