/**
 * check-pets-schema.js - Check the current pets table schema
 */

const db = require('../../config/database');

async function checkPetsSchema() {
    try {
        // Check Pets table schema
        console.log('Checking Pets table schema...');
        const [petsColumns] = await db.query('SHOW COLUMNS FROM Pets');
        
        console.log('\nPets Table Schema:');
        petsColumns.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        
        // Check if UserPets table exists
        console.log('\nChecking if UserPets table exists...');
        try {
            const [userPetsColumns] = await db.query('SHOW COLUMNS FROM UserPets');
            console.log('UserPets Table Schema:');
            userPetsColumns.forEach(col => {
                console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
            });
        } catch (error) {
            console.log('UserPets table does not exist or cannot be accessed');
        }
        
        // Check if PetSkills table exists
        console.log('\nChecking if PetSkills table exists...');
        try {
            const [petSkillsColumns] = await db.query('SHOW COLUMNS FROM PetSkills');
            console.log('PetSkills Table Schema:');
            petSkillsColumns.forEach(col => {
                console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
            });
        } catch (error) {
            console.log('PetSkills table does not exist or cannot be accessed');
        }
        
    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        process.exit();
    }
}

// Run the check
checkPetsSchema();
