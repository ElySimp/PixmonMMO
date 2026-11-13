const { PetTemplate, UserPet } = require('../models/Pet');

// No-op for Mongoose table initialization
async function createPetsTables() {
    return Promise.resolve();
}

exports.initPetsTables = async (req, res) => {
    res.status(200).json({ success: true, message: 'Pets collections initialized successfully' });
};

exports.createPetsTables = createPetsTables;

// Get user pets with template details
exports.PetsDataObtain = async (req, res) => {
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
                Pets_id: up.petId,
                name: tmpl.name || 'Pet',
                nickname: up.nickname || tmpl.name,
                equipped: up.isEquipped ? 'yes' : 'no',
                is_equipped: up.isEquipped,
                current_level: up.level,
                level: up.level,
                current_hp: up.currentHp,
                current_mana: up.currentMana,
                current_atk: tmpl.baseAtk || 15,
                current_def_phy: tmpl.baseDefPhy || 10,
                current_def_magic: tmpl.baseDefMag || 10,
                current_agility: tmpl.baseAgility || 10,
                role: tmpl.role || 'warrior',
                rarity: tmpl.rarityName || 'Common',
                happiness: up.happiness,
                hunger: up.hunger,
                health: up.health,
                time_date: up.createdAt || new Date()
            };
        });

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllPets = async (req, res) => {
    try {
        const pets = await PetTemplate.find({});
        res.status(200).json({ success: true, data: pets });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getPetsByRole = async (req, res) => {
    try {
        const { role } = req.params;
        const pets = await PetTemplate.find({ role });
        res.status(200).json({ success: true, data: pets });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getPetsByRarity = async (req, res) => {
    try {
        const { rarity } = req.params;
        const query = isNaN(rarity) ? { rarityName: rarity } : { rarityTier: parseInt(rarity) };
        const pets = await PetTemplate.find(query);
        res.status(200).json({ success: true, data: pets });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getPetSkillsByRole = async (req, res) => {
    try {
        const { role } = req.params;
        const pets = await PetTemplate.find({ role });
        const skills = pets.flatMap(p => p.activeSkills || []);
        res.status(200).json({ success: true, data: skills });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addPetToUser = async (req, res) => {
    try {
        const { userId, petId, nickname } = req.body;
        const template = await PetTemplate.findOne({
            $or: [{ petId: String(petId) }, { name: String(petId) }]
        });

        if (!template) {
            return res.status(404).json({ message: 'Pet template not found' });
        }

        const userPet = await UserPet.create({
            userId: String(userId),
            petId: template.petId,
            nickname: nickname || template.name,
            level: 1,
            currentHp: template.baseHp,
            currentMana: template.baseMana
        });

        res.status(201).json({ success: true, message: 'Pet added to user successfully', data: userPet });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
            return res.status(404).json({ message: 'Pet not found' });
        }

        res.status(200).json({ success: true, message: 'Pet status updated successfully', data: userPet });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
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
            return res.status(404).json({ message: 'Pet not found' });
        }

        const growthRate = 1.1;
        const stats = {
            hp: Math.round(template.baseHp * Math.pow(growthRate, levelNum - 1)),
            atk: Math.round(template.baseAtk * Math.pow(growthRate, levelNum - 1)),
            def_phy: Math.round(template.baseDefPhy * Math.pow(growthRate, levelNum - 1)),
            def_magic: Math.round(template.baseDefMag * Math.pow(growthRate, levelNum - 1)),
            max_mana: Math.round(template.baseMana * Math.pow(growthRate, levelNum - 1)),
            agility: Math.round(template.baseAgility * Math.pow(growthRate, levelNum - 1))
        };

        res.status(200).json({
            success: true,
            data: {
                pet: template.name,
                level: levelNum,
                stats
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.equipPet = async (req, res) => {
    try {
        const { userId } = req.params;
        const { petId } = req.body;

        await UserPet.updateMany({ userId: String(userId) }, { $set: { isEquipped: false } });

        const pet = await UserPet.findOneAndUpdate(
            { userId: String(userId), $or: [{ _id: petId }, { petId: String(petId) }] },
            { $set: { isEquipped: true } },
            { new: true }
        );

        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found in user collection' });
        }

        res.status(200).json({ success: true, message: 'Pet equipped successfully', data: pet });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getEquippedPet = async (req, res) => {
    try {
        const { userId } = req.params;
        const equippedPet = await UserPet.findOne({ userId: String(userId), isEquipped: true });

        if (!equippedPet) {
            return res.status(404).json({ success: false, message: 'No equipped pet found' });
        }

        const template = await PetTemplate.findOne({ petId: equippedPet.petId });

        res.status(200).json({
            success: true,
            data: {
                id: equippedPet._id.toString(),
                petId: equippedPet.petId,
                name: template?.name || 'Pet',
                nickname: equippedPet.nickname || template?.name,
                level: equippedPet.level,
                hp: equippedPet.currentHp,
                mana: equippedPet.currentMana,
                happiness: equippedPet.happiness,
                hunger: equippedPet.hunger,
                health: equippedPet.health,
                template: template || {}
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.playWithPet = async (req, res) => {
    try {
        const { userPetId } = req.params;
        const pet = await UserPet.findById(userPetId);

        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const happinessIncrease = Math.floor(Math.random() * 11) + 20;
        pet.happiness = Math.min(100, (pet.happiness || 0) + happinessIncrease);
        pet.hunger = Math.max(0, (pet.hunger || 0) - 5);
        await pet.save();

        res.status(200).json({
            success: true,
            message: 'Played with pet successfully',
            update: {
                happiness: pet.happiness,
                happinessIncrease,
                hunger: pet.hunger,
                cooldownSeconds: 60
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPetRawStats = async (req, res) => {
    try {
        const { userPetId } = req.params;
        const pet = await UserPet.findById(userPetId);

        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const template = await PetTemplate.findOne({ petId: pet.petId });

        res.status(200).json({
            success: true,
            pet: {
                id: pet._id.toString(),
                name: template?.name || 'Pet',
                nickname: pet.nickname,
                level: pet.level,
                classType: template?.role || 'warrior',
                hp: pet.currentHp,
                atk: template?.baseAtk || 15,
                defPhysical: template?.baseDefPhy || 10,
                defMagical: template?.baseDefMag || 10,
                mana: pet.currentMana,
                agility: template?.baseAgility || 10,
                healthValue: pet.health,
                hungerValue: pet.hunger,
                happinessValue: pet.happiness,
                isEquipped: pet.isEquipped,
                imageUrl: template?.asset?.staticPath || '/assets/pets/fennec.png'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
