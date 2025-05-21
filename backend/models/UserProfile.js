// models/UserProfile.js
const db = require('../config/database');
const path = require('path');

// Import User model for skill points synchronization
const User = require('./User');

class UserProfile {
    // Create UserProfile table
    static async createTable() {
        try {
            // Create the table
            await db.query(`
                CREATE TABLE IF NOT EXISTS UserProfile (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    username VARCHAR(255) NOT NULL,
                    status_message TEXT,
                    diamonds INT DEFAULT 0,
                    skill_points INT DEFAULT 0,
                    hp_points INT DEFAULT 0,
                    damage_points INT DEFAULT 0,
                    agility_points INT DEFAULT 0,
                    wallpaper_id INT,
                    custom_wallpaper_url VARCHAR(255),                    
                    favorite_pet_id INT,
                    level INT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT NULL,
                    FOREIGN KEY (user_id) REFERENCES UserLogin(id) ON DELETE CASCADE,
                    INDEX idx_userprofile_user_id (user_id)
                ) ENGINE=InnoDB;
            `);
            
            console.log('UserProfile table created or already exists');
        } catch (error) {
            console.error('Error creating UserProfile table:', error);
            throw error;
        }
    }

    // Create Wallpapers table (if needed)
    static async createWallpapersTable() {
        try {
            const result = await db.query(`
                CREATE TABLE IF NOT EXISTS Wallpapers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    url VARCHAR(255) NOT NULL,
                    is_premium BOOLEAN DEFAULT FALSE
                ) ENGINE=InnoDB;
            `);
            
            return result;
        } catch (error) {
            console.error('Error creating Wallpapers table:', error);
            throw error;
        }
    }    // Get user profile by user ID
    static async getByUserId(userId) {
        try {
            // First verify the user exists in UserLogin
            const [userExists] = await db.query(
                'SELECT id, username FROM UserLogin WHERE id = ?',
                [userId]
            );
            if (!userExists || userExists.length === 0) {
                throw new Error('User not found');
            }
            // Get profile with JOIN to ensure it belongs to an existing user
            const [profiles] = await db.query(
                `SELECT p.*, u.username as login_username 
                FROM UserProfile p
                JOIN UserLogin u ON p.user_id = u.id
                WHERE p.user_id = ?`,
                [userId]
            );
            if (profiles.length === 0) {
                // Create default profile if none exists
                return await this.createDefaultProfile(userId);
            }
            // Update username if it's out of sync
            if (profiles[0].username !== profiles[0].login_username) {
                try {
                    await this.syncUsername(userId, profiles[0].login_username);
                    profiles[0].username = profiles[0].login_username;
                } catch (e) {
                    console.error('Error syncing username in getByUserId:', e);
                }
            }
            return profiles[0];
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }    // Sync username with UserLogin table
    static async syncUsername(userId, newUsername) {
        try {
            await db.query(
                'UPDATE UserProfile SET username = ?, updated_at = NOW() WHERE user_id = ?',
                [newUsername, userId]
            );
        } catch (error) {
            console.error('Error syncing username:', error);
            throw error;
        }
    }    // Create a default profile for new users
    static async createDefaultProfile(userId) {
        try {
            // Get username from UserLogin
            const [userResult] = await db.query(
                'SELECT username FROM UserLogin WHERE id = ?',
                [userId]
            );

            if (!userResult || userResult.length === 0) {
                throw new Error('User not found in UserLogin table');
            }
            console.log('Creating default profile for user:', userId);
            
            // First check if profile already exists
            const [existingProfile] = await db.query(
                'SELECT id FROM UserProfile WHERE user_id = ?',
                [userId]
            );
            
            if (existingProfile && existingProfile.length > 0) {
                console.log(`Profile already exists for user ${userId}`);
                return await this.getByUserId(userId);
            }

            // Get username from UserLogin
            const [userRows] = await db.query(
                'SELECT username FROM UserLogin WHERE id = ?',
                [userId]
            );
            
            if (!userRows || userRows.length === 0) {
                throw new Error('User not found in UserLogin table');
            }
            
            const username = userRows[0].username;
            console.log('Found username:', username);

            // Get user stats for level-based calculations
            const [statsRows] = await db.query(
                'SELECT level FROM UserStats WHERE user_id = ?',
                [userId]
            );

            // Default values
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const level = statsRows?.[0]?.level || 1;
            const initialSkillPoints = level * 3; // 3 skill points per level
            const initialDiamonds = 100;
            
            // Insert default profile with calculated values
            await db.query(
                `INSERT INTO UserProfile (
                    user_id,
                    username,
                    status_message,
                    diamonds,
                    skill_points,
                    hp_points,
                    damage_points,
                    agility_points,
                    level,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    username,
                    'Ready for adventure!',
                    initialDiamonds,
                    initialSkillPoints,
                    0, // Initial hp points
                    0, // Initial damage points
                    0, // Initial agility points
                    level,
                    now,
                    now
                ]
            );
            
            console.log('Created default profile successfully');
            return await this.getByUserId(userId);
        } catch (error) {
            console.error('Error creating default profile:', error);
            throw error;
        }
    }

    // Ensure a user profile exists for a given user_id
    static async ensureProfileExists(userId) {
        try {
            // Check if profile exists
            const [profiles] = await db.query(
                'SELECT id FROM UserProfile WHERE user_id = ?',
                [userId]
            );

            // If no profile exists, create default one
            if (profiles.length === 0) {
                await this.createDefaultProfile(userId);
            }
        } catch (error) {
            console.error('Error ensuring profile exists:', error);
            throw error;
        }
    }    // Update basic user profile info (non-skill related)
    static async update(userId, updates) {
        try {
            await db.query('START TRANSACTION');

            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const allowedUpdates = [
                'username',
                'status_message',
                'custom_wallpaper_url',
                'favorite_pet_id',
                'diamonds',
                'skill_points',
                'hp_points',
                'damage_points',
                'agility_points',
                'level',
                'wallpaper_id'
            ];

            // Filter out any updates that aren't in allowedUpdates
            const validUpdates = Object.keys(updates)
                .filter(key => allowedUpdates.includes(key))
                .reduce((obj, key) => ({ ...obj, [key]: updates[key] }), {});

            if (Object.keys(validUpdates).length === 0) {
                await db.query('ROLLBACK');
                return null;
            }

            // First verify the profile exists and belongs to this user
            const [existingProfile] = await db.query(
                'SELECT id FROM UserProfile WHERE user_id = ?',
                [userId]
            );

            if (!existingProfile || existingProfile.length === 0) {
                await db.query('ROLLBACK');
                throw new Error('Profile not found for this user');
            }

            // If username is being updated, sync it with UserLogin
            if (validUpdates.username) {
                await db.query(
                    'UPDATE UserLogin SET username = ? WHERE id = ?',
                    [validUpdates.username, userId]
                );
            }

            // Build UPDATE query
            const updateFields = Object.keys(validUpdates)
                .map(key => `${key} = ?`)
                .join(', ');
            const updateValues = [...Object.values(validUpdates)];

            const query = `
                UPDATE UserProfile 
                SET ${updateFields}, updated_at = ?
                WHERE user_id = ?
            `;

            await db.query(query, [...updateValues, now, userId]);

            // Get and return updated profile
            const [updatedProfile] = await db.query(
                'SELECT * FROM UserProfile WHERE user_id = ?',
                [userId]
            );

            await db.query('COMMIT');
            return updatedProfile[0];

        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Update skill points
    static async updateSkillPoints(userId, updates) {
        try {
            // Start transaction
            await db.query('START TRANSACTION');

            // Update skill points
            const updateQuery = `
                UPDATE UserProfile 
                SET 
                    hp_points = ?,
                    damage_points = ?,
                    agility_points = ?,
                    updated_at = NOW()
                WHERE user_id = ?
            `;

            await db.query(updateQuery, [
                updates.hp_points,
                updates.damage_points,
                updates.agility_points,
                userId
            ]);

            // Get updated profile
            const [rows] = await db.query(
                'SELECT * FROM UserProfile WHERE user_id = ?',
                [userId]
            );

            // Commit transaction
            await db.query('COMMIT');

            return rows[0];
        } catch (error) {
            // Rollback on error
            await db.query('ROLLBACK');
            console.error('Error updating skill points:', error);
            throw error;
        }
    }
    
    // Reset skill points
    static async resetSkillPoints(userId, diamondsCost) {
        try {
            // Start a transaction
            await db.query('START TRANSACTION');
            
            // Get current profile
            const [rows] = await db.query(
                'SELECT * FROM UserProfile WHERE user_id = ?',
                [userId]
            );
            
            if (rows.length === 0) {
                throw new Error('Profile not found');
            }
            
            const profile = rows[0];
            
            // Check if user has enough diamonds
            if (profile.diamonds < diamondsCost) {
                throw new Error('Not enough diamonds');
            }
            
            // Update profile: reset points and deduct diamonds
            await db.query(
                `UPDATE UserProfile 
                SET 
                    diamonds = diamonds - ?,
                    hp_points = 0,
                    damage_points = 0,
                    agility_points = 0,
                    updated_at = NOW()
                WHERE user_id = ?`,
                [diamondsCost, userId]
            );
            
            // Get updated profile
            const [updatedRows] = await db.query(
                'SELECT * FROM UserProfile WHERE user_id = ?',
                [userId]
            );
            
            // Commit transaction
            await db.query('COMMIT');
            
            return {
                success: true,
                diamonds: updatedRows[0].diamonds,
                skill_points: updatedRows[0].skill_points,
                hp_points: 0,
                damage_points: 0,
                agility_points: 0
            };
        } catch (error) {
            // Rollback on error
            await db.query('ROLLBACK');
            console.error('Error resetting skill points:', error);
            throw error;
        }
    }
    
    // Get wallpaper by ID
    static async getWallpaper(wallpaperId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM Wallpapers WHERE id = ?',
                [wallpaperId]
            );
            
            return rows[0];
        } catch (error) {
            console.error('Error getting wallpaper:', error);
            throw error;
        }
    }
    
    // Get pet by ID
    static async getPet(petId) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM Pets WHERE id = ?',
                [petId]
            );
            
            return rows[0];
        } catch (error) {
            console.error('Error getting pet:', error);
            throw error;
        }
    }

    // Add level column to UserProfile table (MySQL compatible)
    static async addLevelColumn() {
        try {
            const [rows] = await db.query(`
                SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'UserProfile' AND COLUMN_NAME = 'level' AND TABLE_SCHEMA = DATABASE()
            `);
            if (rows[0].count === 0) {
                await db.query(`ALTER TABLE UserProfile ADD COLUMN level INT DEFAULT 1`);
                console.log('Level column added to UserProfile table');
            } else {
                console.log('Level column already exists in UserProfile table');
            }
        } catch (error) {
            console.error('Error adding level column:', error);
            throw error;
        }
    }

    // Update username in UserProfile when it changes in UserLogin
    static async syncUsername(userId, newUsername) {
        try {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            await db.query(
                'UPDATE UserProfile SET username = ?, updated_at = ? WHERE user_id = ?',
                [newUsername, now, userId]
            );
            return true;
        } catch (error) {
            console.error('Error syncing username:', error);
            throw error;
        }
    }
}

module.exports = UserProfile;