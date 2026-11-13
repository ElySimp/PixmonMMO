// controllers/userProfileController.js
const Player = require('../models/Player');
const { PetTemplate, UserPet } = require('../models/Pet');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WebP files are allowed.'));
        }
    }
});

const calculateXpCap = (level) => {
    return Math.floor(50 * Math.pow(level || 1, 1.4));
};

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        let player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }, { username: userId }]
        });

        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        const maxXp = calculateXpCap(player.level);

        // Fetch favorite pet if exists
        let favoritePet = null;
        if (player.profile?.favoritePetId || player.profile?.favorite_pet_id) {
            const petId = player.profile.favoritePetId || player.profile.favorite_pet_id;
            favoritePet = await UserPet.findOne({ userId: player.id || player._id.toString(), petId });
        }

        const profileObj = player.profile ? (player.profile.toObject ? player.profile.toObject() : player.profile) : {};

        res.json({
            success: true,
            id: player.id || player._id.toString(),
            user_id: player.id || player._id.toString(),
            username: player.username,
            level: player.level,
            xp: player.xp,
            gold: player.gold,
            diamonds: player.diamonds,
            maxXp,
            status_message: profileObj.status_message || profileObj.statusMessage || 'Ready for adventure!',
            skill_points: profileObj.skill_points || profileObj.skillPoints || 0,
            hp_points: profileObj.hp_points || profileObj.hpPoints || 0,
            damage_points: profileObj.damage_points || profileObj.damagePoints || 0,
            agility_points: profileObj.agility_points || profileObj.agilityPoints || 0,
            wallpaper_url: profileObj.wallpaper_url || profileObj.wallpaper || '/assets/wallpapers/wallpaper1.jpg',
            avatar_url: profileObj.avatar_url || profileObj.avatarUrl || '/assets/avatars/avatar1.jpg',
            favorite_pet: favoritePet,
            selected_achievements: profileObj.selected_achievements || profileObj.selectedAchievements || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load profile data',
            error: error.message
        });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No updates provided' });
        }

        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }, { username: userId }]
        });

        if (!player) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        if (!player.profile) player.profile = {};

        if (updates.status_message !== undefined) {
            player.profile.status_message = updates.status_message;
            player.profile.statusMessage = updates.status_message;
        }
        if (updates.wallpaper_url !== undefined) {
            player.profile.wallpaper_url = updates.wallpaper_url;
            player.profile.wallpaper = updates.wallpaper_url;
        }
        if (updates.wallpaper !== undefined) {
            player.profile.wallpaper_url = updates.wallpaper;
            player.profile.wallpaper = updates.wallpaper;
        }
        if (updates.avatar_url !== undefined) {
            player.profile.avatar_url = updates.avatar_url;
            player.profile.avatarUrl = updates.avatar_url;
        }
        if (updates.favorite_pet_id !== undefined) {
            player.profile.favorite_pet_id = updates.favorite_pet_id;
            player.profile.favoritePetId = updates.favorite_pet_id;
        }

        await player.save();

        const maxXp = calculateXpCap(player.level);

        res.json({
            success: true,
            user_id: player.id || player._id.toString(),
            level: player.level,
            xp: player.xp,
            maxXp,
            profile: player.profile
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating user profile'
        });
    }
};

// Update skill points
exports.updateSkillPoints = async (req, res) => {
    try {
        const { userId } = req.params;
        const { hp_points = 0, damage_points = 0, agility_points = 0 } = req.body;

        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }, { username: userId }]
        });

        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        if (!player.profile) player.profile = {};

        player.profile.hp_points = parseInt(hp_points) || 0;
        player.profile.hpPoints = parseInt(hp_points) || 0;
        player.profile.damage_points = parseInt(damage_points) || 0;
        player.profile.damagePoints = parseInt(damage_points) || 0;
        player.profile.agility_points = parseInt(agility_points) || 0;
        player.profile.agilityPoints = parseInt(agility_points) || 0;

        await player.save();

        const maxXp = calculateXpCap(player.level);

        res.json({
            success: true,
            user_id: player.id || player._id.toString(),
            level: player.level,
            maxXp,
            hp_points: player.profile.hp_points,
            damage_points: player.profile.damage_points,
            agility_points: player.profile.agility_points,
            skill_points: player.profile.skill_points || 0
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating skill points'
        });
    }
};

