/**
 * migrate-pets-schema.js - Migrate from old pets schema to new optimized schema
 */

const db = require('../../config/database');

async function migratePetsSchema() {
    try {
        console.log('Starting pets schema migration...');

        // 1. Create new optimized tables with temporary names to avoid conflicts
        console.log('1. Creating new tables with temporary names...');
        
        // New Pets table
        await db.query(`
            CREATE TABLE IF NOT EXISTS Pets_New (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                class_type VARCHAR(100) NOT NULL,
                rarity VARCHAR(100) NOT NULL,
                base_hp INTEGER NOT NULL,
                base_atk INTEGER NOT NULL,
                base_def_physical INTEGER NOT NULL,
                base_def_magical INTEGER NOT NULL,
                base_mana INTEGER NOT NULL,
                base_agility INTEGER NOT NULL,
                growth_rate FLOAT DEFAULT 1.1,
                passive_name VARCHAR(100),
                passive_description TEXT,
                image_url VARCHAR(255) DEFAULT '/assets/pets/default.png',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_class (class_type),
                INDEX idx_rarity (rarity)
            )
        `);

        // New UserPets table
        await db.query(`
            CREATE TABLE IF NOT EXISTS UserPets_New (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                user_id INTEGER NOT NULL,
                pet_id INTEGER NOT NULL,
                nickname VARCHAR(100),
                current_level INTEGER DEFAULT 1,
                experience INTEGER DEFAULT 0,
                current_hp INTEGER NOT NULL,
                current_mana INTEGER NOT NULL,
                happiness INTEGER DEFAULT 100,
                hunger INTEGER DEFAULT 0,
                health INTEGER DEFAULT 100,
                is_equipped BOOLEAN DEFAULT FALSE,
                acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                favorite BOOLEAN DEFAULT FALSE
            )
        `);

        console.log('✅ New temporary tables created');

        // 2. Migrate data from old tables to new tables
        console.log('2. Migrating data from old tables...');

        // Get existing pets data
        const [oldPets] = await db.query('SELECT * FROM Pets');
        
        // Migrate each pet
        for (const oldPet of oldPets) {
            await db.query(`
                INSERT INTO Pets_New (
                    id, name, class_type, rarity, base_hp, base_atk, 
                    base_def_physical, base_def_magical, base_mana, base_agility,
                    passive_description, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                oldPet.id,
                oldPet.name,
                oldPet.role, // role -> class_type
                oldPet.rarity || 'common',
                oldPet.hp || 50,
                oldPet.atk || 50,
                oldPet.def_phy || 50,
                oldPet.def_magic || 50,
                oldPet.max_mana || 50,
                oldPet.agility || 50,
                oldPet.passive_skill,
                oldPet.time_date || new Date()
            ]);

            console.log(`Migrated pet: ${oldPet.name}`);
        }

        // Check if UserPets table exists and has data
        try {
            const [oldUserPets] = await db.query('SELECT * FROM UserPets');
            
            // Migrate each user pet
            for (const oldUserPet of oldUserPets) {
                await db.query(`
                    INSERT INTO UserPets_New (
                        id, user_id, pet_id, nickname, current_level,
                        current_hp, current_mana, is_equipped
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    oldUserPet.id,
                    oldUserPet.user_id,
                    oldUserPet.Pets_id,
                    oldUserPet.nickname || oldUserPet.name,
                    oldUserPet.current_level || 1,
                    oldUserPet.current_hp || 100,
                    oldUserPet.current_mana || 100,
                    oldUserPet.equipped === 'yes' ? true : false
                ]);

                console.log(`Migrated user pet: ${oldUserPet.nickname || oldUserPet.name}`);
            }
        } catch (error) {
            console.log('No UserPets data to migrate or error occurred:', error.message);
        }

        console.log('✅ Data migration complete');
        
        // 3. Seed the new pet data for each class
        console.log('3. Adding new class-specific pets...');
        
        // Define the new pets data - one for each class
        const newPetsData = [
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

        // Skip existing class pets to avoid duplicates
        const [existingNewPets] = await db.query('SELECT name FROM Pets_New WHERE class_type IN ("mage", "assassin", "warrior", "healer")');
        const existingNames = existingNewPets.map(p => p.name.toLowerCase());

        for (const pet of newPetsData) {
            if (!existingNames.includes(pet.name.toLowerCase())) {
                await db.query(`
                    INSERT INTO Pets_New (
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
                
                console.log(`Added new class pet: ${pet.name} (${pet.class_type})`);
            } else {
                console.log(`Pet ${pet.name} already exists, skipping...`);
            }
        }

        console.log('✅ New pets added successfully');

        // 4. Rename tables to replace old ones (backup old ones first)
        console.log('4. Backing up old tables and applying new schema...');

        // Backup old tables
        await db.query('RENAME TABLE Pets TO Pets_Backup');
        try {
            await db.query('RENAME TABLE UserPets TO UserPets_Backup');
        } catch (error) {
            console.log('No UserPets table to backup or already backed up');
        }

        // Rename new tables to the official names
        await db.query('RENAME TABLE Pets_New TO Pets');
        await db.query('RENAME TABLE UserPets_New TO UserPets');

        console.log('✅ Schema update complete');

        // 5. Create PetSkills table and seed skills
        console.log('5. Creating and seeding PetSkills table...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS PetSkillMapping (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                pet_id INTEGER NOT NULL,
                skill_id INTEGER NOT NULL,
                unlock_level INTEGER DEFAULT 1,
                INDEX idx_pet (pet_id),
                INDEX idx_skill (skill_id)
            )
        `);

        // Define skills for each class if not already created
        const [skillCount] = await db.query('SELECT COUNT(*) as count FROM PetSkills');
        
        if (skillCount[0].count === 0) {
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
                    effect_description: 'Direct magic damage'
                },
                {
                    name: 'Mana Surge',
                    description: 'Channels magical energy to restore 20% mana to all team members.',
                    skill_type: 'active',
                    class_type: 'mage',
                    mana_cost: 50,
                    cooldown: 3,
                    effect_description: 'Restores 20% of max mana to all allies'
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
                    effect_description: 'Direct physical damage'
                },
                {
                    name: 'Shadow Veil',
                    description: 'Cloaks in shadows, becoming untargetable for 1 turn and increasing next attack damage by 30%.',
                    skill_type: 'active',
                    class_type: 'assassin',
                    mana_cost: 35,
                    cooldown: 4,
                    effect_description: 'Becomes untargetable and boosts next attack'
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
                    effect_description: 'Physical damage to all enemies'
                },
                {
                    name: 'Defensive Stance',
                    description: 'Adopts a defensive posture, reducing damage taken by 50% for 2 turns.',
                    skill_type: 'active',
                    class_type: 'warrior',
                    mana_cost: 25,
                    cooldown: 3,
                    effect_description: 'Reduces incoming damage'
                },
                
                // Healer skills
                {
                    name: 'Divine Renewal',
                    description: 'Channels healing energy to restore 40% of max HP to all team members.',
                    skill_type: 'active',
                    class_type: 'healer',
                    mana_cost: 60,
                    cooldown: 4,
                    healing: 40,
                    effect_description: 'Heals all allies'
                },
                {
                    name: 'Purify',
                    description: 'Removes all negative status effects from a target and heals for 25% of their max HP.',
                    skill_type: 'active',
                    class_type: 'healer',
                    mana_cost: 35,
                    cooldown: 3,
                    healing: 25,
                    effect_description: 'Removes debuffs and heals'
                }
            ];

            // Insert skills into the database
            for (const skill of skills) {
                await db.query(`
                    INSERT INTO PetSkills (
                        name, description, skill_type, class_type, mana_cost, cooldown,
                        damage, healing, effect_description
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    skill.name,
                    skill.description,
                    skill.skill_type,
                    skill.class_type,
                    skill.mana_cost,
                    skill.cooldown,
                    skill.damage || 0,
                    skill.healing || 0,
                    skill.effect_description
                ]);
                
                console.log(`Added skill: ${skill.name} for ${skill.class_type}`);
            }
        }

        // Map skills to pets
        console.log('Mapping skills to pets...');
        const [mappingCount] = await db.query('SELECT COUNT(*) as count FROM PetSkillMapping');
        
        if (mappingCount[0].count === 0) {
            // Map skills to their respective class pets
            const [pets] = await db.query('SELECT id, name, class_type FROM Pets');
            
            for (const pet of pets) {
                if (!pet.class_type) continue;
                
                // Get skills for this pet's class
                const [skills] = await db.query(
                    'SELECT id, name FROM PetSkills WHERE class_type = ?',
                    [pet.class_type]
                );
                
                // Map each skill to the pet
                for (const skill of skills) {
                    const unlockLevel = skill.name.includes('Blast') || 
                                       skill.name.includes('Strike') || 
                                       skill.name.includes('Slam') ||
                                       skill.name.includes('Renewal')
                                       ? 1 : Math.floor(Math.random() * 3) + 2; // Basic attacks at level 1, others at 2-4
                    
                    await db.query(`
                        INSERT INTO PetSkillMapping (pet_id, skill_id, unlock_level)
                        VALUES (?, ?, ?)
                    `, [pet.id, skill.id, unlockLevel]);
                    
                    console.log(`Mapped skill ${skill.name} to ${pet.name} at level ${unlockLevel}`);
                }
            }
        }

        console.log('✅ Migration complete!');
        console.log('\nSummary of changes:');
        console.log('1. Created new optimized Pets and UserPets tables');
        console.log('2. Migrated existing data to new schema');
        console.log('3. Added new class-specific pets with balanced stats');
        console.log('4. Created PetSkills table with class-specific skills');
        console.log('5. Mapped skills to pets with appropriate unlock levels');
        console.log('\nBackup tables (Pets_Backup, UserPets_Backup) are available if needed');
        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

// Run the migration
migratePetsSchema();
