/**
 * test-pets-database.js - Utility script to test and view the pets database
 * 
 * This script provides various functions to view and validate the
 * optimized pets database structure.
 */

const db = require('../../config/database');
const Pet = require('../../models/Pet');

// Display usage information
function displayHelp() {
    console.log('\nPets Database Test Utility');
    console.log('========================');
    console.log('Usage: node test-pets-database.js [command] [args]\n');
    console.log('Commands:');
    console.log('  list                - List all pets');
    console.log('  class [classType]   - List all pets of a specific class (mage, warrior, assassin, healer)');
    console.log('  rarity [rarity]     - List all pets by rarity (common, uncommon, rare, epic, legendary)');
    console.log('  pet [id]            - Show detailed information about a specific pet');
    console.log('  skills [petId]      - List skills for a specific pet');
    console.log('  stats [petId] [lvl] - Calculate stats for a pet at a specific level');
    console.log('  allskills           - List all available skills');
    console.log('  seed                - Seed the database with pets data');
    console.log('  help                - Show this help information\n');
}

// List all pets
async function listAllPets() {
    try {
        const [rows] = await db.query(`
            SELECT p.id, p.name, p.class_type, p.rarity,
                   (SELECT COUNT(*) FROM PetSkillMapping WHERE pet_id = p.id) as skill_count
            FROM Pets p
            ORDER BY p.class_type, p.rarity
        `);
        
        console.log('\nAll Pets in Database:');
        console.log('====================');
        console.log('ID | Name | Class | Rarity | Skills');
        console.log('---------------------------------');
        
        rows.forEach(pet => {
            console.log(`${pet.id} | ${pet.name.padEnd(15)} | ${pet.class_type.padEnd(8)} | ${pet.rarity.padEnd(9)} | ${pet.skill_count}`);
        });
        
        console.log(`\nTotal: ${rows.length} pets\n`);
    } catch (error) {
        console.error('Error listing pets:', error);
    }
}

// List pets by class
async function listPetsByClass(classType) {
    try {
        const validClasses = ['mage', 'warrior', 'assassin', 'healer'];
        
        if (!validClasses.includes(classType)) {
            console.error(`Invalid class type: ${classType}`);
            console.log(`Valid class types: ${validClasses.join(', ')}`);
            return;
        }
        
        const [rows] = await db.query(`
            SELECT p.id, p.name, p.rarity, p.base_hp, p.base_atk, p.base_mana, p.growth_rate
            FROM Pets p
            WHERE p.class_type = ?
            ORDER BY p.rarity
        `, [classType]);
        
        console.log(`\nPets of Class: ${classType.toUpperCase()}`);
        console.log('============================');
        console.log('ID | Name | Rarity | HP | ATK | Mana | Growth Rate');
        console.log('--------------------------------------------------');
        
        rows.forEach(pet => {
            console.log(`${pet.id} | ${pet.name.padEnd(15)} | ${pet.rarity.padEnd(9)} | ${pet.base_hp.toString().padEnd(3)} | ${pet.base_atk.toString().padEnd(4)} | ${pet.base_mana.toString().padEnd(5)} | ${pet.growth_rate}`);
        });
        
        console.log(`\nTotal: ${rows.length} ${classType} pets\n`);
    } catch (error) {
        console.error(`Error listing ${classType} pets:`, error);
    }
}

// List pets by rarity
async function listPetsByRarity(rarity) {
    try {
        const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        
        if (!validRarities.includes(rarity)) {
            console.error(`Invalid rarity: ${rarity}`);
            console.log(`Valid rarities: ${validRarities.join(', ')}`);
            return;
        }
        
        const [rows] = await db.query(`
            SELECT p.id, p.name, p.class_type, p.base_hp, p.base_atk, p.base_mana
            FROM Pets p
            WHERE p.rarity = ?
            ORDER BY p.class_type
        `, [rarity]);
        
        console.log(`\nPets of Rarity: ${rarity.toUpperCase()}`);
        console.log('============================');
        console.log('ID | Name | Class | HP | ATK | Mana');
        console.log('-----------------------------------');
        
        rows.forEach(pet => {
            console.log(`${pet.id} | ${pet.name.padEnd(15)} | ${pet.class_type.padEnd(8)} | ${pet.base_hp.toString().padEnd(3)} | ${pet.base_atk.toString().padEnd(4)} | ${pet.base_mana}`);
        });
        
        console.log(`\nTotal: ${rows.length} ${rarity} pets\n`);
    } catch (error) {
        console.error(`Error listing ${rarity} pets:`, error);
    }
}

