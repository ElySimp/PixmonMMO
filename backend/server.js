const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('./models/User');
const Achievement = require('./models/Achievement');
const Inventory = require('./models/Inventory');
const UserProfile = require('./models/UserProfile');
const inventoryController = require('./controllers/inventoryController');
const { initializeTables, QuestSystem, UserQuest } = require('./models/QuestSystem'); // ✅ Tambahkan QuestSystem!
const authController = require('./controllers/authController');
const achievementController = require('./controllers/achievementController');
const questController = require('./controllers/questController');
const userProfileController = require('./controllers/userProfileController');
const { protect } = require('./middleware/auth');
const checkAndFixDuplicateStats = require('./scripts/maintenance/check-and-fix-stats');

const app = express();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


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

// Initialize UserProfile tables
(async () => {
    try {
        await UserProfile.createTable();
        await UserProfile.createWallpapersTable();
        console.log('UserProfile tables initialized');
    } catch (error) {
        console.error('UserProfile tables initialization error:', error);
    }
})();


(async () => {
    try {
        await Inventory.createIndexInvtable();
        await Inventory.createUserInventory();
        console.log('Inventory tables initialized');
    } catch (error) {
        console.error('Inventory tables initialization error:', error);
    }
})();

// Initialize Quest tables
(async () => {
    try {
        await initializeTables();
        console.log('Quest tables initialized');
    } catch (error) {
        console.error('Quest tables initialization error:', error);
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

// UserProfile routes
app.get('/api/userprofile/:userId', protect, userProfileController.getUserProfile);
app.patch('/api/userprofile/:userId', protect, userProfileController.updateUserProfile);
app.put('/api/userprofile/:userId/skills', protect, userProfileController.updateSkillPoints);
app.post('/api/userprofile/:userId/reset-skills', protect, userProfileController.resetSkillPoints);
app.get('/api/wallpapers/:wallpaperId', userProfileController.getWallpaper);
app.get('/api/pets/:petId', userProfileController.getPet);
app.post('/api/upload-wallpaper', upload.single('wallpaper'), userProfileController.uploadWallpaper);
app.post('/api/init-userprofile', userProfileController.initUserProfileTables);

// Inventory Route
app.get('/api/users/:userId/inventoryGet', inventoryController.getAllInventory); // user data
app.get('/api/users/:userId/inventoryCount', inventoryController.getInventoryCount); // user data count
app.get('/api/inventoryIndex', inventoryController.getInventoryIndex);



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

app.post('/api/user/:userId/decrement-quest-point', questController.decrementQuestPoint);
app.post('/api/user/:userId/claim-daily-main-reward', questController.claimDailyMainReward);
app.post('/api/user/:userId/restore-quest-point', questController.restoreQuestPoint);
app.post('/api/user/:userId/quest/:questId/start', questController.startBountyQuest);
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

// Initialize database tables
async function initializeDatabaseTables() {
    try {
        // Create tables in the correct order
        await User.createTable();
        await User.createStatsTable();
        await UserProfile.createTable();
        await UserProfile.createWallpapersTable();
        
        console.log('All database tables initialized successfully');
        
        // Check for and fix any duplicate stats records
        await checkAndFixDuplicateStats();
        
        // Schedule periodic monitoring of UserStats table
        try {
            const scheduleMonitoring = require('./scripts/schedule-monitoring');
            scheduleMonitoring();
        } catch (monitorError) {
            console.error('Warning: Could not schedule UserStats monitoring:', monitorError);
        }
    } catch (error) {
        console.error('Error initializing database tables:', error);
        throw error;
    }
}

// Call initialization when starting server
app.on('ready', async () => {
    try {
        await initializeDatabaseTables();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
