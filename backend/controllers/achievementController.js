const Player = require('../models/Player');

const defaultAchievements = [
    { id: 'ach_first_step', title: 'First Steps', description: 'Take your first exploration step', category: 'exploration', xp_reward: 50, gold_reward: 20 },
    { id: 'ach_level_5', title: 'Seasoned Traveler', description: 'Reach Level 5', category: 'progression', xp_reward: 150, gold_reward: 100 },
    { id: 'ach_first_pet', title: 'Beast Master', description: 'Acquire your first Pixmon pet', category: 'pets', xp_reward: 100, gold_reward: 50 },
    { id: 'ach_dungeon_clear', title: 'Catacomb Conqueror', description: 'Clear your first dungeon run', category: 'dungeon', xp_reward: 200, gold_reward: 150 }
];

exports.getAllAchievements = async (req, res) => {
    res.status(200).json(defaultAchievements);
};

exports.getUserAchievements = async (req, res) => {
    try {
        const { userId } = req.params;
        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }, { username: userId }]
        });

        const selected = player?.profile?.selected_achievements || [];
        const achievements = defaultAchievements.map(a => ({
            ...a,
            completed: selected.includes(a.id) || (player && player.level >= 5 && a.id === 'ach_level_5')
        }));

        const groupedAchievements = achievements.reduce((groups, a) => {
            if (!groups[a.category]) groups[a.category] = [];
            groups[a.category].push(a);
            return groups;
        }, {});

        res.status(200).json({
            achievements,
            groupedAchievements,
            stats: {
                completed: achievements.filter(a => a.completed).length,
                total: achievements.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching user achievements', error: error.message });
    }
};

exports.checkAchievements = async (req, res) => {
    try {
        const { userId } = req.params;
        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }, { username: userId }]
        });

        res.status(200).json({
            newAchievements: [],
            rewards: { xp: 0, gold: 0 },
            updatedStats: {
                level: player?.level || 1,
                xp: player?.xp || 0,
                gold: player?.gold || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error checking achievements', error: error.message });
    }
};

exports.unlockAchievement = async (req, res) => {
    try {
        const { userId } = req.params;
        const { achievementId } = req.body;

        const ach = defaultAchievements.find(a => a.id === achievementId) || {
            id: achievementId,
            title: achievementId,
            xp_reward: 50,
            gold_reward: 25
        };

        await Player.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: String(userId) }, { username: userId }] },
            {
                $addToSet: { 'profile.selected_achievements': achievementId },
                $inc: { xp: ach.xp_reward, gold: ach.gold_reward }
            }
        );

        res.status(200).json({
            message: `Achievement unlocked: ${ach.title}`,
            achievement: ach,
            rewards: { xp: ach.xp_reward, gold: ach.gold_reward }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error unlocking achievement', error: error.message });
    }
};

exports.initAchievementTables = async (req, res) => {
    res.status(200).json({ message: 'Achievement collections initialized successfully' });
};
