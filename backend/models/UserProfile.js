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
                    status_message TEXT,
                    diamonds INT DEFAULT 0,
                    skill_points INT DEFAULT 0,
                    hp_points INT DEFAULT 0,
                    damage_points INT DEFAULT 0,
                    agility_points INT DEFAULT 0,
                    wallpaper_id INT,
                    custom_wallpaper_url VARCHAR(255),                    
                    favorite_pet_id INT,
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
            const [profiles] = await db.query(
                `SELECT 
                    p.*,
                    u.username,
                    COALESCE(s.level, 1) as level,
                    COALESCE(s.xp, 0) as xp,
                    COALESCE(s.gold, 0) as gold
                FROM UserProfile p
                JOIN UserLogin u ON p.user_id = u.id
                LEFT JOIN UserStats s ON p.user_id = s.user_id
                WHERE p.user_id = ?`,
                [userId]
            );

            if (!profiles || profiles.length === 0) {
                return null;
            }

            return profiles[0];
        } catch (error) {
            console.error('Error getting user profile:', error);
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

            // Get level from UserStats
            const [statsResult] = await db.query(
                'SELECT level FROM UserStats WHERE user_id = ?',
                [userId]
            );

            const level = statsResult?.[0]?.level || 1;
            const initialSkillPoints = level * 1; 
            const initialDiamonds = 100;
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            // Insert default profile
            await db.query(
                `INSERT INTO UserProfile (
                    user_id,
                    status_message,
                    diamonds,
                    skill_points,
                    hp_points,
                    damage_points,
                    agility_points,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    'Ready for adventure!',
                    initialDiamonds,
                    initialSkillPoints,
                    0, // Initial hp points
                    0, // Initial damage points
                    0, // Initial agility points
                    now,
                    now
                ]
            );
            
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
            console.log('Updating user profile:', userId);
            console.log('Update data:', updates);

            const updateFields = [];
            const updateValues = [];
            
            // Handle each updatable field from the UserProfile table
            if (updates.status_message !== undefined) {
                updateFields.push('status_message = ?');
                updateValues.push(updates.status_message);
                console.log('Adding status_message update:', updates.status_message);
            }
            if (updates.custom_wallpaper_url !== undefined) {
                updateFields.push('custom_wallpaper_url = ?');
                updateValues.push(updates.custom_wallpaper_url);
            }
            if (updates.diamonds !== undefined) {
                updateFields.push('diamonds = ?');
                updateValues.push(updates.diamonds);
            }
            if (updates.skill_points !== undefined) {
                updateFields.push('skill_points = ?');
                updateValues.push(updates.skill_points);
            }
            if (updates.hp_points !== undefined) {
                updateFields.push('hp_points = ?');
                updateValues.push(updates.hp_points);
            }
            if (updates.damage_points !== undefined) {
                updateFields.push('damage_points = ?');
                updateValues.push(updates.damage_points);
            }
            if (updates.agility_points !== undefined) {
                updateFields.push('agility_points = ?');
                updateValues.push(updates.agility_points);
            }
            
            // Add updated_at timestamp
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            
            // If no fields to update, return current profile
            if (updateFields.length === 0) {
                console.log('No fields to update');
                return await this.getByUserId(userId);
            }
            
            // Add userId to values array
            updateValues.push(userId);
            
            // Construct and execute update query
            const query = `
                UPDATE UserProfile 
                SET ${updateFields.join(', ')}
                WHERE user_id = ?
            `;
            
            console.log('Executing query:', query);
            console.log('With values:', updateValues);
            
            await db.query(query, updateValues);
            
            // Get updated profile by joining with UserLogin and UserStats
            const [profiles] = await db.query(
                `SELECT 
                    p.*,
                    u.username,
                    COALESCE(s.level, 1) as level,
                    COALESCE(s.xp, 0) as xp
                FROM UserProfile p
                JOIN UserLogin u ON p.user_id = u.id
                LEFT JOIN UserStats s ON p.user_id = s.user_id
                WHERE p.user_id = ?`,
                [userId]
            );
            
            console.log('Updated profile:', profiles[0]);
            return profiles[0];
        } catch (error) {
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