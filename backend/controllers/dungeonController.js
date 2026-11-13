const { DungeonSession } = require('../models/DungeonCombat');
const Player = require('../models/Player');
const { ItemTemplate, UserInventory } = require('../models/Item');
const { PetTemplate, UserPet } = require('../models/Pet');
const logger = require('../utils/logger');
const { incrementQuestProgress, applyLazyEnergyRegen } = require('../utils/questHelper');

/**
 * Get active dungeon session for the authenticated user
 */
exports.getActiveSession = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }]
        });
        if (player && applyLazyEnergyRegen(player)) {
            await player.save();
        }

        const session = await DungeonSession.findOne({
            userId: String(userId),
            status: { $in: ['in_progress', 'active', 'in_combat'] }
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            hasActiveSession: Boolean(session),
            session: session || null,
            energy: player?.energy || { current: 10, max: 10 }
        });
    } catch (error) {
        logger.error(`Error in getActiveSession: ${error.message}`, 'DUNGEON', error);
        return res.status(500).json({ success: false, message: 'Server error retrieving dungeon session' });
    }
};

/**
 * Enter a new dungeon:
 * - Checks and consumes 1 energy point
 * - Randomizes totalSteps between 1 and 8
 * - Generates step encounters (monsters, loot, empty)
 */
exports.enterDungeon = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Fetch player to verify energy
        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }]
        });

        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        // Apply energy regeneration before checking
        applyLazyEnergyRegen(player);

        // Check if player has at least 1 energy
        const currentEnergy = player.energy?.current ?? 0;
        if (currentEnergy < 1) {
            return res.status(400).json({
                success: false,
                message: 'Not enough energy. Entering a dungeon requires 1 energy.',
                energy: player.energy
            });
        }

        // Consume 1 energy atomically
        player.energy.current = Math.max(0, currentEnergy - 1);
        await player.save();

        // Close any existing active dungeon session
        await DungeonSession.updateMany(
            { userId: String(userId), status: { $in: ['in_progress', 'active', 'in_combat'] } },
            { $set: { status: 'fled', finishedAt: new Date() } }
        );

        // Randomize 1 to 8 steps
        const totalSteps = Math.floor(Math.random() * 8) + 1;
        const steps = DungeonSession.generateSteps(totalSteps);

        // Fetch equipped pet if any
        const equippedPet = await UserPet.findOne({ userId: String(userId), isEquipped: true });
        let petHp = 0;
        let petMana = 0;
        if (equippedPet) {
            petHp = equippedPet.currentHp || 100;
            petMana = equippedPet.currentMana || 50;
        }

        // Create new session
        const session = new DungeonSession({
            userId: String(userId),
            status: 'in_progress',
            totalSteps,
            currentStepIndex: 0,
            steps,
            combatState: {
                isActive: false,
                turn: 1,
                currentTurnActor: 'player',
                playerCurrentHp: player.stats?.hp || 100,
                playerCurrentMana: player.stats?.mana || 50,
                petCurrentHp: petHp,
                petCurrentMana: petMana,
                combatLogs: []
            },
            accumulatedRewards: {
                xp: 0,
                gold: 0,
                diamonds: 0,
                items: []
            },
            energyCost: 1,
            startedAt: new Date()
        });

        await session.save();

        return res.status(201).json({
            success: true,
            message: `Entered dungeon with ${totalSteps} randomized steps.`,
            session,
            remainingEnergy: player.energy.current
        });
    } catch (error) {
        logger.error(`Error in enterDungeon: ${error.message}`, 'DUNGEON', error);
        return res.status(500).json({ success: false, message: 'Server error entering dungeon' });
    }
};

/**
 * Advance one step in the active dungeon
 */
