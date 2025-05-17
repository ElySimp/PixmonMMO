const Achievement = require('../models/Achievement');
const User = require('../models/User');

// Get all achievements (used by admin or for displaying all possible achievements)
exports.getAllAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.getAllAchievements();
        res.status(200).json(achievements);
    } catch (error) {
        console.error('Error fetching all achievements:', error);
        res.status(500).json({ message: 'Server error fetching achievements', error: error.message });
    }
};

// Get a user's achievements with completion status
exports.getUserAchievements = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        const achievements = await Achievement.getUserAchievements(userId);
        
        // Group achievements by category for easier frontend organization
        const groupedAchievements = achievements.reduce((groups, achievement) => {
            if (!groups[achievement.category]) {
                groups[achievement.category] = [];
            }
            groups[achievement.category].push(achievement);
            return groups;
        }, {});
        
        res.status(200).json({
            achievements: achievements,
            groupedAchievements: groupedAchievements,
            stats: {
                completed: achievements.filter(a => a.completed).length,
                total: achievements.length
            }
        });
    } catch (error) {
        console.error(`Error fetching achievements for user ${req.params.userId}:`, error);
        res.status(500).json({ message: 'Server error fetching user achievements', error: error.message });
    }
};

// Check for new achievements based on user stats and other progress
exports.checkAchievements = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { progressData } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        // Get the user's current stats
        const userStats = await User.getStats(userId);
        
        // Check which achievements should be unlocked
        const newAchievements = await Achievement.checkForAchievements(userId, userStats, progressData);
        
        // Calculate total rewards
        let totalXpReward = 0;
        let totalGoldReward = 0;
        
        newAchievements.forEach(achievement => {
            totalXpReward += achievement.xp_reward;
            totalGoldReward += achievement.gold_reward;
        });
        
        // Update user stats if any rewards were earned
        if (totalXpReward > 0 || totalGoldReward > 0) {
            await User.updateStats(userId, totalXpReward, totalGoldReward);
            
            // Get updated stats
            const updatedStats = await User.getStats(userId);
            
            res.status(200).json({
                newAchievements: newAchievements,
                rewards: {
                    xp: totalXpReward,
                    gold: totalGoldReward
                },
                updatedStats: updatedStats
            });
        } else {
            res.status(200).json({
                newAchievements: newAchievements,
                rewards: {
                    xp: 0,
                    gold: 0
                }
            });
        }
    } catch (error) {
        console.error(`Error checking achievements for user ${req.params.userId}:`, error);
        res.status(500).json({ message: 'Server error checking achievements', error: error.message });
    }
};

// Manually unlock an achievement for testing purposes - admin only
exports.unlockAchievement = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { achievementId } = req.body;
        
        if (!userId || !achievementId) {
            return res.status(400).json({ message: 'User ID and Achievement ID are required' });
        }
        
        const result = await Achievement.unlockAchievement(userId, achievementId);
        
        if (result.unlocked) {
            // Update user stats with rewards
            if (result.rewards.xp > 0 || result.rewards.gold > 0) {
                await User.updateStats(userId, result.rewards.xp, result.rewards.gold);
            }
            
            res.status(200).json({
                message: `Achievement unlocked: ${result.achievement.title}`,
                achievement: result.achievement,
                rewards: result.rewards
            });
        } else if (result.alreadyUnlocked) {
            res.status(200).json({
                message: 'Achievement was already unlocked',
                alreadyUnlocked: true
            });
        } else {
            res.status(400).json({
                message: 'Failed to unlock achievement'
            });
        }
    } catch (error) {
        console.error(`Error unlocking achievement for user ${req.params.userId}:`, error);
        res.status(500).json({ message: 'Server error unlocking achievement', error: error.message });
    }
};

// Initialize achievement tables
exports.initAchievementTables = async (req, res) => {
    try {
        await Achievement.createTable();
        await Achievement.createUserAchievementsTable();
        
        res.status(200).json({
            message: 'Achievement tables initialized successfully'
        });
    } catch (error) {
        console.error('Error initializing achievement tables:', error);
        res.status(500).json({ message: 'Server error initializing achievement tables', error: error.message });
    }
};
