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
                cooldownEnd DATETIME NULL,
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
            'INSERT INTO UserStats (user_id, xp, gold, level, cooldownEnd, updated_at) VALUES (?, 0, 0, 1, NULL, ?)',
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

    // Update all stats including level for a user
    static async updateAllStats(userId, xpDelta, goldDelta, newLevel) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        try {
            // First, check if the user already has stats
            const [existingStats] = await db.query(
                'SELECT id FROM UserStats WHERE user_id = ?',
                [userId]
            );
            
            if (existingStats.length === 0) {
                // Create initial stats if they don't exist
                await this.createUserStats(userId);
            }
            
            // Update the stats with the new values
            await db.query(
                'UPDATE UserStats SET xp = xp + ?, gold = gold + ?, level = ?, updated_at = ? WHERE user_id = ?',
                [xpDelta, goldDelta, newLevel, now, userId]
            );
            
            console.log(`Updated stats for user ${userId}: XP +${xpDelta}, Gold +${goldDelta}, Level set to ${newLevel}`);
        } catch (error) {
            console.error('Error updating all stats:', error);
            throw error;
        }
    }

    // Set absolute values for XP, Gold and Level (useful for XP reset on level up)
    static async updateAllStatsAbsolute(userId, newXp, newGold, newLevel, cooldownEnd = null) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        try {
            // First, check if the user already has stats
            const [existingStats] = await db.query(
                'SELECT id FROM UserStats WHERE user_id = ?',
                [userId]
            );
            
            if (existingStats.length === 0) {
                // Create initial stats if they don't exist
                await this.createUserStats(userId);
            }
            
            // Format the cooldown date for MySQL or use NULL
            const cooldownSql = cooldownEnd ? cooldownEnd.slice(0, 19).replace('T', ' ') : null;
            
            // Ensure level is a valid number
            const safeLevel = Number(newLevel) || 1;
            console.log(`About to update stats with level=${safeLevel} (original value: ${newLevel})`);
            
            // Set absolute values for stats
            if (cooldownSql) {
                await db.query(
                    'UPDATE UserStats SET xp = ?, gold = ?, level = ?, cooldownEnd = ?, updated_at = ? WHERE user_id = ?',
                    [newXp, newGold, safeLevel, cooldownSql, now, userId]
                );
            } else {
                await db.query(
                    'UPDATE UserStats SET xp = ?, gold = ?, level = ?, updated_at = ? WHERE user_id = ?',
                    [newXp, newGold, safeLevel, now, userId]
                );
            }
            
            console.log(`Set absolute stats for user ${userId}: XP=${newXp}, Gold=${newGold}, Level=${safeLevel}, CooldownEnd=${cooldownEnd}`);
        } catch (error) {
            console.error('Error setting absolute stats:', error);
            throw error;
        }
    }

    // Get stats for a user
    static async getStats(userId) {
        try {
            // First, check if this user even has stats
            const [existCheck] = await db.query(
                'SELECT COUNT(*) as count FROM UserStats WHERE user_id = ?',
                [userId]
            );
            
            // If no stats found, create initial stats
            if (existCheck[0].count === 0) {
                console.log(`LEVEL DEBUG [Model] - No stats found for user ${userId}, creating initial stats`);
                await this.createUserStats(userId);
            }
            
            // Now get the stats
            const [rows] = await db.query(
                'SELECT xp, gold, level, cooldownEnd FROM UserStats WHERE user_id = ?',
                [userId]
            );
            
            if (rows.length > 0) {
                console.log(`LEVEL DEBUG [Model] - Retrieved stats: ${JSON.stringify(rows[0])}`);
                // Ensure level is at least 1
                if (!rows[0].level || rows[0].level < 1) {
                    console.log(`LEVEL DEBUG [Model] - Found invalid level (${rows[0].level}), fixing to 1`);
                    rows[0].level = 1;
                    
                    // Update the database to fix the level
                    await db.query(
                        'UPDATE UserStats SET level = 1 WHERE user_id = ? AND (level IS NULL OR level < 1)',
                        [userId]
                    );
                }
                return rows[0];
            } else {
                console.log(`LEVEL DEBUG [Model] - No stats found for user ${userId} even after attempted creation`);
                return { xp: 0, gold: 0, level: 1, cooldownEnd: null };
            }
        } catch (error) {
            console.error(`LEVEL DEBUG [Model] - Error getting stats:`, error);
            return { xp: 0, gold: 0, level: 1, cooldownEnd: null };
        }
    }
}

module.exports = User;