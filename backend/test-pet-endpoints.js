const fetch = require('node-fetch');

// Test both the equip and getEquippedPet endpoints
async function testPetEndpoints() {
    const userId = 1; // Test with user ID 1
    const petId = 1;  // Test with pet ID 1
    const baseUrl = 'http://localhost:5000';

    console.log(`Testing pet endpoints for user ${userId}, pet ${petId}`);

    try {
        // Test equip pet endpoint
        console.log('Testing equip pet endpoint...');
        const equipResponse = await fetch(`${baseUrl}/api/v2/pets/${userId}/equip`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ petId })
        });

        const equipData = await equipResponse.json();
        console.log('Equip response status:', equipResponse.status);
        console.log('Equip response data:', equipData);

        // Test get equipped pet endpoint
        console.log('\nTesting get equipped pet endpoint...');
        const getEquippedResponse = await fetch(`${baseUrl}/api/v2/pets/${userId}/equipped`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const getEquippedData = await getEquippedResponse.json();
        console.log('Get equipped response status:', getEquippedResponse.status);
        console.log('Get equipped response data:', getEquippedData);
        
    } catch (error) {
        console.error('Error testing pet endpoints:', error);
    }
}

testPetEndpoints();
