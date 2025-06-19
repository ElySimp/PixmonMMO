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

exports.getInventoryIndex = async (req, res) => {   
    try {        
        const indexInventory = await Inventory.indexItemObtain();
        // Successfully retrieved inventory index
        return res.status(200).json({ success: true, inventoryIndex: indexInventory });
    } catch (error) {
        console.error('Error pulling data', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve inventory index', error: error.message });
    }
}

exports.gachaResult = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const results = await Inventory.gachaResultMultiStore(userId, 10); // <-- capture returned gacha results

        return res.status(200).json({
            success: true,
            message: 'Gacha pull successful',
            results: results
        });

    } catch (error) {
        console.error('Error in gachaResult controller:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


exports.gachaResultSingle = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        await Inventory.gachaResultMultiStore(userId, 1);

        return res.status(200).json({ message: 'Gacha pull successful' });

    } catch (error) {
        console.error('Error in gachaResult controller:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.NormalKeyObtain = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        await Inventory.normalKeyObtain(userId)

        return res.status(200).json({ message: 'obtainment succesful' });
    } catch (error) {
        console.error(error);
    }
}

exports.MythicalKeyObtain = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        await Inventory.MythicalKeyObtain(userId)

        return res.status(200).json({ message: 'obtainment succesful' });
    } catch (error) {
        console.error(error);
    }
}

exports.ItemUsage = async (req, res) => {
    console.log('ItemUsage controller triggered', req.params);
    try {
        const userId = req.params.userId;
        // Parse index_id as integer for consistent type handling
        const index_id = parseInt(req.params.index_id, 10);

        if (isNaN(index_id)) {
            return res.status(400).json({ error: 'Invalid index_id parameter' });
        }

        await Inventory.itemUse(userId, index_id);
        return res.status(200).json({ message: 'usage successful' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};






