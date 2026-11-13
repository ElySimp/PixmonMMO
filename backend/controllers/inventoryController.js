const { ItemTemplate, UserInventory } = require('../models/Item');
const { UserPet } = require('../models/Pet');
const Player = require('../models/Player');

exports.initInventoryTables = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Inventory collections initialized successfully'
    });
};

exports.getAllInventory = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID required' });
        }

        const items = await UserInventory.find({ userId });
        const templates = await ItemTemplate.find({});
        const templateMap = new Map(templates.map(t => [t.itemId, t]));

        const inventory = items.map(inv => {
            const tmpl = templateMap.get(inv.itemId) || {};
            return {
                id: inv._id.toString(),
                user_id: inv.userId,
                index_id: inv.itemId,
                itemId: inv.itemId,
                amount: inv.amount,
                isEquipped: inv.isEquipped,
                equippedSlot: inv.equippedSlot,
                item_name: tmpl.name || inv.itemId,
                name: tmpl.name || inv.itemId,
                item_type: tmpl.itemType || 'material',
                description: tmpl.description || '',
                rarity: tmpl.rarityTier || 1,
                rarityTier: tmpl.rarityTier || 1,
                rarityName: tmpl.rarityName || 'Common',
                item_stats: tmpl.stats || {},
                asset: tmpl.asset || {}
            };
        });

        res.json({ success: true, inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve inventory', error: error.message });
    }
};

