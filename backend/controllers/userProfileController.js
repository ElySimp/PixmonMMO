// controllers/userProfileController.js
const path = require('path');
const fs = require('fs');
const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        let userProfile;
        try {
            userProfile = await UserProfile.getByUserId(userId);
        } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Coba buat default profile jika tidak ada
            try {
                userProfile = await UserProfile.createDefaultProfile(userId);
            } catch (e) {
                return res.status(404).json({ success: false, message: 'User profile not found and failed to create default.' });
            }
        }
        if (!userProfile) {
            return res.status(404).json({ success: false, message: 'User profile not found.' });
        }
        // Get user stats with failsafe defaults
        let stats;
        try {
            stats = await User.getStats(userId);
        } catch (statsError) {
            console.error('Error fetching user stats:', statsError);
            stats = { level: 1, xp: 0, gold: 0 };
        }
        // Calculate max XP for current level
        const maxXp = Math.floor(50 * Math.pow(stats.level || 1, 1.4));
        // Ensure level sync between profile and stats
        if (userProfile.level !== stats.level) {
            try {
                await UserProfile.update(userId, { level: stats.level });
                userProfile.level = stats.level;
            } catch (syncError) {
                console.error('Error syncing profile level:', syncError);
            }
        }
        // Combine profile data with stats
        const combinedData = {
            success: true,
            ...userProfile,
            xp: stats.xp || 0,
            level: stats.level || 1,
            gold: stats.gold || 0,
            maxXp: maxXp
        };
        res.json(combinedData);
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to load profile data',
            error: error.message
        });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const updates = req.body;
        
        // Validate input
        if (!updates) {
            return res.status(400).json({
                success: false,
                message: 'No updates provided'
            });
        }        // Ensure profile exists
        await UserProfile.ensureProfileExists(userId);
        
        // Update the profile
        const updatedProfile = await UserProfile.update(userId, updates);
        
        if (!updatedProfile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Get the latest stats to include in response
        const stats = await User.getStats(userId);
        
        // Calculate max XP based on current level
        const maxXp = Math.floor(50 * Math.pow(stats.level || 1, 1.4));
        
        // Combine profile and stats data
        const responseData = {
            success: true,
            ...updatedProfile,
            xp: stats.xp || 0,
            level: stats.level || 1,
            maxXp: maxXp
        };
        
        res.json(responseData);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating user profile',
            error: error.message
        });
    }
};

// Reset skill points
exports.resetSkillPoints = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { diamonds_cost } = req.body;
        
        if (!diamonds_cost || typeof diamonds_cost !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Invalid diamond cost provided'
            });
        }
        
        // Get the user's profile to check diamond balance
        const userProfile = await UserProfile.getByUserId(userId);
        
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        
        if (userProfile.diamonds < diamonds_cost) {
            return res.status(400).json({
                success: false,
                message: 'Not enough diamonds to reset skill points'
            });
        }
        
        // Reset skill points
        const updatedProfile = await UserProfile.resetSkillPoints(userId, diamonds_cost);
        
        res.json({
            success: true,
            ...updatedProfile
        });
    } catch (error) {
        console.error('Error resetting skill points:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error resetting skill points'
        });
    }
};

// Get wallpaper
exports.getWallpaper = async (req, res) => {
    try {
        const wallpaperId = req.params.wallpaperId;
        const wallpaper = await UserProfile.getWallpaper(wallpaperId);
        
        if (!wallpaper) {
            return res.status(404).json({
                success: false,
                message: 'Wallpaper not found'
            });
        }
        
        res.json(wallpaper);
    } catch (error) {
        console.error('Error getting wallpaper:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching wallpaper' 
        });
    }
};

// Get pet details
exports.getPet = async (req, res) => {
    try {
        const petId = req.params.petId;
        const pet = await UserProfile.getPet(petId);
        
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        res.json(pet);
    } catch (error) {
        console.error('Error getting pet:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching pet' 
        });
    }
};

// Upload wallpaper
exports.uploadWallpaper = async (req, res) => {
    try {
        // Check if file exists
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../uploads/wallpapers');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generate unique filename
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Write file to disk
        fs.writeFileSync(filePath, req.file.buffer);
        
        // Return the URL path to access the file
        const fileUrl = `/uploads/wallpapers/${fileName}`;
        
        res.json({
            success: true,
            url: fileUrl
        });
    } catch (error) {
        console.error('Error uploading wallpaper:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error uploading wallpaper' 
        });
    }
};

// Initialize UserProfile tables
exports.initUserProfileTables = async (req, res) => {
    try {
        await UserProfile.createTable();
        await UserProfile.addLevelColumn();
        await UserProfile.createWallpapersTable();
        res.json({
            success: true,
            message: 'UserProfile tables initialized successfully'
        });
    } catch (error) {
        console.error('Error initializing UserProfile tables:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error initializing UserProfile tables' 
        });
    }
};

// Update skill points
exports.updateSkillPoints = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { hp_points, damage_points, agility_points } = req.body;
        
        // Validate input
        if (typeof hp_points !== 'number' || 
            typeof damage_points !== 'number' || 
            typeof agility_points !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Invalid skill points values'
            });
        }
        
        // Get current profile
        const currentProfile = await UserProfile.getByUserId(userId);
        if (!currentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        
        // Validate total points don't exceed available points
        const totalPoints = hp_points + damage_points + agility_points;
        if (totalPoints > currentProfile.skill_points) {
            return res.status(400).json({
                success: false,
                message: 'Not enough skill points available'
            });
        }
        
        // Update skill points
        const updates = {
            hp_points,
            damage_points,
            agility_points
        };
        
        const updatedProfile = await UserProfile.updateSkillPoints(userId, updates);
        
        res.json({
            success: true,
            ...updatedProfile
        });
    } catch (error) {
        console.error('Error updating skill points:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating skill points',
            error: error.message 
        });
    }
};