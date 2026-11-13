const mongoose = require('mongoose');
const moment = require('moment-timezone');
const { QuestTemplate, UserQuestProgress } = require('../models/Quest');
const { UserInventory } = require('../models/Item');
const Player = require('../models/Player');

exports.getAllQuests = async (req, res) => {
    try {
        const quests = await QuestTemplate.find({});
        res.json(quests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserQuests = async (req, res) => {
    const { userId } = req.params;

    try {
        const todayKey = UserQuestProgress.generatePeriodKey('daily');
        const progressList = await UserQuestProgress.find({ userId: String(userId) });
        const allTemplates = await QuestTemplate.find({});
        const progressMap = new Map(progressList.map(p => [p.questId, p]));

        const quests = allTemplates.map(tmpl => {
            const prog = progressMap.get(tmpl.questId);
            return {
                id: tmpl.questId,
                quest_id: tmpl.questId,
                name: tmpl.name,
                description: tmpl.description,
                repeat_type: tmpl.repeatType,
                requirement_type: tmpl.requirementType,
                requirement_target: tmpl.requirementTarget,
                xp_reward: tmpl.xpReward,
                gold_reward: tmpl.goldReward,
                diamond_reward: tmpl.diamondReward,
                progress: prog ? prog.progress : 0,
                target: tmpl.requirementTarget,
                completed: prog ? prog.completed : false,
                claimed: prog ? prog.claimed : false
            };
        });

        res.json({ success: true, data: quests });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user quests', details: error.message });
    }
};

exports.getBountyQuests = async (req, res) => {
    try {
        const quests = await QuestTemplate.find({ repeatType: 'bounty' });
        res.json(quests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserBountyQuests = async (req, res) => {
    const { userId } = req.params;
    try {
        const progressList = await UserQuestProgress.find({ userId: String(userId), repeatType: 'bounty' });
        const bountyTemplates = await QuestTemplate.find({ repeatType: 'bounty' });
        const progressMap = new Map(progressList.map(p => [p.questId, p]));

        const quests = bountyTemplates.map(q => {
            const uq = progressMap.get(q.questId);
            return {
                id: q.questId,
                name: q.name,
                description: q.description,
                xp_reward: q.xpReward,
                gold_reward: q.goldReward,
                repeat_type: q.repeatType,
                completed: uq ? uq.completed : false,
                claimed: uq ? uq.claimed : false,
                last_completed: uq ? uq.claimedAt : null
            };
        });

        res.json({ success: true, data: quests });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.completeQuest = async (req, res) => {
    const { userId, questId } = req.params;
    try {
        const tmpl = await QuestTemplate.findOne({ questId });
        if (!tmpl) {
            return res.status(404).json({ success: false, message: 'Quest template not found' });
        }

        const periodKey = UserQuestProgress.generatePeriodKey(tmpl.repeatType);

        await UserQuestProgress.findOneAndUpdate(
            { userId: String(userId), questId, periodKey },
            {
                $set: {
                    repeatType: tmpl.repeatType,
                    target: tmpl.requirementTarget,
                    progress: tmpl.requirementTarget,
                    completed: true
                }
            },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.claimDailyMainReward = async (req, res) => {
    const { userId } = req.params;
    try {
        const playerFilter = mongoose.Types.ObjectId.isValid(userId)
            ? { $or: [{ _id: userId }, { id: String(userId) }, { username: String(userId) }] }
            : { $or: [{ id: String(userId) }, { username: String(userId) }] };

        const now = moment().tz("Asia/Jakarta");
        const startOfToday = now.clone().startOf('day').toDate();

        // Atomic update: only succeeds if lastDailyMainReward is null or prior to today in Jakarta
        const updatedPlayer = await Player.findOneAndUpdate(
            {
                ...playerFilter,
                $or: [
                    { lastDailyMainReward: null },
                    { lastDailyMainReward: { $exists: false } },
                    { lastDailyMainReward: { $lt: startOfToday } }
                ]
            },
            {
                $inc: { diamonds: 5 },
                $set: {
                    lastDailyMainReward: new Date(),
                    'dailyRewards.lastDailyMainReward': new Date()
                }
            },
            { new: true }
        );

        if (!updatedPlayer) {
            const playerExists = await Player.findOne(playerFilter);
            if (!playerExists) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            return res.status(400).json({ success: false, message: 'Main reward already claimed today' });
        }

        // Add 1 Normal Key (Steel Key) atomically with unique compound index protection
        await UserInventory.findOneAndUpdate(
            { userId: String(userId), itemId: 'key_steel' },
            { $inc: { amount: 1 } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, message: 'Main reward claimed: 5 diamonds & 1 Normal Key' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.claimQuestReward = async (req, res) => {
    const { userId, questId } = req.params;
    try {
        const tmpl = await QuestTemplate.findOne({ questId });
        if (!tmpl) {
            return res.status(404).json({ success: false, message: 'Quest not found' });
        }

        const periodKey = UserQuestProgress.generatePeriodKey(tmpl.repeatType);

        // Atomic conditional update: only claim if completed is true and claimed is false
        const progress = await UserQuestProgress.findOneAndUpdate(
            {
                userId: String(userId),
                questId: String(questId),
                periodKey,
                completed: true,
                claimed: false
            },
            {
                $set: {
                    claimed: true,
                    claimedAt: new Date()
                }
            },
            { new: true }
        );

        // If no document was modified, determine the exact state for informative response
        if (!progress) {
            const existing = await UserQuestProgress.findOne({
                userId: String(userId),
                questId: String(questId),
                periodKey
            });

            if (!existing || !existing.completed) {
                return res.status(400).json({ success: false, message: 'Quest not completed' });
            }
            return res.status(400).json({ success: false, message: 'Quest already claimed' });
        }

        // Award rewards atomically to player
        const playerFilter = mongoose.Types.ObjectId.isValid(userId)
            ? { $or: [{ _id: userId }, { id: String(userId) }, { username: String(userId) }] }
            : { $or: [{ id: String(userId) }, { username: String(userId) }] };

        await Player.findOneAndUpdate(
            playerFilter,
            {
                $inc: {
                    xp: tmpl.xpReward || 0,
                    gold: tmpl.goldReward || 0,
                    diamonds: tmpl.diamondReward || 0
                }
            }
        );

        // Award item rewards if defined in template
        if (tmpl.itemRewards && Array.isArray(tmpl.itemRewards) && tmpl.itemRewards.length > 0) {
            for (const reward of tmpl.itemRewards) {
                await UserInventory.findOneAndUpdate(
                    { userId: String(userId), itemId: reward.itemId },
                    { $inc: { amount: reward.amount || 1 } },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }
        }

        res.json({ success: true, message: 'Quest reward claimed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.restoreQuestPoint = async (req, res) => {
    const { userId } = req.params;
    try {
        const playerFilter = mongoose.Types.ObjectId.isValid(userId)
            ? { $or: [{ _id: userId }, { id: String(userId) }, { username: String(userId) }] }
            : { $or: [{ id: String(userId) }, { username: String(userId) }] };

        // Atomically deduct 1 diamond and add 1 quest point if diamonds >= 1 and questPoints < 10
        const player = await Player.findOneAndUpdate(
            {
                ...playerFilter,
                diamonds: { $gte: 1 },
                questPoints: { $lt: 10 }
            },
            {
                $inc: { diamonds: -1, questPoints: 1 }
            },
            { new: true }
        );

        if (!player) {
            const existing = await Player.findOne(playerFilter);
            if (!existing) return res.status(404).json({ success: false, message: 'User not found' });
            if (existing.diamonds < 1) return res.status(400).json({ success: false, message: 'Not enough diamonds' });
            return res.status(400).json({ success: false, message: 'Quest points already max' });
        }

        res.json({ success: true, message: 'Quest point restored!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.decrementQuestPoint = async (req, res) => {
    const { userId } = req.params;
    try {
        const playerFilter = mongoose.Types.ObjectId.isValid(userId)
            ? { $or: [{ _id: userId }, { id: String(userId) }, { username: String(userId) }] }
            : { $or: [{ id: String(userId) }, { username: String(userId) }] };

        const player = await Player.findOneAndUpdate(
            {
                ...playerFilter,
                questPoints: { $gt: 0 }
            },
            {
                $inc: { questPoints: -1 }
            },
            { new: true }
        );

        if (!player) {
            return res.status(400).json({ success: false, message: 'Not enough quest points' });
        }

        res.json({ success: true, message: 'Quest point decremented' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.startBountyQuest = async (req, res) => {
    const { userId, questId } = req.params;
    try {
        const tmpl = await QuestTemplate.findOne({ questId });
        if (!tmpl) {
            return res.status(404).json({ success: false, message: 'Bounty quest not found' });
        }

        const periodKey = UserQuestProgress.generatePeriodKey('bounty');
        await UserQuestProgress.findOneAndUpdate(
            { userId: String(userId), questId, periodKey },
            {
                $set: {
                    repeatType: 'bounty',
                    target: tmpl.requirementTarget,
                    progress: 0,
                    completed: false,
                    claimed: false
                }
            },
            { upsert: true }
        );

        res.json({ success: true, message: 'Bounty quest started' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getServerTime = (req, res) => {
    const now = moment().tz("Asia/Jakarta");
    const nextReset = now.clone().hour(7).minute(0).second(0);
    if (now.isAfter(nextReset)) nextReset.add(1, 'day');
    res.json({
        serverTime: now.format(),
        nextDailyReset: nextReset.format()
    });
};
