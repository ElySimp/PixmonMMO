const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import logger
const logger = require('./utils/logger');

// MongoDB Atlas connection and Mongoose Models
const { connectDB, getConnectionStatus } = require('./config/mongodb');
const Player = require('./models/Player');
const { ItemTemplate } = require('./models/Item');
const { PetTemplate } = require('./models/Pet');
const { QuestTemplate } = require('./models/Quest');
const { ShopCatalog } = require('./models/ShopGacha');
const Npc = require('./models/Npc');

const inventoryController = require('./controllers/inventoryController');
const authController = require('./controllers/authController');
const achievementController = require('./controllers/achievementController');
const questController = require('./controllers/questController');
const userProfileController = require('./controllers/userProfileController');
const dailyRewardsController = require('./controllers/dailyRewardsController');
const petsController = require('./controllers/petsController');
const { protect } = require('./middleware/auth');
const userProfileRoutes = require('./routes/userProfileRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
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
async function initDatabase() {
    try {
        await connectDB();
        logger.info('MongoDB Atlas connected successfully', 'DATABASE');
    } catch (error) {
        logger.error('Database connection failed', 'DATABASE', error);
        throw error;
    }
}

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', protect, authController.getMe);
app.get('/api/userlogin/:id', protect, authController.getUser);

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

// UserProfile Routes
app.get('/api/userprofile/:userId', protect, userProfileController.getUserProfile);
app.put('/api/userprofile/:userId', protect, userProfileController.updateUserProfile);
app.patch('/api/userprofile/:userId', protect, userProfileController.updateUserProfile);

// Skill Points Routes
app.put('/api/userprofile/:userId/skills', protect, userProfileController.updateSkillPoints);
app.post('/api/userprofile/:userId/reset-skills', protect, userProfileController.resetSkillPoints);

// File Upload Routes
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

// Initialization Routes (No-ops for Mongoose schema migrations)
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
app.post('/api/inventory/use-item', protect, inventoryController.useInventoryItem);
app.post('/api/inventory/equip', protect, inventoryController.equipItem);

// Quest Routes
app.get('/api/quests', questController.getAllQuests);
app.post('/api/user/:userId/quest/:questId/complete', questController.completeQuest);
app.post('/api/user/:userId/claim-daily-main-reward', questController.claimDailyMainReward);
app.get('/api/server-time', questController.getServerTime);
app.get('/api/user/:userId/quests/bounty', questController.getUserBountyQuests);
app.get('/api/quests/bounty', questController.getBountyQuests);

// User Quest Routes
app.get('/api/user/:userId/quests', questController.getUserQuests);
app.post('/api/user/:userId/quest/:questId/claim', questController.claimQuestReward);

// Quest Point Management Routes
app.post('/api/user/:userId/decrement-quest-point', questController.decrementQuestPoint);
app.post('/api/user/:userId/restore-quest-point', questController.restoreQuestPoint);
app.post('/api/user/:userId/quest/:questId/start', questController.startBountyQuest);

// Legacy Pets Routes
const petsRoutes = require('./routes/petsRoutes');
app.use('/api/pets', petsRoutes);

// New Optimized Pets Routes
const optimizedPetsRoutes = require('./routes/optimizedPetsRoutes');
app.use('/api/v2/pets', optimizedPetsRoutes);

// Dungeon & Combat Routes
const dungeonRoutes = require('./routes/dungeonRoutes');
app.use('/api/dungeon', dungeonRoutes);

// Shop & Gacha Routes
const shopRoutes = require('./routes/shopRoutes');
app.use('/api/shop', shopRoutes);

// NPC Routes
const npcRoutes = require('./routes/npcRoutes');
app.use('/api/npcs', npcRoutes);

// Overlay Profile Route
app.get('/api/user/overlay-profile', protect, async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }]
        });
        
        if (!player) {
            return res.status(404).json({ error: 'User data not found' });
        }
        
        res.json({
            username: player.username,
            level: player.level,
            xp: player.xp,
            gold: player.gold,
            diamonds: player.diamonds,
            questPoints: player.questPoints || 0,
            energyPoints: player.energy?.current ?? 2,
            energyTimer: player.energy?.timer || '4h 00:00',
            questCompleted: player.stats?.questsCompleted || 0,
            questClaimed: 0
        });
    } catch (error) {
        logger.error(`Error fetching overlay profile: ${error.message}`, 'PROFILE');
        res.status(500).json({ error: 'Failed to fetch overlay profile data' });
    }
});

// Health check route
app.get('/api/health', async (req, res) => {
    try {
        const status = getConnectionStatus();
        const [players, items, pets, quests, shops, npcs] = await Promise.all([
            Player.countDocuments().catch(() => 0),
            ItemTemplate.countDocuments().catch(() => 0),
            PetTemplate.countDocuments().catch(() => 0),
            QuestTemplate.countDocuments().catch(() => 0),
            ShopCatalog.countDocuments().catch(() => 0),
            Npc.countDocuments().catch(() => 0)
        ]);

        const isHealthy = status.isConnected;

        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? 'OK' : 'WARNING',
            message: isHealthy ? 'Server is running with active MongoDB Atlas persistence' : 'Database disconnected',
            database: isHealthy ? 'Connected' : 'Disconnected',
            mongodb: {
                readyState: status.readyState,
                stateName: status.stateName,
                host: status.host,
                databaseName: status.dbName
            },
            collections: {
                players,
                items,
                pets,
                quests,
                shops,
                npcs
            },
            environment: process.env.NODE_ENV || 'development',
            serverless: Boolean(process.env.VERCEL_ENV),
            platform: 'Vercel',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Healthcheck failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
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

app.use('/api/userprofile', userProfileRoutes);

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

// Server startup - only listen when executed directly, not when required in tests
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  
  app.listen(PORT, async () => {
    logger.serverStart(PORT);
    
    try {
      await initDatabase();
      logger.serverReady(PORT);
    } catch (error) {
      logger.error('Failed to initialize database', 'STARTUP', error);
      logger.warning('Server is running but database connection failed', 'STARTUP');
    }
  });
} else if (process.env.VERCEL_ENV !== undefined && process.env.NODE_ENV !== 'test') {
  // In Vercel serverless environment, initialize database on first request
  app.use(async (req, res, next) => {
    if (!global.dbInitialized) {
      try {
        await initDatabase();
        global.dbInitialized = true;
        logger.serverReady('Serverless');
      } catch (error) {
        logger.error('Failed to initialize database in serverless environment', 'STARTUP', error);
      }
    }
    next();
  });
}

// Export for tests and Vercel serverless deployment
module.exports = app;
