const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('./models/User');
const Achievement = require('./models/Achievement');
<<<<<<< HEAD
const Inventory = require('./models/Inventory');
const inventoryController = require('./controllers/inventoryController');
=======
const { initializeTables, QuestSystem, UserQuest } = require('./models/QuestSystem'); // ✅ Tambahkan QuestSystem!
>>>>>>> dbd15927dc7a352f0b9c1b16c5ca51be01985a3e
const authController = require('./controllers/authController');
const achievementController = require('./controllers/achievementController');
const questController = require('./controllers/questController');
const { protect } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
(async () => {
    try {
        await User.createTable();
        console.log('Database initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
})();

// Initialize UserStats table
(async () => {
    try {
        await User.createStatsTable();
        console.log('UserStats table initialized');
    } catch (error) {
        console.error('UserStats table initialization error:', error);
    }
})();

// Initialize Achievement tables
(async () => {
    try {
        await Achievement.createTable();
        await Achievement.createUserAchievementsTable();
        console.log('Achievement tables initialized');
    } catch (error) {
        console.error('Achievement tables initialization error:', error);
    }
})();

<<<<<<< HEAD
// 
(async () => {
    try {
        await Inventory.createIndexInvtable();
        await Inventory.createUserInventory();
        console.log('Achievement tables initialized');
    } catch (error) {
        console.error('Achievement tables initialization error:', error);
=======
// Initialize Quest tables
(async () => {
    try {
        await initializeTables();
        console.log('Quest tables initialized');
    } catch (error) {
        console.error('Quest tables initialization error:', error);
>>>>>>> dbd15927dc7a352f0b9c1b16c5ca51be01985a3e
    }
})();

// Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', protect, authController.getMe);

// Original stats routes
app.get('/api/user/stats', protect, authController.getStats);
app.post('/api/user/stats', protect, authController.updateStats);

// New routes to match frontend endpoints
app.get('/api/users/:userId/stats', authController.getUserStats);
app.post('/api/users/:userId/update-stats', authController.updateUserStats);

// Achievement routes
app.get('/api/achievements', achievementController.getAllAchievements);
app.get('/api/users/:userId/achievements', achievementController.getUserAchievements);
app.post('/api/users/:userId/check-achievements', achievementController.checkAchievements);
app.post('/api/users/:userId/unlock-achievement', achievementController.unlockAchievement);
app.post('/api/init-achievements', achievementController.initAchievementTables);

<<<<<<< HEAD
// Inventory Route
app.get('/api/inventory', inventoryController.getAllInventory);
app.get('/api/users/:userId/inventoryCount', inventoryController.getInventoryCount);

=======
// Quest Routes
app.get('/api/quests', questController.getAllQuests);
app.post('/api/user/:userId/quest/:questId/complete', questController.completeQuest);

app.get('/api/user/:userId/quests', async (req, res) => {
    try {
        const quests = await UserQuest.getUserQuests(req.params.userId);
        res.json(quests);
    } catch (error) {
        console.error("Error fetching user quests:", error);
        res.status(500).json({ error: "Failed to fetch user quests", details: error.message });
    }
});

app.post('/api/user/:userId/quest/:questId/claim', async (req, res) => {
    try {
        await QuestSystem.claimQuestReward(req.params.userId, req.params.questId);
        res.json({ success: true, message: "Quest reward claimed!" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// app.post('/api/user/:userId/regenerate-quest-points', async (req, res) => {
//     try {
//         await QuestSystem.regenerateQuestPoints(req.params.userId);
//         res.json({ success: true, message: "Quest points regenerated successfully" });
//     } catch (error) {
//         console.error("Error regenerating quest points:", error);
//         res.status(500).json({ error: "Failed to regenerate quest points", details: error.message });
//     }
// });

// app.post('/api/user/:userId/bounty-quest/:questId/start', async (req, res) => {
//     try {
//         await QuestSystem.startBountyQuest(req.params.userId, req.params.questId);
//         res.json({ success: true, message: "Bounty quest started successfully" });
//     } catch (error) {
//         console.error("Error starting bounty quest:", error);
//         res.status(500).json({ error: "Failed to start bounty quest", details: error.message });
//     }
// });
>>>>>>> dbd15927dc7a352f0b9c1b16c5ca51be01985a3e

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});