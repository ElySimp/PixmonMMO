const express = require('express');
const userProfileController = require('../controllers/userProfileController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Route untuk update avatar dan wallpaper
router.put('/:userId/avatar', protect, userProfileController.updateAvatar);
router.put('/:userId/wallpaper', protect, userProfileController.updateWallpaper);
// Tambahkan endpoint favorite pet dan selected achievements
router.put('/:userId/favorite-pet', protect, userProfileController.updateFavoritePet);
router.get('/:userId/selected-achievements', protect, userProfileController.getSelectedAchievements);
router.put('/:userId/selected-achievements', protect, userProfileController.updateSelectedAchievements);
// Tambahkan endpoint untuk mengambil semua pet milik user
router.get('/:userId/pets', protect, userProfileController.getUserPets);

module.exports = router; 