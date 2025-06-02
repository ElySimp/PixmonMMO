const User = require('../models/User');
const jwt = require('jsonwebtoken');
const UserProfile = require('../models/UserProfile');
const { UserQuest } = require('../models/QuestSystem'); 
const logger = require('../utils/logger');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

exports.register = async (req, res) => {
    try {
        logger.debug(`Registration attempt for: ${req.body.username}`, 'AUTH');
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            logger.warning('Registration failed: Missing required fields', 'AUTH');
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide username, email and password' 
            });
        }

        // Register user
        const userId = await User.register(username, email, password);
        logger.success(`User registered successfully: ${username} (ID: ${userId})`, 'AUTH');        // Create initial user stats
        try {
            await User.ensureSingleStatsRecord(userId);
            // Initial user stats created
        } catch (statsError) {
            console.error('Error creating initial stats:', statsError);
            // Don't fail registration if stats creation fails
        }

        // Create initial user profile
        try {
            await UserProfile.createDefaultProfile(userId);
            // Initial user profile created
        } catch (profileError) {
            console.error('Error creating initial profile:', profileError);
            // Don't fail registration if profile creation fails
        }        
        // await User.createUserStats(userId);
        
        const user = await User.findById(userId);
        // User data retrieved for token generation
        
        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        console.error('Registration controller error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            logger.warning('Login failed: Missing credentials', 'AUTH');
            return res.status(400).json({
                success: false,
                message: 'Please provide username and password'
            });
        }

        // Login user
        const user = await User.login(username, password);
        logger.success(`User logged in: ${username} (ID: ${user.id})`, 'AUTH');
        
        // Ensure user has only one stats record
        await User.ensureSingleStatsRecord(user.id);

        await UserQuest.assignDailyQuests(user.id);
        
        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getStats = async (req, res) => {
    try {
        const stats = await User.getStats(req.user.id);
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateStats = async (req, res) => {
    try {
        const { xpDelta, goldDelta } = req.body;
        await User.updateStats(req.user.id, xpDelta, goldDelta);
        const stats = await User.getStats(req.user.id);
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// New controller functions for frontend endpoints

// Calculate XP required for a given level
const calculateXpCap = (playerLevel) => {
    return Math.floor(50 * Math.pow(playerLevel, 1.4));
};

// Get stats for a specific user by ID
exports.getUserStats = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Simple validation
        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        const stats = await User.getStats(userId);
        
        // Return stats in the format expected by the frontend
        res.json(stats);
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update stats for a specific user by ID, with level progression
exports.updateUserStats = async (req, res) => {
    try {
        const { userId } = req.params;
        const { xpDelta = 0, goldDelta = 0, diamondsDelta = 0, level: newLevel, resetXp, cooldownEnd } = req.body;
        
        logger.verbose(`Stats update request for user ${userId}: XP+${xpDelta}, Gold+${goldDelta}, Level=${newLevel}`, 'STATS');
        
        // Simple validation
        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }        // If we're only updating diamonds, handle it separately for efficiency
        if (diamondsDelta !== 0 && xpDelta === 0 && goldDelta === 0 && !newLevel && !resetXp && !cooldownEnd) {
            try {
                const updatedDiamonds = await User.updateDiamonds(userId, diamondsDelta);
                logger.gameAction('Diamond Update', userId, `+${diamondsDelta} diamonds (total: ${updatedDiamonds})`);
                
                // Get updated stats
                const updatedStats = await User.getStats(userId);
                return res.json(updatedStats);
            } catch (error) {
                logger.error('Error updating diamonds', 'STATS', error);
                throw error;
            }
        }
        
        // For other updates, require XP and gold deltas
        if (xpDelta === undefined || goldDelta === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide xpDelta and goldDelta'
            });
        }
          // Get current stats
        const currentStats = await User.getStats(userId);
        logger.verbose(`Current stats: Level ${currentStats.level}, XP ${currentStats.xp}`, 'STATS');
        
        // Check if we need to update the level or if the frontend already calculated it
        let updatedLevel = currentStats.level;
        let updatedXp = currentStats.xp + xpDelta;
        
        // Handle level up scenarios
        if (newLevel && newLevel > currentStats.level) {
            // Frontend already calculated the new level, trust it
            updatedLevel = newLevel;
            logger.gameAction('Level Up', userId, `Level ${currentStats.level} → ${updatedLevel}`);
            
            // Reset XP to 0 if requested
            if (resetXp) {
                updatedXp = 0;
                logger.verbose('XP reset to 0 due to level up', 'STATS');
            }
        } else {
            // Calculate if player should level up based on new XP total
            const currentLevelCap = calculateXpCap(currentStats.level);
            logger.verbose(`XP cap for level ${currentStats.level}: ${currentLevelCap}, XP after gain: ${updatedXp}`, 'STATS');
            
            if (updatedXp >= currentLevelCap) {
                updatedLevel = currentStats.level + 1;
                logger.gameAction('Auto Level Up', userId, `Level ${currentStats.level} → ${updatedLevel}`);
                
                // Reset XP to 0 on level up
                updatedXp = 0;
            }
        }        // Update all stats in one go with absolute XP value
        logger.verbose(`Updating stats: XP=${updatedXp}, Gold=${currentStats.gold + goldDelta}, Level=${updatedLevel}`, 'STATS');
        try {
            await User.updateAllStatsAbsolute(userId, updatedXp, currentStats.gold + goldDelta, updatedLevel, cooldownEnd);
        } catch (updateError) {
            // Check if error is related to cooldownEnd column not existing
            if (updateError.message && updateError.message.includes('cooldownEnd')) {
                logger.verbose('Retrying stats update without cooldown parameter', 'STATS');
                // Try again without the cooldownEnd parameter
                await User.updateAllStatsAbsolute(userId, updatedXp, currentStats.gold + goldDelta, updatedLevel);
            } else {
                // Re-throw the error if it's not related to cooldownEnd
                throw updateError;
            }
        }
        
        // Get updated stats
        const updatedStats = await User.getStats(userId);
        logger.verbose(`Stats updated successfully: Level ${updatedStats.level}, XP ${updatedStats.xp}`, 'STATS');
        
        // Log game action for significant changes
        if (xpDelta > 0 || goldDelta > 0) {
            const changes = [];
            if (xpDelta > 0) changes.push(`+${xpDelta} XP`);
            if (goldDelta > 0) changes.push(`+${goldDelta} Gold`);
            logger.gameAction('Stats Update', userId, changes.join(', '));
        }
        
        // Return updated stats in the format expected by the frontend
        res.json(updatedStats);    } catch (error) {
        logger.error('Error updating user stats', 'STATS', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};