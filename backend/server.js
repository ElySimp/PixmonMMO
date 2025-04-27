const express = require('express');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const authController = require('./controllers/authController');
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

// Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', protect, authController.getMe);

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