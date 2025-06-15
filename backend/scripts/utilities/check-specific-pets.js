/**
 * check-specific-pets.js - Check details for specific pet IDs
 */

const db = require('../../config/database');

async function checkSpecificPets() {
    try {
        console.log('Checking pets with IDs 5-8...');
        
        // Check Pets table for pets 5-8
        const [pets] = await db.query('SELECT * FROM Pets WHERE id BETWEEN 5 AND 8');
        
        console.log('Pets (IDs 5-8):');
        console.table(pets);
        
        // Check if any of these pets are already assigned to user_id 1
        const [userPets] = await db.query('SELECT * FROM UserPets WHERE Pets_id BETWEEN 5 AND 8 AND user_id = 1');
        
        console.log('User\'s pets (IDs 5-8, user_id = 1):');
        console.table(userPets);
        
    } catch (error) {
        console.error('Error checking specific pets:', error);
    } finally {
        db.end();
    }
}

checkSpecificPets();
