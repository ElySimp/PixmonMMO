/**
 * check-userpets-schema.js - Check the structure of the UserPets table
 */

const db = require('../../config/database');

async function checkUserPetsSchema() {
    try {
        console.log('Checking UserPets table structure...');
        
        // Check if table exists
        const [tables] = await db.query("SHOW TABLES LIKE 'UserPets'");
        
        if (tables.length === 0) {
            console.log('UserPets table does not exist!');
            return;
        }
        
        // Get table structure
        const [columns] = await db.query('DESCRIBE UserPets');
        
        console.log('UserPets Table Structure:');
        columns.forEach(column => {
            console.log(`${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : ''} ${column.Key} ${column.Extra}`);
        });
        
        // Also show some sample data
        console.log('\nSample Data (if any):');
        const [rows] = await db.query('SELECT * FROM UserPets LIMIT 5');
        console.log(rows);
        
    } catch (error) {
        console.error('Error checking UserPets schema:', error);
    } finally {
        db.end();
    }
}

checkUserPetsSchema();
