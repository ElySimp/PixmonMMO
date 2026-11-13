const mongoose = require('mongoose');

/**
 * PetTemplate: Species and archetype definitions with combat stats,
 * skills, and looping pixel animations.
 */
const PetTemplateSchema = new mongoose.Schema({
    petId: {
        type: String,
        required: [true, 'petId is required'],
        unique: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Pet name is required'],
        trim: true
    },
    role: {
        type: String,
        required: [true, 'Pet role is required'],
        enum: ['warrior', 'mage', 'tank', 'healer', 'support', 'assassin', 'general', 'attacker', 'defender', 'supporter'],
        index: true
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
        default: 'Common'
    },
    baseHp: {
        type: Number,
        default: 100,
        min: 1
    },
    baseAtk: {
        type: Number,
        default: 15,
        min: 0
    },
    baseDefPhy: {
        type: Number,
        default: 10,
        min: 0
    },
    baseDefMag: {
        type: Number,
        default: 10,
        min: 0
    },
    baseMana: {
        type: Number,
        default: 50,
        min: 0
    },
    baseAgility: {
        type: Number,
        default: 10,
        min: 1
    },
    passiveSkill: {
        name: { type: String, default: '' },
        description: { type: String, default: '' },
        effectType: { type: String, default: 'none' },
        value: { type: Number, default: 0 }
    },
    activeSkills: [{
        skillId: { type: String, default: '' },
        name: { type: String, required: true },
        manaCost: { type: Number, default: 10 },
        damage: { type: Number, default: 0 },
        healing: { type: Number, default: 0 },
        cooldownTurns: { type: Number, default: 0 },
        cooldown: { type: Number, default: 0 },
        duration: { type: Number, default: 1 },
        effectType: { type: String, default: 'damage' },
        description: { type: String, default: '' }
    }],
    asset: {
        staticPath: { type: String, default: '' },
        isAnimated: { type: Boolean, default: false },
        spriteSheetPath: { type: String, default: null },
        frameCount: { type: Number, default: 1 },
        frameRate: { type: Number, default: 0 }
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

PetTemplateSchema.index({ role: 1, rarityTier: 1 });

/**
 * UserPet: Player pet instances tracking levels, current status,
 * and equipment status.
 */
const UserPetSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'userId is required'],
        index: true
    },
    petId: {
        type: String,
        required: [true, 'petId is required'],
        index: true
    },
    nickname: {
        type: String,
        trim: true,
        default: null
    },
    level: {
        type: Number,
        default: 1,
        min: 1
    },
    experience: {
        type: Number,
        default: 0,
        min: 0
    },
    currentHp: {
        type: Number,
        default: 100
    },
    maxHp: {
        type: Number,
        default: 100
    },
    currentMana: {
        type: Number,
        default: 50
    },
    maxMana: {
        type: Number,
        default: 50
    },
    happiness: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    hunger: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    health: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    isEquipped: {
        type: Boolean,
        default: false,
        index: true
    },
    timeDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

UserPetSchema.index({ userId: 1, isEquipped: 1 });
UserPetSchema.index({ userId: 1, petId: 1 });

// Virtual populate for pet template details
UserPetSchema.virtual('template', {
    ref: 'PetTemplate',
    localField: 'petId',
    foreignField: 'petId',
    justOne: true
});

const PetTemplate = mongoose.models.PetTemplate || mongoose.model('PetTemplate', PetTemplateSchema);
const UserPet = mongoose.models.UserPet || mongoose.model('UserPet', UserPetSchema);

module.exports = {
    PetTemplate,
    UserPet
};
