const db = require('../config/database');
const { QuestSystem } = require('../models/QuestSystem');

exports.getAllQuests = async (req, res) => {
    try {
        // Fetching all quests - verbose logging removed
        const [quests] = await db.query('SELECT * FROM Quest');

        // Quest data retrieved successfully
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
        res.json({ success: true, message: 'Claimed 5 diamonds' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.restoreQuestPoint = async (req, res) => {
  const { userId } = req.params;
  try {
    // Ambil diamond dan quest_points user
    const [userStats] = await db.query('SELECT diamonds, quest_points FROM UserStats WHERE user_id = ?', [userId]);
    if (!userStats[0]) return res.status(404).json({ success: false, message: 'User not found' });
    if (userStats[0].diamonds < 1) return res.status(400).json({ success: false, message: 'Not enough diamonds' });
    if (userStats[0].quest_points >= 10) return res.status(400).json({ success: false, message: 'Quest points already max' });

    await db.query('UPDATE UserStats SET diamonds = diamonds - 1, quest_points = quest_points + 1 WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'Quest point restored!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.decrementQuestPoint = async (req, res) => {
  const { userId } = req.params;
  try {
    // Cek quest point user
    const [userStats] = await db.query('SELECT quest_points FROM UserStats WHERE user_id = ?', [userId]);
    if (!userStats[0] || userStats[0].quest_points <= 0) {
      return res.status(400).json({ success: false, message: 'Not enough quest points' });
    }
    await db.query('UPDATE UserStats SET quest_points = quest_points - 1 WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'Quest point decremented' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.startBountyQuest = async (req, res) => {
  const { userId, questId } = req.params;
  try {
    await QuestSystem.startBountyQuest(userId, questId);
    res.json({ success: true, message: 'Bounty quest started' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};