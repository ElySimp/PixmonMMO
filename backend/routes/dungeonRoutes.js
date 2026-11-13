const express = require('express');
const router = express.Router();
const dungeonController = require('../controllers/dungeonController');
const { protect } = require('../middleware/auth');

// Get current active session
router.get('/active', protect, dungeonController.getActiveSession);

// Enter a new dungeon (costs 1 energy, randomizes 1-8 steps)
router.post('/enter', protect, dungeonController.enterDungeon);

// Advance one step in the active dungeon
router.post('/step', protect, dungeonController.takeStep);

// Turn-based combat actions (attack, pet_skill, use_item, flee)
router.post('/action', protect, dungeonController.combatAction);

// Claim accumulated rewards upon completion
router.post('/claim', protect, dungeonController.claimDungeonRewards);

module.exports = router;
