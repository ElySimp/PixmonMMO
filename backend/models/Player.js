const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PlayerSchema = new mongoose.Schema({
    // Authentication
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false
    },
    // Numeric or string legacy ID compatibility
    id: {
        type: String,
        index: true
    },

    // Player Progression
    level: {
        type: Number,
        default: 1,
        min: 1
    },
    xp: {
        type: Number,
        default: 0,
        min: 0
    },
    gold: {
        type: Number,
        default: 100,
        min: 0
    },
    diamonds: {
        type: Number,
        default: 10,
        min: 0
    },
    questPoints: {
        type: Number,
        default: 10,
        min: 0
    },
    questPointsMax: {
        type: Number,
        default: 10
    },
    questPointLastUpdate: {
        type: Date,
        default: Date.now
    },

    // Energy Pool (10 Max, 1 per dungeon entry)
    energy: {
        current: {
            type: Number,
            default: 10,
            min: 0
        },
        max: {
            type: Number,
            default: 10,
            min: 1
        },
        lastRefillAt: {
            type: Date,
            default: Date.now
        },
        refillRateMinutes: {
            type: Number,
            default: 10 // 1 energy per 10 minutes
        }
    },

    // Combat Stats
    combatStats: {
        currentHp: {
            type: Number,
            default: 100,
            min: 0
        },
        maxHp: {
            type: Number,
            default: 100,
            min: 1
        },
        currentMana: {
            type: Number,
            default: 50,
            min: 0
        },
        maxMana: {
            type: Number,
            default: 50,
            min: 1
        },
        baseAtk: {
            type: Number,
            default: 15,
            min: 1
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
        baseAgility: {
            type: Number,
            default: 10,
            min: 1
        }
    },

    // Profile & Skill Allocations
    profile: {
        statusMessage: {
            type: String,
            default: 'Ready for adventure!',
            maxlength: 250
        },
        status_message: {
            type: String,
            default: 'Ready for adventure!'
        },
        avatarUrl: {
            type: String,
            default: null
        },
        avatar_url: {
            type: String,
            default: null
        },
        wallpaperId: {
            type: Number,
            default: 1
        },
        wallpaper_url: {
            type: String,
            default: null
        },
        wallpaper: {
            type: String,
            default: null
        },
        favoritePetId: {
            type: String,
            default: null
        },
        favorite_pet_id: {
            type: String,
            default: null
        },
        skillPoints: {
            type: Number,
            default: 0,
            min: 0
        },
        skill_points: {
            type: Number,
            default: 0,
            min: 0
        },
        hpPoints: {
            type: Number,
            default: 0,
            min: 0
        },
        hp_points: {
            type: Number,
            default: 0,
            min: 0
        },
        damagePoints: {
            type: Number,
            default: 0,
            min: 0
        },
        damage_points: {
            type: Number,
            default: 0,
            min: 0
        },
        agilityPoints: {
            type: Number,
            default: 0,
            min: 0
        },
        agility_points: {
            type: Number,
            default: 0,
            min: 0
        },
        selectedAchievements: [{
            type: String
        }],
        selected_achievements: [{
            type: String
        }]
    },

    // Daily Rewards Tracker
    dailyRewards: {
        currentDay: {
            type: Number,
            default: 1,
            min: 1,
            max: 7
        },
        current_day: {
            type: Number,
            default: 1
        },
        streakCount: {
            type: Number,
            default: 0,
            min: 0
        },
        streak_count: {
            type: Number,
            default: 0
        },
        totalClaimed: {
            type: Number,
            default: 0,
            min: 0
        },
        total_claimed: {
            type: Number,
            default: 0
        },
        lastClaimedDate: {
            type: Date,
            default: null
        },
        last_claimed_date: {
            type: String,
            default: null
        },
        lastDailyMainReward: {
            type: Date,
            default: null
        }
    },

    // Exploration Stepping Cooldown
    exploration: {
        cooldownEnd: {
            type: Date,
            default: null
        },
        totalSteps: {
            type: Number,
            default: 0,
            min: 0
        },
        dailySteps: {
            type: Number,
            default: 0,
            min: 0
        },
        lastStepDate: {
            type: String,
            default: null
        }
    },
    cooldownEnd: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
PlayerSchema.index({ level: -1 });
PlayerSchema.index({ gold: -1 });
PlayerSchema.index({ 'exploration.cooldownEnd': 1 });

// Virtuals for backwards compatibility
PlayerSchema.virtual('user_id').get(function () {
    return this.id || (this._id ? (this._id.toHexString ? this._id.toHexString() : this._id.toString()) : '');
});
PlayerSchema.virtual('passwordHash').get(function () {
    return this.password;
}).set(function (val) {
    this.password = val;
});

// Pre-save password hashing and ID synchronization
PlayerSchema.pre('save', async function () {
    if (!this.id && this._id) {
        this.id = this._id.toHexString ? this._id.toHexString() : this._id.toString();
    }
    if (!this.isModified('password')) {
        return;
    }
    // Only hash if not already a bcrypt hash
    if (this.password && typeof this.password === 'string' && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

// Password verification method with input sanitization and exception guarding
PlayerSchema.methods.comparePassword = async function (candidatePassword) {
    if (!candidatePassword || typeof candidatePassword !== 'string' || !this.password || typeof this.password !== 'string') {
        return false;
    }
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch {
        return false;
    }
};

// Calculate required XP to level up
PlayerSchema.methods.calculateMaxXp = function () {
    return Math.floor(50 * Math.pow(this.level, 1.4));
};

// Refill passive energy based on elapsed time
PlayerSchema.methods.refillEnergy = function () {
    if (this.energy.current >= this.energy.max) {
        return this.energy.current;
    }

    const now = Date.now();
    const lastRefill = new Date(this.energy.lastRefillAt).getTime();
    const elapsedMinutes = (now - lastRefill) / (1000 * 60);
    const refillPoints = Math.floor(elapsedMinutes / (this.energy.refillRateMinutes || 10));

    if (refillPoints > 0) {
        this.energy.current = Math.min(this.energy.max, this.energy.current + refillPoints);
        this.energy.lastRefillAt = new Date(lastRefill + refillPoints * (this.energy.refillRateMinutes || 10) * 60 * 1000);
    }

    return this.energy.current;
};

// Consume energy with strict positive number validation and boundary protection
PlayerSchema.methods.consumeEnergy = function (amount = 1) {
    if (typeof amount !== 'number' || Number.isNaN(amount) || !Number.isFinite(amount) || amount <= 0) {
        return false;
    }
    this.refillEnergy();
    if (this.energy.current < amount) {
        return false;
    }
    this.energy.current = Math.max(0, this.energy.current - amount);
    return true;
};

// Sanitize output JSON (strip password)
PlayerSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.models.Player || mongoose.model('Player', PlayerSchema);
