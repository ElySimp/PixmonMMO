/**
 * seedOptimizedPets.js - Seeds the optimized pets database structure
 * 
 * This script populates the new pet table structure with base pets data
 * and their skills for each class (mage, warrior, assassin, healer).
 */

const db = require('../config/database');
const Pet = require('../models/Pet');

async function seedPets() {
    try {
        console.log('Starting to seed optimized pet data...');
        
        // First, ensure tables are created
        await Pet.createTables();
        
        // Check if pets already exist to avoid duplicates
        const [existingPets] = await db.query('SELECT COUNT(*) as count FROM Pets');
        
        if (existingPets[0].count > 0) {
            console.log('Optimized pets data already exists. Skipping seed...');
            return;
        }

        // Define the pets data - one for each class
        const petsData = [
            {
                name: 'Arcania',
                description: 'A mystical mage pet with powerful arcane abilities, specializing in devastating magical attacks and mana manipulation.',
                class_type: 'mage',
                rarity: 'epic',
                base_hp: 35,        // Low HP
                base_atk: 85,       // High magical attack (stored as base_atk)
                base_def_physical: 25,  // Low physical defense
                base_def_magical: 65,   // High magical defense
                base_mana: 95,      // Very high mana
                base_agility: 45,   // Average agility
                growth_rate: 1.12,  // Slightly higher growth to emphasize power scaling
                passive_name: 'Arcane Mastery',
                passive_description: 'Increases magic damage by 15% and mana regeneration by 10% per turn',
                image_url: '/assets/pets/arcania.png'
            },
            {
                name: 'Shadowblade',
                description: 'A stealthy assassin pet that excels in quick, precise attacks and evasion tactics, perfect for eliminating single targets.',
                class_type: 'assassin',
                rarity: 'epic',
                base_hp: 45,        // Moderate-low HP
                base_atk: 95,       // Very high physical attack
                base_def_physical: 55,  // Medium physical defense
                base_def_magical: 25,   // Low magical defense
                base_mana: 55,      // Average mana
                base_agility: 90,   // Extremely high agility
                growth_rate: 1.11,  // Standard growth
                passive_name: 'Shadow Step',
                passive_description: '15% chance to dodge attacks and counter with a strike dealing 50% physical damage',
                image_url: '/assets/pets/shadowblade.png'
            },
            {
                name: 'Ironheart',
                description: 'A stalwart warrior pet with exceptional defensive capabilities, able to absorb massive damage and protect allies.',
                class_type: 'warrior',
                rarity: 'epic',
                base_hp: 85,        // Very high HP
                base_atk: 45,       // Moderate physical attack
                base_def_physical: 95,  // Extremely high physical defense
                base_def_magical: 75,   // High magical defense
                base_mana: 35,      // Low mana
                base_agility: 25,   // Low agility
                growth_rate: 1.10,  // Slightly lower growth - warriors start strong
                passive_name: 'Stalwart Defender',
                passive_description: 'Reduces incoming damage by 20% when below 50% HP',
                image_url: '/assets/pets/ironheart.png'
            },
            {
                name: 'Luminara',
                description: 'A benevolent healer pet that channels divine energy to restore allies and provide protective buffs in battle.',
                class_type: 'healer',
                rarity: 'epic',
                base_hp: 65,        // Moderate HP
                base_atk: 35,       // Low attack (but healing-focused)
                base_def_physical: 35,  // Low physical defense
                base_def_magical: 65,   // High magical defense
                base_mana: 85,      // Very high mana
                base_agility: 55,   // Average agility
                growth_rate: 1.13,  // Higher growth - healers scale well
                passive_name: 'Healing Light',
                passive_description: 'Overhealing converts 20% of excess healing to a shield that lasts for 2 turns',
                image_url: '/assets/pets/luminara.png'
            }
        ];

        // Insert pets into the database
        for (const pet of petsData) {
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
            
            console.log(`Added pet: ${pet.name} (${pet.class_type})`);
        }
        
        console.log('Pet data seeded successfully!');
        
        // Now seed the skills
        await seedPetSkills();
        
    } catch (error) {
        console.error('Error seeding optimized pet data:', error);
        throw error;
    }
}

