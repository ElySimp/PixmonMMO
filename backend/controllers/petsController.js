const db = require('../config/database');
const { seedPets } = require('../scripts/seedPets');

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
            health INTEGER DEFAULT 100
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
            SELECT Pets.*, UserPets.nickname, UserPets.equipped, UserPets.current_level, 
                  UserPets.current_hp, UserPets.current_mana, UserPets.happiness,
                  UserPets.hunger, UserPets.health, UserPets.experience
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
            INSERT INTO UserPets (user_id, Pets_id, current_level, current_hp, current_mana, nickname)
            VALUES (?, ?, 1, ?, ?, ?)
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
        
        // If equipping a new pet, unequip any currently equipped pet
        if (equipped === 'yes') {
            await db.query(
                'UPDATE UserPets SET equipped = "no" WHERE user_id = ? AND equipped = "yes"',
                [userId]
            );
        }
        
        // Update the selected pet
        await db.query(
            'UPDATE UserPets SET equipped = ? WHERE id = ? AND user_id = ?',
            [equipped, userPetId, userId]
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
