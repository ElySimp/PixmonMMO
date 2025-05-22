// Script to initialize UserStats for all users
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function initializeUserStats() {
  try {
    console.log('Initializing UserStats for all users...');
    
    // Get all users who need stats
    const [users] = await db.query(`
      SELECT id, username 
      FROM UserLogin 
      WHERE id NOT IN (SELECT user_id FROM UserStats)
    `);
    
    console.log(`Found ${users.length} users without stats records.`);
    
    // Current timestamp for all records
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Sample data from your original database
    const userData = [
      { id: 1, username: 'ely', xp: 1, gold: 95, level: 1, cooldownEnd: '2025-05-22 06:14:21' },
      { id: 4, username: 'dika', xp: 0, gold: 0, level: 1, cooldownEnd: null },
      { id: 5, username: 'test2', xp: 500, gold: 2000, level: 4, cooldownEnd: null },
      { id: 6, username: 'jeco', xp: 230, gold: 5000, level: 2, cooldownEnd: null }
    ];
    
    // Insert records for each user
    for (const user of users) {
      // Find user data if it exists in our sample data
      const userDataMatch = userData.find(data => data.id === user.id);
      
      // Use sample data if available, otherwise use defaults
      const xp = userDataMatch ? userDataMatch.xp : 0;
      const gold = userDataMatch ? userDataMatch.gold : 0;
      const level = userDataMatch ? userDataMatch.level : 1;
      const cooldownEnd = userDataMatch && userDataMatch.cooldownEnd ? userDataMatch.cooldownEnd : null;
      
      // Insert the record
      await db.query(`
        INSERT INTO UserStats (
          user_id, 
          xp, 
          gold, 
          level, 
          updated_at, 
          cooldownEnd,
          quest_points
        )
        VALUES (?, ?, ?, ?, ?, ?, 10)
      `, [
        user.id,
        xp,
        gold,
        level,
        now,
        cooldownEnd
      ]);
      
      console.log(`Created stats for user ${user.username} (ID: ${user.id})`);
    }
    
    // Verify final state
    const [finalStats] = await db.query(`
      SELECT us.user_id, ul.username, us.xp, us.gold, us.level, us.cooldownEnd, us.updated_at, us.quest_points
      FROM UserStats us
      JOIN UserLogin ul ON us.user_id = ul.id
      ORDER BY us.user_id
    `);
    
    console.log('Current UserStats records after initialization:');
    console.table(finalStats);
    
    console.log('UserStats initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing UserStats:', error);
    process.exit(1);
  }
}

initializeUserStats();
