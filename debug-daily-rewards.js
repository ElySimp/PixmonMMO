// Debug script to test daily rewards connection from frontend perspective
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function debugDailyRewards() {
    console.log('🔍 Debugging Daily Rewards Connection...\n');
    
    try {
        console.log('1. Testing basic server health...');
        const healthResponse = await axios.get(`http://localhost:5000/api/health`);
        console.log('✅ Server health:', healthResponse.data);
        console.log();
        
        console.log('2. Testing daily rewards endpoint...');
        console.log(`   URL: ${API_URL}/users/1/daily-rewards`);
        
        const dailyResponse = await axios.get(`${API_URL}/users/1/daily-rewards`);
        console.log('✅ Daily rewards response:', JSON.stringify(dailyResponse.data, null, 2));
        console.log();
        
        console.log('3. Testing the exact same call as HomeDaily.jsx...');
        // Simulate exactly what the frontend does
        const response = await axios.get(`${API_URL}/users/1/daily-rewards`);
        console.log('Raw response:', response.data);
        
        // Handle different response structures like HomeDaily does
        let data;
        if (response.data && response.data.success && response.data.data) {
            data = response.data.data;
            console.log('✅ Extracted data using success.data pattern:', data);
        } else if (response.data && !response.data.success) {
            console.error('❌ API returned error:', response.data);
            throw new Error(response.data.message || 'Failed to fetch daily rewards');
        } else {
            // Direct data response
            data = response.data;
            console.log('✅ Using direct data response:', data);
        }
        
        console.log('\n📊 Final extracted values:');
        console.log(`   - Current Day: ${data.current_day || 1}`);
        console.log(`   - Streak Count: ${data.streak_count || 0}`);
        console.log(`   - Total Claimed: ${data.total_claimed || 0}`);
        console.log(`   - Can Claim Today: ${data.canClaimToday !== undefined ? data.canClaimToday : true}`);
        console.log(`   - Next Claim Info: ${data.nextClaimInfo ? 'Available' : 'None'}`);
        
    } catch (error) {
        console.error('❌ Error during debug:', error.message);
        
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        } else if (error.request) {
            console.error('   No response received from server');
            console.error('   Request details:', error.request);
        } else {
            console.error('   Request setup error:', error.message);
        }
    }
}

debugDailyRewards();
