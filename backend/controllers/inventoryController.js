const db = require('../config/database');
const Inventory = require('../models/Inventory');
const User = require('../models/User');

exports.initInventoryTables = async (req, res) => {
    try {
        await Inventory.createIndexInvtable();
        await Inventory.createUserInventory();
        await Inventory.createGachaResult();
        
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
        // Successfully retrieved user inventory data
    } catch (error) {
        console.error('Error in getAllInventory:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve inventory' });
    }
};

exports.useInventoryItem = async (req, res) => {
    try {
        const { itemId, petId } = req.body;
        const userId = req.user.id;
        
        if (!itemId || !petId) {
            return res.status(400).json({ success: false, message: 'Item ID and Pet ID are required' });
        }
        
        // Begin transaction
        await db.query('START TRANSACTION');
        
        // 1. Verify the item exists in user inventory and get item details
        const [itemRows] = await db.query(`
            SELECT ui.*, ii.item_name, ii.item_type, ii.item_stats 
            FROM UserInventory ui
            JOIN IndexInventory ii ON ui.index_id = ii.index_id
            WHERE ui.user_id = ? AND ui.index_id = ? AND ui.amount > 0
        `, [userId, itemId]);
        
        if (itemRows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Item not found in inventory or quantity is zero' });
        }
        
        const item = itemRows[0];
        let itemStats = {};
        
        try {
            if (item.item_stats) {
                itemStats = JSON.parse(item.item_stats);
            }
        } catch (e) {
            console.error('Error parsing item stats:', e);
        }
        
        // 2. Verify the pet belongs to the user
        const [petRows] = await db.query(`
            SELECT * FROM UserPets WHERE id = ? AND user_id = ?
        `, [petId, userId]);
        
        if (petRows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Pet not found or does not belong to user' });
        }
        
        const pet = petRows[0];
        
        // 3. Apply item effects based on type
        if (item.item_type === 'food') {
            // Extract values from item stats with defaults
            const hungerValue = itemStats.hunger_value || 20;
            const happinessValue = itemStats.happiness_value || Math.floor(hungerValue / 2); // Default happiness is half the hunger value
            const healthValue = itemStats.health_value || Math.floor(hungerValue / 4); // Default health is quarter the hunger value
            
            // Calculate new values ensuring they stay within 0-100 range
            const newHunger = Math.min(100, Math.max(0, pet.hunger + hungerValue));
            const newHappiness = Math.min(100, Math.max(0, pet.happiness + happinessValue));
            const newHealth = Math.min(100, Math.max(0, pet.health + healthValue));
            
            // Update pet stats with all three values
            await db.query(`
                UPDATE UserPets SET hunger = ?, happiness = ?, health = ? WHERE id = ?
            `, [newHunger, newHappiness, newHealth, petId]);
            
            // Reduce item quantity
            await db.query(`
                UPDATE UserInventory SET amount = amount - 1 WHERE user_id = ? AND index_id = ?
            `, [userId, itemId]);
            
            // Remove item if amount becomes 0
            await db.query(`
                DELETE FROM UserInventory WHERE user_id = ? AND index_id = ? AND amount <= 0
            `, [userId, itemId]);
        } else {
            await db.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Item type not applicable to pets' });
        }
        
        // Commit transaction
        await db.query('COMMIT');
        
        // Extract values for the response to match what was actually updated
        const hungerValue = itemStats.hunger_value || 20;
        const happinessValue = itemStats.happiness_value || Math.floor(hungerValue / 2);
        const healthValue = itemStats.health_value || Math.floor(hungerValue / 4);
        
        res.json({ 
            success: true, 
            message: `Used ${item.item_name} on your pet successfully`,
            petUpdate: { 
                hunger: Math.min(100, pet.hunger + hungerValue),
                happiness: Math.min(100, pet.happiness + happinessValue),
                health: Math.min(100, pet.health + healthValue)
            }
        });
    } catch (error) {
        // Rollback on error
        try {
            await db.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error during transaction rollback:', rollbackError);
        }
        console.error('Error using inventory item:', error);
        res.status(500).json({ success: false, message: 'Failed to use item', error: error.message });
    }
};

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

