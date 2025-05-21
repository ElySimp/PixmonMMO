const db = require('../config/database');
const UserProfile = require('../models/UserProfile');

async function initDatabase() {
    try {
        // Test connection
        await db.query('SELECT 1');
        console.log('Database connection successful');

        // Create tables
        await UserProfile.createTable();
        console.log('UserProfile table initialized');

        await UserProfile.createWallpapersTable();
        console.log('Wallpapers table initialized');

        // Insert test user if not exists
        const [users] = await db.query(
            'SELECT * FROM UserLogin WHERE username = ?',
            ['testuser']
        );

        if (users.length === 0) {
            await db.query(`
                INSERT INTO UserLogin (username, email, password)
                VALUES (?, ?, ?)
            `, ['testuser', 'test@example.com', 'hashedpassword']);
            console.log('Test user created');
        }

        // Create profile for test user
        const [testUser] = await db.query(
            'SELECT id FROM UserLogin WHERE username = ?',
            ['testuser']
        );

        if (testUser) {
            await UserProfile.ensureProfileExists(testUser.id);
            console.log('Test user profile initialized');
        }

        console.log('Database initialization complete');
        process.exit(0);
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

initDatabase();
