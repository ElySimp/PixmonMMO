const mongoose = require('mongoose');

/**
 * ShopCatalog: Storefront listings for purchasing items, potions, keys, and equipment
 * using Gold or Diamonds.
 */
const ShopCatalogSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: [true, 'itemId is required'],
        unique: true,
        index: true
    },
    buyPriceGold: {
        type: Number,
        default: 0,
        min: 0
    },
    buyPriceDiamonds: {
        type: Number,
        default: 0,
        min: 0
    },
    sellPriceGold: {
        type: Number,
        default: 0,
        min: 0
    },
    isAvailable: {
        type: Boolean,
        default: true,
        index: true
    },
    minLevel: {
        type: Number,
        default: 1,
        min: 1
    },
    stock: {
        type: Number,
        default: -1 // -1 means unlimited supply
    },
    category: {
        type: String,
        enum: ['potions', 'equipment', 'keys', 'materials', 'food', 'consumables'],
        default: 'potions',
        index: true
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

ShopCatalogSchema.index({ category: 1, isAvailable: 1 });

// Virtual populate for item template details
ShopCatalogSchema.virtual('template', {
    ref: 'ItemTemplate',
    localField: 'itemId',
    foreignField: 'itemId',
    justOne: true
});

/**
 * GachaLog: Summoning pull audit log tracking player pulls, rarity outcomes,
 * and currency consumption.
 */
const GachaLogSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'userId is required'],
        index: true
    },
    bannerType: {
        type: String,
        required: true,
        enum: ['standard_item', 'premium_weapon', 'pet_summon', 'event', 'normal', 'mythical', 'pet'],
        default: 'standard_item',
        index: true
    },
    pulledAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    resultItemType: {
        type: String,
        required: true,
        enum: ['item', 'pet']
    },
    resultId: {
        type: String,
        required: [true, 'resultId is required']
    },
    resultName: {
        type: String,
        default: ''
    },
    rarityTier: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    rarityName: {
        type: String,
        default: ''
    },
    costType: {
        type: String,
        required: true,
        enum: ['gold', 'diamonds', 'key']
    },
    costAmount: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

GachaLogSchema.index({ userId: 1, pulledAt: -1 });
GachaLogSchema.index({ bannerType: 1, pulledAt: -1 });

const ShopCatalog = mongoose.models.ShopCatalog || mongoose.model('ShopCatalog', ShopCatalogSchema);
const GachaLog = mongoose.models.GachaLog || mongoose.model('GachaLog', GachaLogSchema);

module.exports = {
    ShopCatalog,
    GachaLog
};
