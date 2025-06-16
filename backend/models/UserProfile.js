// models/UserProfile.js
const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

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
                    skill_points INT DEFAULT 0,
                    hp_points INT DEFAULT 0,
                    damage_points INT DEFAULT 0,
                    agility_points INT DEFAULT 0,
                    wallpaper_id INT,
                    custom_wallpaper_url VARCHAR(255),
                    avatar_url VARCHAR(255),
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
    }

    // Get user profile by user ID
    static async getByUserId(userId) {
        try {
            const [profiles] = await db.query(
                `SELECT 
                    p.*,
                    u.username,
                    COALESCE(s.level, 1) as level,
                    COALESCE(s.xp, 0) as xp,
                    COALESCE(s.gold, 0) as gold,
                    COALESCE(s.diamonds, 0) as diamonds
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
    }

    // Create a default profile for new users 
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
            
            // Insert default profile
            await db.query(
                `INSERT INTO UserProfile (
                    user_id,
                    avatar_url,
                    custom_wallpaper_url,
                    wallpaper_id,
                    status_message,
                    skill_points,
                    hp_points,
                    damage_points,
                    agility_points,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    userId,
                    'Ready for adventure!',
                    initialSkillPoints,
                    0, // Initial hp points
                    0, // Initial damage points
                    0  // Initial agility points
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
    }

    // File Upload Helper Methods
    static async createUploadDirectories() {
        try {
            const uploadsDir = path.join(__dirname, '../uploads');
            const wallpapersDir = path.join(uploadsDir, 'wallpapers');
            const avatarsDir = path.join(uploadsDir, 'avatars');
            
            // Create directories if they don't exist
            await fs.mkdir(uploadsDir, { recursive: true });
            await fs.mkdir(wallpapersDir, { recursive: true });
            await fs.mkdir(avatarsDir, { recursive: true });
            
            console.log('Upload directories created');
        } catch (error) {
            console.error('Error creating upload directories:', error);
            throw error;
        }
    }

    // Validate file type
   static validateFileType(filename, allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp']) {
    const ext = path.extname(filename).toLowerCase().substring(1);
    return allowedTypes.includes(ext);
}

    // Generate unique filename
    static generateUniqueFilename(originalFilename) {
        const ext = path.extname(originalFilename);
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        return `${timestamp}_${randomString}${ext}`;
    }

    // Save uploaded wallpaper file
    static async saveWallpaperFile(userId, fileBuffer, originalFilename) {
        try {
            // Validate file type
            if (!this.validateFileType(originalFilename)) {
                throw new Error('Invalid file type. Only JPG, PNG, and GIF files are allowed.');
            }

            // Create upload directories if they don't exist
            await this.createUploadDirectories();

            // Generate unique filename
            const uniqueFilename = this.generateUniqueFilename(originalFilename);
            const wallpaperPath = path.join(__dirname, '../uploads/wallpapers', uniqueFilename);

            // Save file to disk
            await fs.writeFile(wallpaperPath, fileBuffer);

            // Generate URL (adjust based on your server setup)
            const wallpaperUrl = `/uploads/wallpapers/${uniqueFilename}`;

            console.log(`Wallpaper saved: ${wallpaperUrl}`);
            return wallpaperUrl;
        } catch (error) {
            console.error('Error saving wallpaper file:', error);
            throw error;
        }
    }

    // Save uploaded avatar file
    static async saveAvatarFile(userId, fileBuffer, originalFilename) {
        try {
            // Validate file type
            if (!this.validateFileType(originalFilename)) {
                throw new Error('Invalid file type. Only JPG, PNG, and GIF files are allowed.');
            }

            // Create upload directories if they don't exist
            await this.createUploadDirectories();

            // Generate unique filename
            const uniqueFilename = this.generateUniqueFilename(originalFilename);
            const avatarPath = path.join(__dirname, '../uploads/avatars', uniqueFilename);

            // Save file to disk
            await fs.writeFile(avatarPath, fileBuffer);

            // Generate URL (adjust based on your server setup)
            const avatarUrl = `/uploads/avatars/${uniqueFilename}`;

            console.log(`Avatar saved: ${avatarUrl}`);
            return avatarUrl;
        } catch (error) {
            console.error('Error saving avatar file:', error);
            throw error;
        }
    }

    // Delete old file when updating
    static async deleteOldFile(fileUrl) {
        try {
            if (!fileUrl || fileUrl.startsWith('http')) {
                return; // Skip deletion for external URLs
            }

            const filePath = path.join(__dirname, '..', fileUrl);
            await fs.unlink(filePath);
            console.log(`Old file deleted: ${filePath}`);
        } catch (error) {
            console.log(`Could not delete old file: ${error.message}`);
            // Don't throw error, just log it
        }
    }

    // Upload and save custom wallpaper
    static async uploadCustomWallpaper(userId, fileBuffer, originalFilename) {
        try {
            await this.ensureProfileExists(userId);

            // Get current wallpaper URL to delete old file
            const currentProfile = await this.getByUserId(userId);
            const oldWallpaperUrl = currentProfile?.custom_wallpaper_url;

            // Save new wallpaper file
            const wallpaperUrl = await this.saveWallpaperFile(userId, fileBuffer, originalFilename);

            // Update database
            const [result] = await db.query(
                `UPDATE UserProfile 
                SET custom_wallpaper_url = ?, wallpaper_id = NULL, updated_at = NOW()
                WHERE user_id = ?`,
                [wallpaperUrl, userId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Failed to save custom wallpaper to database');
            }

            // Delete old file
            if (oldWallpaperUrl) {
                await this.deleteOldFile(oldWallpaperUrl);
            }

            return await this.getByUserId(userId);
        } catch (error) {
            console.error('Error uploading custom wallpaper:', error);
            throw error;
        }
    }

    // Upload and save avatar
    static async uploadAvatar(userId, fileBuffer, originalFilename) {
        try {
            await this.ensureProfileExists(userId);

            // Get current avatar URL to delete old file
            const currentProfile = await this.getByUserId(userId);
            const oldAvatarUrl = currentProfile?.avatar_url;

            // Save new avatar file
            const avatarUrl = await this.saveAvatarFile(userId, fileBuffer, originalFilename);

            // Update database
            const [result] = await db.query(
                `UPDATE UserProfile 
                SET avatar_url = ?, updated_at = NOW()
                WHERE user_id = ?`,
                [avatarUrl, userId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Failed to save avatar to database');
            }

            // Delete old file
            if (oldAvatarUrl) {
                await this.deleteOldFile(oldAvatarUrl);
            }

            return await this.getByUserId(userId);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw error;
        }
    }

    // Sync skill points when user levels up
    static async syncSkillPointsOnLevelUp(userId, newLevel) {
        try {
            console.log(`Syncing skill points for user ${userId} to level ${newLevel}`);
            
            const totalSkillPoints = newLevel * 1;
            
            const [currentProfile] = await db.query(
                'SELECT hp_points, damage_points, agility_points FROM UserProfile WHERE user_id = ?',
                [userId]
            );
            
            let availableSkillPoints = totalSkillPoints;
            
            if (currentProfile && currentProfile.length > 0) {
                const allocatedPoints = (currentProfile[0].hp_points || 0) + 
                                      (currentProfile[0].damage_points || 0) + 
                                      (currentProfile[0].agility_points || 0);
                availableSkillPoints = totalSkillPoints - allocatedPoints;
            }
            
            await db.query(
                `UPDATE UserProfile 
                SET skill_points = ?, updated_at = NOW()
                WHERE user_id = ?`,
                [Math.max(0, availableSkillPoints), userId]
            );
            
            console.log(`Updated skill points for user ${userId}: ${availableSkillPoints} available`);
            return availableSkillPoints;
        } catch (error) {
            console.error('Error syncing skill points on level up:', error);
            throw error;
        }
    }

    // Update basic user profile info
    static async update(userId, updates) {
        try {
            console.log('Updating user profile:', userId);
            console.log('Update data:', updates);

            await this.ensureProfileExists(userId);

            const updateFields = [];
            const updateValues = [];
            
            // Handle status message
            if (updates.status_message !== undefined) {
                updateFields.push('status_message = ?');
                updateValues.push(updates.status_message);
                console.log('Adding status_message update:', updates.status_message);
            }
            
            // Handle preset wallpaper
            if (updates.wallpaper_id !== undefined) {
                updateFields.push('wallpaper_id = ?');
                updateValues.push(updates.wallpaper_id);
                updateFields.push('custom_wallpaper_url = NULL');
                console.log('Adding wallpaper_id update:', updates.wallpaper_id);
            }
            
            // Handle pet updates
            if (updates.favorite_pet_id !== undefined) {
                updateFields.push('favorite_pet_id = ?');
                updateValues.push(updates.favorite_pet_id);
                console.log('Adding favorite_pet_id update:', updates.favorite_pet_id);
            }
            
            // Handle skill points updates
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
            
            if (updateFields.length === 0) {
                console.log('No fields to update');
                return await this.getByUserId(userId);
            }
            
            updateValues.push(userId);
            updateFields.push('updated_at = NOW()');
            
            const query = `
                UPDATE UserProfile 
                SET ${updateFields.join(', ')}
                WHERE user_id = ?
            `;
            
            console.log('Executing query:', query);
            console.log('With values:', updateValues);
            
            const [result] = await db.query(query, updateValues);
            
            if (result.affectedRows === 0) {
                console.log('No rows affected - creating default profile');
                await this.createDefaultProfile(userId);
                await db.query(query, updateValues);
            }
            
            const updatedProfile = await this.getByUserId(userId);
            console.log('Updated profile:', updatedProfile);
            return updatedProfile;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Update skill points
    static async updateSkillPoints(userId, updates) {
        try {
            console.log('Updating skill points for user:', userId);
            console.log('Skill point updates:', updates);
            
            const hpPoints = parseInt(updates.hp_points) || 0;
            const damagePoints = parseInt(updates.damage_points) || 0;
            const agilityPoints = parseInt(updates.agility_points) || 0;
            
            if (hpPoints < 0 || damagePoints < 0 || agilityPoints < 0) {
                throw new Error('Skill points cannot be negative');
            }
            
            await db.query('START TRANSACTION');

            const currentProfile = await this.getByUserId(userId);
            if (!currentProfile) {
                throw new Error('User profile not found');
            }
            
            const currentLevel = currentProfile.level || 1;
            const totalSkillPoints = currentLevel * 1;
            const newAllocatedPoints = hpPoints + damagePoints + agilityPoints;
            
            if (newAllocatedPoints > totalSkillPoints) {
                throw new Error(`Not enough skill points. You have ${totalSkillPoints} points available, but trying to allocate ${newAllocatedPoints} points.`);
            }
            
            const remainingSkillPoints = totalSkillPoints - newAllocatedPoints;
            
            const updateQuery = `
                UPDATE UserProfile 
                SET 
                    hp_points = ?,
                    damage_points = ?,
                    agility_points = ?,
                    skill_points = ?,
                    updated_at = NOW()
                WHERE user_id = ?
            `;

            const [result] = await db.query(updateQuery, [
                hpPoints,
                damagePoints,
                agilityPoints,
                remainingSkillPoints,
                userId
            ]);
            
            if (result.affectedRows === 0) {
                throw new Error('Failed to update skill points - user profile not found');
            }

            const updatedProfile = await this.getByUserId(userId);
            await db.query('COMMIT');
            
            console.log('Skill points updated successfully:', updatedProfile);
            return updatedProfile;
        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Error updating skill points:', error);
            throw error;
        }
    }
    
    // Reset skill points
    static async resetSkillPoints(userId, diamondsCost) {
        try {
            await db.query('START TRANSACTION');
            
            const [statsRows] = await db.query(
                'SELECT diamonds FROM UserStats WHERE user_id = ?',
                [userId]
            );
            
            if (statsRows.length === 0) {
                throw new Error('User stats not found');
            }
            
            const currentDiamonds = statsRows[0].diamonds || 0;
            
            if (currentDiamonds < diamondsCost) {
                throw new Error('Not enough diamonds');
            }
            
            const currentProfile = await this.getByUserId(userId);
            const currentLevel = currentProfile?.level || 1;
            const totalSkillPoints = currentLevel * 1;
            
            await db.query(
                `UPDATE UserStats 
                SET diamonds = diamonds - ?
                WHERE user_id = ?`,
                [diamondsCost, userId]
            );
            
            await db.query(
                `UPDATE UserProfile 
                SET 
                    hp_points = 0,
                    damage_points = 0,
                    agility_points = 0,
                    skill_points = ?,
                    updated_at = NOW()
                WHERE user_id = ?`,
                [totalSkillPoints, userId]
            );
            
            const [updatedStatsRows] = await db.query(
                'SELECT * FROM UserStats WHERE user_id = ?',
                [userId]
            );
            
            await db.query('COMMIT');
            
            return {
                success: true,
                diamonds: updatedStatsRows[0].diamonds,
                skill_points: totalSkillPoints,
                hp_points: 0,
                damage_points: 0,
                agility_points: 0
            };
        } catch (error) {
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

    // Get all wallpapers
    static async getAllWallpapers() {
        try {
            const [wallpapers] = await db.query(`
                SELECT id, name, wallpaper_url as image_url, is_premium
                FROM Wallpapers
                ORDER BY id
            `);
            return wallpapers;
        } catch (error) {
            console.error('Error getting all wallpapers:', error);
            throw error;
        }
    }
    
    // Validate wallpaper exists
    static async validateWallpaper(wallpaperId) {
        try {
            const [rows] = await db.query(
                'SELECT id FROM Wallpapers WHERE id = ?',
                [wallpaperId]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('Error validating wallpaper:', error);
            return false;
        }
    }

    // Get all available avatars
    static async getAllAvatars() {
        try {
            const [avatars] = await db.query(`
                SELECT id, name, image_path as image_url, is_premium
                FROM Avatars
                ORDER BY id
            `);
            return avatars;
        } catch (error) {
            console.error('Error getting avatars:', error);
            throw error;
        }
    }

    // Update user's avatar
    static async updateAvatar(userId, avatarId) {
        try {
            const [result] = await db.query(
                `UPDATE UserProfile 
                SET avatar_id = ?, updated_at = NOW()
                WHERE user_id = ?`,
                [avatarId, userId]
            );

            if (result.affectedRows === 0) {
                throw new Error('User profile not found');
            }

            return await this.getByUserId(userId);
        } catch (error) {
            console.error('Error updating avatar:', error);
            throw error;
        }
    }

    // Update user's wallpaper
    static async updateWallpaper(userId, wallpaperId) {
        try {
            const [result] = await db.query(
                `UPDATE UserProfile 
                SET wallpaper_id = ?, updated_at = NOW()
                WHERE user_id = ?`,
                [wallpaperId, userId]
            );

            if (result.affectedRows === 0) {
                throw new Error('User profile not found');
            }

            return await this.getByUserId(userId);
        } catch (error) {
            console.error('Error updating wallpaper:', error);
            throw error;
        }
    }
}

module.exports = UserProfile;