exports.ItemUsage = async (req, res) => {
    try {
        const userId = req.params.userId;
        const itemId = req.params.index_id;
        const petId = req.query.petId; // Get petId from query params
        
        if (!userId || !itemId) {
            return res.status(400).json({ success: false, message: 'User ID and item ID are required' });
        }
        
        // Begin transaction
        await db.query('START TRANSACTION');
        
        try {
            // 1. Verify the item exists in user inventory and get item details
            const [itemRows] = await db.query(`
                SELECT ui.*, ii.item_name, ii.item_type, ii.item_stats 
                FROM UserInventory ui
                JOIN IndexInventory ii ON ui.index_id = ii.index_id
                WHERE ui.user_id = ? AND ui.index_id = ? AND ui.amount > 0
            `, [userId, itemId]);
            
            if (itemRows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Item not found in inventory or quantity is zero' });
            }
            
            const item = itemRows[0];
            let itemStats = {};
            
            try {
                if (item.item_stats) {
                    itemStats = JSON.parse(item.item_stats);
                }
            } catch (e) {
                console.error('Error parsing item stats:', e);
            }
            
            // If it's a pet food item and a pet ID is provided
            if (item.item_type === 'food' && petId) {
                // 2. Verify the pet belongs to the user
                const [petRows] = await db.query(`
                    SELECT * FROM UserPets WHERE id = ? AND user_id = ?
                `, [petId, userId]);
                
                if (petRows.length === 0) {
                    await db.query('ROLLBACK');
                    return res.status(404).json({ success: false, message: 'Pet not found or does not belong to user' });
                }
                
                const pet = petRows[0];
                
                // Calculate new hunger value
                const hungerValue = itemStats.hunger_value || 0;
                const newHunger = Math.min(100, pet.hunger + hungerValue);
                
                // Update pet stats
                await db.query(`
                    UPDATE UserPets SET hunger = ? WHERE id = ?
                `, [newHunger, petId]);
                
                // Reduce item quantity
                await db.query(`
                    UPDATE UserInventory SET amount = amount - 1 WHERE user_id = ? AND index_id = ?
                `, [userId, itemId]);
                
                // Remove item if amount becomes 0
                await db.query(`
                    DELETE FROM UserInventory WHERE user_id = ? AND index_id = ? AND amount <= 0
                `, [userId, itemId]);
                
                await db.query('COMMIT');
                
                return res.json({ 
                    success: true, 
                    message: `Used ${item.item_name} on your pet successfully`,
                    petUpdate: { 
                        hunger: newHunger
                    }
                });
            } else {
                // Handle other item types here as needed
                // For now, just use the item without specific effect
                
                // Reduce item quantity
                await db.query(`
                    UPDATE UserInventory SET amount = amount - 1 WHERE user_id = ? AND index_id = ?
                `, [userId, itemId]);
                
                // Remove item if amount becomes 0
                await db.query(`
                    DELETE FROM UserInventory WHERE user_id = ? AND index_id = ? AND amount <= 0
                `, [userId, itemId]);
                
                await db.query('COMMIT');
                
                return res.json({
                    success: true,
                    message: `Used ${item.item_name} successfully`
                });
            }
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error using item:', error);
        return res.status(500).json({ success: false, message: 'Failed to use item', error: error.message });
    }
};

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

exports.ItemInput = async (req, res) => {
    try {
        const userId = req.params.userId;
        const index_id = parseInt(req.params.index_id, 10);

        await Inventory.inputItem(userId, index_id);
        return res.status(200).json({ message: 'input successful' });
    } catch (error) {
        console.error('Error in ItemInput controller:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}