// Show detailed information about a pet
async function showPetDetails(petId) {
    try {
        const pet = await Pet.getById(petId);
        
        if (!pet) {
            console.error(`Pet with ID ${petId} not found.`);
            return;
        }
        
        console.log('\nPet Details:');
        console.log('============');
        console.log(`ID: ${pet.id}`);
        console.log(`Name: ${pet.name}`);
        console.log(`Class: ${pet.class_type}`);
        console.log(`Rarity: ${pet.rarity}`);
        console.log(`Description: ${pet.description}`);
        console.log('\nBase Stats:');
        console.log(`- HP: ${pet.base_hp}`);
        console.log(`- Attack: ${pet.base_atk}`);
        console.log(`- Physical Defense: ${pet.base_def_physical}`);
        console.log(`- Magical Defense: ${pet.base_def_magical}`);
        console.log(`- Mana: ${pet.base_mana}`);
        console.log(`- Agility: ${pet.base_agility}`);
        console.log(`- Growth Rate: ${pet.growth_rate}`);
        console.log('\nPassive Ability:');
        console.log(`- ${pet.passive_name}: ${pet.passive_description}`);
        
        console.log('\nSkills:');
        if (pet.skills && pet.skills.length > 0) {
            console.log('ID | Name | Type | Unlock Level | Mana Cost | Cooldown');
            console.log('---------------------------------------------------');
            
            // Get unlock levels for each skill
            const [skillMappings] = await db.query(`
                SELECT skill_id, unlock_level 
                FROM PetSkillMapping 
                WHERE pet_id = ?
            `, [petId]);
            
            const unlockMap = {};
            skillMappings.forEach(mapping => {
                unlockMap[mapping.skill_id] = mapping.unlock_level;
            });
            
            pet.skills.forEach(skill => {
                const unlockLevel = unlockMap[skill.id] || '?';
                console.log(`${skill.id.toString().padEnd(3)} | ${skill.name.padEnd(15)} | ${skill.skill_type.padEnd(8)} | ${unlockLevel.toString().padEnd(12)} | ${skill.mana_cost.toString().padEnd(9)} | ${skill.cooldown}`);
            });
        } else {
            console.log('No skills found for this pet.');
        }
        
        console.log('\n');
    } catch (error) {
        console.error(`Error showing pet details for ID ${petId}:`, error);
    }
}

// List skills for a pet
async function listPetSkills(petId) {
    try {
        const [skills] = await db.query(`
            SELECT s.*, m.unlock_level 
            FROM PetSkills s
            JOIN PetSkillMapping m ON s.id = m.skill_id
            WHERE m.pet_id = ?
            ORDER BY m.unlock_level ASC, s.name
        `, [petId]);
        
        if (skills.length === 0) {
            console.error(`No skills found for pet with ID ${petId}.`);
            return;
        }
        
        // Get pet name
        const [pet] = await db.query('SELECT name FROM Pets WHERE id = ?', [petId]);
        
        if (pet.length === 0) {
            console.error(`Pet with ID ${petId} not found.`);
            return;
        }
        
        console.log(`\nSkills for Pet: ${pet[0].name} (ID: ${petId})`);
        console.log('=================================');
        console.log('ID | Name | Type | Level | Mana | CD | Dmg | Heal | Effect');
        console.log('--------------------------------------------------------');
        
        skills.forEach(skill => {
            console.log(
                `${skill.id} | ${skill.name.padEnd(15)} | ${skill.skill_type.padEnd(6)} | ` +
                `${skill.unlock_level.toString().padEnd(5)} | ${skill.mana_cost.toString().padEnd(4)} | ` +
                `${skill.cooldown.toString().padEnd(2)} | ${skill.damage.toString().padEnd(3)} | ` +
                `${skill.healing.toString().padEnd(4)} | ${skill.effect_type || '-'}`
            );
        });
        
        console.log(`\nTotal: ${skills.length} skills\n`);
    } catch (error) {
        console.error(`Error listing skills for pet ${petId}:`, error);
    }
}

