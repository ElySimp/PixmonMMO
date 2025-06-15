/**
 * OptimizedPetsController.js - Controller for the optimized pets system
 * 
 * This controller provides endpoints for interacting with the
 * new optimized pet database structure.
 */

const db = require('../config/database');
const Pet = require('../models/Pet');
const { seedPets } = require('../scripts/seedOptimizedPets');

// Initialize pets tables with optimized structure
exports.initPetsTables = async (req, res) => {
    try {
        // Create tables using the Pet model
        await Pet.createTables();
        
        // Check if we need to seed data
        const [petsCount] = await db.query('SELECT COUNT(*) as count FROM Pets');
        if (petsCount[0].count === 0) {
            await seedPets();
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Optimized pets tables initialized successfully' 
        });
    } catch (error) {
        console.error('Error initializing optimized pets tables:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get all available pets
exports.getAllPets = async (req, res) => {
    try {
        const [pets] = await db.query(`
            SELECT p.*, 
                   (SELECT COUNT(*) FROM PetSkillMapping WHERE pet_id = p.id) as skill_count
            FROM Pets p
            ORDER BY p.class_type, p.rarity
        `);

        res.status(200).json({ 
            success: true, 
            count: pets.length,
            data: pets 
        });
    } catch (error) {
        console.error('Error fetching all pets:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get detailed pet information by ID
exports.getPetById = async (req, res) => {
    try {
        const petId = req.params.id;
        const pet = await Pet.getById(petId);
        
        if (!pet) {
            return res.status(404).json({ 
                success: false,
                message: 'Pet not found' 
            });
        }
        
        res.status(200).json({ 
            success: true, 
            data: pet 
        });
    } catch (error) {
        console.error(`Error fetching pet ${req.params.id}:`, error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get pets by class type
exports.getPetsByClass = async (req, res) => {
    try {
        const classType = req.params.classType;
        const pets = await Pet.getByClass(classType);
        
        res.status(200).json({ 
            success: true, 
            count: pets.length,
            data: pets 
        });
    } catch (error) {
        console.error(`Error fetching pets by class ${req.params.classType}:`, error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get pets by rarity
exports.getPetsByRarity = async (req, res) => {
    try {
        const rarity = req.params.rarity;
        const [pets] = await db.query(
            'SELECT * FROM Pets WHERE rarity = ? ORDER BY class_type',
            [rarity]
        );
        
        res.status(200).json({ 
            success: true, 
            count: pets.length,
            data: pets 
        });
    } catch (error) {
        console.error(`Error fetching pets by rarity ${req.params.rarity}:`, error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get all skills for a specific pet class
exports.getSkillsByClass = async (req, res) => {
    try {
        const classType = req.params.classType;
        const [skills] = await db.query(
            'SELECT * FROM PetSkills WHERE class_type = ? ORDER BY skill_type, name',
            [classType]
        );
        
        res.status(200).json({ 
            success: true, 
            count: skills.length,
            data: skills 
        });
    } catch (error) {
        console.error(`Error fetching skills for class ${req.params.classType}:`, error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get skills for a specific pet
exports.getPetSkills = async (req, res) => {
    try {
        const petId = req.params.petId;
        const [skills] = await db.query(`
            SELECT s.*, m.unlock_level 
            FROM PetSkills s
            JOIN PetSkillMapping m ON s.id = m.skill_id
            WHERE m.pet_id = ?
            ORDER BY m.unlock_level ASC, s.name
        `, [petId]);
        
        res.status(200).json({ 
            success: true, 
            count: skills.length,
            data: skills 
        });
    } catch (error) {
        console.error(`Error fetching skills for pet ${req.params.petId}:`, error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get all pets owned by a user
exports.getUserPets = async (req, res) => {
    try {
        const userId = req.params.userId;
        const userPets = await Pet.getUserPets(userId);
        
        res.status(200).json({ 
            success: true, 
            count: userPets.length,
            data: userPets 
        });
    } catch (error) {
        console.error(`Error fetching pets for user ${req.params.userId}:`, error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Add a pet to user's collection
exports.adoptPet = async (req, res) => {
    try {
        const { userId, petId, nickname } = req.body;
        
        if (!userId || !petId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and pet ID are required'
            });
        }
        
        const userPetId = await Pet.adoptPet(userId, petId, nickname);
        
        res.status(201).json({
            success: true,
            message: 'Pet adopted successfully',
            data: { userPetId }
        });
    } catch (error) {
        console.error('Error adopting pet:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Update pet status (happiness, hunger, health)
exports.updatePetStatus = async (req, res) => {
    try {
        const userPetId = req.params.userPetId;
        const status = req.body;
        
        const success = await Pet.updateStatus(userPetId, status);
        
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Pet status updated successfully'
        });
    } catch (error) {
        console.error('Error updating pet status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Toggle pet equipped status
exports.toggleEquipPet = async (req, res) => {
    try {
        const { userPetId, userId, equipped } = req.body;
        
        if (!userPetId || !userId || equipped === undefined) {
            return res.status(400).json({
                success: false,
                message: 'User pet ID, user ID, and equipped status are required'
            });
        }
        
        await Pet.toggleEquip(userPetId, userId, equipped);
        
        res.status(200).json({
            success: true,
            message: 'Pet equipped status updated successfully'
        });
    } catch (error) {
        console.error('Error toggling pet equipped status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Calculate pet stats at a specific level
exports.calculatePetStats = async (req, res) => {
    try {
        const { petId, level } = req.params;
        const levelNum = parseInt(level) || 1;
        
        // Get base stats
        const [pets] = await db.query(`
            SELECT * FROM Pets WHERE id = ?
        `, [petId]);
        
        if (pets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }
        
        const pet = pets[0];
        
        // Prepare base stats object
        const baseStats = {
            hp: pet.base_hp,
            atk: pet.base_atk,
            def_physical: pet.base_def_physical,
            def_magical: pet.base_def_magical,
            mana: pet.base_mana,
            agility: pet.base_agility
        };
        
        // Calculate stats at the given level
        const stats = Pet.calculateStats(baseStats, levelNum, pet.growth_rate);
        
        res.status(200).json({
            success: true,
            data: {
                pet: pet.name,
                class: pet.class_type,
                level: levelNum,
                baseStats,
                calculatedStats: stats
            }
        });
    } catch (error) {
        console.error('Error calculating pet stats:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Add experience to a pet
exports.addExperience = async (req, res) => {
    try {
        const userPetId = req.params.userPetId;
        const { experience } = req.body;
        
        if (!experience || isNaN(experience)) {
            return res.status(400).json({
                success: false,
                message: 'Valid experience amount is required'
            });
        }
        
        const result = await Pet.addExperience(userPetId, parseInt(experience));
        
        res.status(200).json({
            success: true,
            message: result.leveledUp 
                ? `Pet leveled up from ${result.oldLevel} to ${result.newLevel}!` 
                : 'Experience added successfully',
            data: result
        });
    } catch (error) {
        console.error('Error adding experience to pet:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};
