/**
 * fix-pets-tables.js - Script to fix and update Pets tables structure
 * 
 * This script:
 * 1. Renames current Pets table to Pets_Legacy
 * 2. Creates new optimized tables
 * 3. Migrates data from old table to new structure
 */

const db = require('../../config/database');
const Pet = require('../../models/Pet');

async function fixPetsTables() {
    try {
        console.log('Starting Pets table structure fix...');
        
        // Check if Pets_Legacy table already exists
        const [legacyTablesCheck] = await db.query("SHOW TABLES LIKE 'Pets_Legacy'");
        
        // Check if Pets table exists
        const [petsTable] = await db.query("SHOW TABLES LIKE 'Pets'");
        
        // If old Pets table exists but Legacy doesn't, rename it
        if (petsTable.length > 0 && legacyTablesCheck.length === 0) {
            console.log('Existing Pets table found, renaming to Pets_Legacy...');
            
            // Rename old Pets table to Pets_Legacy
            await db.query('RENAME TABLE Pets TO Pets_Legacy');
            
            console.log('Old Pets table renamed to Pets_Legacy successfully');
        } 
        // If both Pets and Pets_Legacy exist, drop the Pets table as it's likely a failed migration
        else if (petsTable.length > 0 && legacyTablesCheck.length > 0) {
            console.log('Both Pets and Pets_Legacy tables found. Dropping the Pets table...');
            await db.query('DROP TABLE Pets');
            console.log('Pets table dropped successfully');
        }
        
        // Create new optimized tables (if they don't exist or were just dropped)
        console.log('Creating new optimized pet tables...');
        await Pet.createTables();
        console.log('New pet tables created successfully');
          // Check if old table exists to migrate data
        const [legacyTables] = await db.query("SHOW TABLES LIKE 'Pets_Legacy'");
        
        if (legacyTables.length > 0) {
            console.log('Migrating data from Pets_Legacy to new structure...');
            
            // Get data from legacy table
            const [legacyPets] = await db.query('SELECT * FROM Pets_Legacy');
            
            // Map roles to new class_type
            const roleToClassMap = {
                'Mage': 'mage',
                'Warrior': 'warrior',
                'Assassin': 'assassin',
                'Healer': 'healer',
                // Add any other mappings if needed
            };
            
            // Insert each legacy pet into the new structure
            let migratedCount = 0;
            for (const legacyPet of legacyPets) {
                // Determine class_type from role, default to 'warrior' if not found
                const classType = roleToClassMap[legacyPet.role] || 'warrior';
                  // Map rarity to one of the accepted values
                let normalizedRarity = 'common';
                if (legacyPet.rarity) {
                    const rarityStr = legacyPet.rarity.toLowerCase().replace(/[\[\]']/g, '');
                    if (rarityStr.includes('legendary')) normalizedRarity = 'legendary';
                    else if (rarityStr.includes('epic')) normalizedRarity = 'epic';
                    else if (rarityStr.includes('rare')) normalizedRarity = 'rare';
                    else if (rarityStr.includes('uncommon')) normalizedRarity = 'uncommon';
                    else normalizedRarity = 'common';
                }

                // Clean name
                const cleanName = legacyPet.name.replace(/[\[\]']/g, '');

                // Insert into new Pets table with appropriate field mappings
                const [result] = await db.query(`
                    INSERT INTO Pets (
                        name, 
                        class_type, 
                        rarity, 
                        base_hp, 
                        base_atk, 
                        base_def_physical, 
                        base_def_magical, 
                        base_mana, 
                        base_agility,
                        growth_rate, 
                        passive_name, 
                        passive_description, 
                        image_url
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    cleanName,
                    classType,
                    normalizedRarity,
                    legacyPet.hp || 50,
                    legacyPet.atk || 50,
                    legacyPet.def_phy || 50,
                    legacyPet.def_magic || 50,
                    legacyPet.max_mana || 50,
                    legacyPet.agility || 50,
                    1.1, // Default growth rate
                    'Legacy Ability', // Default passive name
                    'This pet was migrated from the legacy system', // Default description
                    '/assets/pets/default.png' // Default image
                ]);
                
                migratedCount++;
                console.log(`Migrated legacy pet: ${legacyPet.name}`);
            }
            
            console.log(`Migration complete: ${migratedCount} pets migrated to new structure`);
        }
        
        console.log('Pets tables fix completed successfully');
        
    } catch (error) {
        console.error('Error fixing pets tables:', error);
        throw error;
    }
}

// If this script is run directly, execute the fix function
if (require.main === module) {
    fixPetsTables()
        .then(() => {
            console.log('Pets tables fix process completed successfully!');
            process.exit(0);
        })
        .catch(err => {
            console.error('Pets tables fix failed:', err);
            process.exit(1);
        });
}

module.exports = { fixPetsTables };
