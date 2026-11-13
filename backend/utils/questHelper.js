const { QuestTemplate, UserQuestProgress } = require('../models/Quest');

/**
 * Increment progress for all matching quests (daily, weekly, monthly, bounty)
 * for a given user when an in-game action occurs.
 * @param {string} userId
 * @param {string[]} requirementTypes - e.g. ['step', 'steps', 'explore']
 * @param {number} delta
 */
async function incrementQuestProgress(userId, requirementTypes, delta = 1) {
    if (!userId || !Array.isArray(requirementTypes) || requirementTypes.length === 0) {
        return;
    }

    const templates = await QuestTemplate.find({
        requirementType: { $in: requirementTypes }
    });

    for (const tmpl of templates) {
        const periodKey = UserQuestProgress.generatePeriodKey(tmpl.repeatType);

        let prog = await UserQuestProgress.findOne({
            userId: String(userId),
            questId: tmpl.questId,
            periodKey
        });

        if (!prog) {
            prog = new UserQuestProgress({
                userId: String(userId),
                questId: tmpl.questId,
                repeatType: tmpl.repeatType,
                periodKey,
                progress: 0,
                target: tmpl.requirementTarget || 1,
                completed: false,
                claimed: false
            });
        }

        if (!prog.completed) {
            prog.progress = Math.min(prog.target, prog.progress + delta);
            if (prog.progress >= prog.target) {
                prog.completed = true;
            }
            await prog.save();
        }
    }
}

/**
 * Regenerate player energy based on elapsed minutes since lastRefillAt
 * @param {object} player - Mongoose Player document
 * @returns {boolean} - true if energy was modified
 */
function applyLazyEnergyRegen(player) {
    if (!player || !player.energy) return false;

    const maxEnergy = player.energy.max || 10;
    const currentEnergy = player.energy.current ?? 0;

    if (currentEnergy >= maxEnergy) {
        player.energy.lastRefillAt = new Date();
        return false;
    }

    const rateMinutes = player.energy.refillRateMinutes || 10;
    const now = Date.now();
    const lastRefill = player.energy.lastRefillAt ? new Date(player.energy.lastRefillAt).getTime() : now;
    const elapsedMinutes = Math.floor((now - lastRefill) / 60000);

    if (elapsedMinutes >= rateMinutes) {
        const energyToAdd = Math.floor(elapsedMinutes / rateMinutes);
        player.energy.current = Math.min(maxEnergy, currentEnergy + energyToAdd);
        player.energy.lastRefillAt = new Date(lastRefill + energyToAdd * rateMinutes * 60000);
        return true;
    }

    return false;
}

module.exports = {
    incrementQuestProgress,
    applyLazyEnergyRegen
};
