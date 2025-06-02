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
const { initializeTables, QuestSystem, UserQuest } = require('./models/QuestSystem');
const authController = require('./controllers/authController');
const achievementController = require('./controllers/achievementController');
const questController = require('./controllers/questController');
const userProfileController = require('./controllers/userProfileController');
const petsController = require('./controllers/petsController');
const { protect } = require('./middleware/auth');
const checkAndFixDuplicateStats = require('./scripts/maintenance/check-and-fix-stats');

const app = express();

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

// Initialize Inventory tables
(async () => {
    try {
        await Inventory.createIndexInvtable();
        await Inventory.createUserInventory();
        console.log('Inventory tables initialized');
    } catch (error) {
        console.error('Inventory tables initialization error:', error);
    }
})();

// Initialize Pets tables
(async () => {
    try {
        await petsController.createPetsTables(); 
        console.log('Pets tables initialized');
    } catch (err) {
        console.error('Pets table error:', err);
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

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', protect, authController.getMe);

// User Stats Routes
app.get('/api/user/stats', protect, authController.getStats);
app.post('/api/user/stats', protect, authController.updateStats);
app.get('/api/users/:userId/stats', authController.getUserStats);
app.post('/api/users/:userId/update-stats', authController.updateUserStats);

// Achievement Routes
app.get('/api/achievements', achievementController.getAllAchievements);
app.get('/api/users/:userId/achievements', achievementController.getUserAchievements);
app.post('/api/users/:userId/check-achievements', achievementController.checkAchievements);
app.post('/api/users/:userId/unlock-achievement', achievementController.unlockAchievement);
app.post('/api/init-achievements', achievementController.initAchievementTables);

// UserProfile Routes - FIXED
app.get('/api/userprofile/:userId', protect, userProfileController.getUserProfile);
app.patch('/api/userprofile/:userId', protect, userProfileController.updateUserProfile);

// Skill Points Routes
app.put('/api/userprofile/:userId/skills', protect, userProfileController.updateSkillPoints);
app.post('/api/userprofile/:userId/reset-skills', protect, userProfileController.resetSkillPoints);

// File Upload Routes - FIXED
app.post('/api/userprofile/:userId/upload-wallpaper', 
    protect,
    userProfileController.uploadSingle('wallpaper'), 
    userProfileController.uploadCustomWallpaper
);

app.post('/api/userprofile/:userId/upload-avatar', 
    protect,
    userProfileController.uploadSingle('avatar'), 
    userProfileController.uploadAvatar
);

// Wallpaper and Pet Routes
app.get('/api/wallpapers/all', userProfileController.getAllWallpapers);
app.get('/api/wallpapers/:wallpaperId', userProfileController.getWallpaper);
app.get('/api/pets/:petId', userProfileController.getPet);

// Initialization Routes
app.post('/api/init-userprofile', userProfileController.initUserProfileTables);

// Inventory Routes
app.get('/api/users/:userId/inventoryGet', inventoryController.getAllInventory);
app.get('/api/users/:userId/inventoryCount', inventoryController.getInventoryCount);
app.get('/api/inventoryIndex', inventoryController.getInventoryIndex);

// Quest Routes
app.get('/api/quests', questController.getAllQuests);
app.post('/api/user/:userId/quest/:questId/complete', questController.completeQuest);

// User Quest Routes
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

// Quest Point Management Routes
app.post('/api/user/:userId/decrement-quest-point', questController.decrementQuestPoint);
app.post('/api/user/:userId/claim-daily-main-reward', questController.claimDailyMainReward);
app.post('/api/user/:userId/restore-quest-point', questController.restoreQuestPoint);
app.post('/api/user/:userId/quest/:questId/start', questController.startBountyQuest);

// Pets Routes
app.get('/api/users/:userId/userPetGet', petsController.PetsDataObtain);

// Overlay Profile Route
app.get('/api/user/overlay-profile', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const overlayData = await User.getOverlayProfileData(userId);
        
        if (!overlayData) {
            return res.status(404).json({ error: 'User data not found' });
        }
        
        res.json({
            username: overlayData.username,
            level: overlayData.level,
            xp: overlayData.xp,
            gold: overlayData.gold,
            diamonds: overlayData.diamonds,
            questPoints: overlayData.quest_points,
            energyPoints: overlayData.energy_points || 2,
            energyTimer: overlayData.energy_timer || '4h 09:40',
            questCompleted: overlayData.quest_completed,
            questClaimed: overlayData.quest_claimed
        });
    } catch (error) {
        console.error('Error fetching overlay profile:', error);
        res.status(500).json({ error: 'Failed to fetch overlay profile data' });
    }
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Handle multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
    }
    
    // Handle file type errors
    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
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
        await Achievement.createTable();
        await Achievement.createUserAchievementsTable();
        await Inventory.createIndexInvtable();
        await Inventory.createUserInventory();
        await initializeTables(); // Quest tables
        await petsController.createPetsTables();
        
        console.log('All database tables initialized successfully');
        
        // Check for and fix any duplicate stats records
        try {
            await checkAndFixDuplicateStats();
        } catch (statsError) {
            console.error('Warning: Could not fix duplicate stats:', statsError);
        }
        
        // Schedule periodic monitoring of UserStats table
        try {
            const scheduleMonitoring = require('./scripts/monitoring/schedule-monitoring');
            scheduleMonitoring();
        } catch (monitorError) {
            console.error('Warning: Could not schedule UserStats monitoring:', monitorError);
        }
    } catch (error) {
        console.error('Error initializing database tables:', error);
        throw error;
    }
}

// Initialize database on server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    try {
        await initializeDatabaseTables();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        // Don't exit process, let server continue to run
    }
});