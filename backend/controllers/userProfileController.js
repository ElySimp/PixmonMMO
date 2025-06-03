// controllers/userProfileController.js
const path = require('path');
const fs = require('fs');
const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WebP files are allowed.'));
        }
    }
});

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        // Ensure profile exists first
        await UserProfile.ensureProfileExists(userId);
        
        let userProfile;
        try {
            userProfile = await UserProfile.getByUserId(userId);
        } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch user profile',
                error: profileError.message 
            });
        }

        if (!userProfile) {
            return res.status(404).json({ success: false, message: 'User profile not found.' });
        }

        // Calculate max XP for current level
        const maxXp = Math.floor(50 * Math.pow(userProfile.level || 1, 1.4));

        // Combine profile data with stats (already included in getByUserId)
        const combinedData = {
            success: true,
            ...userProfile,
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
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No updates provided'
            });
        }

        // Validate wallpaper_id if provided
        if (updates.wallpaper_id !== undefined && updates.wallpaper_id !== null) {
            const isValidWallpaper = await UserProfile.validateWallpaper(updates.wallpaper_id);
            if (!isValidWallpaper) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid wallpaper ID'
                });
            }
        }

        // Update the profile
        const updatedProfile = await UserProfile.update(userId, updates);
        
        if (!updatedProfile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Calculate max XP based on current level
        const maxXp = Math.floor(50 * Math.pow(updatedProfile.level || 1, 1.4));
        
        // Prepare response data
        const responseData = {
            success: true,
            ...updatedProfile,
            maxXp
        };

        res.json(responseData);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating user profile'
        });
    }
};

// Update skill points
exports.updateSkillPoints = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { hp_points, damage_points, agility_points } = req.body;
        
        // Validate input
        if (hp_points === undefined || damage_points === undefined || agility_points === undefined) {
            return res.status(400).json({
                success: false,
                message: 'All skill points (hp_points, damage_points, agility_points) are required'
            });
        }

        const updates = {
            hp_points: parseInt(hp_points) || 0,
            damage_points: parseInt(damage_points) || 0,
            agility_points: parseInt(agility_points) || 0
        };

        // Update skill points using the model method
        const updatedProfile = await UserProfile.updateSkillPoints(userId, updates);
        
        // Calculate max XP
        const maxXp = Math.floor(50 * Math.pow(updatedProfile.level || 1, 1.4));
        
        res.json({
            success: true,
            ...updatedProfile,
            maxXp
        });
    } catch (error) {
        console.error('Error updating skill points:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error updating skill points'
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
        
        // Reset skill points using the model method
        const result = await UserProfile.resetSkillPoints(userId, diamonds_cost);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error resetting skill points:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error resetting skill points'
        });
    }
};

// Upload custom wallpaper
exports.uploadCustomWallpaper = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        console.log('Upload wallpaper request:', {
            userId,
            file: req.file ? {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : 'No file'
        });
        
        // Check if file exists
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
            });
        }
        
        // Check file size (max 5MB)
        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        
        // Upload wallpaper using UserProfile model
        const updatedProfile = await UserProfile.uploadCustomWallpaper(
            userId, 
            req.file.buffer, 
            req.file.originalname
        );
        
        const maxXp = Math.floor(50 * Math.pow(updatedProfile.level || 1, 1.4));
        
        res.json({
            success: true,
            message: 'Custom wallpaper uploaded successfully',
            custom_wallpaper_url: updatedProfile.custom_wallpaper_url,
            userId: updatedProfile.id,
            level: updatedProfile.level,
            maxXp
        });
    } catch (error) {
        console.error('Error uploading custom wallpaper:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error uploading wallpaper' 
        });
    }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        console.log('Upload avatar request:', {
            userId,
            file: req.file ? {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : 'No file'
        });
        
        // Check if file exists
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
            });
        }
        
        // Check file size (max 5MB)
        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        
        // Upload avatar using UserProfile model
        const updatedProfile = await UserProfile.uploadAvatar(
            userId, 
            req.file.buffer, 
            req.file.originalname
        );
        
        // Calculate max XP
        const maxXp = Math.floor(50 * Math.pow(updatedProfile.level || 1, 1.4));
        
        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatar_url: updatedProfile.avatar_url,
            userId: updatedProfile.user_id,
            level: updatedProfile.level,
            maxXp
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error uploading avatar' 
        });
    }
};
// Get all wallpapers
exports.getAllWallpapers = async (req, res) => {
    try {
        const wallpapers = await UserProfile.getAllWallpapers();
        
        res.json({
            success: true,
            wallpapers
        });
    } catch (error) {
        console.error('Error getting all wallpapers:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching wallpapers' 
        });
    }
};

exports.updateStatusMessage = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { status_message } = req.body;
        
        console.log('Update status message request:', {
            userId,
            status_message
        });
        
        if (status_message === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Status message is required'
            });
        }
        
        const updates = { status_message };
        const updatedProfile = await UserProfile.update(userId, updates);
        
        if (!updatedProfile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Status message updated successfully',
            status_message: updatedProfile.status_message,
            userId: updatedProfile.user_id
        });
    } catch (error) {
        console.error('Error updating status message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating status message'
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
        
        res.json({
            success: true,
            wallpaper
        });
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
        
        res.json({
            success: true,
            pet
        });
    } catch (error) {
        console.error('Error getting pet:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching pet' 
        });
    }
};

// Initialize UserProfile tables
exports.initUserProfileTables = async (req, res) => {
    try {
        await UserProfile.createTable();
        await UserProfile.createWallpapersTable();
        
        res.json({
            success: true,
            message: 'UserProfile tables initialized successfully'
        });
    } catch (error) {
        console.error('Error initializing UserProfile tables:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error initializing UserProfile tables',
            error: error.message 
        });
    }
};

// Middleware untuk upload file
exports.uploadSingle = (fieldName) => {
    return upload.single(fieldName);
};

// Export multer upload untuk digunakan di routes
exports.upload = upload;