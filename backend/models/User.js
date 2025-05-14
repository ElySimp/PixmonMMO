const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {

    // Login table creation
    static async createTable() {
        // Drop table, kalo butuh
        const dropSql = `DROP TABLE IF EXISTS NAMATABELDISINI`;
        
        const sql = `
            CREATE TABLE IF NOT EXISTS UserLogin (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NULL
            )
        `;
        try {
            await db.query(dropSql);
            await db.query(sql);
            console.log('UserLogin table created or already exists');
        } catch (error) {
            console.error('Error creating UserLogin table:', error);
            throw error;
        }
    }

    static async register(username, email, password) {
        try {
            console.log('Attempting to register user:', { username, email });
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('Password hashed successfully');
            
            // Insert user with current date for updated_at
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const [result] = await db.query(
                'INSERT INTO UserLogin (username, email, password, updated_at) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, now]
            );
            
            console.log('User registered successfully:', result.insertId);
            return result.insertId;
        } catch (error) {
            console.error('Registration error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                if (error.message.includes('username')) {
                    throw new Error('Username already exists');
                } else if (error.message.includes('email')) {
                    throw new Error('Email already exists');
                }
            }
            throw error;
        }
    }

    static async login(username, password) {
        try {
            // Find user
            const [users] = await db.query(
                'SELECT * FROM UserLogin WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                throw new Error('User not found');
            }

            const user = users[0];

            // Check password
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                throw new Error('Invalid password');
            }

            // Update the updated_at timestamp
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            await db.query(
                'UPDATE UserLogin SET updated_at = ? WHERE id = ?',
                [now, user.id]
            );

            // Return user data (excluding password)
            const { password: _, ...userData } = user;
            return userData;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [users] = await db.query(
                'SELECT id, username, email, created_at, updated_at FROM UserLogin WHERE id = ?',
                [id]
            );
            return users[0] || null;
        } catch (error) {
            throw error;
        }
    }
    
    static async createStatsTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS UserStats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                xp INT DEFAULT 0,
                gold INT DEFAULT 0,
                level INT DEFAULT 1,
                updated_at DATETIME NULL,
                FOREIGN KEY (user_id) REFERENCES UserLogin(id) ON DELETE CASCADE
            )
        `;
        try {
            await db.query(sql);
            console.log('UserStats table created or already exists');
        } catch (error) {
            console.error('Error creating UserStats table:', error);
            throw error;
        }
    }

    // Call this after registering a user
    static async createUserStats(userId) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await db.query(
            'INSERT INTO UserStats (user_id, xp, gold, level, updated_at) VALUES (?, 0, 0, 1, ?)',
            [userId, now]
        );
    }

    // Update XP and Gold for a user
    static async updateStats(userId, xpDelta, goldDelta) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await db.query(
            'UPDATE UserStats SET xp = xp + ?, gold = gold + ?, updated_at = ? WHERE user_id = ?',
            [xpDelta, goldDelta, now, userId]
        );
    }

    // Get stats for a user
    static async getStats(userId) {
        const [rows] = await db.query(
            'SELECT xp, gold, level FROM UserStats WHERE user_id = ?',
            [userId]
        );
        return rows[0] || { xp: 0, gold: 0, level: 1 };
    }
}

module.exports = User;