// Reset skill points
exports.resetSkillPoints = async (req, res) => {
    try {
        const { userId } = req.params;
        const { diamonds_cost = 5 } = req.body;

        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }, { username: userId }]
        });

        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        if (player.diamonds < diamonds_cost) {
            return res.status(400).json({ success: false, message: 'Insufficient diamonds' });
        }

        player.diamonds -= diamonds_cost;

        if (!player.profile) player.profile = {};

        const refundedPoints = (player.profile.hp_points || 0) + 
                               (player.profile.damage_points || 0) + 
                               (player.profile.agility_points || 0);

        player.profile.hp_points = 0;
        player.profile.hpPoints = 0;
        player.profile.damage_points = 0;
        player.profile.damagePoints = 0;
        player.profile.agility_points = 0;
        player.profile.agilityPoints = 0;
        player.profile.skill_points = (player.profile.skill_points || 0) + refundedPoints;
        player.profile.skillPoints = player.profile.skill_points;

        await player.save();

        res.json({
            success: true,
            diamonds: player.diamonds,
            skill_points: player.profile.skill_points,
            hp_points: 0,
            damage_points: 0,
            agility_points: 0
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error resetting skill points'
        });
    }
};

// Upload custom wallpaper
exports.uploadCustomWallpaper = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const wallpaperUrl = `/assets/wallpapers/custom_${Date.now()}.png`;

        const player = await Player.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: String(userId) }, { username: userId }] },
            { $set: { 'profile.wallpaper_url': wallpaperUrl, 'profile.wallpaper': wallpaperUrl } },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Custom wallpaper uploaded successfully',
            wallpaper_url: wallpaperUrl,
            userId: player.id || player._id.toString(),
            level: player.level,
            maxXp: calculateXpCap(player.level)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const avatarUrl = `/assets/avatars/custom_${Date.now()}.png`;

        const player = await Player.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: String(userId) }, { username: userId }] },
            { $set: { 'profile.avatar_url': avatarUrl, 'profile.avatarUrl': avatarUrl } },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatar_url: avatarUrl,
            userId: player.id || player._id.toString(),
            level: player.level,
            maxXp: calculateXpCap(player.level)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all wallpapers
exports.getAllWallpapers = async (req, res) => {
    res.json({
        success: true,
        wallpapers: [
            { id: 1, name: 'Default Meadow', url: '/assets/wallpapers/wallpaper1.jpg' },
            { id: 2, name: 'Void Domain', url: '/assets/wallpapers/wallpaper2.png' },
            { id: 3, name: 'Astral Rift', url: '/assets/wallpapers/wallpaper3.png' },
            { id: 4, name: 'Molten Keep', url: '/assets/wallpapers/wallpaper4.png' },
            { id: 5, name: 'Frozen Tundra', url: '/assets/wallpapers/wallpaper5.png' }
        ]
    });
};

// Update status message
exports.updateStatusMessage = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status_message } = req.body;

        if (status_message === undefined) {
            return res.status(400).json({ success: false, message: 'Status message is required' });
        }

        const player = await Player.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: String(userId) }, { username: userId }] },
            { $set: { 'profile.status_message': status_message, 'profile.statusMessage': status_message } },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Status message updated successfully',
            status_message,
            userId: player.id || player._id.toString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get wallpaper by ID
exports.getWallpaper = async (req, res) => {
    const { wallpaperId } = req.params;
    res.json({
        success: true,
        wallpaper: {
            id: wallpaperId,
            url: `/assets/wallpapers/wallpaper${wallpaperId}.png`
        }
    });
};

