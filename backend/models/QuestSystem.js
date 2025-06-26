const db = require('../config/database');
const moment = require('moment-timezone');
const cron = require('node-cron');

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

        // Seed initial quests if empty
        const [count] = await db.query('SELECT COUNT(*) as count FROM Quest');
        if (count[0].count === 0) {
            await this.seedInitialQuests();
        }
    }

    static async seedInitialQuests() {
        const quests = [
            // 5 Daily Quests
            {
                name: "Daily Login",
                description: "Login to the game today.",
                xp_reward: 50,
                gold_reward: 25,
                repeat_type: "daily",
                level_required: 1,
                quest_points_required: 0
            },
            {
                name: "Take 5 Steps",
                description: "Take 5 steps in the adventure.",
                xp_reward: 75,
                gold_reward: 50,
                repeat_type: "daily",
                level_required: 1,
                quest_points_required: 0
            },
            {
                name: "Take 20 Steps",
                description: "Take 20 steps in the adventure.",
                xp_reward: 100,
                gold_reward: 75,
                repeat_type: "daily",
                level_required: 1,
                quest_points_required: 0
            },
            {
                name: "Win 1 Battle",
                description: "Win 1 battle against a wild Pixmon.",
                xp_reward: 100,
                gold_reward: 60,
                repeat_type: "daily",
                level_required: 1,
                quest_points_required: 0
            },
            {
                name: "Collect 100 Gold",
                description: "Collect a total of 100 gold today.",
                xp_reward: 80,
                gold_reward: 40,
                repeat_type: "daily",
                level_required: 1,
                quest_points_required: 0
            },
            // 3 Bounty Quests
            {
                name: "Defeat 3 Wild Pixmon",
                description: "Defeat 3 wild Pixmon in battle.",
                xp_reward: 100,
                gold_reward: 50,
                repeat_type: "bounty",
                level_required: 1,
                quest_points_required: 1
            },
            {
                name: "Earn 500 Gold",
                description: "Earn a total of 500 gold from any source.",
                xp_reward: 100,
                gold_reward: 60,
                repeat_type: "bounty",
                level_required: 1,
                quest_points_required: 1
            },
            {
                name: "Catch 3 Unique Pixmon",
                description: "Catch 3 different Pixmon species.",
                xp_reward: 125,
                gold_reward: 100,
                repeat_type: "bounty",
                level_required: 1,
                quest_points_required: 1
            }
        ];

        for (const quest of quests) {
            try {
                await db.query(`
                    INSERT INTO Quest 
                    (name, description, xp_reward, gold_reward, repeat_type, level_required, quest_points_required)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    quest.name,
                    quest.description,
                    quest.xp_reward,
                    quest.gold_reward,
                    quest.repeat_type,
                    quest.level_required,
                    quest.quest_points_required
                ]);
            } catch (error) {
                console.error(`Error seeding quest ${quest.name}:`, error);
            }
        }
        console.log('Seeded initial quests');
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

    static async completeDailyLoginQuest(userId) {
        // Cari quest "Daily Login"
        const [loginQuest] = await db.query(
            `SELECT id FROM Quest WHERE repeat_type = "daily" AND LOWER(name) LIKE '%login%' LIMIT 1`
        );
        if (loginQuest.length === 0) return;

        const questId = loginQuest[0].id;
        // Cek apakah sudah completed hari ini
        const today = moment().tz("Asia/Jakarta").format('YYYY-MM-DD');
        const [uq] = await db.query(
            `SELECT last_completed FROM UserQuest WHERE user_id = ? AND quest_id = ?`,
            [userId, questId]
        );
        if (uq.length > 0 && 
            uq[0].completed &&
            uq[0].last_completed && 
            moment(uq[0].last_completed).tz("Asia/Jakarta").format('YYYY-MM-DD') === today) {
            // Sudah completed hari ini, jangan update lagi
            return;
        }
        // Mark completed dan update completed_at
        await db.query(
            `UPDATE UserQuest SET completed = TRUE WHERE user_id = ? AND quest_id = ?`,
            [userId, questId]
        );
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

            if (existing.length === 0) {
                await db.query(
                    'INSERT INTO UserQuest (user_id, quest_id, completed, claimed) VALUES (?, ?, FALSE, FALSE)',
                    [userId, quest.id]
                );
            }
        }
    }

    static async getUserQuests(userId) {
        console.log(`Fetching quests for user ${userId}`); // 🔍 Debugging log
        
        const [quests] = await db.query(
            `SELECT q.id, q.name, q.description, q.xp_reward, q.gold_reward, q.repeat_type, uq.completed, uq.claimed, uq.last_completed
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
        // Cek apakah sudah ada UserQuest, kalau belum insert
        const [rows] = await db.query('SELECT * FROM UserQuest WHERE user_id = ? AND quest_id = ?', [userId, questId]);
        if (rows.length === 0) {
            await db.query('INSERT INTO UserQuest (user_id, quest_id, completed, claimed) VALUES (?, ?, 0, 0)', [userId, questId]);
        }
    }

    static async completeQuest(userId, questId) {
        // Hanya update status quest, TIDAK menambah reward!
        await db.query(
            'UPDATE UserQuest SET completed = TRUE, last_completed = CURRENT_TIMESTAMP WHERE user_id = ? AND quest_id = ?',
            [userId, questId]
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

        const [questData] = await db.query(
            'SELECT xp_reward, gold_reward FROM Quest WHERE id = ?',
            [questId]
        );

        // Update UserStats (reward diberikan di sini!)
        await db.query(
            'UPDATE UserStats SET xp = xp + ?, gold = gold + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [questData[0].xp_reward, questData[0].gold_reward, userId]
        );

        await db.query(
            'UPDATE UserQuest SET claimed = TRUE WHERE user_id = ? AND quest_id = ?',
            [userId, questId]
        );

        console.log(`✅ User ${userId} manually claimed reward for quest ${questId}`);
    }

    static async resetDailyQuests() {
        const now = moment().tz("Asia/Jakarta");
        const todayDate = now.format('YYYY-MM-DD');
        const [users] = await db.query('SELECT user_id FROM UserStats');

        for (const user of users) {
            await db.query(
                `UPDATE UserQuest uq
                JOIN Quest q ON uq.quest_id = q.id
                SET uq.completed = FALSE, uq.claimed = FALSE
                WHERE uq.user_id = ?
                AND q.repeat_type = "daily"
                AND (uq.last_completed IS NULL OR DATE(uq.last_completed) <> ?)`,
                [user.user_id, todayDate]
            );

            await db.query(
                `INSERT INTO UserQuest (user_id, quest_id, completed, claimed)
                SELECT ?, q.id, FALSE, FALSE
                FROM Quest q
                WHERE q.repeat_type = "daily"
                AND NOT EXISTS (
                    SELECT 1 FROM UserQuest uq2 WHERE uq2.user_id = ? AND uq2.quest_id = q.id
                )`,
                [user.user_id, user.user_id]
            );

            console.log(`✅ Daily quests reset for user ${user.user_id} at ${now.format()}`);
        }
    }

        static startDailyQuestResetSchedule() {
            cron.schedule('0 7 * * *', async () => {
                await QuestSystem.resetDailyQuests();
            }, {
                timezone: "Asia/Jakarta"
            });
        }

    }

// ✅ Jalankan reset otomatis saat server berjalan
QuestSystem.startDailyQuestResetSchedule();

async function initializeTables() {
    await Quest.createTable();
    await UserQuest.createTable();
    // Quest tables initialized
}

module.exports = { QuestSystem, UserQuest, initializeTables };