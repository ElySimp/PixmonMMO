const express = require('express');
const userProfileController = require('../controllers/userProfileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route untuk update avatar dan wallpaper
router.put('/:userId/avatar', protect, userProfileController.updateAvatar);
router.put('/:userId/wallpaper', protect, userProfileController.updateWallpaper);

module.exports = router; 