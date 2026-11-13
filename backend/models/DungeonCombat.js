const mongoose = require('mongoose');

/**
 * DungeonSession: Active dungeon run containing 1 to 8 randomized steps,
 * monster encounters, loot drops, and turn-based combat state.
 */
const DungeonSessionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'userId is required'],
        index: true
    },
    status: {
        type: String,
        required: true,
        enum: ['in_progress', 'active', 'in_combat', 'completed', 'fled', 'failed', 'died'],
        default: 'in_progress',
        index: true
    },
    totalSteps: {
        type: Number,
        required: [true, 'totalSteps is required (1-8)'],
        min: 1,
        max: 8
    },
    currentStepIndex: {
        type: Number,
        default: 0,
        min: 0
    },
    steps: [{
        stepNumber: {
            type: Number,
            required: true
        },
        eventType: {
            type: String,
            required: true,
            enum: ['monster', 'loot', 'empty']
        },
        monster: {
            monsterId: { type: String, default: null },
            name: { type: String, default: '' },
            level: { type: Number, default: 1 },
            currentHp: { type: Number, default: 100 },
            maxHp: { type: Number, default: 100 },
            atk: { type: Number, default: 15 },
            defPhy: { type: Number, default: 8 },
            expReward: { type: Number, default: 50 },
            goldReward: { type: Number, default: 25 },
            assetPath: { type: String, default: '/assets/monsters/goblin.png' }
        },
        loot: {
            itemId: { type: String, default: null },
            name: { type: String, default: '' },
            amount: { type: Number, default: 0 },
            gold: { type: Number, default: 0 },
            diamonds: { type: Number, default: 0 }
        },
        isResolved: {
            type: Boolean,
            default: false
        }
    }],
    combatState: {
        isActive: {
            type: Boolean,
            default: false
        },
        turn: {
            type: Number,
            default: 1
        },
        currentTurnActor: {
            type: String,
            enum: ['player', 'pet', 'monster'],
            default: 'player'
        },
        monsterCurrentHp: { type: Number, default: 0 },
        monsterMaxHp: { type: Number, default: 0 },
        playerCurrentHp: { type: Number, default: 0 },
        playerCurrentMana: { type: Number, default: 0 },
        petCurrentHp: { type: Number, default: 0 },
        petCurrentMana: { type: Number, default: 0 },
        combatLogs: [{
            round: { type: Number, default: 1 },
            actor: { type: String, default: 'player' },
            action: { type: String, default: 'attack' },
            damage: { type: Number, default: 0 },
            healing: { type: Number, default: 0 },
            message: { type: String, default: '' },
            timestamp: { type: Date, default: Date.now }
        }]
    },
    accumulatedRewards: {
        xp: { type: Number, default: 0 },
        gold: { type: Number, default: 0 },
        diamonds: { type: Number, default: 0 },
        items: [{
            itemId: { type: String, required: true },
            name: { type: String, default: '' },
            amount: { type: Number, default: 1 }
        }]
    },
    energyCost: {
        type: Number,
        default: 1
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    finishedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

DungeonSessionSchema.index({ userId: 1, status: 1 });

/**
 * Static method to randomize and construct 1-8 dungeon steps
 */
DungeonSessionSchema.statics.generateSteps = function (totalSteps) {
    const steps = [];
    const monsterTypes = [
        { id: 'mon_goblin_scout', name: 'Goblin Scout', level: 1, hp: 80, atk: 12, def: 5, xp: 45, gold: 20 },
        { id: 'mon_cave_spider', name: 'Cave Spider', level: 2, hp: 110, atk: 18, def: 8, xp: 65, gold: 35 },
        { id: 'mon_void_wisp', name: 'Void Wisp', level: 3, hp: 150, atk: 25, def: 12, xp: 90, gold: 50 },
        { id: 'mon_dungeon_boss', name: 'Dungeon Overseer', level: 5, hp: 300, atk: 35, def: 20, xp: 200, gold: 120 }
    ];

    for (let i = 1; i <= totalSteps; i++) {
        const isLastStep = i === totalSteps;
        const roll = Math.random();

        if (isLastStep || roll < 0.55) {
            const monIdx = isLastStep && totalSteps >= 5 ? 3 : Math.floor(Math.random() * 3);
            const mon = monsterTypes[monIdx];
            steps.push({
                stepNumber: i,
                eventType: 'monster',
                monster: {
                    monsterId: mon.id,
                    name: mon.name,
                    level: mon.level,
                    currentHp: mon.hp,
                    maxHp: mon.hp,
                    atk: mon.atk,
                    defPhy: mon.def,
                    expReward: mon.xp,
                    goldReward: mon.gold,
                    assetPath: `/assets/monsters/${mon.id}.png`
                },
                loot: {},
                isResolved: false
            });
        } else if (roll < 0.85) {
            const goldAmount = Math.floor(Math.random() * 40) + 10;
            steps.push({
                stepNumber: i,
                eventType: 'loot',
                monster: {},
                loot: {
                    itemId: 'potion_hp_small',
                    name: 'Minor Health Potion',
                    amount: 1,
                    gold: goldAmount,
                    diamonds: Math.random() < 0.2 ? 1 : 0
                },
                isResolved: false
            });
        } else {
            steps.push({
                stepNumber: i,
                eventType: 'empty',
                monster: {},
                loot: {},
                isResolved: true
            });
        }
    }

    return steps;
};

const DungeonSession = mongoose.models.DungeonSession || mongoose.model('DungeonSession', DungeonSessionSchema);

module.exports = {
    DungeonSession
};
