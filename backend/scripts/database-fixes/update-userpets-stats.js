// Script to ensure UserPets table has happiness, hunger, and health columns
const db = require('../../config/database');

async function updateUserPetsTable() {
  try {
    console.log('Checking UserPets table structure...');
    
    // Check if happiness column exists
    const [happinessResult] = await db.query(`
      SELECT COUNT(*) as count
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'UserPets' 
      AND COLUMN_NAME = 'happiness'
    `);
    
    if (happinessResult[0].count === 0) {
      console.log('Adding happiness column to UserPets table');
      await db.query(`
        ALTER TABLE UserPets
        ADD COLUMN happiness INTEGER DEFAULT 100
      `);
    }
    
    // Check if hunger column exists
    const [hungerResult] = await db.query(`
      SELECT COUNT(*) as count
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'UserPets' 
      AND COLUMN_NAME = 'hunger'
    `);
    
    if (hungerResult[0].count === 0) {
      console.log('Adding hunger column to UserPets table');
      await db.query(`
        ALTER TABLE UserPets
        ADD COLUMN hunger INTEGER DEFAULT 0
      `);
    }
    
    // Check if health column exists
    const [healthResult] = await db.query(`
      SELECT COUNT(*) as count
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'UserPets' 
      AND COLUMN_NAME = 'health'
    `);
    
    if (healthResult[0].count === 0) {
      console.log('Adding health column to UserPets table');
      await db.query(`
        ALTER TABLE UserPets
        ADD COLUMN health INTEGER DEFAULT 100
      `);
    }
    
    console.log('UserPets table structure update complete!');
  } catch (error) {
    console.error('Error updating UserPets table:', error);
  }
}

// Run the function if this script is called directly
if (require.main === module) {
  updateUserPetsTable()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateUserPetsTable };
