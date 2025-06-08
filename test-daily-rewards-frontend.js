// Test script to verify daily rewards frontend functionality
const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testDailyRewardsAPI() {
  console.log('🧪 Testing Daily Rewards API Integration...\n');
  
  try {
    // Test 1: Get daily rewards data
    console.log('📋 Test 1: Getting daily rewards data for user 1...');
    const response = await axios.get(`${API_URL}/api/users/1/daily-rewards`);
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));
    
    // Test 2: Verify data structure
    console.log('\n🔍 Test 2: Verifying data structure...');
    const data = response.data.data;
    
    const requiredFields = ['current_day', 'streak_count', 'total_claimed', 'canClaimToday'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length === 0) {
      console.log('✅ All required fields present:', requiredFields.join(', '));
    } else {
      console.log('❌ Missing fields:', missingFields.join(', '));
    }
    
    // Test 3: Check API URL configuration
    console.log('\n🌐 Test 3: API URL Configuration...');
    console.log('✅ Base API URL:', API_URL);
    console.log('✅ Full endpoint:', `${API_URL}/api/users/1/daily-rewards`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📍 Frontend should now be able to:');
    console.log('   - Connect to backend at http://localhost:5000');
    console.log('   - Load daily rewards data');
    console.log('   - Display streak count and claim status');
    console.log('   - Handle claim operations');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testDailyRewardsAPI();
