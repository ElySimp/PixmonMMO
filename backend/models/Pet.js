/**
 * Pet.js - Optimized Pet Model for PixmonMMO
 * 
 * This model represents the core Pet functionality for the game,
 * with optimized database structure for multi-player scaling.
 */

const db = require('../config/database');

class Pet {
    /**
     * Initialize all pet-related tables with proper relationships
     * Uses a more normalized approach for better scalability
     */
    static async createTables() {
        try {
            console.log('Creating optimized pet tables...');

            // 1. Base Pets table - contains immutable pet templates
            const createPetsTable = `
                CREATE TABLE IF NOT EXISTS Pets (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    class_type ENUM('mage', 'warrior', 'assassin', 'healer') NOT NULL,
                    rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') NOT NULL,
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
            `;
            await db.query(createPetsTable);

            // 2. Pet Skills table - contains all possible skills
            const createPetSkillsTable = `
                CREATE TABLE IF NOT EXISTS PetSkills (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    description TEXT NOT NULL,
                    skill_type ENUM('active', 'passive') NOT NULL,
                    class_type ENUM('mage', 'warrior', 'assassin', 'healer') NOT NULL,
                    mana_cost INTEGER NOT NULL DEFAULT 0,
                    cooldown INTEGER NOT NULL DEFAULT 0,
                    damage INTEGER DEFAULT 0,
                    healing INTEGER DEFAULT 0,
                    duration INTEGER DEFAULT 1,
                    effect_type VARCHAR(50),
                    effect_value FLOAT,
                    effect_description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_class_skill_type (class_type, skill_type)
                )
            `;
            await db.query(createPetSkillsTable);

            // 3. Pet-Skill mapping table (many-to-many)
            const createPetSkillMappingTable = `
                CREATE TABLE IF NOT EXISTS PetSkillMapping (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    pet_id INTEGER NOT NULL,
                    skill_id INTEGER NOT NULL,
                    unlock_level INTEGER DEFAULT 1,
                    FOREIGN KEY (pet_id) REFERENCES Pets(id) ON DELETE CASCADE,
                    FOREIGN KEY (skill_id) REFERENCES PetSkills(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_pet_skill (pet_id, skill_id)
                )
            `;
            await db.query(createPetSkillMappingTable);

            // 4. User Pets table - contains user-specific pet instances
            const createUserPetsTable = `
                CREATE TABLE IF NOT EXISTS UserPets (
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
                    favorite BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (pet_id) REFERENCES Pets(id),
                    INDEX idx_user (user_id),
                    INDEX idx_equipped (is_equipped)
                )
            `;
            await db.query(createUserPetsTable);

            // 5. Pet Evolution Paths
            const createPetEvolutionsTable = `
                CREATE TABLE IF NOT EXISTS PetEvolutions (
                    id INTEGER PRIMARY KEY AUTO_INCREMENT,
                    base_pet_id INTEGER NOT NULL,
                    evolved_pet_id INTEGER NOT NULL,
                    required_level INTEGER DEFAULT 10,
                    required_items TEXT,
                    evolution_description TEXT,
                    FOREIGN KEY (base_pet_id) REFERENCES Pets(id),
                    FOREIGN KEY (evolved_pet_id) REFERENCES Pets(id)
                )
            `;
            await db.query(createPetEvolutionsTable);

            console.log('Pet tables created successfully');
            return true;
        } catch (error) {
            console.error('Error creating pet tables:', error);
            throw error;
        }
    }

    /**
     * Calculate pet stats based on base stats and level
     * @param {Object} baseStats Base stats of the pet
     * @param {Number} level Current level of the pet
     * @param {Number} growthRate Growth rate per level
     * @returns {Object} Calculated stats
     */
    static calculateStats(baseStats, level, growthRate = 1.1) {
        const stats = {};
        for (const [key, value] of Object.entries(baseStats)) {
            stats[key] = Math.round(value * Math.pow(growthRate, level - 1));
        }
        return stats;
    }

