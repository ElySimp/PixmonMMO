const express = require('express');
const userProfileController = require('../controllers/userProfileController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Route to update avatar and wallpaper
router.put('/:userId/avatar', protect, userProfileController.updateAvatar);
router.put('/:userId/wallpaper', protect, userProfileController.updateWallpaper);
// Endpoints for favorite pet and selected achievements
router.put('/:userId/favorite-pet', protect, userProfileController.updateFavoritePet);
router.get('/:userId/selected-achievements', protect, userProfileController.getSelectedAchievements);
router.put('/:userId/selected-achievements', protect, userProfileController.updateSelectedAchievements);
// Endpoint to retrieve all pets belonging to user
router.get('/:userId/pets', protect, userProfileController.getUserPets);

module.exports = router; 