const db = require('../config/database');

class Inventory {
    static async createIndexInvtable() {
        const sql = `
            CREAT                item_name:"Chonklette", 
                description:"Chonklette's diet? All the snacks!",
                item_type:"food",
                item_stats: {
                    hunger_value: 35,
                    happiness_value: 25,
                    health_value: 15
                },
                rarity:3  IF NOT EXISTS IndexInventory  (
                index_id INT(11) NOT NULL PRIMARY KEY,
                item_name VARCHAR(100) DEFAULT NULL,
                description VARCHAR(100) DEFAULT NULL,
                item_type VARCHAR(100) DEFAULT NULL,
                rarity INT(11) DEFAULT NULL,
                item_Stats JSON DEFAULT NULL
             )
        `;
          try {
            await db.query(sql);
            // Table creation logged by database initialization system
            
            // Populate with initial achievements if table is empty
            const [count] = await db.query('SELECT COUNT(*) as count FROM IndexInventory');
            if (count[0].count === 0) {
                await this.seedInitialinventoryIndex();
            }
        } catch (error) {
            console.error('Error creating IndexInventory table:', error);
            throw error;
        }
    }

    static async createUserInventory() {
        const sql = `
            CREATE TABLE IF NOT EXISTS UserInventory (
                item_name varchar(100),
                index_id int(11),
                user_id int(11),
                item_type varchar(100),
                item_stats JSON DEFAULT NULL,
                amount int,
                rarity int(11) DEFAULT NULL,
                FOREIGN KEY (index_id) REFERENCES IndexInventory (index_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES UserLogin(id) ON DELETE CASCADE
            );

        `;
          try {
            await db.query(sql);
            // Table creation logged by database initialization system
        } catch (error) {
            console.error('Error creating UserAchievements table:', error);
            throw error;
        }
    }

    static async createGachaResult () {
        const sql = `
            CREATE TABLE IF NOT EXISTS gachaResult (
                item_name varchar(100),
                index_id int(11), 
                user_id int(11), 
                item_stats JSON DEFAULT NULL,
                item_type varchar(100), 
                created_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES UserLogin(id) ON DELETE CASCADE
            )
        `;
        try {
            await db.query(sql);
        } catch(error) {
            console.error('Error creating gacha result');
        }
    }


