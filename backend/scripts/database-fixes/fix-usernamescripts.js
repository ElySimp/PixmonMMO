// Fix usernames in UserProfile table
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function fixUsernames() {
    try {
        // Get all users and their profiles
        const [users] = await db.query(`
            SELECT ul.id, ul.username, up.id as profile_id
            FROM UserLogin ul
            LEFT JOIN UserProfile up ON ul.id = up.user_id
        `);

        console.log(`Found ${users.length} users to process`);

        // Update each profile with the correct username from UserLogin
        for (const user of users) {
            if (user.profile_id) {
                await db.query(
                    'UPDATE UserProfile SET username = ? WHERE user_id = ?',
                    [user.username, user.id]
                );
                console.log(`Updated username for user ${user.id} to ${user.username}`);
            }
        }

        console.log('Username fix complete');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing usernames:', error);
        process.exit(1);
    }
}

fixUsernames();