exports.takeStep = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const session = await DungeonSession.findOne({
            userId: String(userId),
            status: { $in: ['in_progress', 'active'] }
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'No active dungeon session found' });
        }

        // Check if all steps already completed
        if (session.currentStepIndex >= session.totalSteps) {
            session.status = 'completed';
            session.finishedAt = new Date();
            await session.save();
            return res.status(200).json({
                success: true,
                isCompleted: true,
                message: 'Dungeon run complete! Claim your rewards.',
                session
            });
        }

        const step = session.steps[session.currentStepIndex];
        session.currentStepIndex += 1;

        if (step.eventType === 'monster') {
            // Trigger combat
            session.status = 'in_combat';
            session.combatState.isActive = true;
            session.combatState.turn = 1;
            session.combatState.currentTurnActor = 'player';
            session.combatState.monsterCurrentHp = step.monster.currentHp || 100;
            session.combatState.monsterMaxHp = step.monster.maxHp || 100;
            session.combatState.combatLogs = [{
                round: 1,
                actor: 'monster',
                action: 'encounter',
                message: `Encountered ${step.monster.name} (Lv. ${step.monster.level})! Prepare for battle.`
            }];
        } else if (step.eventType === 'loot') {
            // Award step loot directly to accumulated rewards
            step.isResolved = true;
            if (step.loot.gold) session.accumulatedRewards.gold += step.loot.gold;
            if (step.loot.diamonds) session.accumulatedRewards.diamonds += step.loot.diamonds;
            if (step.loot.itemId) {
                session.accumulatedRewards.items.push({
                    itemId: step.loot.itemId,
                    name: step.loot.name || step.loot.itemId,
                    amount: step.loot.amount || 1
                });
            }
        } else {
            // Empty corridor / mystery step
            step.isResolved = true;
        }

        // Check if that was the last step and resolved
        if (session.currentStepIndex >= session.totalSteps && session.status !== 'in_combat') {
            session.status = 'completed';
            session.finishedAt = new Date();
        }

        await session.save();

        // Increment step quests asynchronously
        incrementQuestProgress(userId, ['step', 'steps', 'explore', 'dungeon_step'], 1).catch(() => {});

        return res.status(200).json({
            success: true,
            currentStep: step,
            stepIndex: session.currentStepIndex,
            totalSteps: session.totalSteps,
            status: session.status,
            session
        });
    } catch (error) {
        logger.error(`Error in takeStep: ${error.message}`, 'DUNGEON', error);
        return res.status(500).json({ success: false, message: 'Server error advancing dungeon step' });
    }
};

/**
 * Execute a turn-based combat action in the dungeon
 * Action types: 'attack', 'pet_skill', 'use_item', 'flee'
 */
