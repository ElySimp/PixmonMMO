const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('./models/User');
const Achievement = require('./models/Achievement');
const authController = require('./controllers/authController');
const achievementController = require('./controllers/achievementController');
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