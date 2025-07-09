const db = require('../config/database');
const { seedPets } = require('../scripts/seedPets');
const Pet = require('../models/Pet');

// Fungsi murni untuk inisialisasi tabel
async function createPetsTables() {
    // Buat tabel UserPets
    const createUserPetsTable = `
        CREATE TABLE IF NOT EXISTS UserPets (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            user_id INTEGER,
            Pets_id INTEGER,
            current_level INTEGER,
            current_hp INTEGER,
            current_mana INTEGER,
            equipped VARCHAR(100),
            nickname VARCHAR(100),
            experience INTEGER DEFAULT 0,
            happiness INTEGER DEFAULT 100,
            hunger INTEGER DEFAULT 0,
            health INTEGER DEFAULT 100,
            is_equipped BOOLEAN DEFAULT FALSE
        )
    `;
    await db.query(createUserPetsTable);

    // Buat tabel Pets
    const createPetsTable = `
        CREATE TABLE IF NOT EXISTS Pets (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100),
            role VARCHAR(100),
            level INTEGER,
            atk INTEGER,
            hp INTEGER,
            def_phy INTEGER,
            def_magic INTEGER,
            max_mana INTEGER,
            agility INTEGER,
            rarity VARCHAR(100),
            passive_skill TEXT,
            time_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await db.query(createPetsTable);
    
    // Seed pet data if table is empty
    const [rows] = await db.query('SELECT COUNT(*) as count FROM Pets');
    if (rows[0].count === 0) {
        await seedPets();
    }
}

// Endpoint Express opsional untuk trigger via API
exports.initPetsTables = async (req, res) => {
    try {
        await createPetsTables();
        res.status(200).json({ message: 'Pets tables initialized successfully' });
    } catch (error) {
        console.error('Error initializing pets tables:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Ekspor untuk digunakan di server.js
exports.createPetsTables = createPetsTables;

// Dapatkan data pet milik user dari relasi UserPets -> Pets
exports.PetsDataObtain = async (req, res) => {
    try {
        const userId = req.params.userId;

        const [rows] = await db.query(`
            SELECT Pets.*, UserPets.name, UserPets.equipped, UserPets.current_level, 
                  UserPets.current_hp, UserPets.current_mana, UserPets.current_atk, UserPets.current_def_phy, UserPets.current_def_magic, UserPets.current_agility,
                  UserPets.role, UserPets.time_date
            FROM UserPets
            JOIN Pets ON UserPets.Pets_id = Pets.id
            WHERE UserPets.user_id = ?
        `, [userId]);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error gathering data for user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all available pets
exports.getAllPets = async (req, res) => {
    try {
        const [pets] = await db.query('SELECT * FROM Pets');
        res.status(200).json({ success: true, data: pets });
    } catch (error) {
        console.error('Error fetching all pets:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get pets by role/class
exports.getPetsByRole = async (req, res) => {
    try {
        const role = req.params.role;
        const [pets] = await db.query('SELECT * FROM Pets WHERE role = ?', [role]);
        res.status(200).json({ success: true, data: pets });
    } catch (error) {
        console.error('Error fetching pets by role:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get pets by rarity
exports.getPetsByRarity = async (req, res) => {
    try {
        const rarity = req.params.rarity;
        const [pets] = await db.query('SELECT * FROM Pets WHERE rarity = ?', [rarity]);
        res.status(200).json({ success: true, data: pets });
    } catch (error) {
        console.error('Error fetching pets by rarity:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get pet skills by role/class
exports.getPetSkillsByRole = async (req, res) => {
    try {
        const role = req.params.role;
        const [skills] = await db.query('SELECT * FROM PetSkills WHERE pet_role = ?', [role]);
        res.status(200).json({ success: true, data: skills });
    } catch (error) {
        console.error('Error fetching skills by role:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Add a pet to user's collection
exports.addPetToUser = async (req, res) => {
    try {
        const { userId, petId, nickname } = req.body;
        
        // Get base stats of the pet
        const [petInfo] = await db.query('SELECT * FROM Pets WHERE id = ?', [petId]);
        
        if (petInfo.length === 0) {
            return res.status(404).json({ message: 'Pet not found' });
        }
        
        // Insert the pet into user's collection
        await db.query(`
            INSERT INTO UserPets (user_id, Pets_id, current_level, current_hp, current_mana, nickname, happiness, hunger, health)
            VALUES (?, ?, 1, ?, ?, ?, 100, 0, 100)
        `, [
            userId, 
            petId, 
            petInfo[0].hp, 
            petInfo[0].max_mana, 
            nickname || petInfo[0].name
        ]);
        
        res.status(201).json({ success: true, message: 'Pet added to user successfully' });
    } catch (error) {
        console.error('Error adding pet to user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update pet stats (for feeding, playing, etc.)
exports.updatePetStatus = async (req, res) => {
    try {
        const { userPetId } = req.params;
        const { happiness, hunger, health } = req.body;
        
        const updateFields = [];
        const params = [];
        
        if (happiness !== undefined) {
            updateFields.push('happiness = ?');
            params.push(Math.min(Math.max(happiness, 0), 100)); // Ensure between 0-100
        }
        
        if (hunger !== undefined) {
            updateFields.push('hunger = ?');
            params.push(Math.min(Math.max(hunger, 0), 100)); // Ensure between 0-100
        }
        
        if (health !== undefined) {
            updateFields.push('health = ?');
            params.push(Math.min(Math.max(health, 0), 100)); // Ensure between 0-100
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }
        
        params.push(userPetId);
        
        await db.query(
            `UPDATE UserPets SET ${updateFields.join(', ')} WHERE id = ?`,
            params
        );
        
        res.status(200).json({ success: true, message: 'Pet status updated successfully' });
    } catch (error) {
        console.error('Error updating pet status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Equip/unequip a pet
exports.toggleEquipPet = async (req, res) => {
    try {
        const { userPetId, userId, equipped } = req.body;
        
        console.log(`Toggle equip pet: userPetId=${userPetId}, userId=${userId}, equipped=${equipped}`);
        
        // If equipping a new pet, unequip any currently equipped pet
        if (equipped === 'yes') {
            await db.query(
                'UPDATE UserPets SET equipped = "no", is_equipped = FALSE WHERE user_id = ? AND (equipped = "yes" OR is_equipped = TRUE)',
                [userId]
            );
        }
        
        // Update the selected pet
        await db.query(
            'UPDATE UserPets SET equipped = ?, is_equipped = ? WHERE id = ? AND user_id = ?',
            [equipped, equipped === 'yes' ? true : false, userPetId, userId]
        );
        
        res.status(200).json({ success: true, message: 'Pet equipped status updated successfully' });
    } catch (error) {
        console.error('Error toggling pet equipped status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get stats of a pet at a specific level
exports.calculatePetStats = async (req, res) => {
    try {
        const { petId, level } = req.params;
        const levelNum = parseInt(level) || 1;
        
        // Get base stats
        const [pet] = await db.query('SELECT * FROM Pets WHERE id = ?', [petId]);
        
        if (pet.length === 0) {
            return res.status(404).json({ message: 'Pet not found' });
        }
        
        // Growth rate per level (10% increase per level)
        const growthRate = 1.1;
        
        // Calculate stats at the given level
        const stats = {
            hp: Math.round(pet[0].hp * Math.pow(growthRate, levelNum - 1)),
            atk: Math.round(pet[0].atk * Math.pow(growthRate, levelNum - 1)),
            def_phy: Math.round(pet[0].def_phy * Math.pow(growthRate, levelNum - 1)),
            def_magic: Math.round(pet[0].def_magic * Math.pow(growthRate, levelNum - 1)),
            max_mana: Math.round(pet[0].max_mana * Math.pow(growthRate, levelNum - 1)),
            agility: Math.round(pet[0].agility * Math.pow(growthRate, levelNum - 1))
        };
        
        res.status(200).json({
            success: true,
            data: {
                pet: pet[0].name,
                level: levelNum,
                stats: stats
            }
        });
    } catch (error) {
        console.error('Error calculating pet stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.equipPet = async (req, res) => {
  try {
    const { userId } = req.params;
    const { petId } = req.body;

    console.log(`Equipping pet ${petId} for user ${userId}`);
    
    // Use the Pet model method to toggle equip status
    const success = await Pet.toggleEquip(petId, userId, true);

    if (success) {
      res.status(200).json({ success: true, message: 'Pet equipped successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to equip pet' });
    }
  } catch (error) {
    console.error('Error equipping pet:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getEquippedPet = async (req, res) => {
    try {
        const { userId } = req.params;

        const equippedPet = await Pet.getEquippedPet(userId);

        if (!equippedPet) {
            return res.status(404).json({ success: false, message: 'No equipped pet found' });
        }

        res.status(200).json({ success: true, data: equippedPet });
    } catch (error) {
        console.error('Error fetching equipped pet:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Handle playing with pets and manage cooldowns
exports.playWithPet = async (req, res) => {
    try {
        const { userPetId } = req.params;
        
        // Get the current pet data
        const [petRows] = await db.query(
            'SELECT id, happiness, last_played_at FROM UserPets WHERE id = ?',
            [userPetId]
        );
        
        if (petRows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pet not found' 
            });
        }
        
        const pet = petRows[0];
        const now = new Date();
        
        // Check if there's a cooldown (60 seconds cooldown)
        if (pet.last_played_at) {
            const lastPlayedAt = new Date(pet.last_played_at);
            const cooldownTimeMs = 60 * 1000; // 60 seconds in milliseconds
            const timeSinceLastPlayed = now - lastPlayedAt;
            
            if (timeSinceLastPlayed < cooldownTimeMs) {
                const remainingCooldownSecs = Math.ceil((cooldownTimeMs - timeSinceLastPlayed) / 1000);
                
                return res.status(429).json({
                    success: false,
                    message: 'Play action on cooldown',
                    cooldown: {
                        remainingSeconds: remainingCooldownSecs,
                        totalCooldownSeconds: 60
                    }
                });
            }
        }
        
        // Generate a random happiness increase between 20-30%
        const happinessIncrease = Math.floor(Math.random() * 11) + 20; // 20-30
        
        // Calculate new happiness ensuring it doesn't exceed 100
        const newHappiness = Math.min(100, Math.max(0, pet.happiness + happinessIncrease));
        
        // Playing with pet reduces hunger by 5%
        // We'll get the current hunger first
        const [hungerResult] = await db.query(
            'SELECT hunger FROM UserPets WHERE id = ?',
            [userPetId]
        );
        
        // Calculate new hunger value (decrease by 5, but ensure it doesn't go below 0)
        const currentHunger = hungerResult[0].hunger;
        const newHunger = Math.max(0, currentHunger - 5);
        
        // Update pet's happiness, hunger and last_played_at timestamp
        await db.query(
            'UPDATE UserPets SET happiness = ?, hunger = ?, last_played_at = ? WHERE id = ?',
            [newHappiness, newHunger, now, userPetId]
        );
        
        res.status(200).json({
            success: true,
            message: 'Played with pet successfully',
            update: {
                happiness: newHappiness,
                happinessIncrease: happinessIncrease,
                hunger: newHunger,
                lastPlayedAt: now,
                cooldownSeconds: 60
            }
        });
    } catch (error) {
        console.error('Error playing with pet:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get pet's raw stats (not percentage values)
exports.getPetRawStats = async (req, res) => {
    try {
        const { userPetId } = req.params;
        
        // Get pet data including calculated and raw stats
        const [petRows] = await db.query(`
            SELECT 
                up.id,
                up.nickname,
                p.name,
                p.class_type,
                p.role,
                up.current_level,
                up.current_hp,
                up.current_atk,
                up.current_def_phy,
                up.current_def_magic,
                up.current_mana,
                up.current_agility,
                up.health,
                up.hunger,
                up.happiness,
                up.is_equipped,
                p.base_hp,
                p.base_atk,
                p.base_def_physical,
                p.base_def_magical,
                p.base_mana,
                p.base_agility,
                p.image_url
            FROM UserPets up
            JOIN Pets p ON up.Pets_id = p.id
            WHERE up.id = ?
        `, [userPetId]);
        
        if (petRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        const pet = petRows[0];
        
        // Calculate actual health, hunger and happiness values 
        // (if you want to show actual numbers instead of percentages)
        const maxHealth = 100; // Base max health for all pets
        const maxHunger = 100; // Base max hunger for all pets
        const maxHappiness = 100; // Base max happiness for all pets
        
        // Calculate actual current values
        const actualHealth = pet.health;
        const actualHunger = pet.hunger; // 0 means starving, 100 means full
        const actualHappiness = pet.happiness;
        
        res.status(200).json({
            success: true,
            pet: {
                id: pet.id,
                name: pet.name,
                nickname: pet.nickname,
                level: pet.current_level,
                classType: pet.class_type || pet.role,
                
                // Battle stats
                hp: pet.current_hp,
                atk: pet.current_atk,
                defPhysical: pet.current_def_phy,
                defMagical: pet.current_def_magic,
                mana: pet.current_mana,
                agility: pet.current_agility,
                
                // Status values
                healthValue: actualHealth,
                hungerValue: actualHunger,
                happinessValue: actualHappiness,
                
                // Status percentages 
                healthPercent: actualHealth,
                hungerPercent: actualHunger,
                happinessPercent: actualHappiness,
                
                // Max values
                maxHealth: maxHealth,
                maxHunger: maxHunger,
                maxHappiness: maxHappiness,
                
                isEquipped: Boolean(pet.is_equipped),
                imageUrl: pet.image_url
            }
        });
    } catch (error) {
        console.error('Error getting pet raw stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pet stats',
            error: error.message
        });
    }
};
