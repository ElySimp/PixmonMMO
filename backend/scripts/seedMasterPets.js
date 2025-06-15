/**
 * seedMasterPets.js - Master script for seeding all pet data
 * 
 * This script manages the complete seeding process for pets,
 * including base pets, additional pets, and legendary pets.
 */

const db = require('../config/database');
const Pet = require('../models/Pet');
const { seedPets } = require('./seedOptimizedPets');
const { seedAdditionalPets } = require('./seedAdditionalPets');
const { seedLegendaryPets } = require('./seedLegendaryPets');

async function seedAllPets() {
    try {
        console.log('Starting complete pet database seeding...');
        
        // First, ensure tables are created
        console.log('Creating pet tables...');
        await Pet.createTables();
        
        // Check if we need to seed
        const [petsCount] = await db.query('SELECT COUNT(*) as count FROM Pets');
        
        if (petsCount[0].count > 0) {
            console.log(`Found ${petsCount[0].count} existing pets in the database.`);
            const answer = await promptUser('Pets already exist in the database. Would you like to proceed and potentially add more? (y/n): ');
            
            if (answer.toLowerCase() !== 'y') {
                console.log('Seeding cancelled by user.');
                return;
            }
        }
        
        // Step 1: Seed base pets (one for each class)
        console.log('Step 1: Seeding base pets...');
        await seedPets();
        
        // Step 2: Seed additional pets (one more for each class)
        console.log('Step 2: Seeding additional pets...');
        await seedAdditionalPets();
        
        // Step 3: Seed legendary pets
        console.log('Step 3: Seeding legendary pets...');
        await seedLegendaryPets();
        
        // Display summary
        const [finalCount] = await db.query('SELECT COUNT(*) as count FROM Pets');
        const [skillCount] = await db.query('SELECT COUNT(*) as count FROM PetSkills');
        const [mappingCount] = await db.query('SELECT COUNT(*) as count FROM PetSkillMapping');
        
        console.log('\n===== Pet Database Seeding Complete =====');
        console.log(`Total Pets: ${finalCount[0].count}`);
        console.log(`Total Skills: ${skillCount[0].count}`);
        console.log(`Total Skill Mappings: ${mappingCount[0].count}`);
        console.log('========================================\n');
        
        // Show a breakdown of pets by class and rarity
        const [breakdown] = await db.query(`
            SELECT class_type, rarity, COUNT(*) as count 
            FROM Pets 
            GROUP BY class_type, rarity 
            ORDER BY class_type, rarity
        `);
        
        console.log('Pet Distribution:');
        for (const row of breakdown) {
            console.log(`  ${row.class_type} (${row.rarity}): ${row.count} pets`);
        }
        
    } catch (error) {
        console.error('Error in master pet seeding process:', error);
        throw error;
    }
}

// Simple helper to prompt user in Node.js
function promptUser(question) {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// Export for use in other files
module.exports = {
    seedAllPets
};

// If this script is run directly, execute the master seed function
if (require.main === module) {
    seedAllPets()
        .then(() => {
            console.log('Master pet seeding process completed successfully!');
            process.exit(0);
        })
        .catch(err => {
            console.error('Master pet seeding failed:', err);
            process.exit(1);
        });
}