exports.combatAction = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { action = 'attack', itemId } = req.body;

        const session = await DungeonSession.findOne({
            userId: String(userId),
            status: 'in_combat'
        });

        if (!session || !session.combatState?.isActive) {
            return res.status(400).json({ success: false, message: 'No active combat session found' });
        }

        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }]
        });
        const equippedPet = await UserPet.findOne({ userId: String(userId), isEquipped: true });

        // Compute equipped gear bonuses
        const equippedGear = await UserInventory.find({ userId: String(userId), isEquipped: true });
        let gearAtk = 0;
        let gearDef = 0;
        if (equippedGear.length > 0) {
            const templates = await ItemTemplate.find({ itemId: { $in: equippedGear.map(g => g.itemId) } });
            for (const tmpl of templates) {
                gearAtk += tmpl.stats?.atk || 0;
                gearDef += tmpl.stats?.defPhy || 0;
            }
        }

        const playerAtk = (player?.combatStats?.baseAtk || 15) + gearAtk;
        const playerDef = (player?.combatStats?.baseDefPhy || 10) + gearDef;
        const petAtk = equippedPet?.currentAtk || 15;

        // Current step monster
        const currentStep = session.steps[session.currentStepIndex - 1];
        const monster = currentStep?.monster;
        if (!monster) {
            return res.status(400).json({ success: false, message: 'Invalid combat target' });
        }

        let combatFinished = false;
        let victory = false;
        let logs = [];

        // 1. Resolve Player Action
        if (action === 'attack') {
            const isCrit = Math.random() < 0.15;
            const variance = Math.floor(Math.random() * 5) - 2;
            const baseDmg = Math.max(5, playerAtk - (monster.defPhy || 5) + variance);
            const finalDmg = isCrit ? Math.floor(baseDmg * 1.5) : baseDmg;

            session.combatState.monsterCurrentHp = Math.max(0, session.combatState.monsterCurrentHp - finalDmg);
            logs.push({
                round: session.combatState.turn,
                actor: 'player',
                action: 'attack',
                damage: finalDmg,
                message: `${player.username} attacked ${monster.name} for ${finalDmg} damage!${isCrit ? ' (Critical Hit!)' : ''}`
            });
        } else if (action === 'use_item' && itemId) {
            // Use health potion
            const healAmount = 50;
            const maxHp = player?.stats?.maxHp || 100;
            session.combatState.playerCurrentHp = Math.min(maxHp, (session.combatState.playerCurrentHp || maxHp) + healAmount);
            logs.push({
                round: session.combatState.turn,
                actor: 'player',
                action: 'use_item',
                healing: healAmount,
                message: `${player.username} used a potion and restored ${healAmount} HP!`
            });
        } else if (action === 'flee') {
            const fleeSuccess = Math.random() < 0.5;
            if (fleeSuccess) {
                session.status = 'fled';
                session.combatState.isActive = false;
                session.finishedAt = new Date();
                await session.save();
                return res.status(200).json({
                    success: true,
                    fled: true,
                    message: 'Successfully fled the battle and retreated from the dungeon.',
                    session
                });
            } else {
                logs.push({
                    round: session.combatState.turn,
                    actor: 'player',
                    action: 'flee_fail',
                    message: `${player.username} tried to flee but was blocked!`
                });
            }
        }

        // Check if monster is defeated after player attack
        if (session.combatState.monsterCurrentHp <= 0) {
            combatFinished = true;
            victory = true;
            currentStep.isResolved = true;

            const xpGained = monster.expReward || 50;
            const goldGained = monster.goldReward || 25;

            session.accumulatedRewards.xp += xpGained;
            session.accumulatedRewards.gold += goldGained;

            logs.push({
                round: session.combatState.turn,
                actor: 'system',
                action: 'victory',
                message: `Victory! ${monster.name} was defeated. Earned +${xpGained} XP, +${goldGained} Gold.`
            });

            session.combatState.isActive = false;

            // Check if all steps cleared
            if (session.currentStepIndex >= session.totalSteps) {
                session.status = 'completed';
                session.finishedAt = new Date();
            } else {
                session.status = 'in_progress';
            }
        }

        // 2. Pet Assists (if pet equipped and monster still alive)
        if (!combatFinished && equippedPet && session.combatState.monsterCurrentHp > 0) {
            const petDmg = Math.max(3, Math.floor(petAtk * 0.7));
            session.combatState.monsterCurrentHp = Math.max(0, session.combatState.monsterCurrentHp - petDmg);
            logs.push({
                round: session.combatState.turn,
                actor: 'pet',
                action: 'pet_attack',
                damage: petDmg,
                message: `${equippedPet.nickname || 'Pet'} attacked ${monster.name} for ${petDmg} damage!`
            });

            if (session.combatState.monsterCurrentHp <= 0) {
                combatFinished = true;
                victory = true;
                currentStep.isResolved = true;
                session.accumulatedRewards.xp += monster.expReward || 50;
                session.accumulatedRewards.gold += monster.goldReward || 25;
                session.combatState.isActive = false;

                if (session.currentStepIndex >= session.totalSteps) {
                    session.status = 'completed';
                    session.finishedAt = new Date();
                } else {
                    session.status = 'in_progress';
                }
            }
        }

        // 3. Monster Turn (if still alive)
        if (!combatFinished && session.combatState.monsterCurrentHp > 0) {
            const monsterAtk = monster.atk || 12;
            const monsterDmg = Math.max(2, monsterAtk - Math.floor(playerDef * 0.4));
            session.combatState.playerCurrentHp = Math.max(0, (session.combatState.playerCurrentHp || 100) - monsterDmg);

            logs.push({
                round: session.combatState.turn,
                actor: 'monster',
                action: 'monster_attack',
                damage: monsterDmg,
                message: `${monster.name} struck ${player.username} for ${monsterDmg} damage!`
            });

            // Check if player died
            if (session.combatState.playerCurrentHp <= 0) {
                combatFinished = true;
                victory = false;
                session.status = 'died';
                session.combatState.isActive = false;
                session.finishedAt = new Date();

                logs.push({
                    round: session.combatState.turn,
                    actor: 'system',
                    action: 'defeat',
                    message: `${player.username} succumbed to their wounds in battle!`
                });
            }
        }

        session.combatState.turn += 1;
        session.combatState.combatLogs.push(...logs);

        // Keep combat logs at reasonable size
        if (session.combatState.combatLogs.length > 30) {
            session.combatState.combatLogs = session.combatState.combatLogs.slice(-30);
        }

        await session.save();

        // Increment combat kill quests on victory
        if (victory) {
            incrementQuestProgress(userId, ['kill', 'monster_kill', 'battle', 'combat'], 1).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            combatState: session.combatState,
            status: session.status,
            combatFinished,
            victory,
            logs
        });
    } catch (error) {
        logger.error(`Error in combatAction: ${error.message}`, 'DUNGEON', error);
        return res.status(500).json({ success: false, message: 'Server error processing combat action' });
    }
};

