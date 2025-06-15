/**
 * add-epic-pets-to-user.js - Directly add epic pets to a user
 */

const db = require('../../config/database');

async function addEpicPetsToUser(userId, petIds) {
    try {
        console.log(`Adding epic pets ${petIds.join(', ')} to user ID ${userId}...`);
        
        // Get all the pet data
        const [epics] = await db.query('SELECT * FROM Pets WHERE id IN (?)', [petIds]);
        
        if (epics.length === 0) {
            console.log('No epic pets found with the given IDs.');
            return;
        }
        
        console.log(`Found ${epics.length} epic pets:`);
        epics.forEach(pet => {
            console.log(`- ID ${pet.id}: ${pet.name} (${pet.class_type})`);
        });
        
        // For each epic pet, add it to UserPets
        let equipped = true; // We'll equip the first pet
        for (const pet of epics) {
            // Check if user already has this pet
            const [existing] = await db.query(
                'SELECT * FROM UserPets WHERE user_id = ? AND Pets_id = ?',
                [userId, pet.id]
            );
            
            if (existing.length > 0) {
                console.log(`User ${userId} already has pet ${pet.name} (ID: ${pet.id}). Skipping...`);
                continue;
            }
              // Insert the pet for this user
            const [result] = await db.query(`
                INSERT INTO UserPets (
                    user_id,
                    Pets_id,
                    name,
                    role,
                    current_level,
                    current_atk,
                    current_hp,
                    current_def_phy,
                    current_def_magic,
                    current_mana,
                    current_agility,
                    time_date,
                    equipped
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
            `, [
                userId,
                pet.id,
                pet.name,
                pet.class_type,
                1, // Start at level 1
                pet.base_atk,
                pet.base_hp,
                pet.base_def_physical,
                pet.base_def_magical,
                pet.base_mana,
                pet.base_agility,
                equipped ? 'yes' : 'no'
            ]);
            
            console.log(`Added pet ${pet.name} (${pet.class_type}) to user ${userId}${equipped ? ' and equipped it' : ''}.`);
            
            // Only equip the first pet
            if (equipped) equipped = false;
        }
        
        // Now show all pets for this user
        const [userPets] = await db.query(`
            SELECT *
            FROM UserPets
            WHERE user_id = ?
            ORDER BY FIELD(equipped, 'yes', 'no'), current_level DESC
        `, [userId]);
        
        console.log(`\nUser ${userId} now has ${userPets.length} pets:`);
        userPets.forEach(pet => {
            console.log(`- ${pet.name} (${pet.role}), Level ${pet.current_level}, ${pet.equipped === 'yes' ? 'EQUIPPED' : 'not equipped'}`);
        });
        
    } catch (error) {
        console.error('Error adding epic pets to user:', error);
        throw error;
    } finally {
        db.end();
    }
}

// User ID 1, epic pets (IDs 5-8)
const USER_ID = 1;
const PET_IDS = [5, 6, 7, 8]; // Epic pets - Frostweaver, Viperstrike, Stoneguard, Natureblossom

addEpicPetsToUser(USER_ID, PET_IDS)
    .then(() => {
        console.log('Epic pets added successfully!');
    })
    .catch(err => {
        console.error('Failed to add epic pets:', err);
    });
