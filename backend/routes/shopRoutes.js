const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { protect } = require('../middleware/auth');

// Get shop catalog
router.get('/catalog', shopController.getCatalog);

// Buy item (gold or diamonds)
router.post('/buy', protect, shopController.buyItem);

// Sell item from inventory
router.post('/sell', protect, shopController.sellItem);

// Gacha pull (1x or 10x)
router.post('/gacha/pull', protect, shopController.gachaPull);

module.exports = router;
