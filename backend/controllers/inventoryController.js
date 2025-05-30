const db = require('../config/database');
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
        const userId = req.params.userId;
        let inventory = [];

        if (userId) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            inventory = await Inventory.UserDataObtain(userId);
        } else {
            // Optionally handle the case if no userId is provided
            return res.status(400).json({ success: false, message: 'User ID required' });
        }
        
        res.json({ success: true, inventory });
        console.log('success getting user inventory data');
    } catch (error) {
        console.error('Error in getAllInventory:', error);
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
        const userId = req.params.userId;
        let count;

        if (userId) {
            // Pastikan user tersebut ada
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            count = await Inventory.countUserInventory(userId);
        } else {
            count = await Inventory.countAllInventory();
        }

        res.json({ success: true, count });
        console.log("Success getting inventory count");
    } catch (error) {
        console.error('Error getting inventory count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get inventory count',
            error: error.message
        });
    }
};

