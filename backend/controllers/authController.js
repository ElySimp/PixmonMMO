const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { UserQuest } = require('../models/QuestSystem'); 

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

exports.register = async (req, res) => {
    try {
        console.log('Register request received:', req.body);
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide username, email and password' 
            });
        }

        // Register user
        const userId = await User.register(username, email, password);
        console.log('User registered with ID:', userId);

        // await User.createUserStats(userId);
        
        const user = await User.findById(userId);
        console.log('User found:', user);
        
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
            return res.status(400).json({
                success: false,
                message: 'Please provide username and password'
            });
        }

        // Login user
        const user = await User.login(username, password);
        
        await User.createUserStats(user.id);

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
        const { xpDelta, goldDelta, level: newLevel, resetXp, cooldownEnd } = req.body;
        
        console.log(`LEVEL DEBUG [Controller] - Received request with level=${newLevel}, userId=${userId}`);
        console.log(`LEVEL DEBUG [Controller] - Full request body:`, req.body);
        
        // Simple validation
        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        if (xpDelta === undefined || goldDelta === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide xpDelta and goldDelta'
            });
        }
        
        // Get current stats
        const currentStats = await User.getStats(userId);
        console.log(`LEVEL DEBUG [Controller] - Current stats from DB: level=${currentStats.level}, xp=${currentStats.xp}`);
        
        // Check if we need to update the level or if the frontend already calculated it
        let updatedLevel = currentStats.level;
        let updatedXp = currentStats.xp + xpDelta;
        
        // Handle level up scenarios
        if (newLevel && newLevel > currentStats.level) {
            // Frontend already calculated the new level, trust it
            updatedLevel = newLevel;
            console.log(`LEVEL DEBUG [Controller] - Using frontend level=${updatedLevel} (was ${currentStats.level})`);
            
            // Reset XP to 0 if requested
            if (resetXp) {
                updatedXp = 0;
                console.log(`LEVEL DEBUG [Controller] - Resetting XP to 0 due to resetXp flag`);
            }
        } else {
            // Calculate if player should level up based on new XP total
            const currentLevelCap = calculateXpCap(currentStats.level);
            console.log(`LEVEL DEBUG [Controller] - XP cap for level ${currentStats.level} is ${currentLevelCap}, current XP after gain would be ${updatedXp}`);
            
            if (updatedXp >= currentLevelCap) {
                updatedLevel = currentStats.level + 1;
                console.log(`LEVEL DEBUG [Controller] - Player leveled up! New level: ${updatedLevel}`);
                
                // Reset XP to 0 on level up
                updatedXp = 0;
            }
        }
          // Update all stats in one go with absolute XP value
        console.log(`LEVEL DEBUG [Controller] - Calling updateAllStatsAbsolute with level=${updatedLevel}`);
        try {
            await User.updateAllStatsAbsolute(userId, updatedXp, currentStats.gold + goldDelta, updatedLevel, cooldownEnd);
        } catch (updateError) {
            // Check if error is related to cooldownEnd column not existing
            if (updateError.message && updateError.message.includes('cooldownEnd')) {
                console.log('LEVEL DEBUG [Controller] - Detected cooldownEnd column issue, trying without cooldown');
                // Try again without the cooldownEnd parameter
                await User.updateAllStatsAbsolute(userId, updatedXp, currentStats.gold + goldDelta, updatedLevel);
            } else {
                // Re-throw the error if it's not related to cooldownEnd
                throw updateError;
            }
        }
        
        // Get updated stats
        const updatedStats = await User.getStats(userId);
        console.log(`LEVEL DEBUG [Controller] - After update, stats from DB: level=${updatedStats.level}, xp=${updatedStats.xp}`);
        
        // Return updated stats in the format expected by the frontend
        res.json(updatedStats);    } catch (error) {
        console.error('Error updating user stats:', error);
        console.error('Error stack:', error.stack);
        console.error('Request body:', req.body);
        console.error('User ID:', userId);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};