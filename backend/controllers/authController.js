const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Player = require('../models/Player');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'as9d8f7a98sdf7a9s8df7a9s8d7fa8sd7f89a7sdf';

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id || user._id.toString(), username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Validate token helper
const validateToken = async (token) => {
    try {
        if (!token) return { valid: false, message: 'No token provided' };

        const decoded = jwt.verify(token, JWT_SECRET);
        const player = await Player.findOne({
            $or: [{ _id: decoded.id }, { id: String(decoded.id) }]
        });

        if (!player) {
            return { valid: false, message: 'User not found' };
        }

        return { valid: true, user: player };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return { valid: false, message: 'Token expired' };
        }
        return { valid: false, message: 'Invalid token' };
    }
};

exports.register = async (req, res) => {
    try {
        logger.debug(`Registration attempt for: ${req.body.username}`, 'AUTH');
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            logger.warning('Registration failed: Missing required fields', 'AUTH');
            return res.status(400).json({
                success: false,
                message: 'Please provide username, email and password'
            });
        }

        // Check if username or email already exists
        const existing = await Player.findOne({
            $or: [{ username: username.toLowerCase().trim() }, { email: email.toLowerCase().trim() }]
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: existing.username === username.toLowerCase().trim() 
                    ? 'Username already taken' 
                    : 'Email already registered'
            });
        }

        const player = await Player.create({
            username: username.trim(),
            email: email.trim(),
            password: password
        });

        logger.success(`User registered successfully: ${player.username} (ID: ${player.id})`, 'AUTH');

        const token = generateToken(player);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: player,
                token
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            logger.warning('Login failed: Missing credentials', 'AUTH');
            return res.status(400).json({
                success: false,
                message: 'Please provide username and password'
            });
        }

        const player = await Player.findOne({
            username: username.toLowerCase().trim()
        }).select('+password');

        if (!player) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await player.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        logger.success(`User logged in: ${player.username} (ID: ${player.id})`, 'AUTH');

        const token = generateToken(player);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: player,
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
        const player = await Player.findOne({
            $or: [{ _id: req.user.id }, { id: String(req.user.id) }]
        });

        if (!player) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: player
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
        const player = await Player.findOne({
            $or: [{ _id: req.user.id }, { id: String(req.user.id) }]
        });

        if (!player) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                user_id: player.id || player._id.toString(),
                level: player.level,
                xp: player.xp,
                gold: player.gold,
                diamonds: player.diamonds,
                quest_points: player.questPoints,
                energy: player.energy,
                combat_stats: player.combatStats
            }
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
        const { xpDelta = 0, goldDelta = 0 } = req.body;

        const player = await Player.findOneAndUpdate(
            { $or: [{ _id: req.user.id }, { id: String(req.user.id) }] },
            { $inc: { xp: xpDelta, gold: goldDelta } },
            { new: true }
        );

        if (!player) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                user_id: player.id || player._id.toString(),
                level: player.level,
                xp: player.xp,
                gold: player.gold,
                diamonds: player.diamonds,
                quest_points: player.questPoints
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const calculateXpCap = (playerLevel) => {
    return Math.floor(50 * Math.pow(playerLevel, 1.4));
};

exports.getUserStats = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }, { username: userId }]
        });

        if (!player) {
            return res.status(404).json({
                success: false,
                message: 'User stats not found'
            });
        }

        res.json({
            user_id: player.id || player._id.toString(),
            level: player.level,
            xp: player.xp,
            gold: player.gold,
            diamonds: player.diamonds,
            quest_points: player.questPoints,
            energy: player.energy?.current || 10,
            energy_max: player.energy?.max || 10,
            cooldownEnd: player.cooldownEnd || player.exploration?.cooldownEnd
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateUserStats = async (req, res) => {
    try {
        const { userId } = req.params;
        const { xpDelta = 0, goldDelta = 0, diamondsDelta = 0, level: newLevel, resetXp, cooldownEnd } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const playerFilter = mongoose.Types.ObjectId.isValid(userId)
            ? { $or: [{ _id: userId }, { id: String(userId) }, { username: String(userId) }] }
            : { $or: [{ id: String(userId) }, { username: String(userId) }] };

        const incOps = {};
        const setOps = {};

        if (goldDelta) incOps.gold = Number(goldDelta);
        if (diamondsDelta) incOps.diamonds = Number(diamondsDelta);
        if (xpDelta && !resetXp) incOps.xp = Number(xpDelta);

        if (newLevel !== undefined) {
            setOps.level = Number(newLevel);
        }
        if (resetXp) {
            setOps.xp = 0;
        }
        if (cooldownEnd !== undefined) {
            setOps.cooldownEnd = cooldownEnd ? new Date(cooldownEnd) : null;
        }

        const updateOps = {};
        if (Object.keys(incOps).length > 0) updateOps.$inc = incOps;
        if (Object.keys(setOps).length > 0) updateOps.$set = setOps;

        let player;
        if (Object.keys(updateOps).length > 0) {
            player = await Player.findOneAndUpdate(
                playerFilter,
                updateOps,
                { new: true }
            );
        } else {
            player = await Player.findOne(playerFilter);
        }

        if (!player) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Automatic level-up calculation if XP crosses threshold and level was not explicitly passed
        if (newLevel === undefined && player.xp > 0) {
            const xpCap = calculateXpCap(player.level);
            if (player.xp >= xpCap) {
                player = await Player.findOneAndUpdate(
                    {
                        ...playerFilter,
                        level: player.level, // Optimistic guard against duplicate concurrent level increments
                        xp: { $gte: xpCap }
                    },
                    {
                        $inc: { level: 1 },
                        $set: { xp: 0 }
                    },
                    { new: true }
                ) || player;
            }
        }

        res.json({
            user_id: player.id || player._id.toString(),
            level: player.level,
            xp: player.xp,
            gold: player.gold,
            diamonds: player.diamonds,
            quest_points: player.questPoints,
            cooldownEnd: player.cooldownEnd
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getUser = async (req, res) => {
    try {
        const player = await Player.findOne({
            $or: [{ _id: req.params.id }, { id: String(req.params.id) }]
        });

        if (!player) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: player
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    register: exports.register,
    login: exports.login,
    getMe: exports.getMe,
    getStats: exports.getStats,
    updateStats: exports.updateStats,
    getUserStats: exports.getUserStats,
    updateUserStats: exports.updateUserStats,
    getUser: exports.getUser,
    validateToken
};
