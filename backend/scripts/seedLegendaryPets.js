/**
 * seedLegendaryPets.js - Seeds legendary tier pets
 * 
 * This script adds rare, legendary pets that players can obtain through
 * special events, achievements, or as rare drops in the game.
 * These pets have higher base stats and unique abilities.
 */

const db = require('../config/database');
const Pet = require('../models/Pet');

async function seedLegendaryPets() {
    try {
        console.log('Starting to seed legendary pet data...');
        
        // First, ensure tables are created (in case this script runs standalone)
        await Pet.createTables();
        
        // Define legendary pets - one for each class type
        const legendaryPetsData = [
            {
                name: 'Chronostorm',
                description: 'A mythical time-bending mage pet that can manipulate the flow of time itself. Ancient and incomprehensibly powerful.',
                class_type: 'mage',
                rarity: 'legendary',
                base_hp: 50,        // Moderate HP
                base_atk: 120,      // Extremely high magical attack
                base_def_physical: 40,  // Low-moderate physical defense
                base_def_magical: 90,   // Very high magical defense
                base_mana: 150,     // Extraordinary mana pool
                base_agility: 70,   // High agility
                growth_rate: 1.15,  // Superior growth rate
                passive_name: 'Time Distortion',
                passive_description: 'Has a 15% chance to take an additional turn after acting',
                image_url: '/assets/pets/legendary/chronostorm.png'
            },
            {
                name: 'Nightwhisper',
                description: 'A legendary shadow assassin birthed from the void itself. Moves with such speed and stealth that it appears to teleport between shadows.',
                class_type: 'assassin',
                rarity: 'legendary',
                base_hp: 60,        // Moderate HP
                base_atk: 130,      // Highest attack in the game
                base_def_physical: 60,  // Moderate physical defense
                base_def_magical: 50,   // Moderate magical defense
                base_mana: 70,      // Moderate mana
                base_agility: 120,  // Extraordinarily high agility
                growth_rate: 1.14,  // Superior growth rate
                passive_name: 'Shadow Merge',
                passive_description: 'Has a 25% chance to dodge any attack and counter with a shadow strike dealing 30% damage',
                image_url: '/assets/pets/legendary/nightwhisper.png'
            },
            {
                name: 'Titanshield',
                description: 'An ancient titan warrior bound to a suit of living armor. Said to have held back an army of thousands single-handedly.',
                class_type: 'warrior',
                rarity: 'legendary',
                base_hp: 150,       // Extraordinarily high HP
                base_atk: 70,       // Moderate attack
                base_def_physical: 130,  // Highest physical defense in the game
                base_def_magical: 100,   // Very high magical defense
                base_mana: 60,      // Moderate mana
                base_agility: 40,   // Low agility
                growth_rate: 1.13,  // Superior growth rate
                passive_name: 'Unbreakable',
                passive_description: 'When HP drops below 25%, gains 50% damage reduction for 3 turns',
                image_url: '/assets/pets/legendary/titanshield.png'
            },
            {
                name: 'Celestia',
                description: 'A divine celestial being of pure healing light. Its mere presence brings comfort and healing to allies.',
                class_type: 'healer',
                rarity: 'legendary',
                base_hp: 85,        // High HP
                base_atk: 60,       // Moderate attack
                base_def_physical: 50,  // Moderate physical defense
                base_def_magical: 110,   // Very high magical defense
                base_mana: 130,     // Extraordinarily high mana
                base_agility: 75,   // High agility
                growth_rate: 1.15,  // Superior growth rate
                passive_name: 'Divine Blessing',
                passive_description: 'All healing effects are increased by 25%. Provides 5% HP regeneration to all allies each turn',
                image_url: '/assets/pets/legendary/celestia.png'
            }
        ];

        // Insert legendary pets into the database
        for (const pet of legendaryPetsData) {
            // Check if pet already exists (by name)
            const [existingPet] = await db.query(
                'SELECT id FROM Pets WHERE name = ?',
                [pet.name]
            );
            
            if (existingPet.length > 0) {
                console.log(`Legendary pet ${pet.name} already exists, skipping...`);
                continue;
            }
            
            const [result] = await db.query(`
                INSERT INTO Pets (
                    name, description, class_type, rarity, base_hp, base_atk, 
                    base_def_physical, base_def_magical, base_mana, base_agility,
                    growth_rate, passive_name, passive_description, image_url
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                pet.name,
                pet.description,
                pet.class_type,
                pet.rarity,
                pet.base_hp,
                pet.base_atk,
                pet.base_def_physical,
                pet.base_def_magical,
                pet.base_mana,
                pet.base_agility,
                pet.growth_rate,
                pet.passive_name,
                pet.passive_description,
                pet.image_url
            ]);
            
            const petId = result.insertId;
            console.log(`Added new legendary pet: ${pet.name} (${pet.class_type}) with ID ${petId}`);
        }
        
        console.log('Legendary pets have been seeded successfully!');
        
        // Create special legendary skills
        await seedLegendarySkills();
        
    } catch (error) {
        console.error('Error seeding legendary pet data:', error);
        throw error;
    }
}

async function seedLegendarySkills() {
    try {
        console.log('Starting to seed legendary pet skills...');
        
        // Define legendary skills for each class
        const legendarySkills = [
            // Legendary mage skills
            {
                name: 'Time Warp',
                description: 'Manipulates the flow of time, resetting cooldowns for all team members and granting them an extra action.',
                skill_type: 'active',
                class_type: 'mage',
                mana_cost: 100,
                cooldown: 8,
                damage: 0,
                healing: 0,
                duration: 1,
                effect_type: 'cooldown_reset',
                effect_value: 1.0,
                effect_description: 'Resets all cooldowns and grants an extra turn'
            },
            {
                name: 'Arcane Supernova',
                description: 'Channels immense magical energy into a devastating explosion that deals massive damage to all enemies.',
                skill_type: 'active',
                class_type: 'mage',
                mana_cost: 120,
                cooldown: 6,
                damage: 150,
                healing: 0,
                duration: 1,
                effect_type: 'aoe_damage',
                effect_value: 0,
                effect_description: 'Massive AoE damage to all enemies'
            },
            
            // Legendary assassin skills
            {
                name: 'Dimensional Slash',
                description: 'Cuts through the fabric of reality, dealing unavoidable damage that ignores defense to a single target.',
                skill_type: 'active',
                class_type: 'assassin',
                mana_cost: 90,
                cooldown: 5,
                damage: 200,
                healing: 0,
                duration: 1,
                effect_type: 'true_damage',
                effect_value: 1.0,
                effect_description: 'Deals true damage that bypasses all defenses'
            },
            {
                name: 'Shadow Army',
                description: 'Creates shadow clones that attack all enemies, each dealing 40% of the pet\'s attack damage.',
                skill_type: 'active',
                class_type: 'assassin',
                mana_cost: 80,
                cooldown: 5,
                damage: 40,
                healing: 0,
                duration: 1,
                effect_type: 'multi_hit',
                effect_value: 0.4,
                effect_description: 'Multiple shadow strikes hit all enemies'
            },
            
            // Legendary warrior skills
            {
                name: 'Titan\'s Rage',
                description: 'Enters a state of unstoppable fury, becoming immune to crowd control and increasing damage dealt by 50% for 3 turns.',
                skill_type: 'active',
                class_type: 'warrior',
                mana_cost: 70,
                cooldown: 6,
                damage: 0,
                healing: 0,
                duration: 3,
                effect_type: 'berserk',
                effect_value: 0.5,
                effect_description: 'Immune to CC with damage boost'
            },
            {
                name: 'Earth Shatter',
                description: 'Slams the ground with such force that it stuns all enemies for 2 turns and deals heavy physical damage.',
                skill_type: 'active',
                class_type: 'warrior',
                mana_cost: 90,
                cooldown: 7,
                damage: 100,
                healing: 0,
                duration: 2,
                effect_type: 'aoe_stun',
                effect_value: 2,
                effect_description: 'AoE damage with multi-turn stun'
            },
            
            // Legendary healer skills
            {
                name: 'Divine Intervention',
                description: 'Calls upon divine power to fully restore all allies to maximum HP and remove all negative effects.',
                skill_type: 'active',
                class_type: 'healer',
                mana_cost: 150,
                cooldown: 8,
                damage: 0,
                healing: 100,
                duration: 1,
                effect_type: 'full_heal',
                effect_value: 1.0,
                effect_description: 'Full team heal and cleanse'
            },
            {
                name: 'Celestial Blessing',
                description: 'Surrounds allies with a divine aura that makes them immune to damage for 1 turn.',
                skill_type: 'active',
                class_type: 'healer',
                mana_cost: 120,
                cooldown: 10,
                damage: 0,
                healing: 0,
                duration: 1,
                effect_type: 'invulnerability',
                effect_value: 1.0,
                effect_description: 'Team-wide damage immunity'
            }
        ];

        // Insert legendary skills
        for (const skill of legendarySkills) {
            // Check if skill already exists by name and class
            const [existingSkill] = await db.query(
                'SELECT id FROM PetSkills WHERE name = ? AND class_type = ?',
                [skill.name, skill.class_type]
            );
            
            if (existingSkill.length > 0) {
                console.log(`Legendary skill ${skill.name} already exists, skipping...`);
                continue;
            }
            
            // Insert the legendary skill
            const [result] = await db.query(`
                INSERT INTO PetSkills (
                    name, description, skill_type, class_type, mana_cost, cooldown,
                    damage, healing, duration, effect_type, effect_value, effect_description
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                skill.name,
                skill.description,
                skill.skill_type,
                skill.class_type,
                skill.mana_cost,
                skill.cooldown,
                skill.damage,
                skill.healing,
                skill.duration,
                skill.effect_type,
                skill.effect_value,
                skill.effect_description
            ]);
            
            const skillId = result.insertId;
            console.log(`Added legendary skill: ${skill.name} for ${skill.class_type}`);
            
            // Map this skill to the corresponding legendary pet
            const [legendaryPet] = await db.query(`
                SELECT id, name FROM Pets 
                WHERE class_type = ? AND rarity = 'legendary'
            `, [skill.class_type]);
            
            if (legendaryPet.length > 0) {
                // Legendary skills start at different levels based on their power
                let unlockLevel = 10;
                if (skill.name.includes('Supernova') || 
                    skill.name.includes('Dimensional') || 
                    skill.name.includes('Rage') ||
                    skill.name.includes('Divine Intervention')) {
                    unlockLevel = 5; // First legendary skill at level 5
                } else {
                    unlockLevel = 10; // Second legendary skill at level 10
                }
                
                await db.query(`
                    INSERT INTO PetSkillMapping (pet_id, skill_id, unlock_level)
                    VALUES (?, ?, ?)
                `, [legendaryPet[0].id, skillId, unlockLevel]);
                
                console.log(`Mapped legendary skill ${skill.name} to ${legendaryPet[0].name} at level ${unlockLevel}`);
            }
        }
        
        console.log('Legendary pet skills seeded successfully!');
        
    } catch (error) {
        console.error('Error seeding legendary skills:', error);
        throw error;
    }
}

// Export for use in other files
module.exports = {
    seedLegendaryPets,
    seedLegendarySkills
};

// If this script is run directly, execute the seed function
if (require.main === module) {
    seedLegendaryPets()
        .then(() => {
            console.log('Legendary pet seeding completed successfully!');
            process.exit(0);
        })
        .catch(err => {
            console.error('Legendary pet seeding failed:', err);
            process.exit(1);
        });
}
