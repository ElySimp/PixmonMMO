const jwt = require('jsonwebtoken');
const Player = require('../models/Player');

const JWT_SECRET = process.env.JWT_SECRET || 'as9d8f7a98sdf7a9s8df7a9s8d7fa8sd7f89a7sdf';

exports.protect = async (req, res, next) => {
    try {
        let token;

        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            // For development fallback if configured
            if (process.env.NODE_ENV === 'development') {
                const devPlayer = await Player.findOne();
                if (devPlayer) {
                    req.user = devPlayer;
                    return next();
                }
            }
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.exp && decoded.exp < currentTime) {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please log in again.',
                    code: 'TOKEN_EXPIRED'
                });
            }

            const player = await Player.findOne({
                $or: [{ _id: decoded.id }, { id: String(decoded.id) }]
            });

            if (!player) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found. Please log in again.',
                    code: 'USER_NOT_FOUND'
                });
            }

            req.user = player;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server authentication error'
        });
    }
};
