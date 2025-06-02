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
            return res.status(400).json({ success: false, message: 'User ID required' });        }
        
        res.json({ success: true, inventory });
        // Successfully retrieved user inventory data
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
        }        res.json({ success: true, count });
        // Successfully retrieved inventory count
    } catch (error) {
        console.error('Error getting inventory count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get inventory count',
            error: error.message
        });
    }
};

exports.getInventoryIndex = async (req, res) => {    try {        const indexInventory = await Inventory.indexItemObtain();
        // Successfully retrieved inventory index
        return res.status(200).json({ success: true, inventoryIndex: indexInventory });
    } catch (error) {
        console.error('Error pulling data', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve inventory index', error: error.message });
    }
}

exports.saveInventoryItem = async (req, res) => {
    try {
        const {
            user_id,
            atk,
            effect,
            def,
            index_id,
            item_type,
            amount
        } = req.body;

        // Basic input validation
        if (!user_id || !index_id || !item_type || amount == null) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields (user_id, index_id, item_type, or amount)'
            });
        }

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a positive number'
            });
        }

        // Validate user existence
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if the item already exists in user's inventory
        await Inventory.claimItem(user_id, atk, effect, def, index_id, item_type, amount);

        return res.status(201).json({
            success: true,
            message: 'Inventory item saved successfully'
        });
    } catch (error) {
        console.error('Error saving inventory item:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save inventory item',
            error: error.message
        });
    }
};

exports.obtainKey = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
};

