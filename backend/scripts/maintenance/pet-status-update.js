/**
 * Pet status update system
 * 
 * Scheduled task that handles:
 * 1. Health regeneration when pets are well-fed and happy
 * 2. Health decrease when pets are hungry
 * 3. Hunger increase over time
 * 4. Happiness decrease over time
 */

const db = require('../../config/database');

// Constants for pet status changes
const HEALTH_REGEN_RATE = 1; // Health points regenerated per cycle when conditions are met
const HUNGER_INCREASE_RATE = 2; // Hunger decrease per cycle 
const HAPPINESS_DECREASE_RATE = 3; // Happiness decrease per cycle
const HEALTH_DECREASE_HUNGRY = 1; // Health decrease when very hungry

// Thresholds for status effects
const HUNGER_HEALTH_THRESHOLD = 20; // Below this hunger, health decreases
const HUNGER_HIGH_THRESHOLD = 70; // Above this hunger, health regenerates if happy
const HAPPINESS_HEALTH_THRESHOLD = 50; // Above this happiness, health regenerates if well-fed

async function updatePetStatuses() {
    try {
        console.log('Starting pet status update cycle...');
        
        // Get all active pets
        const [pets] = await db.query(`
            SELECT id, health, hunger, happiness
            FROM UserPets
        `);
        
        console.log(`Found ${pets.length} pets to update`);
        
        // Process each pet
        for (const pet of pets) {
            // Calculate new values
            let newHealth = pet.health;
            let newHunger = Math.max(0, pet.hunger - HUNGER_INCREASE_RATE); // Hunger naturally decreases
            let newHappiness = Math.max(0, pet.happiness - HAPPINESS_DECREASE_RATE); // Happiness naturally decreases
            
            // Health regeneration when well-fed and happy
            if (pet.hunger > HUNGER_HIGH_THRESHOLD && pet.happiness > HAPPINESS_HEALTH_THRESHOLD && pet.health < 100) {
                newHealth = Math.min(100, pet.health + HEALTH_REGEN_RATE);
            }
            
            // Health decrease when very hungry
            if (pet.hunger < HUNGER_HEALTH_THRESHOLD && pet.health > 0) {
                newHealth = Math.max(0, pet.health - HEALTH_DECREASE_HUNGRY);
            }
            
            // Update the pet in the database
            await db.query(`
                UPDATE UserPets
                SET health = ?, hunger = ?, happiness = ?
                WHERE id = ?
            `, [newHealth, newHunger, newHappiness, pet.id]);
        }
        
        console.log('Pet status update cycle completed successfully');
    } catch (error) {
        console.error('Error updating pet statuses:', error);
    }
}

// If run directly
if (require.main === module) {
    updatePetStatuses()
        .then(() => {
            console.log('Pet status update script executed successfully');
            process.exit(0);
        })
        .catch(err => {
            console.error('Error executing pet status update script:', err);
            process.exit(1);
        });
}

module.exports = { updatePetStatuses };
