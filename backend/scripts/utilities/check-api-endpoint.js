/**
 * check-api-endpoint.js - Test the user pets API endpoint
 */

const axios = require('axios');

async function testUserPetsEndpoint() {
    try {
        console.log('Testing user pets API endpoint...');
        const userId = 1; // The user ID we want to test
        
        // Test the API endpoint
        const response = await axios.get(`http://localhost:5000/api/pets/user/${userId}`);
        
        console.log('API Response Status:', response.status);
        console.log('API Response Data:', response.data);
        
    } catch (error) {
        console.error('Error testing API endpoint:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testUserPetsEndpoint();
