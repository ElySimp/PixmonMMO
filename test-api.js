// Simple test script to check API connectivity
const fetch = require('node-fetch');

async function testAPI() {
    try {
        console.log('Testing backend API...');
        
        // Test health endpoint
        const healthResponse = await fetch('http://localhost:5000/api/health');
        const healthData = await healthResponse.text();
        console.log('Health check:', healthData);
        
        // Test daily rewards endpoint (assuming user ID 1 exists)
        console.log('\nTesting daily rewards endpoint...');
        const rewardsResponse = await fetch('http://localhost:5000/api/users/1/daily-rewards');
        const rewardsData = await rewardsResponse.json();
        console.log('Daily rewards response:', JSON.stringify(rewardsData, null, 2));
        
    } catch (error) {
        console.error('API Test failed:', error);
    }
}

testAPI();
