const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import logger
const logger = require('./utils/logger');

const User = require('./models/User');
const Achievement = require('./models/Achievement');
const Inventory = require('./models/Inventory');
const UserProfile = require('./models/UserProfile');
const DailyRewards = require('./models/DailyRewards');
const inventoryController = require('./controllers/inventoryController');
const { initializeTables, QuestSystem, UserQuest } = require('./models/QuestSystem');
const authController = require('./controllers/authController');
const achievementController = require('./controllers/achievementController');
const questController = require('./controllers/questController');
const userProfileController = require('./controllers/userProfileController');
const dailyRewardsController = require('./controllers/dailyRewardsController');
const petsController = require('./controllers/petsController');
const { protect } = require('./middleware/auth');
const checkAndFixDuplicateStats = require('./scripts/maintenance/check-and-fix-stats');
const userProfileRoutes = require('./routes/userProfileRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        logger.request(req);
        next();
    });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database initialization function
async function initializeDatabaseTables() {    const initSteps = [
        'UserLogin Table',
        'UserStats Table', 
        'Achievement Tables',
        'UserProfile Tables',
        'DailyRewards Table',
        'Inventory Tables',
        'Pets Tables',
        'Quest Tables',
        'Final Check & Cleanup'
    ];

    logger.dbInitStart(initSteps);

    try {
        // Initialize UserLogin table
        logger.dbStep('UserLogin Table', 'running');
        await User.createTable();
        logger.dbStep('UserLogin Table', 'success');

        // Initialize UserStats table
        logger.dbStep('UserStats Table', 'running');
        await User.createStatsTable();
        logger.dbStep('UserStats Table', 'success');

        // Initialize Achievement tables
        logger.dbStep('Achievement Tables', 'running');
        await Achievement.createTable();
        await Achievement.createUserAchievementsTable();
        logger.dbStep('Achievement Tables', 'success');        // Initialize UserProfile tables
        logger.dbStep('UserProfile Tables', 'running');
        await UserProfile.createTable();
        await UserProfile.createWallpapersTable();
        logger.dbStep('UserProfile Tables', 'success');
        
        // Initialize DailyRewards table
        logger.dbStep('DailyRewards Table', 'running');
        await DailyRewards.createTable();
        logger.dbStep('DailyRewards Table', 'success');

        // Initialize Inventory tables
        logger.dbStep('Inventory Tables', 'running');
        await Inventory.createIndexInvtable();
        await Inventory.createUserInventory();
        await Inventory.createGachaResult();
        logger.dbStep('Inventory Tables', 'success');

        // Initialize Pets tables
        logger.dbStep('Pets Tables', 'running');
        await petsController.createPetsTables();
        logger.dbStep('Pets Tables', 'success');

        // Initialize Quest tables
        logger.dbStep('Quest Tables', 'running');
        await initializeTables();
        logger.dbStep('Quest Tables', 'success');        // Final check
        logger.dbStep('Final Check & Cleanup', 'running');
        
        // Check for and fix any duplicate stats records
        try {
            await checkAndFixDuplicateStats();
            logger.debug('Duplicate stats check completed', 'MAINTENANCE');
        } catch (statsError) {
            logger.warning('Could not fix duplicate stats', 'MAINTENANCE');
        }
        
        // Schedule periodic monitoring of UserStats table
        try {
            const scheduleMonitoring = require('./scripts/monitoring/schedule-monitoring');
            scheduleMonitoring();
            logger.debug('UserStats monitoring scheduled', 'MAINTENANCE');
        } catch (monitorError) {
            logger.warning('Could not schedule UserStats monitoring', 'MAINTENANCE');
        }
        
        logger.dbStep('Final Check & Cleanup', 'success');

        logger.dbInitComplete();
        
    } catch (error) {
        logger.error('Database initialization failed', 'DATABASE', error);
        throw error;
    }
}

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', protect, authController.getMe);
app.get('/api/userlogin/:id', protect, authController.getUser); // Added for profile compatibility


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
app.put('/api/userprofile/:userId', protect, userProfileController.updateUserProfile);
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
app.post('/api/init-daily-rewards', dailyRewardsController.initDailyRewardsTable);

// Daily Rewards Routes
app.get('/api/users/:userId/daily-rewards', dailyRewardsController.getUserDailyRewards);
app.post('/api/users/:userId/claim-daily-reward', dailyRewardsController.claimDailyReward);

// Inventory Routes
app.get('/api/users/:userId/inventoryGet', inventoryController.getAllInventory);
app.get('/api/users/:userId/inventoryCount', inventoryController.getInventoryCount);
app.get('/api/inventoryIndex', inventoryController.getInventoryIndex);
app.get('/api/users/:userId/tenPull', inventoryController.gachaResult);
app.get('/api/users/:userId/onePull', inventoryController.gachaResultSingle);
app.get('/api/users/:userId/NormalObtain', inventoryController.NormalKeyObtain);
app.get('/api/users/:userId/MythicalObtain', inventoryController.MythicalKeyObtain);
app.get('/api/users/:userId/:index_id/ItemUse', inventoryController.ItemUsage);
app.get('/api/users/:userId/:index_id/itemInput', inventoryController.ItemInput);


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

// Legacy Pets Routes
const petsRoutes = require('./routes/petsRoutes');
app.use('/api/pets', petsRoutes);

// New Optimized Pets Routes
const optimizedPetsRoutes = require('./routes/optimizedPetsRoutes');
app.use('/api/v2/pets', optimizedPetsRoutes);

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

// Log route registration summary
logger.separator('API Routes Registered');
logger.info('✅ Authentication routes: /api/auth/*', 'ROUTES');
logger.info('✅ User stats routes: /api/user/stats, /api/users/:userId/stats', 'ROUTES');
logger.info('✅ Achievement routes: /api/achievements, /api/users/:userId/achievements', 'ROUTES');
logger.info('✅ Daily rewards routes: /api/users/:userId/daily-rewards', 'ROUTES');
logger.info('✅ Profile routes: /api/userprofile/:userId/*', 'ROUTES');
logger.info('✅ Inventory routes: /api/users/:userId/inventory*', 'ROUTES');
logger.info('✅ Quest routes: /api/quests, /api/user/:userId/quest*', 'ROUTES');
logger.info('✅ Pets routes: /api/users/:userId/userPetGet', 'ROUTES');
logger.info('✅ Health check: /api/health', 'ROUTES');
logger.separator();

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(`Server error: ${err.message}`, 'MIDDLEWARE', err);
    
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

// Initialize database on server start
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, async () => {
    logger.serverStart(PORT);
    
    try {
        await initializeDatabaseTables();
        logger.serverReady(PORT);
    } catch (error) {
        logger.error('Failed to initialize database', 'STARTUP', error);
        logger.warning('Server is running but database initialization failed', 'STARTUP');
        // Don't exit process, let server continue to run
    }
});

app.use('/api/userprofile', userProfileRoutes);