/**
 * seedAdditionalPets.js - Seeds additional pets for each class
 * 
 * This script adds more variety to the pet roster by adding
 * additional pets for each class type with different stats and skills.
 */

const db = require('../config/database');
const Pet = require('../models/Pet');

async function seedAdditionalPets() {
    try {
        console.log('Starting to seed additional pet data...');
        
        // First, ensure tables are created (in case this script runs standalone)
        await Pet.createTables();
        
        // Define the new pets data - one additional per class
        const additionalPetsData = [
            {
                name: 'Frostweaver',
                description: 'A powerful frost mage with mastery over ice and snow, specializing in crowd control and area damage.',
                class_type: 'mage',
                rarity: 'epic',
                base_hp: 40,        // Slightly higher HP than Arcania
                base_atk: 80,       // High magical attack but slightly lower than Arcania
                base_def_physical: 30,  // Slightly better physical defense
                base_def_magical: 70,   // Higher magical defense
                base_mana: 90,      // High mana but slightly lower than Arcania
                base_agility: 40,   // Lower agility
                growth_rate: 1.13,  // Different growth rate
                passive_name: 'Frost Armor',
                passive_description: 'When attacked, has a 20% chance to freeze the attacker for 1 turn',
                image_url: '/assets/pets/frostweaver.png'
            },
            {
                name: 'Viperstrike',
                description: 'A venomous assassin pet that specializes in dealing damage over time through deadly poisons.',
                class_type: 'assassin',
                rarity: 'epic',
                base_hp: 42,        // Slightly lower HP than Shadowblade
                base_atk: 90,       // High physical attack, slightly lower than Shadowblade
                base_def_physical: 50,  // Slightly lower physical defense
                base_def_magical: 30,   // Higher magical defense than Shadowblade
                base_mana: 60,      // Higher mana than Shadowblade
                base_agility: 95,   // Higher agility - the fastest pet
                growth_rate: 1.12,  // Different growth rate
                passive_name: 'Venomous Fangs',
                passive_description: 'Basic attacks have a 25% chance to poison the target, dealing 5% of their max HP as damage for 3 turns',
                image_url: '/assets/pets/viperstrike.png'
            },
            {
                name: 'Stoneguard',
                description: 'An earthen warrior with rocky skin, granting immense durability at the cost of mobility.',
                class_type: 'warrior',
                rarity: 'epic',
                base_hp: 95,        // Higher HP than Ironheart
                base_atk: 40,       // Lower attack than Ironheart
                base_def_physical: 90,  // Slightly lower physical defense
                base_def_magical: 85,   // Higher magical defense
                base_mana: 30,      // Lower mana
                base_agility: 20,   // Even lower agility - the slowest pet
                growth_rate: 1.11,  // Different growth rate
                passive_name: 'Stone Skin',
                passive_description: 'Takes 30% reduced damage from critical hits',
                image_url: '/assets/pets/stoneguard.png'
            },
            {
                name: 'Natureblossom',
                description: 'A nature-attuned healer pet that harnesses the power of plants to provide healing and regenerative support.',
                class_type: 'healer',
                rarity: 'epic',
                base_hp: 60,        // Slightly lower HP than Luminara
                base_atk: 40,       // Higher attack than Luminara
                base_def_physical: 40,  // Higher physical defense
                base_def_magical: 60,   // Slightly lower magical defense
                base_mana: 80,      // Slightly lower mana
                base_agility: 65,   // Higher agility
                growth_rate: 1.14,  // Different growth rate - better late game scaling
                passive_name: 'Natural Regeneration',
                passive_description: 'All allies recover 5% of their max HP at the start of each turn',
                image_url: '/assets/pets/natureblossom.png'
            }
        ];

        // Insert pets into the database
        for (const pet of additionalPetsData) {
            // Check if pet already exists (by name)
            const [existingPet] = await db.query(
                'SELECT id FROM Pets WHERE name = ?',
                [pet.name]
            );
            
            if (existingPet.length > 0) {
                console.log(`Pet ${pet.name} already exists, skipping...`);
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
            console.log(`Added new pet: ${pet.name} (${pet.class_type}) with ID ${petId}`);
            
            // Get skills for this pet's class
            const [classSkills] = await db.query(
                'SELECT id, name FROM PetSkills WHERE class_type = ?',
                [pet.class_type]
            );
            
            // Map each skill to the pet (similar to original seed script)
            for (const skill of classSkills) {
                // Determine unlock level based on skill name
                const unlockLevel = skill.name.includes('Blast') || 
                                   skill.name.includes('Strike') || 
                                   skill.name.includes('Slam') ||
                                   skill.name.includes('Renewal')
                                   ? 1 : (Math.floor(Math.random() * 3) + 2); // Basic attacks at level 1, others at 2-4
                
                await db.query(`
                    INSERT INTO PetSkillMapping (pet_id, skill_id, unlock_level)
                    VALUES (?, ?, ?)
                `, [petId, skill.id, unlockLevel]);
                
                console.log(`Mapped skill ${skill.name} to ${pet.name} at level ${unlockLevel}`);
            }
        }
        
        console.log('Additional pets have been seeded successfully!');
        
        // Create new skills for each class
        await seedAdditionalSkills();
        
    } catch (error) {
        console.error('Error seeding additional pet data:', error);
        throw error;
    }
}

async function seedAdditionalSkills() {
    try {
        console.log('Starting to seed additional pet skills...');
        
        // Define additional skills for each class
        const additionalSkills = [
            // Additional mage skills
            {
                name: 'Ice Nova',
                description: 'Creates an explosive burst of ice, dealing damage to all enemies and slowing their agility by 20% for 2 turns.',
                skill_type: 'active',
                class_type: 'mage',
                mana_cost: 45,
                cooldown: 3,
                damage: 70,
                healing: 0,
                duration: 2,
                effect_type: 'aoe_slow',
                effect_value: 0.2,
                effect_description: 'AoE damage with agility reduction'
            },
            {
                name: 'Mana Shield',
                description: 'Converts 30% of incoming damage to mana cost instead of HP loss.',
                skill_type: 'active',
                class_type: 'mage',
                mana_cost: 25,
                cooldown: 3,
                damage: 0,
                healing: 0,
                duration: 2,
                effect_type: 'mana_shield',
                effect_value: 0.3,
                effect_description: 'Redirects damage to mana'
            },
            
            // Additional assassin skills
            {
                name: 'Smoke Bomb',
                description: 'Throws a smoke bomb that provides stealth to all allies for 1 turn, making them untargetable.',
                skill_type: 'active',
                class_type: 'assassin',
                mana_cost: 40,
                cooldown: 5,
                damage: 0,
                healing: 0,
                duration: 1,
                effect_type: 'team_stealth',
                effect_value: 1.0,
                effect_description: 'Team-wide stealth effect'
            },
            {
                name: 'Venomous Cloud',
                description: 'Creates a poisonous cloud that damages all enemies for 10% of their max HP for 3 turns.',
                skill_type: 'active',
                class_type: 'assassin',
                mana_cost: 35,
                cooldown: 4,
                damage: 0,
                healing: 0,
                duration: 3,
                effect_type: 'aoe_poison',
                effect_value: 0.1,
                effect_description: 'AoE poison damage over time'
            },
            
            // Additional warrior skills
            {
                name: 'Battle Shout',
                description: 'Increases attack power of all allies by 25% for 3 turns.',
                skill_type: 'active',
                class_type: 'warrior',
                mana_cost: 30,
                cooldown: 4,
                damage: 0,
                healing: 0,
                duration: 3,
                effect_type: 'atk_boost',
                effect_value: 0.25,
                effect_description: 'Team-wide attack boost'
            },
            {
                name: 'Taunt',
                description: 'Forces all enemies to attack this pet for 2 turns and increases its defense by 30%.',
                skill_type: 'active',
                class_type: 'warrior',
                mana_cost: 25,
                cooldown: 3,
                damage: 0,
                healing: 0,
                duration: 2,
                effect_type: 'taunt',
                effect_value: 0.3,
                effect_description: 'Forces attacks on self with defense boost'
            },
            
            // Additional healer skills
            {
                name: 'Resurrection',
                description: 'Revives a fallen ally with 50% of their max HP.',
                skill_type: 'active',
                class_type: 'healer',
                mana_cost: 80,
                cooldown: 6,
                damage: 0,
                healing: 50,
                duration: 1,
                effect_type: 'revive',
                effect_value: 0.5,
                effect_description: 'Brings back defeated allies'
            },
            {
                name: 'Rejuvenation',
                description: 'Places a healing effect on an ally that increases all healing received by 30% for 3 turns.',
                skill_type: 'active',
                class_type: 'healer',
                mana_cost: 40,
                cooldown: 4,
                damage: 0,
                healing: 15,
                duration: 3,
                effect_type: 'healing_boost',
                effect_value: 0.3,
                effect_description: 'Increases healing effectiveness'
            }
        ];

        // Insert additional skills and map them to appropriate pets
        for (const skill of additionalSkills) {
            // Check if skill already exists by name and class
            const [existingSkill] = await db.query(
                'SELECT id FROM PetSkills WHERE name = ? AND class_type = ?',
                [skill.name, skill.class_type]
            );
            
            if (existingSkill.length > 0) {
                console.log(`Skill ${skill.name} already exists, skipping...`);
                continue;
            }
            
            // Insert the new skill
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
            console.log(`Added new skill: ${skill.name} for ${skill.class_type}`);
            
            // Map this skill to appropriate pets (both original and new)
            const [classPets] = await db.query(
                'SELECT id, name FROM Pets WHERE class_type = ?',
                [skill.class_type]
            );
            
            for (const pet of classPets) {
                // Map each new skill to the pets of matching class
                // with a higher unlock level to make them special
                const unlockLevel = Math.floor(Math.random() * 3) + 5; // Unlock at levels 5-7
                
                await db.query(`
                    INSERT INTO PetSkillMapping (pet_id, skill_id, unlock_level)
                    VALUES (?, ?, ?)
                `, [pet.id, skillId, unlockLevel]);
                
                console.log(`Mapped new skill ${skill.name} to ${pet.name} at level ${unlockLevel}`);
            }
        }
        
        console.log('Additional pet skills seeded successfully!');
        
    } catch (error) {
        console.error('Error seeding additional skills:', error);
        throw error;
    }
}

// Export for use in other files
module.exports = {
    seedAdditionalPets,
    seedAdditionalSkills
};

// If this script is run directly, execute the seed function
if (require.main === module) {
    seedAdditionalPets()
        .then(() => {
            console.log('Additional pet seeding completed successfully!');
            process.exit(0);
        })
        .catch(err => {
            console.error('Additional pet seeding failed:', err);
            process.exit(1);
        });
}
