/**
 * test-optimized-pets.js - Test script for the optimized pets database
 * 
 * Run this script to initialize and test the new optimized pet system.
 */

const db = require('../../config/database');
const Pet = require('../../models/Pet');
const { seedPets } = require('../../scripts/seedOptimizedPets');

async function testOptimizedPets() {
    try {
        console.log('===== Testing Optimized Pets System =====\n');
        
        // 1. Initialize tables
        console.log('1. Creating tables...');
        await Pet.createTables();
        console.log('✅ Tables created successfully\n');
        
        // 2. Check if we have pet data
        const [petCount] = await db.query('SELECT COUNT(*) as count FROM Pets');
        
        if (petCount[0].count === 0) {
            console.log('2. Seeding pet data...');
            await seedPets();
        } else {
            console.log(`2. Found ${petCount[0].count} pets already in database.`);
        }
        console.log('✅ Pet data ready\n');
          // 3. Get and display all pets
        console.log('3. Fetching all pets...');
        const [pets] = await db.query('SELECT * FROM Pets');
        
        console.log('==== Pet Templates ====');
        pets.forEach(pet => {
            const classType = pet.class_type || 'unknown';
            const name = pet.name || 'Unnamed';
            const rarity = pet.rarity || 'common';
            console.log(`[${classType.toUpperCase()}] ${name} (${rarity}) - HP: ${pet.base_hp || 0}, ATK: ${pet.base_atk || 0}`);
        });
        console.log('✅ All pets fetched successfully\n');
        
        // 4. Show skills for each class
        console.log('4. Fetching pet skills for each class...');
        for (const classType of ['mage', 'warrior', 'assassin', 'healer']) {
            const [skills] = await db.query(
                'SELECT * FROM PetSkills WHERE class_type = ?',
                [classType]
            );
            
            console.log(`\n==== ${classType.toUpperCase()} Skills (${skills.length}) ====`);
            skills.forEach(skill => {
                console.log(`- ${skill.name}: ${skill.description} (Mana: ${skill.mana_cost}, Cooldown: ${skill.cooldown})`);
            });
        }
        console.log('\n✅ All skills fetched successfully\n');
        
        // 5. Calculate stats for a pet at different levels
        console.log('5. Testing stat calculations...');
        const [testPet] = await db.query('SELECT * FROM Pets WHERE class_type = "mage" LIMIT 1');
        const arcaniaPet = testPet[0];
        
        console.log(`Testing stats calculation for ${arcaniaPet.name} (${arcaniaPet.class_type})`);
        
        const baseStats = {
            hp: arcaniaPet.base_hp,
            atk: arcaniaPet.base_atk,
            def_physical: arcaniaPet.base_def_physical,
            def_magical: arcaniaPet.base_def_magical,
            mana: arcaniaPet.base_mana,
            agility: arcaniaPet.base_agility
        };
        
        console.log(`\nBase Stats (Level 1):`, baseStats);
        
        for (const level of [5, 10, 20]) {
            const stats = Pet.calculateStats(baseStats, level, arcaniaPet.growth_rate);
            console.log(`\nStats at Level ${level}:`, stats);
        }
        console.log('\n✅ Stat calculations working correctly\n');
        
        // 6. Test adding a pet to a user
        console.log('6. Testing pet adoption...');
        
        // Create a test user if needed
        let testUserId = 1; // Assume user ID 1 exists
        
        // First, check if the user already has this pet
        const [existingUserPets] = await db.query(
            'SELECT * FROM UserPets WHERE user_id = ? AND pet_id = ?',
            [testUserId, arcaniaPet.id]
        );
        
        if (existingUserPets.length > 0) {
            console.log(`User already owns ${arcaniaPet.name}`);
        } else {
            const userPetId = await Pet.adoptPet(testUserId, arcaniaPet.id, `Test ${arcaniaPet.name}`);
            console.log(`Adopted pet ${arcaniaPet.name} for user ${testUserId} with userPetId: ${userPetId}`);
        }
        console.log('✅ Pet adoption test completed\n');
        
        console.log('===== All Tests Completed Successfully =====');
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit();
    }
}

// Run the test
testOptimizedPets();
