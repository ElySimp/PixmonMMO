/**
 * optimizedPetsRoutes.js - Routes for the optimized pet system
 * 
 * This file defines the API routes for interacting with the
 * optimized pet database structure.
 */

const express = require('express');
const router = express.Router();
const optimizedPetsController = require('../controllers/optimizedPetsController');
const { protect } = require('../middleware/auth');

// Initialize optimized pet tables (admin route)
router.post('/init', protect, optimizedPetsController.initPetsTables);

// Pet template routes (available pets in the game)
router.get('/', protect, optimizedPetsController.getAllPets);
router.get('/:id', protect, optimizedPetsController.getPetById);
router.get('/class/:classType', protect, optimizedPetsController.getPetsByClass);
router.get('/rarity/:rarity', protect, optimizedPetsController.getPetsByRarity);

// Pet skills routes
router.get('/skills/class/:classType', protect, optimizedPetsController.getSkillsByClass);
router.get('/:petId/skills', protect, optimizedPetsController.getPetSkills);

// User pet routes
router.get('/user/:userId', protect, optimizedPetsController.getUserPets);
router.post('/adopt', protect, optimizedPetsController.adoptPet);
router.patch('/status/:userPetId', protect, optimizedPetsController.updatePetStatus);
router.patch('/equip', protect, optimizedPetsController.toggleEquipPet);
router.get('/stats/:petId/:level', protect, optimizedPetsController.calculatePetStats);
router.post('/experience/:userPetId', protect, optimizedPetsController.addExperience);

module.exports = router;
