/**
 * Script to add missing pet status columns to UserPets table
 * - health (happiness and hunger should already exist)
 */

const db = require('../../config/database');

async function addPetStatusColumns() {
    try {
        console.log('Checking and adding pet status columns to UserPets table...');
        
        // Check if health column exists
        const [healthColumns] = await db.query(`
            SHOW COLUMNS FROM UserPets LIKE 'health'
        `);
        
        if (healthColumns.length === 0) {
            // Add health column
            await db.query(`
                ALTER TABLE UserPets
                ADD COLUMN health INTEGER DEFAULT 100
            `);
            console.log('Added health column to UserPets table');
        } else {
            console.log('health column already exists in UserPets table');
        }
        
        // Check if happiness column exists
        const [happinessColumns] = await db.query(`
            SHOW COLUMNS FROM UserPets LIKE 'happiness'
        `);
        
        if (happinessColumns.length === 0) {
            // Add happiness column
            await db.query(`
                ALTER TABLE UserPets
                ADD COLUMN happiness INTEGER DEFAULT 100
            `);
            console.log('Added happiness column to UserPets table');
        } else {
            console.log('happiness column already exists in UserPets table');
        }
        
        // Check if hunger column exists
        const [hungerColumns] = await db.query(`
            SHOW COLUMNS FROM UserPets LIKE 'hunger'
        `);
        
        if (hungerColumns.length === 0) {
            // Add hunger column
            await db.query(`
                ALTER TABLE UserPets
                ADD COLUMN hunger INTEGER DEFAULT 100
            `);
            console.log('Added hunger column to UserPets table');
        } else {
            console.log('hunger column already exists in UserPets table');
        }
        
        console.log('Pet status columns check complete');
    } catch (error) {
        console.error('Error adding pet status columns:', error);
    } finally {
        process.exit();
    }
}

// Run the function
addPetStatusColumns();
