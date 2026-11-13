const mongoose = require('mongoose');

/**
 * Npc: Interactive non-player characters (Blacksmith Goran, Alchemist Elian,
 * Guildmaster Vane, Mystic Aurelia) for dialogue, services, and story quests.
 */
const NpcSchema = new mongoose.Schema({
    npcId: {
        type: String,
        required: [true, 'npcId is required'],
        unique: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'NPC name is required'],
        trim: true
    },
    title: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        required: [true, 'NPC role is required'],
        enum: ['blacksmith', 'alchemist', 'guildmaster', 'mystic', 'merchant', 'innkeeper', 'guide'],
        index: true
    },
    location: {
        type: String,
        default: 'Town Square'
    },
    portraitAsset: {
        type: String,
        default: ''
    },
    portraitUrl: {
        type: String,
        default: ''
    },
    defaultGreeting: {
        type: String,
        default: 'Greetings, traveler. How may I be of service?'
    },
    dialogue: [{
        dialogueId: {
            type: String,
            default: 'd_default'
        },
        prompt: {
            type: String,
            default: ''
        },
        response: {
            type: String,
            default: ''
        },
        actions: [{
            actionType: {
                type: String,
                default: 'close'
            },
            actionTarget: {
                type: String,
                default: ''
            },
            actionData: {
                type: mongoose.Schema.Types.Mixed,
                default: null
            },
            label: {
                type: String,
                default: 'Continue'
            }
        }]
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Npc = mongoose.models.Npc || mongoose.model('Npc', NpcSchema);

module.exports = Npc;