// Get pet details
exports.getPet = async (req, res) => {
    try {
        const { petId } = req.params;
        const pet = await PetTemplate.findOne({ petId });
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }
        res.json({ success: true, pet });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Initialize UserProfile tables (no-op in MongoDB)
exports.initUserProfileTables = async (req, res) => {
    res.json({
        success: true,
        message: 'UserProfile collections initialized successfully'
    });
};

exports.uploadSingle = (fieldName) => upload.single(fieldName);
exports.upload = upload;

// Update avatar and wallpaper
exports.updateAvatarAndWallpaper = async (req, res) => {
    try {
        const { userId } = req.params;
        const { avatar_id, wallpaper_id } = req.body;

        const avatarUrl = `/assets/avatars/avatar${avatar_id || 1}.jpg`;
        const wallpaperUrl = `/assets/wallpapers/wallpaper${wallpaper_id || 1}.png`;

        await Player.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: String(userId) }, { username: userId }] },
            {
                $set: {
                    'profile.avatar_url': avatarUrl,
                    'profile.wallpaper_url': wallpaperUrl,
                    'profile.wallpaper': wallpaperUrl
                }
            }
        );

        res.json({ success: true, message: 'Avatar and wallpaper updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update preset avatar
exports.updateAvatar = async (req, res) => {
    try {
        const { userId } = req.params;
        const { avatar_id } = req.body;
        const avatarUrl = `/assets/avatars/avatar${avatar_id || 1}.jpg`;

        await Player.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: String(userId) }, { username: userId }] },
            { $set: { 'profile.avatar_url': avatarUrl, 'profile.avatarUrl': avatarUrl } }
        );

        res.json({
            success: true,
            message: 'Avatar updated successfully',
            avatar_url: avatarUrl
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update preset wallpaper
exports.updateWallpaper = async (req, res) => {
    try {
        const { userId } = req.params;
        const { wallpaper_id } = req.body;
        const wallpaperUrl = `/assets/wallpapers/wallpaper${wallpaper_id || 1}.png`;

        await Player.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: String(userId) }, { username: userId }] },
            { $set: { 'profile.wallpaper_url': wallpaperUrl, 'profile.wallpaper': wallpaperUrl } }
        );

        res.json({
            success: true,
            message: 'Wallpaper updated successfully',
            wallpaper: wallpaperUrl
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update favorite pet
exports.updateFavoritePet = async (req, res) => {
    try {
        const { userId } = req.params;
        const { pet_id } = req.body;

        await Player.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: String(userId) }, { username: userId }] },
            { $set: { 'profile.favorite_pet_id': pet_id, 'profile.favoritePetId': pet_id } }
        );

        res.json({
            success: true,
            message: 'Favorite pet updated successfully',
            favorite_pet_id: pet_id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get selected achievements
exports.getSelectedAchievements = async (req, res) => {
    try {
        const { userId } = req.params;
        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }, { username: userId }]
        });
        res.json(player?.profile?.selected_achievements || player?.profile?.selectedAchievements || []);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update selected achievements
exports.updateSelectedAchievements = async (req, res) => {
    try {
        const { userId } = req.params;
        const { achievement_ids = [] } = req.body;

        await Player.findOneAndUpdate(
            { $or: [{ _id: userId }, { id: String(userId) }, { username: userId }] },
            {
                $set: {
                    'profile.selected_achievements': achievement_ids.slice(0, 3),
                    'profile.selectedAchievements': achievement_ids.slice(0, 3)
                }
            }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user pets
exports.getUserPets = async (req, res) => {
    try {
        const { userId } = req.params;
        const userPets = await UserPet.find({ userId }).populate('template');

        const rows = userPets.map(p => ({
            id: p._id.toString(),
            name: p.nickname || p.template?.name || 'Pet',
            level: p.level,
            role: p.template?.role || 'warrior',
            rarity: p.template?.rarityName || 'Common',
            image_url: p.template?.asset?.staticPath || '/assets/pets/fennec.png'
        }));

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get user pets' });
    }
};
