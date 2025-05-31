const db = require('../config/database');

// Fungsi murni untuk inisialisasi tabel
async function createPetsTables() {
    const createUserPetsTable = `
        CREATE TABLE IF NOT EXISTS UserPets (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            user_id INTEGER,
            Pets_id INTEGER,
            current_level INTEGER,
            current_hp INTEGER,
            current_mana INTEGER,
            equipped VARCHAR(100),
            nickname VARCHAR(100)
        )
    `;
    await db.query(createUserPetsTable);

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
            time_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await db.query(createPetsTable);
}

// Fungsi Express (dipakai kalau perlu endpoint API)
exports.initPetsTables = async (req, res) => {
    try {
        await createPetsTables();
        res.status(200).json({ message: 'Pets tables initialized successfully' });
    } catch (error) {
        console.error('Error initializing pets tables:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Fungsi untuk keperluan server.js
exports.createPetsTables = createPetsTables;

// Dapatkan data pet user
exports.PetsDataObtain = async (req, res) => {
    try {
        const userId = req.params.userId;
        const [rows] = await db.query('SELECT * FROM namatabellu WHERE user_id = ?', [userId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error gathering data for user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
