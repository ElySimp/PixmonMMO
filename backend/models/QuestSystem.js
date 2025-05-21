const db = require('../config/database');
const moment = require('moment-timezone');

class Quest {
    static async createTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS Quest (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                xp_reward INT DEFAULT 0,
                gold_reward INT DEFAULT 0,
                repeat_type ENUM('daily', 'weekly', 'monthly', 'bounty') NOT NULL,
                level_required INT DEFAULT 1,
                quest_points_required INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.query(sql);
        console.log('Quest table created or already exists');
    }
}

class UserQuest {
    static async createTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS UserQuest (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                quest_id INT NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                claimed BOOLEAN DEFAULT FALSE,
                last_completed TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES UserStats(user_id) ON DELETE CASCADE,
                FOREIGN KEY (quest_id) REFERENCES Quest(id) ON DELETE CASCADE
            )
        `;
        await db.query(sql);
        console.log('UserQuest table created or already exists');
    }

    static async assignDailyQuests(userId) {
        const [dailyQuests] = await db.query('SELECT id, name FROM Quest WHERE repeat_type = "daily"');

        if (dailyQuests.length === 0) {
            console.warn(`No daily quests available for user ${userId}`);
            return;
        }

        for (const quest of dailyQuests) {
            // Cek apakah quest ini sudah ada di UserQuest untuk user ini
            const [existing] = await db.query(
                'SELECT id FROM UserQuest WHERE user_id = ? AND quest_id = ?',
                [userId, quest.id]
            );
            if (existing.length > 0) {
                // Sudah ada, skip
                continue;
            }

            const isLoginQuest = quest.name.toLowerCase().includes("login");
            await db.query(
                'INSERT INTO UserQuest (user_id, quest_id, completed, claimed) VALUES (?, ?, ?, ?)',
                [userId, quest.id, isLoginQuest, false]
            );

            if (isLoginQuest) {
                console.log(`✅ Daily Login Quest auto-completed for user ${userId}`);
            }
        }
    }

    static async getUserQuests(userId) {
        console.log(`Fetching quests for user ${userId}`); // 🔍 Debugging log
        
        const [quests] = await db.query(
            `SELECT q.id, q.name, q.description, q.xp_reward, q.gold_reward, uq.completed, uq.claimed, uq.last_completed
             FROM UserQuest uq 
             JOIN Quest q ON uq.quest_id = q.id 
             WHERE uq.user_id = ?`,
            [userId]
        );

        console.log(`✅ User ${userId} quests retrieved:`, quests);
        return quests;
    }
}

class QuestSystem {
    static async startBountyQuest(userId, questId) {
        const [questData] = await db.query(
            'SELECT quest_points_required FROM Quest WHERE id = ? AND repeat_type = "bounty"',
            [questId]
        );

        if (!questData.length) throw new Error('Quest not found or not a bounty quest');

        const { quest_points_required } = questData[0];

        const [userData] = await db.query(
            'SELECT quest_points, quest_point_cooldown FROM UserStats WHERE user_id = ?', 
            [userId]
        );

        if (!userData.length || userData[0].quest_points < quest_points_required) {
            throw new Error('Not enough quest points to start this bounty quest');
        }

        const nextCooldown = new Date();
        nextCooldown.setMinutes(nextCooldown.getMinutes() + 30);

        await db.query(
            'UPDATE UserStats SET quest_points = quest_points - ?, quest_point_cooldown = ? WHERE user_id = ?',
            [quest_points_required, nextCooldown, userId]
        );

        await db.query(
            'INSERT INTO UserQuest (user_id, quest_id, completed, claimed) VALUES (?, ?, FALSE, FALSE)',
            [userId, questId]
        );

        console.log(`User ${userId} started bounty quest ${questId}`);
    }

    static async completeQuest(userId, questId) {
        const [questData] = await db.query(
            'SELECT xp_reward, gold_reward FROM Quest WHERE id = ?',
            [questId]
        );

        if (!questData.length) throw new Error('Quest not found');

        await db.query(
            'UPDATE UserQuest SET completed = TRUE, last_completed = CURRENT_TIMESTAMP WHERE user_id = ? AND quest_id = ?',
            [userId, questId]
        );

        await db.query(
            'UPDATE UserStats SET xp = xp + ?, gold = gold + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [questData[0].xp_reward, questData[0].gold_reward, userId]
        );

        console.log(`User ${userId} completed quest ${questId}`);
    }

    static async claimQuestReward(userId, questId) {
        const [questStatus] = await db.query(
            'SELECT completed, claimed FROM UserQuest WHERE user_id = ? AND quest_id = ?',
            [userId, questId]
        );

        if (!questStatus.length) throw new Error('Quest not found for this user');
        if (!questStatus[0].completed) throw new Error('Quest must be completed before claiming reward');
        if (questStatus[0].claimed) throw new Error('Quest reward already claimed');

        await db.query(
            'UPDATE UserQuest SET claimed = TRUE WHERE user_id = ? AND quest_id = ?',
            [userId, questId]
        );

        console.log(`✅ User ${userId} manually claimed reward for quest ${questId}`);
    }

    static async resetDailyQuests() {
        const now = moment().tz("Asia/Jakarta");
        const today7AM = now.clone().hour(7).minute(0).second(0);

        const [users] = await db.query('SELECT user_id, last_reset FROM UserStats');

        for (const user of users) {
            const lastResetTime = user.last_reset ? moment(user.last_reset).tz("Asia/Jakarta") : null;

            if (!lastResetTime || lastResetTime.isBefore(today7AM)) {
                await db.query(
                    'UPDATE UserStats SET last_reset = ? WHERE user_id = ?',
                    [now.format('YYYY-MM-DD HH:mm:ss'), user.user_id]
                );

                await db.query(
                    'DELETE FROM UserQuest WHERE user_id = ? AND quest_id IN (SELECT id FROM Quest WHERE repeat_type = "daily")',
                    [user.user_id]
                );

                await db.query(
                    `INSERT INTO UserQuest (user_id, quest_id, completed, claimed)
                    SELECT ?, id,
                        CASE WHEN LOWER(name) LIKE '%login%' THEN TRUE ELSE FALSE END,
                        FALSE
                    FROM Quest WHERE repeat_type = "daily"`,
                    [user.user_id]
                );

                console.log(`✅ Daily quests reset for user ${user.user_id}`);
            }
        }
    }

    static startDailyQuestResetSchedule() {
        setInterval(async () => {
            await QuestSystem.resetDailyQuests();
        }, 5 * 60 * 1000); // ✅ Jalankan reset setiap 5 menit
    }

}

// ✅ Jalankan reset otomatis saat server berjalan
QuestSystem.startDailyQuestResetSchedule();

async function initializeTables() {
    await Quest.createTable();
    await UserQuest.createTable();
    console.log('All tables initialized!');
}

module.exports = { QuestSystem, UserQuest, initializeTables };