    static async seedInitialinventoryIndex() {
        const items = [
            {
                item_id: 1,
                item_name:"test item no 1", 
                description:"idk item",
                item_type:"consumables",
                item_stats: {
                    atk_value: 0,
                    effect_value: 0, 
                    def_value: 0
                },
                rarity: 2, 
            },
            {
                item_id: 2,
                item_name:"Mana Potion", 
                description:"A potion that somehow recovers mana",
                item_type:"potion",
                item_stats: {
                    mana_regen: 30, 
                },
                rarity: 3, 
            },
            {
                item_id: 3,
                item_name:"Health Potion", 
                description:"A potion that somehow recovers health",
                item_type:"potion",

                item_stats: {
                    health_regen: 30
                },
                rarity:2 
            },
            {
                item_id: 4,
                item_name:"Snaccident", 
                description:"Yall accidentally made this",
                item_type:"food",
                item_stats: {
                    hunger_value: 40,
                    happiness_value: 15,
                    health_value: 10
                },
                rarity:2 
            },
            {
                item_id: 5,
                item_name:"Marshmelt", 
                description:"A melted marshmallow cool right",
                item_type:"food",
                item_stats: {
                    hunger_value: 25,
                    happiness_value: 20,
                    health_value: 5
                },
                rarity:3 
            },
            {
                item_id: 6,
                item_name:"Cheese", 
                description:"Say cheese",
                item_type:"food",
                item_stats: {
                    hunger_value: 20,
                    happiness_value: 10,
                    health_value: 8
                },
                rarity:2 
            },
            {
                item_id: 7,
                item_name:"Chonklette", 
                description:"Chonklette’s diet? All the snacks!",
                item_type:"food",
                item_stats: {
                    hunger_value: 35
                },
                rarity:3 
            },
            {
                item_id: 8,
                item_name:"Sizzlet", 
                description:"Just a sizzled food what do you expect",
                item_type:"food",
                item_stats: {
                    hunger_value: 30,
                    happiness_value: 8,
                    health_value: 12
                },
                rarity:1 
            },
            {
                item_id: 9,
                item_name:"Steel Key", 
                description:"A key to open up a metal chest",
                item_type:"key",
                item_stats: {
                    key_level: 1
                },
                rarity:2
            },
            {
                item_id: 10,
                item_name:"Mythical Key", 
                description:"A key to open up a mythical chest",
                item_type:"key",
                item_stats: {
                    key_level: 2
                },
                rarity:4, 
            }

        ];
        
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        for (const item of items) {
            try {
                await db.query(`
                    INSERT INTO IndexInventory 
                    (index_id, item_name, description, item_type, item_stats, rarity) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    item.item_id, 
                    item.item_name,
                    item.description,
                    item.item_type,
                    JSON.stringify(item.item_stats),
                    item.rarity
                ]);
            } catch (error) {
                console.error(error);
            }
        }
        
        
    }

    static async countUserInventory(userId) {
        try {
            const [rows] = await db.query('SELECT COUNT(*) AS count FROM UserInventory WHERE user_id = ?', [userId]);
            return rows[0].count;
        } catch (error) {
            console.error(`Error counting inventory items for user ${userId}:`, error);
            throw error;
        }
    }


    static async UserDataObtain(userId) {
        try {
            const [rows] = await db.query('SELECT * FROM UserInventory WHERE user_id = ?', [userId]);
            return rows;
        } catch(error) {
            console.error(`error gathering data for user`, error);
        } 
    }

    static async indexItemObtain () {
        try {
            const [rows] = await db.query('SELECT * FROM IndexInventory');
            return rows;
        } catch (error) {
            console.error("error pulling data");
        }
    }

    static async gachaResultMultiStore(userId, limit) {
    function chooseRarity() {
        const random = Math.random() * 100;
        if (random < 60) return 1;
        else if (random < 90) return 2;
        else return 3;
    }

    try {
        let stored = 0;
        const results = [];

        while (stored < limit) {
            const chosenRarity = chooseRarity();

            const [items] = await db.query(
                `SELECT * FROM IndexInventory WHERE rarity = ?`,
                [chosenRarity]
            );

            if (!items || items.length === 0) {
                console.log(`No items found with rarity ${chosenRarity}`);
                continue;
            }

            const filteredItems = items.filter(item => item.index_id !== 9 && item.index_id !== 10);
            if (filteredItems.length === 0) {
                console.log(`All items with rarity ${chosenRarity} are excluded`);
                continue;
            }

            const randomIndex = Math.floor(Math.random() * filteredItems.length);
            const selectedItem = filteredItems[randomIndex];
            const now = new Date();

            // Store gacha result
            await db.query(
                `INSERT INTO gachaResult 
                    (item_name, index_id, user_id, item_type, item_stats, created_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    selectedItem.item_name,
                    selectedItem.index_id,
                    userId,
                    selectedItem.item_type,
                    selectedItem.item_Stats ? JSON.stringify(selectedItem.item_Stats) : null,
                    now
                ]
            );

            // Add to UserInventory
            const [rows] = await db.query(
                'SELECT COUNT(*) AS count FROM UserInventory WHERE user_id = ? AND index_id = ?',
                [userId, selectedItem.index_id]
            );

            if (rows[0].count === 0) {
                await db.query(`
                    INSERT INTO UserInventory 
                        (item_name, index_id, user_id, item_type, amount, item_stats, rarity)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        selectedItem.item_name,
                        selectedItem.index_id,
                        userId,
                        selectedItem.item_type,
                        1,
                        selectedItem.item_Stats ? JSON.stringify(selectedItem.item_Stats) : null,
                        selectedItem.rarity
                    ]
                );
            } else {
                await db.query(`
                    UPDATE UserInventory 
                    SET amount = amount + 1
                    WHERE user_id = ? AND index_id = ?
                    `,
                    [userId, selectedItem.index_id]
                );
            }

            // Maintain only last 21 gacha results
            const [rows2] = await db.query(
                'SELECT COUNT(*) AS count FROM gachaResult WHERE user_id = ?',
                [userId]
            );

            if (rows2[0].count > 21) {
                await db.query(`
                    DELETE FROM gachaResult
                    WHERE user_id = ?
                    ORDER BY created_at ASC
                    LIMIT 1;
                    `,
                    [userId]
                );
            }

            results.push(selectedItem); // collect the result
            stored++;
        }

        return results; // return the collected gacha results
    } catch (err) {
        console.error('Error in gachaResultMultiStore:', err);
        return []; // return empty array on error
    }
}


    static async normalKeyObtain (userId) {
        const [rows] = ('SELECT COUNT(*) AS count FROM UserInventory WHERE user_id = ? AND index_id = ?', [userId, 9])

        if (rows[0].count === 0) {
            await db.query(`
                INSERT INTO UserInventory (item_name, atk_value, effect_value, def_value, index_id, user_id, item_type, amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            
                `, ['Steel Key', 0, 0, 0, 9, userId, 'key', 1]
            )
        }

        else if (rows[0].count > 0) {
            await db.query(`
                UPDATE UserInventory
                SET amount = amount + 1
                WHERE user_id = ? AND index_id = ?
                `, [userId, 9]
            );
        }
    }

    static async MythicalKeyObtain (userId) {
        const [rows] = ('SELECT COUNT(*) AS count FROM UserInventory WHERE user_id = ? AND index_id = ?', [userId, 9])

        if (rows[0].count === 0) {
            await db.query(`
                INSERT INTO UserInventory (item_name, atk_value, effect_value, def_value, index_id, user_id, item_type, amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            
                `, ['Mythical Key', 0, 0, 0, 10, userId, 'key', 1]
            )
        }

        else if (rows[0].count > 0) {
            await db.query(`
                UPDATE UserInventory
                SET amount = amount + 1
                WHERE user_id = ? AND index_id = ?
                `, [userId, 10]
            );
        }
    }

    static async itemUse (userId, index_id) {
        // inget masukin ini ke controller buat index id
        // const index_id = parseInt(req.params.index_id, 10); // base 10

        try {
            // health
            if (index_id === 3) {
                const [rows] = await db.query('SELECT max_hp, current_hp FROM UserStats WHERE user_id = ?', [userId]);
                const HP = rows[0];
                console.log('query run', `max_hp: ${HP.max_hp}`, `current_hp: ${HP.current_hp}`);
                const heal = 30 * HP.max_hp / 100;

                // heal = 0.3 * HP.max_hp;

                if (heal + HP.current_hp > HP.max_hp) {
                    console.log('hp potion used');
                    await db.query(`
                        UPDATE UserStats 
                        SET current_hp = ?
                        WHERE user_id = ?
                        `, [HP.max_hp, userId]
                    );

                    await db.query(`
                        UPDATE UserInventory 
                        SET amount = amount - 1
                        WHERE user_id = ? AND index_id = ?
                        `, [userId, index_id]
                    );
                }

                else if (heal + HP.current_hp <= HP.max_hp) {
                    console.log('hp potion used')
                    await db.query(`
                        UPDATE UserStats 
                        SET current_hp = current_hp + ?
                        WHERE user_id = ?
                        `, [heal, userId]
                    );

                    await db.query(`
                        UPDATE UserInventory 
                        SET amount = amount - 1
                        WHERE user_id = ? AND index_id = ?
                        `, [userId, index_id]
                    );
                }

                console.log('usage complete');
            }
            // mana
            else if (index_id === 2) {
                
            }
            // food
            else if (index_id > 0 && index_id < 9) {

            }
            // key
            else if (index_id === 9 || index_id === 10) {

            }
        } catch (error) {
            console.error(error);
        }
    }

    static async inputItem (userId, index_id) {
        const [rows] = await db.query('SELECT * FROM IndexInventory WHERE index_id = ?', [index_id]);
        const selectedItem = rows[0];

        const [rows2] = await db.query(
                'SELECT COUNT(*) AS count FROM UserInventory WHERE user_id = ? AND index_id = ?',
                [userId, selectedItem.index_id]
            );

            if (rows2[0].count === 0) {
                await db.query(`
                    INSERT INTO UserInventory 
                        (item_name, index_id, user_id, item_type, amount, item_stats, rarity)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        selectedItem.item_name,
                        selectedItem.index_id,
                        userId,
                        selectedItem.item_type,
                        1,
                        selectedItem.item_Stats ? JSON.stringify(selectedItem.item_Stats) : null,
                        selectedItem.rarity
                    ]
                );
            } else {
                await db.query(`
                    UPDATE UserInventory 
                    SET amount = amount + 1
                    WHERE user_id = ? AND index_id = ?
                    `,
                    [userId, selectedItem.index_id]
                );
            }
            const now = new Date();
            await db.query(
                `INSERT INTO gachaResult 
                    (item_name, index_id, user_id, item_type, item_stats, created_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    selectedItem.item_name,
                    selectedItem.index_id,
                    userId,
                    selectedItem.item_type,
                    selectedItem.item_Stats ? JSON.stringify(selectedItem.item_Stats) : null,
                    now
                ]
            );
            const [rows3] = await db.query(
                'SELECT COUNT(*) AS count FROM gachaResult WHERE user_id = ?',
                [userId]
            );

            if (rows3[0].count > 21) {
                await db.query(`
                    DELETE FROM gachaResult
                    WHERE user_id = ?
                    ORDER BY created_at ASC
                    LIMIT 1;
                    `,
                    [userId]
                );
            }

    }
    
}


module.exports = Inventory;