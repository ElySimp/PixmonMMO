const mongoose = require('mongoose');

/**
 * ItemTemplate: Authoritative catalog of all items, equipment, and consumables
 * across the 10 Rarity Tiers.
 */
const ItemTemplateSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: [true, 'itemId is required'],
        unique: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    itemType: {
        type: String,
        required: [true, 'itemType is required'],
        enum: ['weapon', 'armor', 'tool', 'consumable', 'potion', 'food', 'material', 'key', 'accessory'],
        index: true
    },
    equipSlot: {
        type: String,
        default: 'none'
    },
    rarityTier: {
        type: Number,
        required: [true, 'rarityTier is required (1-10)'],
        min: 1,
        max: 10,
        index: true
    },
    rarityName: {
        type: String,
        required: [true, 'rarityName is required']
    },
    stats: {
        atk: { type: Number, default: 0 },
        defPhy: { type: Number, default: 0 },
        defMag: { type: Number, default: 0 },
        hp: { type: Number, default: 0 },
        mana: { type: Number, default: 0 },
        agility: { type: Number, default: 0 },
        hungerValue: { type: Number, default: 0 },
        happinessValue: { type: Number, default: 0 },
        healthValue: { type: Number, default: 0 },
        healthRegen: { type: Number, default: 0 },
        manaRegen: { type: Number, default: 0 },
        healHp: { type: Number, default: 0 },
        healMana: { type: Number, default: 0 },
        keyLevel: { type: Number, default: 0 }
    },
    asset: {
        staticPath: { type: String, default: '' },
        isAnimated: { type: Boolean, default: false },
        spriteSheetPath: { type: String, default: null },
        frameCount: { type: Number, default: 1 },
        frameRate: { type: Number, default: 0 }
    },
    buyPriceGold: {
        type: Number,
        default: 0,
        min: 0
    },
    sellPriceGold: {
        type: Number,
        default: 0,
        min: 0
    },
    buyPriceDiamonds: {
        type: Number,
        default: 0,
        min: 0
    },
    maxStack: {
        type: Number,
        default: 99,
        min: 1
    },
    isTradeable: {
        type: Boolean,
        default: true
    },
    minLevel: {
        type: Number,
        default: 1,
        min: 1
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

ItemTemplateSchema.index({ itemType: 1, rarityTier: 1 });

/**
 * UserInventory: Player inventory instances referencing ItemTemplate.
 */
const UserInventorySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'userId is required'],
        index: true
    },
    itemId: {
        type: String,
        required: [true, 'itemId is required'],
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'amount is required'],
        default: 1,
        min: 0
    },
    isEquipped: {
        type: Boolean,
        default: false,
        index: true
    },
    equippedSlot: {
        type: String,
        default: 'none'
    },
    acquiredAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes
UserInventorySchema.index({ userId: 1, itemId: 1 }, { unique: true });
UserInventorySchema.index({ userId: 1, isEquipped: 1, equippedSlot: 1 });

// Virtual populate for item template details
UserInventorySchema.virtual('template', {
    ref: 'ItemTemplate',
    localField: 'itemId',
    foreignField: 'itemId',
    justOne: true
});

const ItemTemplate = mongoose.models.ItemTemplate || mongoose.model('ItemTemplate', ItemTemplateSchema);
const UserInventory = mongoose.models.UserInventory || mongoose.model('UserInventory', UserInventorySchema);

module.exports = {
    ItemTemplate,
    UserInventory
};