/**
 * Claim accumulated rewards upon completing or exiting dungeon
 */
exports.claimDungeonRewards = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const session = await DungeonSession.findOne({
            userId: String(userId),
            status: { $in: ['completed', 'fled'] }
        }).sort({ createdAt: -1 });

        if (!session) {
            return res.status(404).json({ success: false, message: 'No completed dungeon session found to claim' });
        }

        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }]
        });

        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        const rewards = session.accumulatedRewards || { xp: 0, gold: 0, diamonds: 0, items: [] };

        // Award XP and currency
        player.xp = (player.xp || 0) + (rewards.xp || 0);
        player.gold = (player.gold || 0) + (rewards.gold || 0);
        player.diamonds = (player.diamonds || 0) + (rewards.diamonds || 0);

        // Level up checks
        const xpRequired = Math.floor(50 * Math.pow(player.level || 1, 1.4));
        if (player.xp >= xpRequired) {
            player.level = (player.level || 1) + 1;
            player.xp -= xpRequired;
            player.skillPoints = (player.skillPoints || 0) + 2;
        }

        await player.save();

        // Award items to UserInventory
        if (rewards.items && rewards.items.length > 0) {
            for (const item of rewards.items) {
                await UserInventory.findOneAndUpdate(
                    { userId: String(userId), itemId: item.itemId },
                    { $inc: { amount: item.amount || 1 } },
                    { upsert: true, new: true }
                );
            }
        }

        // Mark session as fully claimed
        session.status = 'claimed';
        await session.save();

        // Increment dungeon clear quests
        incrementQuestProgress(userId, ['dungeon', 'dungeon_clear', 'clear_dungeon'], 1).catch(() => {});

        return res.status(200).json({
            success: true,
            message: 'Dungeon rewards successfully claimed!',
            rewards,
            player: {
                level: player.level,
                xp: player.xp,
                gold: player.gold,
                diamonds: player.diamonds,
                skillPoints: player.skillPoints
            }
        });
    } catch (error) {
        logger.error(`Error in claimDungeonRewards: ${error.message}`, 'DUNGEON', error);
        return res.status(500).json({ success: false, message: 'Server error claiming dungeon rewards' });
    }
};
