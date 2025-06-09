const db = require('../config/database');

class DailyRewards {
    // Create DailyRewards table
    static async createTable() {
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS DailyRewards (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    current_day INT DEFAULT 1,
                    streak_count INT DEFAULT 0,
                    total_claimed INT DEFAULT 0,
                    last_claimed_date DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT NULL,
                    FOREIGN KEY (user_id) REFERENCES UserLogin(id) ON DELETE CASCADE,
                    INDEX idx_dailyrewards_user_id (user_id)
                ) ENGINE=InnoDB;
            `);
            
            console.log('DailyRewards table created or already exists');
        } catch (error) {
            console.error('Error creating DailyRewards table:', error);
            throw error;
        }
    }

    // Ensure a user's daily rewards record exists
    static async ensureUserDailyRewardsExist(userId) {
        try {
            const [exists] = await db.query(
                'SELECT 1 FROM DailyRewards WHERE user_id = ?',
                [userId]
            );

            if (exists.length === 0) {
                await this.createDefaultDailyRewards(userId);
            }

            return true;
        } catch (error) {
            console.error('Error ensuring daily rewards exist:', error);
            throw error;
        }
    }

    // Create default daily rewards record for a user
    static async createDefaultDailyRewards(userId) {
        try {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const [result] = await db.query(
                `INSERT INTO DailyRewards 
                (user_id, current_day, streak_count, total_claimed, updated_at)
                VALUES (?, 1, 0, 0, ?)`,
                [userId, now]
            );
            
            return {
                current_day: 1,
                streak_count: 0,
                total_claimed: 0,
                last_claimed_date: null
            };
        } catch (error) {
            console.error('Error creating default daily rewards:', error);
            throw error;
        }
    }

    // Get daily rewards data for a user
    static async getUserDailyRewards(userId) {
        try {
            await this.ensureUserDailyRewardsExist(userId);

            const [data] = await db.query(
                `SELECT 
                    current_day, 
                    streak_count, 
                    total_claimed, 
                    last_claimed_date 
                FROM DailyRewards 
                WHERE user_id = ?`,
                [userId]
            );
            
            return data[0];
        } catch (error) {
            console.error('Error getting user daily rewards:', error);
            throw error;
        }
    }

    // Claim daily reward for a user
    static async claimDailyReward(userId, dayCompleted, newDay, rewardType, rewardAmount) {
        try {
            const now = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

            // Check if the user has already claimed today
            const [lastClaimed] = await db.query(
                'SELECT last_claimed_date FROM DailyRewards WHERE user_id = ?',
                [userId]
            );

            if (lastClaimed[0]?.last_claimed_date === now) {
                throw new Error('Daily reward already claimed today');
            }

            // Update the user's daily rewards record
            await db.query(
                `UPDATE DailyRewards 
                SET 
                    current_day = ?,
                    streak_count = streak_count + 1,
                    total_claimed = total_claimed + 1,
                    last_claimed_date = ?,
                    updated_at = ?
                WHERE user_id = ?`,
                [newDay, now, timestamp, userId]
            );

            return {
                success: true,
                dayCompleted,
                reward: {
                    type: rewardType,
                    amount: rewardAmount
                },
                nextDay: newDay
            };
        } catch (error) {
            console.error('Error claiming daily reward:', error);
            throw error;
        }
    }

    // Check if a streak has been broken and reset if needed
    static async checkAndResetStreak(userId) {
        try {
            const [data] = await db.query(
                `SELECT 
                    last_claimed_date
                FROM DailyRewards 
                WHERE user_id = ?`,
                [userId]
            );
            
            if (!data[0] || !data[0].last_claimed_date) {
                return false; // No previous claims, no streak to reset
            }
            
            const lastClaimedDate = new Date(data[0].last_claimed_date);
            const today = new Date();
            
            // Calculate days difference (ignoring time)
            const lastClaimedDay = new Date(
                lastClaimedDate.getFullYear(),
                lastClaimedDate.getMonth(),
                lastClaimedDate.getDate()
            );
            
            const todayDay = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
            );
            
            const daysDifference = Math.floor(
                (todayDay - lastClaimedDay) / (1000 * 60 * 60 * 24)
            );
            
            // If more than 1 day has passed since last claim, reset streak
            if (daysDifference > 1) {
                const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
                await db.query(
                    `UPDATE DailyRewards 
                    SET 
                        current_day = 1,
                        streak_count = 0,
                        updated_at = ?
                    WHERE user_id = ?`,
                    [timestamp, userId]
                );
                return true; // Streak was reset
            }
            
            return false; // No need to reset streak
        } catch (error) {
            console.error('Error checking streak:', error);
            throw error;
        }
    }
}

module.exports = DailyRewards;
