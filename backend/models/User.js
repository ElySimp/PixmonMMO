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
        `;        try {
            await db.query(dropSql);
            await db.query(sql);
            // Table creation logged by database initialization system
        } catch (error) {
            console.error('Error creating UserLogin table:', error);
            throw error;
        }
    }    static async register(username, email, password) {
        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert user with current date for updated_at
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const [result] = await db.query(
                'INSERT INTO UserLogin (username, email, password, updated_at) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, now]
            );

            const newUserId = result.insertId;
            
            await UserProfile.ensureProfileExists(newUserId);

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
        try {            await db.query(`
                CREATE TABLE IF NOT EXISTS UserStats (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    level INT DEFAULT 1,
                    xp INT DEFAULT 0,
                    gold INT DEFAULT 0,
                    diamonds INT DEFAULT 0,
                    quest_points INT DEFAULT 10,
                    quest_point_cooldown DATETIME DEFAULT NULL,
                    cooldownEnd DATETIME DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT NULL,
                    max_hp INT,
                    current_hp INT,
                    FOREIGN KEY (user_id) REFERENCES UserLogin(id) ON DELETE CASCADE,
                    INDEX idx_userstats_user_id (user_id)
                ) ENGINE=InnoDB;
            `);
            // Table creation logged by database initialization system
        } catch (error) {
            console.error('Error creating UserStats table:', error);
            throw error;
        }
    }
    
    static async createUserStats(userId) {
        try {
            // First check if user exists in UserLogin
            const [userExists] = await db.query(
                'SELECT id FROM UserLogin WHERE id = ?',
                [userId]
            );

            if (userExists.length === 0) {
                throw new Error('Cannot create stats for non-existent user');
            }

            // Check if user already has stats
            const [existingStats] = await db.query(
                'SELECT COUNT(*) as count FROM UserStats WHERE user_id = ?',
                [userId]
            );            // If user already has stats, delete all existing records first to prevent duplicates
            if (existingStats[0].count > 0) {
                await db.query('DELETE FROM UserStats WHERE user_id = ?', [userId]);
                // Cleaned up duplicate stats records
            }

            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            // Create initial stats
            await db.query(
                'INSERT INTO UserStats (user_id, xp, gold, level, cooldownEnd, updated_at, quest_points, diamonds) VALUES (?, 0, 0, 1, NULL, ?, 10, 0)',
                [userId, now]
            );

            // Return default stats object
            return {
                level: 1,
                xp: 0,
                gold: 0,
                diamonds: 0,
                quest_points: 10,
                cooldownEnd: null
            };        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                // If stats already exist due to unique constraint, just return them
                return await this.getStats(userId);
            }
            console.error('Error creating user stats:', error);
            throw error;
        }
    }
    
    // Update XP and Gold for a user
    static async updateStats(userId, xpDelta, goldDelta) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await db.query(
            'UPDATE UserStats SET xp = xp + ?, gold = gold + ?, updated_at = ? WHERE user_id = ?',
            [xpDelta, goldDelta, now, userId]
        );
          // Check for level up after XP update
        await this.checkLevelUp(userId);
    }
    
    // Update all stats including level for a user
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
            console.error('Error updating all stats:', error);            throw error;
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
            
            // Check if the cooldownEnd column exists to avoid SQL errors
            const [cooldownColumn] = await db.query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'UserStats' 
                AND COLUMN_NAME = 'cooldownEnd'
            `);
              const cooldownColumnExists = cooldownColumn[0].count > 0;
            
            // Format the cooldown date for MySQL or use NULL
            const cooldownSql = cooldownEnd ? cooldownEnd.slice(0, 19).replace('T', ' ') : null;
            
            // Ensure level is a valid number
            const safeLevel = Number(newLevel) || 1;
            
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
                );            }
            
            // Log only for verbose mode - removed verbose console output
        } catch (error) {
            console.error('Error setting absolute stats:', error);throw error;
        }
    }
    
    // Get stats for a user
    static async getStats(userId) {
        try {
            // Check if multiple stats records exist for this user
            const [statCount] = await db.query(
                'SELECT COUNT(*) as count FROM UserStats WHERE user_id = ?',
                [userId]
            );            // If multiple records exist, clean them up
            if (statCount[0].count > 1) {
                // Get the ID of the most recent record
                const [latestRecord] = await db.query(
                    'SELECT id FROM UserStats WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
                    [userId]
                );
                
                if (latestRecord.length > 0) {
                    const latestId = latestRecord[0].id;
                    
                    // Delete all other records
                    await db.query(
                        'DELETE FROM UserStats WHERE user_id = ? AND id != ?',
                        [userId, latestId]
                    );
                    // Cleaned up duplicate stat records
                }
            }
            
            // Get the user's stats (now there should be only one record or none)
            const [existingStats] = await db.query(
                'SELECT level, xp, gold, diamonds, quest_points, quest_point_cooldown, cooldownEnd FROM UserStats WHERE user_id = ?',
                [userId]
            );
            
            if (existingStats.length === 0) {
                // Create default stats if none exist
                // await this.createUserStats(userId);
                return { 
                    level: 1, 
                    xp: 0, 
                    gold: 0, 
                    diamonds: 0, 
                    quest_points: 10, 
                    quest_point_cooldown: null, 
                    cooldownEnd: null 
                };
            }
            // const stats = existingStats[0];
            return {
                level: existingStats[0].level || 1,
                xp: existingStats[0].xp || 0,
                gold: existingStats[0].gold || 0,
                diamonds: existingStats[0].diamonds || 0,
                quest_points: existingStats[0].quest_points || 0,
                quest_point_cooldown: existingStats[0].quest_point_cooldown,
                cooldownEnd: existingStats[0].cooldownEnd
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            // Return default values on error for graceful fallback
            return {
                level: 1,
                xp: 0,
                gold: 0,
                diamonds: 0,
                quest_points: 10,
                quest_point_cooldown: null,
                cooldownEnd: null
            };
        }
    }

    // Create default stats for a user
    static async createDefaultStats(userId) {
        try {
            const [result] = await db.query(
                `INSERT INTO UserStats (user_id, diamonds,  level, xp, gold, updated_at)
                VALUES (?, 1, 0, 0, NOW())`,
                [userId]
            );
            
            return {
                level: 1,
                xp: 0,
                gold: 0,
                diamonds: 0
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
            const skillPointsToAdd = 1;
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

    static async getOverlayProfileData(userId) {
        try {
            const query = `
                SELECT 
                    ul.username,
                    us.level,
                    us.xp,
                    us.gold,
                    us.diamonds,
                    us.quest_points,
                    COALESCE(quest_stats.completed_count, 0) as quest_completed,
                    COALESCE(quest_stats.claimed_count, 0) as quest_claimed
                FROM UserLogin ul
                JOIN UserStats us ON ul.id = us.user_id
                LEFT JOIN (
                    SELECT 
                        user_id,
                        COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_count,
                        COUNT(CASE WHEN claimed = 1 THEN 1 END) as claimed_count
                    FROM UserQuest 
                    WHERE user_id = ?
                    GROUP BY user_id
                ) quest_stats ON ul.id = quest_stats.user_id
                WHERE ul.id = ?
            `;
            
            const [rows] = await db.query(query, [userId, userId]);
            return rows[0];
        } catch (error) {
            console.error('Error getting overlay profile data:', error);
            throw error;
        }
    }

    // Ensure user has only one stats record
    static async ensureSingleStatsRecord(userId) {
        try {
            // Check if multiple stats records exist for this user
            const [statCount] = await db.query(
                'SELECT COUNT(*) as count FROM UserStats WHERE user_id = ?',
                [userId]
            );

            // If no records exist, create one
            if (statCount[0].count === 0) {
                return await this.createUserStats(userId);
            }
              // If multiple records exist, keep only the most recent
            if (statCount[0].count > 1) {
                // Get the ID of the most recent record
                const [latestRecord] = await db.query(
                    'SELECT id FROM UserStats WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
                    [userId]
                );
                
                if (latestRecord.length > 0) {
                    const latestId = latestRecord[0].id;
                    
                    // Delete all other records
                    await db.query(
                        'DELETE FROM UserStats WHERE user_id = ? AND id != ?',
                        [userId, latestId]
                    );
                    // Cleaned up duplicate stat records
                }
            }
            
            // Get the user's stats (now there should be only one record)
            const [stats] = await db.query(
                'SELECT level, xp, gold, cooldownEnd FROM UserStats WHERE user_id = ?',
                [userId]
            );
            
            return {
                level: stats[0].level || 1,
                xp: stats[0].xp || 0,
                gold: stats[0].gold || 0,
                cooldownEnd: stats[0].cooldownEnd
            };
        } catch (error) {
            console.error('Error ensuring single stats record:', error);
            // Return default values on error for graceful fallback
            return {
                level: 1,
                xp: 0,
                gold: 0,
                cooldownEnd: null
            };
        }
    }

    // Update diamonds for a user
    static async updateDiamonds(userId, diamondsDelta) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        try {
            await db.query(
                'UPDATE UserStats SET diamonds = diamonds + ?, updated_at = ? WHERE user_id = ?',
                [diamondsDelta, now, userId]
            );
            
            // Get updated diamonds count
            const [result] = await db.query(
                'SELECT diamonds FROM UserStats WHERE user_id = ?', 
                [userId]
            );
            
            return result.length > 0 ? result[0].diamonds : 0;
        } catch (error) {
            console.error('Error updating diamonds:', error);
            throw error;
        }
    }
}

module.exports = User;