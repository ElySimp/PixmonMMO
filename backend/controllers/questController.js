const db = require('../config/database');
const { QuestSystem } = require('../models/QuestSystem');

exports.getAllQuests = async (req, res) => {
    try {
        console.log("Fetching all quests...");
        const [quests] = await db.query('SELECT * FROM Quest');

        console.log("Quests fetched:", quests);
        res.json(quests);
    } catch (error) {
        console.error("Error fetching quests:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getUserQuests = async (req, res) => {
    const { userId } = req.params;

    try {
        const quests = await UserQuest.getUserQuests(userId);
        
        if (quests.length === 0) {
            return res.json({ success: true, message: "No quests assigned yet", data: [] });
        }

        res.json({ success: true, data: quests });
    } catch (error) {
        console.error("Error fetching user quests:", error);
        res.status(500).json({ error: "Failed to fetch user quests", details: error.message });
    }
};


exports.completeQuest = async (req, res) => {
    try {
        await QuestSystem.completeQuest(req.params.userId, req.params.questId);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.claimDailyMainReward = async (req, res) => {
    const { userId } = req.params;
    try {
        await db.query('UPDATE UserStats SET diamonds = diamonds + 5 WHERE user_id = ?', [userId]);
        await db.query('INSERT INTO UserInventory (item_name, user_id) VALUES (?, ?)', ['Normal Key', userId]);
        res.json({ success: true, message: 'Claimed 5 diamonds & 1 key!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.restoreQuestPoint = async (req, res) => {
  const { userId } = req.params;
  try {
    const [userStats] = await db.query('SELECT diamonds, quest_points FROM UserStats WHERE user_id = ?', [userId]);
    if (userStats[0].diamonds < 1) throw new Error('Not enough diamonds');
    if (userStats[0].quest_points >= 10) throw new Error('Quest points already max');
    await db.query('UPDATE UserStats SET diamonds = diamonds - 1, quest_points = quest_points + 1 WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'Quest point restored!' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};