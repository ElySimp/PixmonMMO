const db = require('../config/database');

class Inventory {
    static async createIndexInvtable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS IndexInventory  (
                index_id INT(11) NOT NULL PRIMARY KEY,
                item_name VARCHAR(100) DEFAULT NULL,
                description VARCHAR(100) DEFAULT NULL,
                item_type VARCHAR(100) DEFAULT NULL,
                max_base INT(11) DEFAULT NULL,
                min_base INT(11) DEFAULT NULL,
                rarity INT(11) DEFAULT NULL,
                effect_base INT(11) DEFAULT NULL
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
                atk_value int,
                effect_value int, 
                def_value int,
                index_id int(11),
                user_id int(11),
                item_type varchar(100),
                amount int,
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
                atk_value int(11), 
                effect_value int(11),
                def_value int(11),
                index_id int(11), 
                user_id int(11), 
                item_type varchar(100), 
                gacha_date TIME,
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
                max_base: 20,
                min_base: 10,
                rarity: 2, 
                effect_base: null
            },
            {
                item_id: 2,
                item_name:"Mana Potion", 
                description:"A potion that somehow recovers mana",
                item_type:"potion",
                max_base: 0,
                min_base: 0,
                rarity: 3, 
                effect_base: 30
            },
            {
                item_id: 3,
                item_name:"Health Potion", 
                description:"A potion that somehow recovers health",
                item_type:"potion",
                max_base:0,
                min_base:0,
                rarity:2, 
                effect_base: 30
            },
            {
                item_id: 4,
                item_name:"Snaccident", 
                description:"Yall accidentally made this",
                item_type:"food",
                max_base:0,
                min_base:0,
                rarity:2, 
                effect_base:40
            },
            {
                item_id: 5,
                item_name:"Marshmelt", 
                description:"A melted marshmallow cool right",
                item_type:"food",
                max_base:0,
                min_base:0,
                rarity:3, 
                effect_base:25
            },
            {
                item_id: 6,
                item_name:"Cheese", 
                description:"Say cheese",
                item_type:"food",
                max_base:0,
                min_base:0,
                rarity:2, 
                effect_base:20
            },
            {
                item_id: 7,
                item_name:"Chonklette", 
                description:"Chonklette’s diet? All the snacks!",
                item_type:"food",
                max_base:0,
                min_base:0,
                rarity:3, 
                effect_base:35
            },
            {
                item_id: 8,
                item_name:"Sizzlet", 
                description:"Just a sizzled food what do you expect",
                item_type:"food",
                max_base:0,
                min_base:0,
                rarity:1, 
                effect_base:30
            },
            {
                item_id: 9,
                item_name:"Steel Key", 
                description:"A key to open up a metal chest",
                item_type:"key",
                max_base:0,
                min_base:0,
                rarity:2, 
                effect_base:0
            },
            {
                item_id: 10,
                item_name:"Mythical Key", 
                description:"A key to open up a mythical chest",
                item_type:"key",
                max_base:0,
                min_base:0,
                rarity:4, 
                effect_base:0
            }

        ];
        
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        for (const item of items) {
            try {
                await db.query(`
                    INSERT INTO IndexInventory 
                    (index_id, item_name, description, item_type, max_base, min_base, rarity, effect_base) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    item.item_id, 
                    item.item_name,
                    item.description,
                    item.item_type,
                    item.max_base,
                    item.min_base, 
                    item.rarity, 
                    item.effect_base
                ]);
            } catch (error) {
                console.error(error);
            }
        }
        
        console.log('Seeded initial items');
    }


    static async force_send (id) {
        const test_items = [
            {
                item_name: "test item no 1",
                atk_value: 0,
                effect_value: 20, 
                def_value: 0,
                index_id: 1 ,
                user_id: 1
            }
        ]

        try {            await db.query(`
                    INSERT INTO UserInventory 
                    (item_name, atk_value, effect_value, def_value, index_id, user_id) 
                    VALUES (? , ? , ? , ? , ? , ?)
                `, [
                    test_items.item_name,
                    test_items.atk_value,
                    test_items.effect_value, 
                    test_items.def_value,
                    test_items.index_id,
                    test_items.user_id
                ]);
            // Test item force sent to UserInventory
        } catch (error){
            console.error('Error sending data to UserInventory table:', error);
            throw error;
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

    static async gachaResultMultiStore(userId) {
        function chooseRarity() {
            const random = Math.random() * 100;
            if (random < 60) return 1;
            else if (random < 90) return 2;
            else return 3;
        }

        try {
            let stored = 0;

            while (stored < 10) {
                const chosenRarity = chooseRarity();

                const [items] = await db.query(
                    `SELECT * FROM IndexInventory WHERE rarity = ?`,
                    [chosenRarity]
                );

                if (!items || items.length === 0) {
                    console.log(`No items found with rarity ${chosenRarity}`);
                    continue;
                }

                // Filter out index_id 9 and 10
                const filteredItems = items.filter(item => item.index_id !== 9 && item.index_id !== 10);
                if (filteredItems.length === 0) {
                    console.log(`All items with rarity ${chosenRarity} are excluded`);
                    continue;
                }

                const randomIndex = Math.floor(Math.random() * filteredItems.length);
                const selectedItem = filteredItems[randomIndex];

                await db.query(
                    `INSERT INTO gachaResult 
                        (item_name, atk_value, effect_value, def_value, index_id, user_id, item_type, gacha_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        selectedItem.item_name,
                        0, // atk_value placeholder
                        selectedItem.effect_base || 0,
                        0, // def_value placeholder
                        selectedItem.index_id,
                        userId,
                        selectedItem.item_type
                    ]
                );

                stored++;
            }
        } catch (err) {
            console.error('Error in gachaResultMultiStore:', err);
        }
}

    static async gachaResultMultiGet (userId) {

    }
}


module.exports = Inventory;