    /**
     * Get a pet by its ID
     * @param {Number} id The pet ID
     * @returns {Object} Pet data
     */
    static async getById(id) {
        try {
            const [pets] = await db.query('SELECT * FROM Pets WHERE id = ?', [id]);
            
            if (pets.length === 0) {
                return null;
            }
            
            // Get skills for this pet
            const [skills] = await db.query(`
                SELECT s.* 
                FROM PetSkills s
                JOIN PetSkillMapping m ON s.id = m.skill_id
                WHERE m.pet_id = ?
                ORDER BY m.unlock_level ASC
            `, [id]);
            
            const pet = pets[0];
            pet.skills = skills;
            
            return pet;
        } catch (error) {
            console.error(`Error fetching pet ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get all pets of a specific class
     * @param {String} classType The pet class type
     * @returns {Array} List of pets
     */
    static async getByClass(classType) {
        try {
            const [pets] = await db.query(
                'SELECT * FROM Pets WHERE class_type = ?', 
                [classType]
            );
            return pets;
        } catch (error) {
            console.error(`Error fetching pets of class ${classType}:`, error);
            throw error;
        }
    }

    /**
     * Get all pets owned by a user
     * @param {Number} userId The user ID
     * @returns {Array} List of user pets with calculated stats
     */
    static async getUserPets(userId) {
        try {
            const [userPets] = await db.query(`
                SELECT up.*, p.name, p.class_type, p.rarity, p.base_hp, 
                       p.base_atk, p.base_def_physical, p.base_def_magical,
                       p.base_mana, p.base_agility, p.growth_rate,
                       p.passive_name, p.passive_description, p.image_url
                FROM UserPets up
                JOIN Pets p ON up.pet_id = p.id
                WHERE up.user_id = ?
                ORDER BY up.is_equipped DESC, up.current_level DESC
            `, [userId]);

            // Calculate current stats based on level for each pet
            return userPets.map(pet => {
                const baseStats = {
                    hp: pet.base_hp,
                    atk: pet.base_atk,
                    def_physical: pet.base_def_physical,
                    def_magical: pet.base_def_magical,
                    mana: pet.base_mana,
                    agility: pet.base_agility
                };

                const currentStats = this.calculateStats(
                    baseStats, 
                    pet.current_level, 
                    pet.growth_rate
                );

                return {
                    ...pet,
                    currentStats
                };
            });
        } catch (error) {
            console.error(`Error fetching pets for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Add a pet to a user's collection
     * @param {Number} userId The user ID
     * @param {Number} petId The pet ID
     * @param {String} nickname Optional nickname for the pet
     * @returns {Number} The ID of the newly created user pet
     */
    static async adoptPet(userId, petId, nickname = null) {
        try {
            // Get the pet base stats
            const [pets] = await db.query('SELECT * FROM Pets WHERE id = ?', [petId]);
            
            if (pets.length === 0) {
                throw new Error('Pet not found');
            }
            
            const pet = pets[0];
            
            // Insert the pet into user's collection
            const [result] = await db.query(`
                INSERT INTO UserPets (
                    user_id, pet_id, nickname, current_hp, current_mana
                )
                VALUES (?, ?, ?, ?, ?)
            `, [
                userId,
                petId,
                nickname || pet.name,
                pet.base_hp,
                pet.base_mana
            ]);
            
            return result.insertId;
        } catch (error) {
            console.error('Error adopting pet:', error);
            throw error;
        }
    }

    /**
     * Update a user pet's status (happiness, hunger, health)
     * @param {Number} userPetId The user pet ID
     * @param {Object} status The status fields to update
     * @returns {Boolean} Success indicator
     */
    static async updateStatus(userPetId, status) {
        try {
            const updateFields = [];
            const params = [];
            
            if (status.happiness !== undefined) {
                updateFields.push('happiness = ?');
                // Ensure value is between 0-100
                params.push(Math.min(Math.max(status.happiness, 0), 100));
            }
            
            if (status.hunger !== undefined) {
                updateFields.push('hunger = ?');
                params.push(Math.min(Math.max(status.hunger, 0), 100));
            }
            
            if (status.health !== undefined) {
                updateFields.push('health = ?');
                params.push(Math.min(Math.max(status.health, 0), 100));
            }

            if (status.current_hp !== undefined) {
                updateFields.push('current_hp = ?');
                params.push(status.current_hp);
            }
            
            if (status.current_mana !== undefined) {
                updateFields.push('current_mana = ?');
                params.push(status.current_mana);
            }
            
            if (updateFields.length === 0) {
                return false;
            }
            
            updateFields.push('last_interaction = CURRENT_TIMESTAMP');
            params.push(userPetId);
            
            await db.query(
                `UPDATE UserPets SET ${updateFields.join(', ')} WHERE id = ?`,
                params
            );
            
            return true;
        } catch (error) {
            console.error('Error updating pet status:', error);
            throw error;
        }
    }

    /**
     * Toggle equipped status for a pet
     * @param {Number} userPetId The user pet ID
     * @param {Number} userId The user ID
     * @param {Boolean} equipped Whether to equip or unequip
     * @returns {Boolean} Success indicator
     */
    static async toggleEquip(userPetId, userId, equipped) {
        try {
            if (equipped) {
                await db.query(
                    'UPDATE UserPets SET is_equipped = FALSE WHERE user_id = ?',
                    [userId]
                );
            }

            await db.query(
                'UPDATE UserPets SET is_equipped = ? WHERE id = ? AND user_id = ?',
                [equipped, userPetId, userId]
            );

            return true;
        } catch (error) {
            console.error('Error toggling pet equipped status:', error);
            throw error;
        }
    }

    /**
     * Add experience to a user pet and potentially level it up
     * @param {Number} userPetId The user pet ID
     * @param {Number} expAmount The amount of experience to add
     * @returns {Object} Updated pet data including level changes
     */
    static async addExperience(userPetId, expAmount) {
        try {
            // Get current pet data
            const [userPets] = await db.query(`
                SELECT up.*, p.base_hp, p.base_mana 
                FROM UserPets up
                JOIN Pets p ON up.pet_id = p.id
                WHERE up.id = ?
            `, [userPetId]);
            
            if (userPets.length === 0) {
                throw new Error('User pet not found');
            }
            
            const userPet = userPets[0];
            
            // Calculate experience requirement formula
            const getExpForLevel = (level) => 100 * Math.pow(level, 1.5);
            
            // Add experience and check for level up
            const newExp = userPet.experience + expAmount;
            let newLevel = userPet.current_level;
            let leveledUp = false;
            
            // Check if we've gained levels
            while (newExp >= getExpForLevel(newLevel)) {
                newLevel++;
                leveledUp = true;
            }
            
            // Update pet data
            await db.query(`
                UPDATE UserPets
                SET experience = ?, current_level = ?
                WHERE id = ?
            `, [newExp, newLevel, userPetId]);
            
            // If leveled up, restore HP and mana
            if (leveledUp) {
                // Calculate new HP and mana based on base values and growth rate
                const growthRate = 1.1; // Default growth rate
                const newHp = Math.round(userPet.base_hp * Math.pow(growthRate, newLevel - 1));
                const newMana = Math.round(userPet.base_mana * Math.pow(growthRate, newLevel - 1));
                
                await db.query(`
                    UPDATE UserPets
                    SET current_hp = ?, current_mana = ?
                    WHERE id = ?
                `, [newHp, newMana, userPetId]);
            }
            
            return {
                newExperience: newExp,
                oldLevel: userPet.current_level,
                newLevel: newLevel,
                leveledUp: leveledUp
            };
        } catch (error) {
            console.error('Error adding experience to pet:', error);
            throw error;
        }
    }

    /**
     * Get the currently equipped pet for a user
     * @param {Number} userId The user ID
     * @returns {Object} Equipped pet data
     */
    static async getEquippedPet(userId) {
        try {
            const [rows] = await db.query(`
                SELECT up.*, p.name, p.class_type as role, p.rarity, p.image_url,
                       p.base_hp as HP, p.base_atk as ATK, p.base_def_physical as DEF_PHY,
                       p.base_def_magical as DEF_MAGE, p.base_mana as MAX_MANA, p.base_agility as AGILITY
                FROM UserPets up
                JOIN Pets p ON up.Pets_id = p.id
                WHERE up.user_id = ? AND up.is_equipped = TRUE
                LIMIT 1
            `, [userId]);

            if (rows.length === 0) {
                return null;
            }

            const pet = rows[0];
            
            // Format the pet data for the frontend
            return {
                id: pet.id,
                name: pet.name,
                role: pet.role,
                rarity: pet.rarity,
                level: pet.current_level || 1,
                image_url: pet.image_url,
                happiness: pet.happiness || 50,
                hunger: pet.hunger || 50,
                energy: 100 - (pet.hunger || 0), // Calculate energy based on hunger
                health: pet.health || 100,
                stats: {
                    HP: pet.HP || 0,
                    ATK: pet.ATK || 0,
                    DEF_PHY: pet.DEF_PHY || 0,
                    DEF_MAGE: pet.DEF_MAGE || 0,
                    MAX_MANA: pet.MAX_MANA || 0,
                    AGILITY: pet.AGILITY || 0
                }
            };
        } catch (error) {
            console.error('Error fetching equipped pet:', error);
            throw error;
        }
    }
}

module.exports = Pet;
