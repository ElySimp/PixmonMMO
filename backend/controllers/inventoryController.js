const Inventory = require('../models/Inventory');
const User = require('../models/User');

exports.initInventoryTables = async (req, res) => {
    try {
        await Achievement.createTable();
        await Achievement.createUserInventory();
        
        res.status(200).json({
            message: 'Inventory tables initialized successfully'
        });
    } catch (error) {
        console.error('Error initializing inventory tables:', error);
        res.status(500).json({ message: 'Server error initializing inventory tables', error: error.message });
    }


};

exports.getAllInventory = async (req, res) => {
    try {
        const inventory = await InventoryModel.getAllInventory();
        res.json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve inventory' });
    }
}

// force obtainment
exports.forceObtain = async (req, res) => {
   try {
        await Inventory.forcesend(); //  sending data test
   } catch(error) {
        console.error('Error initializing inventory tables:', error);
        res.status(500).json({ message: 'Server error initializing inventory tables', error: error.message });
   }
    
};

exports.getInventoryCount = async (req, res) => {
    try {
        const userId = req.params.userId;  // get userId from URL params
        let count;

        if(userId) {
            count = await Inventory.countUserInventory(userId);
        } else {
            count = await Inventory.countAllInventory();
        }

        res.json({ success: true, count });
    } catch(error) {
        console.error('Error getting inventory count:', error);
        res.status(500).json({ success: false, message: 'Failed to get inventory count', error: error.message });
    }
};
