const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;

        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if token has expired
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.exp && decoded.exp < currentTime) {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please log in again.',
                    code: 'TOKEN_EXPIRED'
                });
            }

            // Get user from token
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found. Please log in again.',
                    code: 'USER_NOT_FOUND'
                });
            }

            req.user = user;
            next();
        } catch (error) {
            // Handle specific JWT verification errors
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Please log in again.',
                    code: 'INVALID_TOKEN'
                });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please log in again.',
                    code: 'TOKEN_EXPIRED'
                });
            }

            throw error;
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed. Please try again.',
            code: 'AUTH_ERROR'
        });
    }
};