const { ShopCatalog, GachaLog } = require('../models/ShopGacha');
const { ItemTemplate, UserInventory } = require('../models/Item');
const { PetTemplate, UserPet } = require('../models/Pet');
const Player = require('../models/Player');
const logger = require('../utils/logger');

/**
 * Get shop catalog with full item template metadata
 */
exports.getCatalog = async (req, res) => {
    try {
        const catalogItems = await ShopCatalog.find({ isAvailable: true }).sort({ sortOrder: 1, category: 1 });
        const itemIds = catalogItems.map(c => c.itemId);
        const templates = await ItemTemplate.find({ itemId: { $in: itemIds } });
        const templateMap = new Map(templates.map(t => [t.itemId, t]));

        const results = catalogItems.map(cat => {
            const tmpl = templateMap.get(cat.itemId) || {};
            return {
                id: cat._id,
                itemId: cat.itemId,
                name: tmpl.name || cat.itemId,
                description: tmpl.description || '',
                itemType: tmpl.itemType || 'material',
                rarityTier: tmpl.rarityTier || 1,
                rarityName: tmpl.rarityName || 'Common',
                category: cat.category,
                buyPriceGold: cat.buyPriceGold,
                buyPriceDiamonds: cat.buyPriceDiamonds,
                sellPriceGold: cat.sellPriceGold,
                stock: cat.stock,
                stats: tmpl.stats || {},
                assetPath: tmpl.assetPath || ''
            };
        });

        return res.status(200).json({ success: true, catalog: results });
    } catch (error) {
        logger.error(`Error in getCatalog: ${error.message}`, 'SHOP', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve shop catalog' });
    }
};

/**
 * Purchase an item from the shop
 */
exports.buyItem = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { itemId, amount = 1, currency = 'gold' } = req.body;

        if (!itemId || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid itemId and amount are required' });
        }

        const shopItem = await ShopCatalog.findOne({ itemId, isAvailable: true });
        if (!shopItem) {
            return res.status(404).json({ success: false, message: 'Item not found in shop catalog' });
        }

        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }]
        });
        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        // Calculate total cost
        const isDiamondPurchase = currency.toLowerCase() === 'diamonds' && shopItem.buyPriceDiamonds > 0;
        const unitCost = isDiamondPurchase ? shopItem.buyPriceDiamonds : shopItem.buyPriceGold;
        const totalCost = unitCost * amount;

        if (isDiamondPurchase) {
            if ((player.diamonds || 0) < totalCost) {
                return res.status(400).json({ success: false, message: 'Insufficient diamonds' });
            }
            player.diamonds -= totalCost;
        } else {
            if ((player.gold || 0) < totalCost) {
                return res.status(400).json({ success: false, message: 'Insufficient gold' });
            }
            player.gold -= totalCost;
        }

        await player.save();

        // Add to UserInventory
        const inventoryEntry = await UserInventory.findOneAndUpdate(
            { userId: String(userId), itemId },
            { $inc: { amount: amount } },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            success: true,
            message: `Successfully purchased ${amount}x ${itemId}`,
            remainingGold: player.gold,
            remainingDiamonds: player.diamonds,
            inventoryItem: inventoryEntry
        });
    } catch (error) {
        logger.error(`Error in buyItem: ${error.message}`, 'SHOP', error);
        return res.status(500).json({ success: false, message: 'Failed to process purchase' });
    }
};

/**
 * Sell an item from player's inventory
 */
exports.sellItem = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { itemId, amount = 1 } = req.body;

        if (!itemId || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid itemId and amount are required' });
        }

        const inv = await UserInventory.findOne({ userId: String(userId), itemId });
        if (!inv || inv.amount < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient item quantity in inventory' });
        }

        const shopItem = await ShopCatalog.findOne({ itemId });
        const sellPricePerUnit = shopItem?.sellPriceGold || 10;
        const totalGoldGained = sellPricePerUnit * amount;

        // Decrement item quantity or remove
        inv.amount -= amount;
        if (inv.amount <= 0) {
            await UserInventory.deleteOne({ _id: inv._id });
        } else {
            await inv.save();
        }

        // Credit gold to player
        const player = await Player.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: String(userId) }] },
            { $inc: { gold: totalGoldGained } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: `Sold ${amount}x ${itemId} for ${totalGoldGained} Gold`,
            goldGained: totalGoldGained,
            currentGold: player?.gold || 0
        });
    } catch (error) {
        logger.error(`Error in sellItem: ${error.message}`, 'SHOP', error);
        return res.status(500).json({ success: false, message: 'Failed to sell item' });
    }
};

