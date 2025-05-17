const db = require('../config/database');

class Achievement {
    // Create the achievements table
    static async createTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS Achievements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                icon_name VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                requirement_type VARCHAR(50) NOT NULL,
                requirement_value INT NOT NULL,
                xp_reward INT NOT NULL DEFAULT 0,
                gold_reward INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NULL
            )
        `;
        
        try {
            await db.query(sql);
            console.log('Achievements table created or already exists');
            
            // Populate with initial achievements if table is empty
            const [count] = await db.query('SELECT COUNT(*) as count FROM Achievements');
            if (count[0].count === 0) {
                await this.seedInitialAchievements();
            }
        } catch (error) {
            console.error('Error creating Achievements table:', error);
            throw error;
        }
    }
    
    // Create user achievements junction table to track which users have which achievements
    static async createUserAchievementsTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS UserAchievements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                achievement_id INT NOT NULL,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY user_achievement (user_id, achievement_id),
                FOREIGN KEY (user_id) REFERENCES UserLogin(id) ON DELETE CASCADE,
                FOREIGN KEY (achievement_id) REFERENCES Achievements(id) ON DELETE CASCADE
            )
        `;
        
        try {
            await db.query(sql);
            console.log('UserAchievements table created or already exists');
        } catch (error) {
            console.error('Error creating UserAchievements table:', error);
            throw error;
        }
    }
    
    // Seed the database with initial achievements
    static async seedInitialAchievements() {
        const achievements = [
            // Adventure achievements
            {
                title: "First Steps",
                description: "Take your first step in the adventure",
                icon_name: "footprints",
                category: "adventure",
                requirement_type: "steps",
                requirement_value: 1,
                xp_reward: 50,
                gold_reward: 25
            },
            {
                title: "Explorer",
                description: "Take 50 steps in the adventure",
                icon_name: "compass",
                category: "adventure",
                requirement_type: "steps",
                requirement_value: 50,
                xp_reward: 150,
                gold_reward: 75
            },
            {
                title: "Adventurer",
                description: "Take 200 steps in the adventure",
                icon_name: "map",
                category: "adventure",
                requirement_type: "steps",
                requirement_value: 200,
                xp_reward: 300,
                gold_reward: 150
            },
            {
                title: "Expedition Leader",
                description: "Take 1000 steps in the adventure",
                icon_name: "mountain",
                category: "adventure",
                requirement_type: "steps",
                requirement_value: 1000,
                xp_reward: 800,
                gold_reward: 400
            },
            
            // Level achievements
            {
                title: "Level 5",
                description: "Reach level 5 with your character",
                icon_name: "level_star",
                category: "level",
                requirement_type: "level",
                requirement_value: 5,
                xp_reward: 200,
                gold_reward: 100
            },
            {
                title: "Level 10",
                description: "Reach level 10 with your character",
                icon_name: "level_star",
                category: "level",
                requirement_type: "level",
                requirement_value: 10,
                xp_reward: 500,
                gold_reward: 250
            },
            {
                title: "Level 25",
                description: "Reach level 25 with your character",
                icon_name: "level_star",
                category: "level",
                requirement_type: "level",
                requirement_value: 25,
                xp_reward: 1500,
                gold_reward: 750
            },
            
            // Gold achievements
            {
                title: "Pocket Money",
                description: "Accumulate 100 gold",
                icon_name: "money_bag",
                category: "wealth",
                requirement_type: "gold_total",
                requirement_value: 100,
                xp_reward: 100,
                gold_reward: 0
            },
            {
                title: "Treasure Hunter",
                description: "Accumulate 1000 gold",
                icon_name: "treasure",
                category: "wealth",
                requirement_type: "gold_total",
                requirement_value: 1000,
                xp_reward: 500,
                gold_reward: 0
            },
            {
                title: "Wealthy Collector",
                description: "Accumulate 5000 gold",
                icon_name: "crown",
                category: "wealth",
                requirement_type: "gold_total",
                requirement_value: 5000,
                xp_reward: 1500,
                gold_reward: 0
            },
            
            // Pixmon achievements
            {
                title: "First Friend",
                description: "Catch your first Pixmon",
                icon_name: "pixball",
                category: "collection",
                requirement_type: "pixmon_count",
                requirement_value: 1,
                xp_reward: 100,
                gold_reward: 50
            },
            {
                title: "Collector",
                description: "Catch 10 different Pixmon",
                icon_name: "pixdex",
                category: "collection",
                requirement_type: "pixmon_unique",
                requirement_value: 10,
                xp_reward: 500,
                gold_reward: 250
            }
        ];
        
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        for (const achievement of achievements) {
            try {
                await db.query(`
                    INSERT INTO Achievements 
                    (title, description, icon_name, category, requirement_type, requirement_value, xp_reward, gold_reward, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    achievement.title,
                    achievement.description,
                    achievement.icon_name,
                    achievement.category,
                    achievement.requirement_type,
                    achievement.requirement_value,
                    achievement.xp_reward,
                    achievement.gold_reward,
                    now
                ]);
            } catch (error) {
                console.error(`Error seeding achievement ${achievement.title}:`, error);
            }
        }
        
        console.log('Seeded initial achievements');
    }
    
    // Get all achievements
    static async getAllAchievements() {
        try {
            const [achievements] = await db.query(`
                SELECT * FROM Achievements 
                ORDER BY category, requirement_value
            `);
            
            return achievements;
        } catch (error) {
            console.error('Error getting all achievements:', error);
            throw error;
        }
    }
    
    // Get achievements by category
    static async getAchievementsByCategory(category) {
        try {
            const [achievements] = await db.query(`
                SELECT * FROM Achievements 
                WHERE category = ?
                ORDER BY requirement_value
            `, [category]);
            
            return achievements;
        } catch (error) {
            console.error(`Error getting achievements for category ${category}:`, error);
            throw error;
        }
    }
    
    // Get achievement by ID
    static async getAchievementById(id) {
        try {
            const [achievements] = await db.query(`
                SELECT * FROM Achievements 
                WHERE id = ?
            `, [id]);
            
            return achievements[0] || null;
        } catch (error) {
            console.error(`Error getting achievement with ID ${id}:`, error);
            throw error;
        }
    }
    
    // Get all achievements for a user with completion status
    static async getUserAchievements(userId) {
        try {
            const [achievements] = await db.query(`
                SELECT 
                    a.*,
                    ua.completed_at IS NOT NULL as completed,
                    ua.completed_at
                FROM 
                    Achievements a
                LEFT JOIN 
                    UserAchievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
                ORDER BY 
                    a.category, a.requirement_value
            `, [userId]);
            
            return achievements;
        } catch (error) {
            console.error(`Error getting achievements for user ${userId}:`, error);
            throw error;
        }
    }
    
    // Unlock an achievement for a user
    static async unlockAchievement(userId, achievementId) {
        try {
            // Check if already unlocked
            const [existing] = await db.query(`
                SELECT id FROM UserAchievements
                WHERE user_id = ? AND achievement_id = ?
            `, [userId, achievementId]);
            
            if (existing.length > 0) {
                // Already unlocked
                return { alreadyUnlocked: true };
            }
            
            // Get achievement details for rewards
            const achievement = await this.getAchievementById(achievementId);
            if (!achievement) {
                throw new Error(`Achievement with ID ${achievementId} not found`);
            }
            
            // Insert the user achievement
            await db.query(`
                INSERT INTO UserAchievements (user_id, achievement_id)
                VALUES (?, ?)
            `, [userId, achievementId]);
            
            return { 
                unlocked: true,
                achievement: achievement,
                rewards: {
                    xp: achievement.xp_reward,
                    gold: achievement.gold_reward
                }
            };
        } catch (error) {
            console.error(`Error unlocking achievement ${achievementId} for user ${userId}:`, error);
            throw error;
        }
    }
    
    // Check for achievements that can be unlocked based on user stats
    static async checkForAchievements(userId, userStats, progressData = {}) {
        try {
            const unlockedAchievements = [];
            
            // Get all achievements user doesn't have yet
            const [pendingAchievements] = await db.query(`
                SELECT a.* FROM Achievements a
                LEFT JOIN UserAchievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
                WHERE ua.id IS NULL
            `, [userId]);
            
            for (const achievement of pendingAchievements) {
                let requirementMet = false;
                
                switch (achievement.requirement_type) {
                    case 'level':
                        requirementMet = userStats.level >= achievement.requirement_value;
                        break;
                    case 'steps':
                        if (progressData.totalSteps !== undefined) {
                            requirementMet = progressData.totalSteps >= achievement.requirement_value;
                        }
                        break;
                    case 'gold_total':
                        requirementMet = userStats.gold >= achievement.requirement_value;
                        break;
                    case 'pixmon_count':
                    case 'pixmon_unique':
                        if (progressData.pixmonCount !== undefined) {
                            requirementMet = progressData.pixmonCount >= achievement.requirement_value;
                        }
                        break;
                }
                
                if (requirementMet) {
                    const result = await this.unlockAchievement(userId, achievement.id);
                    if (!result.alreadyUnlocked) {
                        unlockedAchievements.push({
                            ...achievement,
                            rewards: {
                                xp: achievement.xp_reward,
                                gold: achievement.gold_reward
                            }
                        });
                    }
                }
            }
            
            return unlockedAchievements;
        } catch (error) {
            console.error(`Error checking achievements for user ${userId}:`, error);
            return [];
        }
    }
}

module.exports = Achievement;
