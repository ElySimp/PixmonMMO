const db = require('../config/database');
const bcrypt = require('bcryptjs');
const UserProfile = require('./UserProfile');

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
    
    // Create UserStats table
    static async createStatsTable() {
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS UserStats (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    level INT DEFAULT 1,
                    xp INT DEFAULT 0,
                    gold INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT NULL,
                    FOREIGN KEY (user_id) REFERENCES UserLogin(id) ON DELETE CASCADE,
                    INDEX idx_userstats_user_id (user_id)
                ) ENGINE=InnoDB;
            `);
            
            console.log('UserStats table created or already exists');
        } catch (error) {
            console.error('Error creating UserStats table:', error);
            throw error;
        }
    }    static async createUserStats(userId) {
        try {
            // First check if user exists in UserLogin
            const [userExists] = await db.query(
                'SELECT id FROM UserLogin WHERE id = ?',
                [userId]
            );

            if (userExists.length === 0) {
                throw new Error('Cannot create stats for non-existent user');
            }

            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            // Create initial stats
            await db.query(
                'INSERT INTO UserStats (user_id, xp, gold, level, cooldownEnd, updated_at) VALUES (?, 0, 0, 1, NULL, ?)',
                [userId, now]
            );

            // Return default stats object
            return {
                level: 1,
                xp: 0,
                gold: 0,
                cooldownEnd: null
            };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                // If stats already exist, just return them
                return await this.getStats(userId);
            }
            console.error('Error creating user stats:', error);
            throw error;
        }
    }// Update XP and Gold for a user
    static async updateStats(userId, xpDelta, goldDelta) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await db.query(
            'UPDATE UserStats SET xp = xp + ?, gold = gold + ?, updated_at = ? WHERE user_id = ?',
            [xpDelta, goldDelta, now, userId]
        );
        
        // Check for level up after XP update
        await this.checkLevelUp(userId);
    }    // Update all stats including level for a user
    static async updateAllStats(userId, xpDelta, goldDelta, newLevel) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        try {
            // Ensure positive values for level
            const safeLevel = Math.max(1, Number(newLevel) || 1);
            
            // First, check if the user already has stats
            const [existingStats] = await db.query(
                'SELECT id, xp, gold FROM UserStats WHERE user_id = ?',
                [userId]
            );
            
            if (existingStats.length === 0) {
                // Create initial stats if they don't exist
                await this.createUserStats(userId);
            }
            
            // Calculate new values ensuring they don't go below 0
            const newXp = Math.max(0, (existingStats[0]?.xp || 0) + xpDelta);
            const newGold = Math.max(0, (existingStats[0]?.gold || 0) + goldDelta);
            
            // Update the stats with the new values
            await db.query(
                'UPDATE UserStats SET xp = ?, gold = ?, level = ?, updated_at = ? WHERE user_id = ?',
                [newXp, newGold, safeLevel, now, userId]
            );
            
            // Update profile level if it exists
            await db.query(
                'UPDATE UserProfile SET level = ? WHERE user_id = ?',
                [safeLevel, userId]
            );
            
            return {
                xp: newXp,
                gold: newGold,
                level: safeLevel
            };
        } catch (error) {
            console.error('Error updating all stats:', error);
            throw error;
        }
    }// Set absolute values for XP, Gold and Level (useful for XP reset on level up)
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
            
            // Check if the cooldownEnd column exists to avoid SQL errors
            const [cooldownColumn] = await db.query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'UserStats' 
                AND COLUMN_NAME = 'cooldownEnd'
            `);
            
            const cooldownColumnExists = cooldownColumn[0].count > 0;
            console.log(`LEVEL DEBUG [Model] - cooldownEnd column exists: ${cooldownColumnExists}`);
            
            // Format the cooldown date for MySQL or use NULL
            const cooldownSql = cooldownEnd ? cooldownEnd.slice(0, 19).replace('T', ' ') : null;
            
            // Ensure level is a valid number
            const safeLevel = Number(newLevel) || 1;
            console.log(`About to update stats with level=${safeLevel} (original value: ${newLevel})`);
            
            // Set absolute values for stats
            if (cooldownSql && cooldownColumnExists) {
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
    }    // Get stats for a user
    static async getStats(userId) {
        try {
            // First check if stats exist
            const [existingStats] = await db.query(
                'SELECT level, xp, gold, cooldownEnd FROM UserStats WHERE user_id = ?',
                [userId]
            );
            if (existingStats.length === 0) {
                // Buat default stats jika tidak ada
                await this.createUserStats(userId);
                return { level: 1, xp: 0, gold: 0, cooldownEnd: null };
            }
            return {
                level: existingStats[0].level || 1,
                xp: existingStats[0].xp || 0,
                gold: existingStats[0].gold || 0,
                cooldownEnd: existingStats[0].cooldownEnd
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            // Return default values on error for graceful fallback
            return {
                level: 1,
                xp: 0,
                gold: 0,
                cooldownEnd: null
            };
        }
    }

    // Create default stats for a user
    static async createDefaultStats(userId) {
        try {
            const [result] = await db.query(
                `INSERT INTO UserStats (user_id, level, xp, gold, updated_at)
                VALUES (?, 1, 0, 0, NOW())`,
                [userId]
            );
            
            return {
                level: 1,
                xp: 0,
                gold: 0
            };
        } catch (error) {
            console.error('Error creating default stats:', error);
            throw error;
        }
    }

    // Ensure stats exist for a user
    static async ensureStatsExist(userId) {
        try {
            const [exists] = await db.query(
                'SELECT 1 FROM UserStats WHERE user_id = ?',
                [userId]
            );

            if (exists.length === 0) {
                return await this.createDefaultStats(userId);
            }

            return true;
        } catch (error) {
            console.error('Error ensuring stats exist:', error);
            throw error;
        }
    }

    static async updateUsername(userId, newUsername) {
        try {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            await db.query(
                'UPDATE UserLogin SET username = ?, updated_at = ? WHERE id = ?',
                [newUsername, now, userId]
            );
            // Sync username to UserProfile
            await UserProfile.syncUsername(userId, newUsername);
            return true;
        } catch (error) {
            console.error('Error updating username:', error);
            throw error;
        }
    }

    static async updateLevel(userId, newLevel) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        try {
            // Update UserStats level
            await db.query(
                'UPDATE UserStats SET level = ?, updated_at = ? WHERE user_id = ?',
                [newLevel, now, userId]
            );
            // Update UserProfile level and add skill points
            const skillPointsToAdd = 3; // 3 points per level
            await db.query(
                'UPDATE UserProfile SET level = ?, skill_points = skill_points + ?, updated_at = ? WHERE user_id = ?',
                [newLevel, skillPointsToAdd, now, userId]
            );
        } catch (error) {
            console.error('Error updating level:', error);
            throw error;
        }
    }

    static calculateXpCap(level) {
        return Math.floor(50 * Math.pow(level, 1.4)); // Progressive scaling
    }

    static async checkLevelUp(userId) {
        try {
            // Get current stats
            const [stats] = await db.query(
                'SELECT xp, level FROM UserStats WHERE user_id = ?',
                [userId]
            );
            
            if (!stats.length) return false;

            const currentXp = stats[0].xp;
            const currentLevel = stats[0].level;
            const xpCap = this.calculateXpCap(currentLevel);

            if (currentXp >= xpCap) {
                // Level up
                const newLevel = currentLevel + 1;
                await this.updateLevel(userId, newLevel);
                // Reset XP to remainder
                const remainderXp = currentXp - xpCap;
                await db.query(
                    'UPDATE UserStats SET xp = ? WHERE user_id = ?',
                    [remainderXp, userId]
                );
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking level up:', error);
            throw error;
        }
    }
}

module.exports = User;