/**
 * Roll Gacha (1x or 10x summons) across the 10 Rarity Tiers
 */
exports.gachaPull = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { pullCount = 1, banner = 'standard' } = req.body;
        const count = pullCount === 10 ? 10 : 1;

        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }]
        });
        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        // Cost calculation: 1 pull = 100 Gold or 1 Key; 10 pull = 900 Gold
        const goldCost = count === 10 ? 900 : 100;
        if ((player.gold || 0) < goldCost) {
            return res.status(400).json({
                success: false,
                message: `Insufficient gold. Need ${goldCost} gold for ${count}x pull.`
            });
        }

        player.gold -= goldCost;
        await player.save();

        // Fetch catalog of summonable items and pets
        const allItems = await ItemTemplate.find({});
        const allPets = await PetTemplate.find({});

        const results = [];

        for (let i = 0; i < count; i++) {
            const roll = Math.random() * 100;
            let targetTier = 1;

            if (roll < 0.4) {
                targetTier = 10; // Transcendent (0.4%)
            } else if (roll < 2.0) {
                targetTier = 9;  // Eldritch (1.6%)
            } else if (roll < 6.0) {
                targetTier = 8;  // Astral (4%)
            } else if (roll < 12.0) {
                targetTier = 7;  // Dragonforged (6%)
            } else if (roll < 22.0) {
                targetTier = 6;  // Radiant (10%)
            } else if (roll < 36.0) {
                targetTier = 5;  // Abyssal (14%)
            } else if (roll < 52.0) {
                targetTier = 4;  // Runic (16%)
            } else if (roll < 70.0) {
                targetTier = 3;  // Tempered (18%)
            } else if (roll < 85.0) {
                targetTier = 2;  // Sturdy (15%)
            } else {
                targetTier = 1;  // Crude (15%)
            }

            // Decide item vs pet pull (80% item, 20% pet)
            const isPetPull = Math.random() < 0.20 && allPets.length > 0;

            if (isPetPull) {
                const randomPet = allPets[Math.floor(Math.random() * allPets.length)];
                await UserPet.create({
                    userId: String(userId),
                    petId: randomPet.petId,
                    nickname: randomPet.name,
                    level: 1,
                    currentHp: randomPet.baseHp || 100,
                    currentMana: randomPet.baseMana || 50,
                    isEquipped: false
                });

                results.push({
                    type: 'pet',
                    id: randomPet.petId,
                    name: randomPet.name,
                    rarityTier: targetTier,
                    rarityName: randomPet.rarityTier?.name || `Tier ${targetTier}`,
                    role: randomPet.role,
                    animated: targetTier >= 9
                });
            } else {
                // Find matching or closest tier item
                let matchingItems = allItems.filter(item => item.rarityTier === targetTier);
                if (matchingItems.length === 0) {
                    matchingItems = allItems;
                }
                const chosenItem = matchingItems[Math.floor(Math.random() * matchingItems.length)];

                await UserInventory.findOneAndUpdate(
                    { userId: String(userId), itemId: chosenItem.itemId },
                    { $inc: { amount: 1 } },
                    { upsert: true, new: true }
                );

                results.push({
                    type: 'item',
                    id: chosenItem.itemId,
                    name: chosenItem.name,
                    rarityTier: chosenItem.rarityTier || targetTier,
                    rarityName: chosenItem.rarityName || `Tier ${targetTier}`,
                    itemType: chosenItem.itemType,
                    animated: (chosenItem.rarityTier || targetTier) >= 9,
                    animationFrames: (chosenItem.rarityTier || targetTier) === 10 ? 6 : (chosenItem.rarityTier || targetTier) === 9 ? 4 : 0
                });
            }
        }

        return res.status(200).json({
            success: true,
            results,
            count,
            remainingGold: player.gold
        });
    } catch (error) {
        logger.error(`Error in gachaPull: ${error.message}`, 'SHOP', error);
        return res.status(500).json({ success: false, message: 'Gacha pull failed' });
    }
};