async function seedPetSkills() {
    try {
        console.log('Starting to seed pet skills...');
        
        // Check if skills already exist
        const [existingSkills] = await db.query('SELECT COUNT(*) as count FROM PetSkills');
        
        if (existingSkills[0].count > 0) {
            console.log('Pet skills already exist. Skipping skills seed...');
            return;
        }
        
        // Define skills for each class
        const skills = [
            // Mage skills
            {
                name: 'Arcane Blast',
                description: 'Unleashes concentrated arcane energy at a single target, dealing high magic damage.',
                skill_type: 'active',
                class_type: 'mage',
                mana_cost: 30,
                cooldown: 1,
                damage: 85,
                healing: 0,
                duration: 1,
                effect_type: 'damage',
                effect_value: 0,
                effect_description: 'Direct magic damage'
            },
            {
                name: 'Mana Surge',
                description: 'Channels magical energy to restore 20% mana to all team members.',
                skill_type: 'active',
                class_type: 'mage',
                mana_cost: 50,
                cooldown: 3,
                damage: 0,
                healing: 0,
                duration: 1,
                effect_type: 'mana_restore',
                effect_value: 0.2,
                effect_description: 'Restores 20% of max mana to all allies'
            },
            {
                name: 'Arcane Barrier',
                description: 'Creates a magical shield that absorbs damage equal to 50% of the caster\'s max mana.',
                skill_type: 'active',
                class_type: 'mage',
                mana_cost: 40,
                cooldown: 4,
                damage: 0,
                healing: 0,
                duration: 2,
                effect_type: 'shield',
                effect_value: 0.5,
                effect_description: 'Creates a shield based on max mana'
            },
            
            // Assassin skills
            {
                name: 'Lethal Strike',
                description: 'Precisely targets an enemy\'s weak point, dealing devastating physical damage.',
                skill_type: 'active',
                class_type: 'assassin',
                mana_cost: 30,
                cooldown: 1,
                damage: 95,
                healing: 0,
                duration: 1,
                effect_type: 'damage',
                effect_value: 0,
                effect_description: 'Direct physical damage'
            },
            {
                name: 'Shadow Veil',
                description: 'Cloaks in shadows, becoming untargetable for 1 turn and increasing next attack damage by 30%.',
                skill_type: 'active',
                class_type: 'assassin',
                mana_cost: 35,
                cooldown: 4,
                damage: 0,
                healing: 0,
                duration: 1,
                effect_type: 'evasion',
                effect_value: 1.0,
                effect_description: 'Becomes untargetable and boosts next attack'
            },
            {
                name: 'Poison Blade',
                description: 'Coats weapons with deadly poison, causing the target to take 15% of the initial damage for 3 turns.',
                skill_type: 'active',
                class_type: 'assassin',
                mana_cost: 25,
                cooldown: 3,
                damage: 55,
                healing: 0,
                duration: 3,
                effect_type: 'poison',
                effect_value: 0.15,
                effect_description: 'Applies damage over time effect'
            },
            
            // Warrior skills
            {
                name: 'Mighty Slam',
                description: 'Slams the ground with tremendous force, dealing physical damage to all enemies.',
                skill_type: 'active',
                class_type: 'warrior',
                mana_cost: 35,
                cooldown: 2,
                damage: 65,
                healing: 0,
                duration: 1,
                effect_type: 'aoe_damage',
                effect_value: 0,
                effect_description: 'Physical damage to all enemies'
            },
            {
                name: 'Defensive Stance',
                description: 'Adopts a defensive posture, reducing damage taken by 50% for 2 turns.',
                skill_type: 'active',
                class_type: 'warrior',
                mana_cost: 25,
                cooldown: 3,
                damage: 0,
                healing: 0,
                duration: 2,
                effect_type: 'damage_reduction',
                effect_value: 0.5,
                effect_description: 'Reduces incoming damage'
            },
            {
                name: 'Rallying Cry',
                description: 'Emits a powerful battle cry, increasing the physical defense of all allies by 25% for 3 turns.',
                skill_type: 'active',
                class_type: 'warrior',
                mana_cost: 40,
                cooldown: 4,
                damage: 0,
                healing: 0,
                duration: 3,
                effect_type: 'def_boost',
                effect_value: 0.25,
                effect_description: 'Boosts physical defense of all allies'
            },
            
            // Healer skills
            {
                name: 'Divine Renewal',
                description: 'Channels healing energy to restore 40% of max HP to all team members.',
                skill_type: 'active',
                class_type: 'healer',
                mana_cost: 60,
                cooldown: 4,
                damage: 0,
                healing: 40,
                duration: 1,
                effect_type: 'heal',
                effect_value: 0.4,
                effect_description: 'Heals all allies'
            },
            {
                name: 'Purify',
                description: 'Removes all negative status effects from a target and heals for 25% of their max HP.',
                skill_type: 'active',
                class_type: 'healer',
                mana_cost: 35,
                cooldown: 3,
                damage: 0,
                healing: 25,
                duration: 1,
                effect_type: 'cleanse',
                effect_value: 0.25,
                effect_description: 'Removes debuffs and heals'
            },
            {
                name: 'Blessed Aura',
                description: 'Creates a healing aura that restores 10% HP to all allies each turn for 3 turns.',
                skill_type: 'active',
                class_type: 'healer',
                mana_cost: 50,
                cooldown: 5,
                damage: 0,
                healing: 10,
                duration: 3,
                effect_type: 'heal_over_time',
                effect_value: 0.1,
                effect_description: 'Healing over time to all allies'
            }
        ];

        // Insert skills into the database
        const skillIds = {};
        for (const skill of skills) {
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
            
            // Store the skill ID with its name and class for mapping
            const key = `${skill.name}_${skill.class_type}`;
            skillIds[key] = result.insertId;
            
            console.log(`Added skill: ${skill.name} for ${skill.class_type}`);
        }
        
        // Now map skills to pets
        const [pets] = await db.query('SELECT id, name, class_type FROM Pets');
        
        for (const pet of pets) {
            // Get skills for this pet's class
            const [classSkills] = await db.query(
                'SELECT id, name FROM PetSkills WHERE class_type = ?',
                [pet.class_type]
            );
            
            // Map each skill to the pet
            for (const skill of classSkills) {
                const unlockLevel = skill.name.includes('Blast') || 
                                   skill.name.includes('Strike') || 
                                   skill.name.includes('Slam') ||
                                   skill.name.includes('Renewal')
                                   ? 1 : (Math.floor(Math.random() * 3) + 2); // Basic attacks at level 1, others at 2-4
                
                await db.query(`
                    INSERT INTO PetSkillMapping (pet_id, skill_id, unlock_level)
                    VALUES (?, ?, ?)
                `, [pet.id, skill.id, unlockLevel]);
                
                console.log(`Mapped skill ${skill.name} to ${pet.name} at level ${unlockLevel}`);
            }
        }
        
        console.log('Pet skills mapping completed successfully!');
        
    } catch (error) {
        console.error('Error seeding pet skills:', error);
        throw error;
    }
}

// Export for use in other files
module.exports = {
    seedPets,
    seedPetSkills
};

// If this script is run directly, execute the seed function
if (require.main === module) {
    seedPets()
        .then(() => {
            console.log('Pet seeding completed successfully!');
            process.exit(0);
        })
        .catch(err => {
            console.error('Pet seeding failed:', err);
            process.exit(1);
        });
}
