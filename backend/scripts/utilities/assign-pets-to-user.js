/**
 * assign-pets-to-user.js - Script to assign pets to a specific user
 * 
 * This script assigns selected pets to a specific user for testing purposes.
 */

const db = require('../../config/database');
const Pet = require('../../models/Pet');

async function assignPetsToUser(userId, petIds) {
    try {
        console.log(`Starting to assign pets to user ID ${userId}...`);
        
        // Check if user exists (if we have a Users table)
        try {
            const [users] = await db.query('SELECT id FROM Users WHERE id = ?', [userId]);
            
            if (users.length === 0) {
                console.log(`Warning: User ID ${userId} not found in Users table. Continuing anyway...`);
            } else {
                console.log(`Found user ID ${userId} in database.`);
            }
        } catch (error) {
            // It's okay if this fails - the Users table might not exist or have the right structure
            console.log('Could not check Users table. Continuing anyway...');
        }
        
        // For each pet ID, adopt the pet for the user
        for (const petId of petIds) {
            try {
                // First check if the pet exists
                const [pets] = await db.query('SELECT * FROM Pets WHERE id = ?', [petId]);
                
                if (pets.length === 0) {
                    console.log(`Pet ID ${petId} not found. Skipping...`);
                    continue;
                }
                
                const pet = pets[0];
                
                // Check if the user already has this pet
                const [existingUserPets] = await db.query(
                    'SELECT * FROM UserPets WHERE user_id = ? AND pet_id = ?', 
                    [userId, petId]
                );
                
                if (existingUserPets.length > 0) {
                    console.log(`User ${userId} already has pet ${pet.name} (ID: ${petId}). Skipping...`);
                    continue;
                }
                
                // Add the pet to the user's collection (use the Pet model's adoptPet method)
                const userPetId = await Pet.adoptPet(userId, petId, pet.name);
                
                // For the first pet, automatically equip it
                if (petIds.indexOf(petId) === 0) {
                    await Pet.toggleEquip(userPetId, userId, true);
                    console.log(`Pet ${pet.name} (ID: ${petId}) assigned to user ${userId} and equipped.`);
                } else {
                    console.log(`Pet ${pet.name} (ID: ${petId}) assigned to user ${userId}.`);
                }
                
                // Set some initial stats for testing
                await Pet.updateStatus(userPetId, {
                    happiness: 100,
                    hunger: Math.floor(Math.random() * 50), // Random hunger between 0-50
                    health: 100
                });
                
            } catch (error) {
                console.error(`Error assigning pet ID ${petId} to user ${userId}:`, error);
                console.log('Continuing with next pet...');
            }
        }
        
        // Get all pets for this user to confirm
        const userPets = await Pet.getUserPets(userId);
        
        console.log(`\nUser ${userId} now has ${userPets.length} pets:`);
        userPets.forEach(pet => {
            console.log(`- ${pet.name} (${pet.class_type}), Level ${pet.current_level}, ${pet.is_equipped ? 'EQUIPPED' : 'not equipped'}`);
        });
        
        console.log('\nPet assignment completed successfully!');
        
    } catch (error) {
        console.error('Error in pet assignment process:', error);
        throw error;
    }
}

// If this script is run directly
if (require.main === module) {
    // User ID 1, assign pet IDs 5-8 (the epic pets)
    const USER_ID = 1;
    const PET_IDS = [5, 6, 7, 8]; // Frostweaver, Viperstrike, Stoneguard, Natureblossom
    
    assignPetsToUser(USER_ID, PET_IDS)
        .then(() => {
            console.log('Script completed successfully!');
            process.exit(0);
        })
        .catch(err => {
            console.error('Script failed:', err);
            process.exit(1);
        });
}