// Calculate stats for a pet at a specific level
async function calculatePetStats(petId, level) {
    try {
        const levelNum = parseInt(level) || 1;
        
        // Get base stats
        const [pets] = await db.query('SELECT * FROM Pets WHERE id = ?', [petId]);
        
        if (pets.length === 0) {
            console.error(`Pet with ID ${petId} not found.`);
            return;
        }
        
        const pet = pets[0];
        
        // Prepare base stats object
        const baseStats = {
            hp: pet.base_hp,
            atk: pet.base_atk,
            def_physical: pet.base_def_physical,
            def_magical: pet.base_def_magical,
            mana: pet.base_mana,
            agility: pet.base_agility
        };
        
        // Calculate stats at the given level
        const stats = Pet.calculateStats(baseStats, levelNum, pet.growth_rate);
        
        console.log(`\nStats for ${pet.name} (${pet.class_type}) at Level ${levelNum}:`);
        console.log('===========================================');
        console.log('Stat | Base Value | Calculated Value');
        console.log('-----------------------------------');
        console.log(`HP | ${pet.base_hp.toString().padEnd(10)} | ${stats.hp}`);
        console.log(`ATK | ${pet.base_atk.toString().padEnd(10)} | ${stats.atk}`);
        console.log(`P.DEF | ${pet.base_def_physical.toString().padEnd(10)} | ${stats.def_physical}`);
        console.log(`M.DEF | ${pet.base_def_magical.toString().padEnd(10)} | ${stats.def_magical}`);
        console.log(`Mana | ${pet.base_mana.toString().padEnd(10)} | ${stats.mana}`);
        console.log(`AGI | ${pet.base_agility.toString().padEnd(10)} | ${stats.agility}`);
        console.log(`\nGrowth rate: ${pet.growth_rate}\n`);
    } catch (error) {
        console.error('Error calculating pet stats:', error);
    }
}

// List all skills
async function listAllSkills() {
    try {
        const [rows] = await db.query(`
            SELECT s.id, s.name, s.class_type, s.skill_type, s.mana_cost, s.cooldown, s.effect_type,
                   COUNT(m.pet_id) as pet_count
            FROM PetSkills s
            LEFT JOIN PetSkillMapping m ON s.id = m.skill_id
            GROUP BY s.id
            ORDER BY s.class_type, s.skill_type, s.name
        `);
        
        console.log('\nAll Pet Skills:');
        console.log('==============');
        console.log('ID | Name | Class | Type | Mana | CD | Effect | # Pets');
        console.log('----------------------------------------------------');
        
        rows.forEach(skill => {
            console.log(
                `${skill.id.toString().padEnd(3)} | ${skill.name.padEnd(15)} | ${skill.class_type.padEnd(8)} | ` +
                `${skill.skill_type.padEnd(6)} | ${skill.mana_cost.toString().padEnd(4)} | ${skill.cooldown.toString().padEnd(2)} | ` +
                `${(skill.effect_type || '-').padEnd(10)} | ${skill.pet_count}`
            );
        });
        
        console.log(`\nTotal: ${rows.length} skills\n`);
    } catch (error) {
        console.error('Error listing all skills:', error);
    }
}

// Run a command based on arguments
async function runCommand() {
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        const command = args[0] || 'help';
        
        switch (command.toLowerCase()) {
            case 'list':
                await listAllPets();
                break;
            case 'class':
                await listPetsByClass(args[1] || 'mage');
                break;
            case 'rarity':
                await listPetsByRarity(args[1] || 'epic');
                break;
            case 'pet':
                await showPetDetails(args[1] || 1);
                break;
            case 'skills':
                await listPetSkills(args[1] || 1);
                break;
            case 'stats':
                await calculatePetStats(args[1] || 1, args[2] || 1);
                break;
            case 'allskills':
                await listAllSkills();
                break;
            case 'seed':
                const { seedAllPets } = require('./seedMasterPets');
                await seedAllPets();
                break;
            case 'help':
            default:
                displayHelp();
                break;
        }
    } catch (error) {
        console.error('Error running command:', error);
    } finally {
        // Close the database connection
        db.end();
    }
}

// Run the program
runCommand();
