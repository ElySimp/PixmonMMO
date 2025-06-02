const db = require('../config/database');

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
            nickname VARCHAR(100)
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
            time_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await db.query(createPetsTable);
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
            SELECT Pets.*, UserPets.nickname, UserPets.equipped, UserPets.current_level, UserPets.current_hp, UserPets.current_mana
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