exports.useInventoryItem = async (req, res) => {
    try {
        const { itemId, petId } = req.body;
        const userId = req.user ? (req.user.id || req.user._id.toString()) : req.body.userId;

        if (!itemId || !petId) {
            return res.status(400).json({ success: false, message: 'Item ID and Pet ID are required' });
        }

        // Verify target pet exists before deducting item
        const pet = await UserPet.findOne({
            $or: [{ _id: petId }, { petId: String(petId) }],
            userId: String(userId)
        });

        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found or does not belong to user' });
        }

        // Atomic deduction: only matches and decrements if quantity is >= 1
        const invItem = await UserInventory.findOneAndUpdate(
            {
                userId: String(userId),
                itemId: String(itemId),
                amount: { $gte: 1 }
            },
            {
                $inc: { amount: -1 }
            },
            { new: true }
        );

        if (!invItem) {
            return res.status(404).json({ success: false, message: 'Item not found in inventory or quantity is zero' });
        }

        // Clean up depleted item document
        if (invItem.amount <= 0) {
            await UserInventory.deleteOne({ _id: invItem._id });
        }

        // Apply item template stats to pet
        const template = await ItemTemplate.findOne({ itemId: String(itemId) });
        const itemStats = template?.stats || {};
        const hungerVal = itemStats.hungerValue || itemStats.hunger_value || 25;
        const happinessVal = itemStats.happinessValue || itemStats.happiness_value || Math.floor(hungerVal / 2);
        const healthVal = itemStats.healthValue || itemStats.health_value || Math.floor(hungerVal / 4);

        pet.hunger = Math.min(100, Math.max(0, (pet.hunger || 0) + hungerVal));
        pet.happiness = Math.min(100, Math.max(0, (pet.happiness || 0) + happinessVal));
        pet.health = Math.min(100, Math.max(0, (pet.health || 0) + healthVal));
        await pet.save();

        res.json({
            success: true,
            message: `Used ${template?.name || itemId} on your pet successfully`,
            petUpdate: {
                hunger: pet.hunger,
                happiness: pet.happiness,
                health: pet.health
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to use item', error: error.message });
    }
};

exports.getInventoryCount = async (req, res) => {
    try {
        const { userId } = req.params;
        const count = userId
            ? await UserInventory.countDocuments({ userId: String(userId) })
            : await UserInventory.countDocuments({});

        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get inventory count', error: error.message });
    }
};

exports.getInventoryIndex = async (req, res) => {
    try {
        const templates = await ItemTemplate.find({});
        const inventoryIndex = templates.map(t => ({
            index_id: t.itemId,
            itemId: t.itemId,
            item_name: t.name,
            name: t.name,
            description: t.description,
            item_type: t.itemType,
            rarity: t.rarityTier,
            rarityTier: t.rarityTier,
            rarityName: t.rarityName,
            item_stats: t.stats,
            asset: t.asset,
            buyPriceGold: t.buyPriceGold,
            sellPriceGold: t.sellPriceGold
        }));

        res.status(200).json({ success: true, inventoryIndex });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve inventory index', error: error.message });
    }
};

exports.forceObtain = async (req, res) => {
    res.status(200).json({ success: true, message: 'Force obtain complete' });
};

exports.gachaResult = async (req, res) => {
    try {
        const { userId } = req.params;
        res.status(200).json({ success: true, message: 'Gacha pull successful', results: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.gachaResultSingle = async (req, res) => {
    res.status(200).json({ success: true, message: 'Gacha pull successful' });
};

exports.NormalKeyObtain = async (req, res) => {
    try {
        const { userId } = req.params;
        await UserInventory.findOneAndUpdate(
            { userId: String(userId), itemId: 'key_steel' },
            { $inc: { amount: 1 } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ success: true, message: 'Obtainment successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.MythicalKeyObtain = async (req, res) => {
    try {
        const { userId } = req.params;
        await UserInventory.findOneAndUpdate(
            { userId: String(userId), itemId: 'key_mythical' },
            { $inc: { amount: 1 } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ success: true, message: 'Obtainment successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.ItemUsage = async (req, res) => {
    try {
        const { userId, index_id } = req.params;

        // Atomic deduction with amount guard
        const invItem = await UserInventory.findOneAndUpdate(
            {
                userId: String(userId),
                itemId: String(index_id),
                amount: { $gte: 1 }
            },
            {
                $inc: { amount: -1 }
            },
            { new: true }
        );

        if (!invItem) {
            return res.status(404).json({ error: 'Item not found in inventory' });
        }

        if (invItem.amount <= 0) {
            await UserInventory.deleteOne({ _id: invItem._id });
        }

        res.status(200).json({ success: true, message: 'Usage successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.ItemInput = async (req, res) => {
    try {
        const { userId, index_id } = req.params;
        await UserInventory.findOneAndUpdate(
            { userId: String(userId), itemId: String(index_id) },
            { $inc: { amount: 1 } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ success: true, message: 'Input successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.equipItem = async (req, res) => {
    try {
        const userId = String(req.user?.id || req.user?._id);
        const { itemId } = req.body;

        if (!itemId) {
            return res.status(400).json({ success: false, message: 'itemId is required' });
        }

        const invItem = await UserInventory.findOne({ userId, itemId, amount: { $gte: 1 } });
        if (!invItem) {
            return res.status(404).json({ success: false, message: 'Item not found in inventory' });
        }

        const tmpl = await ItemTemplate.findOne({ itemId });
        if (!tmpl) {
            return res.status(404).json({ success: false, message: 'Item template not found' });
        }

        const equippableTypes = ['weapon', 'armor', 'accessory', 'tool'];
        if (!equippableTypes.includes(tmpl.itemType)) {
            return res.status(400).json({ success: false, message: 'This item cannot be equipped' });
        }

        // Toggle if already equipped
        if (invItem.isEquipped) {
            invItem.isEquipped = false;
            invItem.equippedSlot = null;
            await invItem.save();
            return res.status(200).json({
                success: true,
                equipped: false,
                message: `Unequipped ${tmpl.name}`,
                item: invItem
            });
        }

        // Unequip any other item in the same slot
        await UserInventory.updateMany(
            { userId, equippedSlot: tmpl.itemType, isEquipped: true },
            { $set: { isEquipped: false, equippedSlot: null } }
        );

        invItem.isEquipped = true;
        invItem.equippedSlot = tmpl.itemType;
        await invItem.save();

        return res.status(200).json({
            success: true,
            equipped: true,
            slot: tmpl.itemType,
            message: `Equipped ${tmpl.name} in ${tmpl.itemType} slot`,
            item: invItem
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to equip item', error: error.message });
    }
};
