const db = require('../../config/database');

async function testDatabaseConnection() {
    try {
        console.log('Attempting to connect to database...');
        
        // Try a simple query
        const [result] = await db.query('SELECT 1 + 1 as solution');
        
        console.log('Database connection successful!');
        console.log('Test query result:', result[0].solution);
        
        // Check if pets table exists
        try {
            const [tables] = await db.query('SHOW TABLES LIKE "Pets"');
            if (tables.length > 0) {
                console.log('Pets table exists');
                
                // Count pets
                const [petsCount] = await db.query('SELECT COUNT(*) as count FROM Pets');
                console.log(`Number of pets in database: ${petsCount[0].count}`);
            } else {
                console.log('Pets table does not exist yet');
            }
        } catch (error) {
            console.log('Error checking Pets table:', error.message);
        }
        
    } catch (error) {
        console.error('Database connection error:', error);
        console.error('Please check your .env file and make sure the database is running.');
    } finally {
        process.exit();
    }
}

testDatabaseConnection();
