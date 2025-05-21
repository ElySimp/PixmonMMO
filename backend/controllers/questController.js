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
    const { userId, questId } = req.params;
    console.log(`Completing quest for user ${userId}, quest ${questId}`); // 🔍 Debugging log

    try {
        await QuestSystem.completeQuest(userId, questId);
        console.log("Quest successfully marked as completed!"); // ✅ Sukses log
        
        res.json({ success: true, message: 'Quest completed successfully!' });
    } catch (error) {
        console.error("Error completing quest:", error); // 🔍 Error log
        
        res.status(500).json({ success: false, message: error.message });
    }
};