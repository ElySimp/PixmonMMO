const Npc = require('../models/Npc');
const Player = require('../models/Player');
const logger = require('../utils/logger');

/**
 * Get all active NPCs in the world
 */
exports.getAllNpcs = async (req, res) => {
    try {
        const npcs = await Npc.find({ isActive: true }).sort({ name: 1 });
        return res.status(200).json({ success: true, npcs });
    } catch (error) {
        logger.error(`Error in getAllNpcs: ${error.message}`, 'NPC', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve NPCs' });
    }
};

/**
 * Interact with a specific NPC (dialogue, healing, or town service)
 */
exports.interactNpc = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { npcId } = req.params;
        const { actionType } = req.body || {};

        const npc = await Npc.findOne({ npcId, isActive: true });
        if (!npc) {
            return res.status(404).json({ success: false, message: 'NPC not found' });
        }

        if (actionType === 'heal' && userId) {
            const player = await Player.findOne({
                $or: [{ _id: userId }, { id: String(userId) }]
            });
            if (player) {
                const maxHp = player.combatStats?.maxHp || 100;
                const maxMana = player.combatStats?.maxMana || 50;
                player.combatStats.currentHp = maxHp;
                player.combatStats.currentMana = maxMana;
                await player.save();

                return res.status(200).json({
                    success: true,
                    message: `${npc.name} restored your HP and Mana to full!`,
                    hp: maxHp,
                    mana: maxMana
                });
            }
        }

        return res.status(200).json({
            success: true,
            npc,
            greeting: npc.defaultGreeting
        });
    } catch (error) {
        logger.error(`Error in interactNpc: ${error.message}`, 'NPC', error);
        return res.status(500).json({ success: false, message: 'Failed to interact with NPC' });
    }
};
