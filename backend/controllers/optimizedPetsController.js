/**
 * OptimizedPetsController.js - Controller for the optimized pets system
 * Backed by Mongoose PetTemplate and UserPet models.
 */

const { PetTemplate, UserPet } = require('../models/Pet');

exports.initPetsTables = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Optimized pets collections initialized successfully'
    });
};

exports.getAllPets = async (req, res) => {
    try {
        const pets = await PetTemplate.find({});
        res.status(200).json({
            success: true,
            count: pets.length,
            data: pets
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.getPetById = async (req, res) => {
    try {
        const { id } = req.params;
        const pet = await PetTemplate.findOne({
            $or: [{ petId: String(id) }, { name: String(id) }]
        });
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }
        res.status(200).json({ success: true, data: pet });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.getPetsByClass = async (req, res) => {
    try {
        const { classType } = req.params;
        const pets = await PetTemplate.find({ role: classType });
        res.status(200).json({ success: true, count: pets.length, data: pets });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.getPetsByRarity = async (req, res) => {
    try {
        const { rarity } = req.params;
        const query = isNaN(rarity) ? { rarityName: rarity } : { rarityTier: parseInt(rarity) };
        const pets = await PetTemplate.find(query);
        res.status(200).json({ success: true, count: pets.length, data: pets });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.getSkillsByClass = async (req, res) => {
    try {
        const { classType } = req.params;
        const pets = await PetTemplate.find({ role: classType });
        const skills = pets.flatMap(p => p.activeSkills || []);
        res.status(200).json({ success: true, data: skills });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.getPetSkills = async (req, res) => {
    try {
        const { petId } = req.params;
        const pet = await PetTemplate.findOne({
            $or: [{ petId: String(petId) }, { name: String(petId) }]
        });
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }
        res.status(200).json({ success: true, data: pet.activeSkills || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.getUserPets = async (req, res) => {
    try {
        const { userId } = req.params;
        const userPets = await UserPet.find({ userId: String(userId) });
        const templates = await PetTemplate.find({});
        const templateMap = new Map(templates.map(t => [t.petId, t]));

        const rows = userPets.map(up => {
            const tmpl = templateMap.get(up.petId) || {};
            return {
                id: up._id.toString(),
                user_id: up.userId,
                pet_id: up.petId,
                name: tmpl.name || 'Pet',
                nickname: up.nickname || tmpl.name,
                level: up.level,
                experience: up.experience,
                current_hp: up.currentHp,
                current_mana: up.currentMana,
                is_equipped: up.isEquipped,
                happiness: up.happiness,
                hunger: up.hunger,
                health: up.health,
                template: tmpl
            };
        });

        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.adoptPet = async (req, res) => {
    try {
        const { userId, petId, nickname } = req.body;
        const template = await PetTemplate.findOne({
            $or: [{ petId: String(petId) }, { name: String(petId) }]
        });

        if (!template) {
            return res.status(404).json({ success: false, message: 'Pet template not found' });
        }

        const userPet = await UserPet.create({
            userId: String(userId),
            petId: template.petId,
            nickname: nickname || template.name,
            level: 1,
            experience: 0,
            currentHp: template.baseHp,
            currentMana: template.baseMana
        });

        res.status(201).json({ success: true, message: 'Pet adopted successfully', data: userPet });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.updatePetStatus = async (req, res) => {
    try {
        const { userPetId } = req.params;
        const { happiness, hunger, health } = req.body;

        const update = {};
        if (happiness !== undefined) update.happiness = Math.min(100, Math.max(0, happiness));
        if (hunger !== undefined) update.hunger = Math.min(100, Math.max(0, hunger));
        if (health !== undefined) update.health = Math.min(100, Math.max(0, health));

        const userPet = await UserPet.findByIdAndUpdate(userPetId, { $set: update }, { new: true });
        if (!userPet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        res.status(200).json({ success: true, message: 'Pet status updated successfully', data: userPet });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.toggleEquipPet = async (req, res) => {
    try {
        const { userPetId, userId, equipped } = req.body;
        const isEquip = equipped === 'yes' || equipped === true;

        if (isEquip) {
            await UserPet.updateMany({ userId: String(userId) }, { $set: { isEquipped: false } });
        }

        await UserPet.findByIdAndUpdate(userPetId, { $set: { isEquipped: isEquip } });

        res.status(200).json({ success: true, message: 'Pet equipped status updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.calculatePetStats = async (req, res) => {
    try {
        const { petId, level } = req.params;
        const levelNum = parseInt(level) || 1;
        const template = await PetTemplate.findOne({
            $or: [{ petId: String(petId) }, { name: String(petId) }]
        });

        if (!template) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const growthRate = 1.1;
        res.status(200).json({
            success: true,
            data: {
                pet: template.name,
                level: levelNum,
                stats: {
                    hp: Math.round(template.baseHp * Math.pow(growthRate, levelNum - 1)),
                    atk: Math.round(template.baseAtk * Math.pow(growthRate, levelNum - 1)),
                    def_phy: Math.round(template.baseDefPhy * Math.pow(growthRate, levelNum - 1)),
                    def_magic: Math.round(template.baseDefMag * Math.pow(growthRate, levelNum - 1)),
                    max_mana: Math.round(template.baseMana * Math.pow(growthRate, levelNum - 1)),
                    agility: Math.round(template.baseAgility * Math.pow(growthRate, levelNum - 1))
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.addExperience = async (req, res) => {
    try {
        const { userPetId } = req.params;
        const { amount = 0 } = req.body;

        const userPet = await UserPet.findById(userPetId);
        if (!userPet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        userPet.experience = (userPet.experience || 0) + parseInt(amount);
        const xpForNextLevel = userPet.level * 100;
        if (userPet.experience >= xpForNextLevel) {
            userPet.level += 1;
            userPet.experience -= xpForNextLevel;
        }

        await userPet.save();

        res.status(200).json({
            success: true,
            message: 'Experience added successfully',
            data: {
                level: userPet.level,
                experience: userPet.experience
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
