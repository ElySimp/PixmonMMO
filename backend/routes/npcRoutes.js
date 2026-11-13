const express = require('express');
const router = express.Router();
const npcController = require('../controllers/npcController');
const { protect } = require('../middleware/auth');

router.get('/', npcController.getAllNpcs);
router.post('/:npcId/interact', protect, npcController.interactNpc);

module.exports = router;
