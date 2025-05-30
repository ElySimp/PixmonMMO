const db = require('../config/database');

class Inventory {
    static async createIndexInvtable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS IndexInventory (
                item_id int AUTO_INCREMENT PRIMARY KEY,
                item_name varchar(100),
                description varchar(100),
                item_type varchar(100),
                max_base int,
                min_base int, 
                obtain_check BOOLEAN,
                rarity int,
                first_obtain_date timestamp
            )
        `;
        
        try {
            await db.query(sql);
            console.log('IndexInventory table created or already exists');
            
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

    static async createUserAchievementsTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS UserInventory(
                item_name varchar(100),
                atk_value int,
                effect_value int, 
                def_value int,
                index_id int(11),
                user_id int(11),
                item_type varchar(100),
                FOREIGN KEY (index_id) REFERENCES index_inventory (item_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES UserLogin(id) ON DELETE CASCADE
            )
        `;
        
        try {
            await db.query(sql);
            console.log('UserInventory table created or already exists');
        } catch (error) {
            console.error('Error creating UserAchievements table:', error);
            throw error;
        }
    }


    static async seedInitialinventoryIndex() {
        const items = [
            {
                item_name : "test item no 1",
                description : "i hab no idea",
                item_type : "potion", // ni tar mo di ganti jadi item type id supaya jadi id aj or tetep string?
                max_base : 20,
                min_base : 10,
                obtain_check : false,
                rarity : 2,
                first_obtain_date : null
            }
        ];
        
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        for (const items of items) {
            try {
                await db.query(`
                    INSERT INTO index_inventory 
                    (item_name, description, item_type, max_base, min_base, obtain_check, rarity, first_obtain_date) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    items.item_name, 
                    items.description,
                    items.item_type,
                    items.max_base,
                    items.min_base, 
                    items.obtain_check,
                    items.rarity, 
                    items.first_obtain_date
                ]);
            } catch (error) {
                console.error(`Error seeding item ${items.item_name}:`, error);
            }
        }
        
        console.log('Seeded initial items');
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
                FOREIGN KEY (index_id) REFERENCES index_inventory (item_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES UserLogin(id) ON DELETE CASCADE
            )
        `;
        
        try {
            await db.query(sql);
            console.log('UserInventory table created or already exists');
        } catch (error) {
            console.error('Error creating UserInventory table:', error);
            throw error;
        }
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

        try {
            await db.query(`
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
            console.log('Insert successful: item added to UserInventory');
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

}

module.exports = Inventory;