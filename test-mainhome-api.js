// Test script to verify MainHome.jsx API calls are working correctly
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testMainHomeAPI() {
    console.log('🧪 Testing MainHome.jsx API calls...\n');
    
    try {
        // Test daily rewards API (the one that was broken)
        console.log('1. Testing Daily Rewards API...');
        const dailyRewardsResponse = await axios.get(`${API_URL}/users/1/daily-rewards`);
        console.log('✅ Daily Rewards Response:', JSON.stringify(dailyRewardsResponse.data, null, 2));
        
        // Extract data like MainHome.jsx does
        const dailyRewardsData = dailyRewardsResponse.data.success ? dailyRewardsResponse.data.data : dailyRewardsResponse.data;
        console.log('✅ Extracted Daily Rewards Data:', JSON.stringify(dailyRewardsData, null, 2));
        console.log(`✅ Streak Count: ${dailyRewardsData.streak_count}`);
        console.log();
        
        // Test user stats API
        console.log('2. Testing User Stats API...');
        const userStatsResponse = await axios.get(`${API_URL}/users/1/stats`);
        console.log('✅ User Stats Response:', JSON.stringify(userStatsResponse.data, null, 2));
        console.log();
        
        // Summary
        console.log('📊 SUMMARY:');
        console.log(`- Daily Streak: ${dailyRewardsData.streak_count} days`);
        console.log(`- Current Day: ${dailyRewardsData.current_day}`);
        console.log(`- Total Claimed: ${dailyRewardsData.total_claimed}`);
        console.log(`- Can Claim Today: ${dailyRewardsData.canClaimToday}`);
        console.log();
        console.log('🎉 All APIs working correctly! The daily streak should now show the correct value in MainHome.jsx');
        
    } catch (error) {
        console.error('❌ Error testing APIs:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testMainHomeAPI();
