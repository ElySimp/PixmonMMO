const express = require('express');
const router = express.Router();
const petsController = require('../controllers/petsController');
const { protect } = require('../middleware/auth');

// Initialize pet tables - for admin use
router.get('/init-tables', protect, petsController.initPetsTables);

// Get user's pets
router.get('/user/:userId', protect, petsController.PetsDataObtain);

// Get all available pets
router.get('/', protect, petsController.getAllPets);

// Get pets by role/class
router.get('/role/:role', protect, petsController.getPetsByRole);

// Get pets by rarity
router.get('/rarity/:rarity', protect, petsController.getPetsByRarity);

// Get skills for a specific pet class
router.get('/skills/:role', protect, petsController.getPetSkillsByRole);

// Add a pet to user's collection
router.post('/add-to-user', protect, petsController.addPetToUser);

// Update pet status (happiness, hunger, health)
router.patch('/status/:userPetId', protect, petsController.updatePetStatus);

// Toggle pet equipped status
router.patch('/equip', protect, petsController.toggleEquipPet);

// Calculate pet stats at a specific level
router.get('/stats/:petId/:level', protect, petsController.calculatePetStats);

module.exports = router;
