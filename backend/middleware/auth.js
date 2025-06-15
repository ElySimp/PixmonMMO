const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;

        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // For development testing - bypass auth if no token
        if (!token && process.env.NODE_ENV === 'development') {
            console.log('⚠️ Warning: Authentication bypassed in development mode');
            req.user = { id: 1 }; // Dummy user for development
            return next();
        }

        // Check if token exists in production
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_development');

            // Get user from token
            req.user = await User.findById(decoded.id);
            next();
        } catch (error) {
            console.error('JWT verification error:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 