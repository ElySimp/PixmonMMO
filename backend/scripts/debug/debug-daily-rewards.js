/**
 * Debug script to check daily rewards database state
 * Run with: node scripts/debug/debug-daily-rewards.js <userId>
 */
const db = require('../../config/database');

async function checkDailyRewards(userId = 1) {
  try {
    console.log(`Checking daily rewards data for user ${userId}...`);
    
    // Get user data from UserLogin
    const [userData] = await db.query('SELECT * FROM UserLogin WHERE id = ?', [userId]);
    
    if (!userData || userData.length === 0) {
      console.error(`User with ID ${userId} not found`);
      return;
    }
    
    console.log('User data:');
    console.log(userData[0]);
    
    // Get daily rewards data
    const [rewardsData] = await db.query('SELECT * FROM DailyRewards WHERE user_id = ?', [userId]);
    
    if (!rewardsData || rewardsData.length === 0) {
      console.error(`No daily rewards data found for user ${userId}`);
      return;
    }
    
    console.log('\nDaily Rewards data:');
    console.log(rewardsData[0]);
    
    // Format dates for better readability
    const lastClaimDate = rewardsData[0].last_claimed_date 
      ? new Date(rewardsData[0].last_claimed_date).toLocaleDateString()
      : 'Never claimed';
      
    const createdAt = rewardsData[0].created_at
      ? new Date(rewardsData[0].created_at).toLocaleString()
      : 'Unknown';
      
    const updatedAt = rewardsData[0].updated_at
      ? new Date(rewardsData[0].updated_at).toLocaleString()
      : 'Never updated';
    
    console.log('\nDaily Rewards Summary:');
    console.log(`User ID: ${userId} (${userData[0].username})`);
    console.log(`Current Day: ${rewardsData[0].current_day}`);
    console.log(`Streak Count: ${rewardsData[0].streak_count}`);
    console.log(`Total Claimed: ${rewardsData[0].total_claimed}`);
    console.log(`Last Claimed Date: ${lastClaimDate}`);
    console.log(`Created: ${createdAt}`);
    console.log(`Last Updated: ${updatedAt}`);
    
    // Check if user can claim today
    const today = new Date();
    const lastClaimed = rewardsData[0].last_claimed_date ? new Date(rewardsData[0].last_claimed_date) : null;
    
    if (!lastClaimed) {
      console.log('\nUser has never claimed a daily reward. They can claim today.');
    } else {
      const todayDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      
      const lastClaimedDay = new Date(
        lastClaimed.getFullYear(),
        lastClaimed.getMonth(),
        lastClaimed.getDate()
      );
      
      const daysDifference = Math.floor((todayDay - lastClaimedDay) / (1000 * 60 * 60 * 24));
      
      if (daysDifference === 0) {
        console.log('\nUser has already claimed today. They cannot claim again today.');
      } else if (daysDifference === 1) {
        console.log('\nUser claimed yesterday. They can claim today to maintain streak.');
      } else {
        console.log(`\nUser last claimed ${daysDifference} days ago. If they claim today, their streak will reset.`);
      }
    }
    
  } catch (error) {
    console.error('Error checking daily rewards:', error);
  } finally {
    process.exit(0);
  }
}

// Get userId from command line or use default
const userId = process.argv[2] || 1;
checkDailyRewards(userId);
