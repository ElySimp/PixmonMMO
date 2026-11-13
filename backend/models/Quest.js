const mongoose = require('mongoose');

/**
 * QuestTemplate: Definition of Daily, Weekly, Monthly, and Bounty quests.
 */
const QuestTemplateSchema = new mongoose.Schema({
    questId: {
        type: String,
        required: [true, 'questId is required'],
        unique: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Quest name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Quest description is required']
    },
    repeatType: {
        type: String,
        required: [true, 'repeatType is required'],
        enum: ['daily', 'weekly', 'monthly', 'bounty'],
        index: true
    },
    requirementType: {
        type: String,
        required: [true, 'requirementType is required']
    },
    requirementTarget: {
        type: Number,
        required: [true, 'requirementTarget is required'],
        default: 1,
        min: 1
    },
    xpReward: {
        type: Number,
        default: 0,
        min: 0
    },
    goldReward: {
        type: Number,
        default: 0,
        min: 0
    },
    diamondReward: {
        type: Number,
        default: 0,
        min: 0
    },
    itemRewards: [{
        itemId: { type: String, required: true },
        amount: { type: Number, default: 1, min: 1 }
    }],
    levelRequired: {
        type: Number,
        default: 1,
        min: 1
    },
    questPointsRequired: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

QuestTemplateSchema.index({ repeatType: 1, levelRequired: 1 });

/**
 * UserQuestProgress: Tracks individual user progress for each quest
 * within a periodic window.
 */
const UserQuestProgressSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'userId is required'],
        index: true
    },
    questId: {
        type: String,
        required: [true, 'questId is required'],
        index: true
    },
    repeatType: {
        type: String,
        required: [true, 'repeatType is required'],
        enum: ['daily', 'weekly', 'monthly', 'bounty']
    },
    periodKey: {
        type: String,
        required: [true, 'periodKey is required'],
        index: true
    },
    progress: {
        type: Number,
        default: 0,
        min: 0
    },
    target: {
        type: Number,
        required: [true, 'target is required'],
        min: 1
    },
    completed: {
        type: Boolean,
        default: false
    },
    claimed: {
        type: Boolean,
        default: false
    },
    claimedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound unique index prevents duplicate quest progress entries within the same reset window
UserQuestProgressSchema.index({ userId: 1, questId: 1, periodKey: 1 }, { unique: true });
UserQuestProgressSchema.index({ userId: 1, repeatType: 1, periodKey: 1 });

// Helper to calculate standard period keys
UserQuestProgressSchema.statics.generatePeriodKey = function (repeatType, date = new Date()) {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    if (repeatType === 'daily') {
        return `${yyyy}-${mm}-${dd}`;
    }
    if (repeatType === 'weekly') {
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return `${yyyy}-W${String(weekNum).padStart(2, '0')}`;
    }
    if (repeatType === 'monthly') {
        return `${yyyy}-${mm}`;
    }
    return 'permanent';
};

// Virtual populate for quest template
UserQuestProgressSchema.virtual('template', {
    ref: 'QuestTemplate',
    localField: 'questId',
    foreignField: 'questId',
    justOne: true
});

const QuestTemplate = mongoose.models.QuestTemplate || mongoose.model('QuestTemplate', QuestTemplateSchema);
const UserQuestProgress = mongoose.models.UserQuestProgress || mongoose.model('UserQuestProgress', UserQuestProgressSchema);

module.exports = {
    QuestTemplate,
    UserQuestProgress
};
