/**
 * fix-pet-foreign-keys.js - Script to fix foreign key references
 * 
 * This script corrects foreign key relationships after the migration
 * from the old Pets table to the new structure.
 */

const db = require('../../config/database');

async function fixForeignKeys() {
    try {
        console.log('Starting to fix pet table foreign keys...');
        
        // First, check the current foreign key constraints
        const [constraints] = await db.query(`
            SELECT 
                TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM 
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE 
                REFERENCED_TABLE_SCHEMA = DATABASE()
                AND (REFERENCED_TABLE_NAME = 'Pets_Legacy'
                     OR TABLE_NAME = 'PetSkillMapping'
                     OR TABLE_NAME = 'UserPets'
                     OR TABLE_NAME = 'PetEvolutions')
        `);
        
        console.log('Current foreign key constraints:');
        constraints.forEach(constraint => {
            console.log(`${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME} (${constraint.CONSTRAINT_NAME})`);
        });
        
        // Drop constraints referencing the Pets_Legacy table
        for (const constraint of constraints) {
            if (constraint.REFERENCED_TABLE_NAME === 'Pets_Legacy') {
                console.log(`Dropping constraint ${constraint.CONSTRAINT_NAME} from ${constraint.TABLE_NAME}...`);
                await db.query(`
                    ALTER TABLE ${constraint.TABLE_NAME}
                    DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
                `);
            }
        }
        
        // Add new constraints referencing the correct Pets table
        console.log('Adding new foreign key constraints...');
        
        // Fix PetSkillMapping foreign keys
        await db.query(`
            ALTER TABLE PetSkillMapping
            ADD CONSTRAINT FK_PetSkillMapping_Pet
            FOREIGN KEY (pet_id) REFERENCES Pets(id) ON DELETE CASCADE
        `);
        console.log('Fixed PetSkillMapping.pet_id -> Pets.id');
          // Check if UserPets table exists and has pet_id column before adding constraint
        try {
            // First check if the table exists
            const [userPetsTable] = await db.query(`
                SHOW TABLES LIKE 'UserPets'
            `);
            
            if (userPetsTable.length > 0) {
                // Then check if pet_id column exists
                const [columns] = await db.query(`
                    SHOW COLUMNS FROM UserPets LIKE 'pet_id'
                `);
                
                if (columns.length > 0) {
                    // Add constraint only if the column exists
                    await db.query(`
                        ALTER TABLE UserPets
                        ADD CONSTRAINT FK_UserPets_Pet
                        FOREIGN KEY (pet_id) REFERENCES Pets(id)
                    `);
                    console.log('Fixed UserPets.pet_id -> Pets.id');
                } else {
                    console.log('UserPets table exists but has no pet_id column. Skipping constraint.');
                }
            } else {
                console.log('UserPets table not found. Skipping constraint.');
            }
        } catch (error) {
            if (error.code === 'ER_CANT_CREATE_TABLE') {
                console.log('UserPets table already has correct constraints');
            } else {
                console.error('Error with UserPets constraint:', error);
                console.log('Continuing with other fixes...');
            }
        }
        
        // Fix PetEvolutions foreign keys if they exist
        try {
            await db.query(`
                ALTER TABLE PetEvolutions
                ADD CONSTRAINT FK_PetEvolutions_BasePet
                FOREIGN KEY (base_pet_id) REFERENCES Pets(id)
            `);
            console.log('Fixed PetEvolutions.base_pet_id -> Pets.id');
            
            await db.query(`
                ALTER TABLE PetEvolutions
                ADD CONSTRAINT FK_PetEvolutions_EvolvedPet
                FOREIGN KEY (evolved_pet_id) REFERENCES Pets(id)
            `);
            console.log('Fixed PetEvolutions.evolved_pet_id -> Pets.id');
        } catch (error) {
            if (error.code === 'ER_CANT_CREATE_TABLE') {
                console.log('PetEvolutions table not found or already has correct constraints');
            } else {
                throw error;
            }
        }
        
        console.log('Foreign key fixes completed successfully');
    } catch (error) {
        console.error('Error fixing pet foreign keys:', error);
        throw error;
    }
}

// If this script is run directly, execute the fix function
if (require.main === module) {
    fixForeignKeys()
        .then(() => {
            console.log('Pet foreign key fix process completed successfully!');
            process.exit(0);
        })
        .catch(err => {
            console.error('Pet foreign key fix failed:', err);
            process.exit(1);
        });
}
