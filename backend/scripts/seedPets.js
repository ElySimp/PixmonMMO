const db = require('../config/database');

// Function to seed pets data
async function seedPets() {
  try {
    console.log('Starting to seed pets data...');
    
    // Check if pets already exist to avoid duplicates
    const [existingPets] = await db.query('SELECT COUNT(*) as count FROM Pets');
    
    if (existingPets[0].count > 0) {
      console.log('Pets data already exists. Skipping seed...');
      return;
    }
    
    // Define the pets data
    const petsData = [
      {
        name: 'Arcania',
        role: 'mage',
        level: 1,
        atk: 0,         // No physical attack
        hp: 35,         // Low HP
        def_phy: 25,    // Low physical defense
        def_magic: 65,  // High magic defense
        max_mana: 95,   // Very high mana
        agility: 45,    // Average agility
        rarity: 'epic',
        passive_skill: 'Arcane Mastery: Increase magic damage by 15% and mana regeneration by 10% per turn'
      },
      {
        name: 'Shadowblade',
        role: 'assassin',
        level: 1,
        atk: 85,         // High physical attack
        hp: 45,          // Moderate-low HP
        def_phy: 65,     // High physical defense
        def_magic: 25,   // Low magic defense
        max_mana: 55,    // Average mana
        agility: 75,     // High agility
        rarity: 'epic',
        passive_skill: 'Shadow Step: 15% chance to dodge attacks and counter with a strike dealing 50% physical damage'
      },
      {
        name: 'Ironheart',
        role: 'warrior',
        level: 1,
        atk: 35,         // Low physical attack
        hp: 75,          // High HP
        def_phy: 95,     // Insane physical defense
        def_magic: 95,   // Insane magic defense
        max_mana: 45,    // Moderate-low mana
        agility: 25,     // Low agility
        rarity: 'epic',
        passive_skill: 'Stalwart Defender: Reduce incoming damage by 20% when below 50% HP'
      },
      {
        name: 'Luminara',
        role: 'healer',
        level: 1,
        atk: 0,          // No physical attack
        hp: 55,          // Moderate HP
        def_phy: 35,     // Low-moderate physical defense
        def_magic: 45,   // Moderate magic defense
        max_mana: 85,    // High mana
        agility: 35,     // Low-moderate agility
        rarity: 'epic',
        passive_skill: 'Healing Light: Overhealing converts 20% of excess healing to a shield that lasts for 2 turns'
      }
    ];

    // Insert data into the Pets table
    for (const pet of petsData) {
      await db.query(`
        INSERT INTO Pets (name, role, level, atk, hp, def_phy, def_magic, max_mana, agility, rarity, passive_skill)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        pet.name,
        pet.role,
        pet.level,
        pet.atk,
        pet.hp,
        pet.def_phy,
        pet.def_magic,
        pet.max_mana,
        pet.agility,
        pet.rarity,
        pet.passive_skill
      ]);
    }

    console.log('Pets data seeded successfully!');
    
    // Now let's create the pet skills table and seed data
    await createPetSkillsTable();
    await seedPetSkills();
    
  } catch (error) {
    console.error('Error seeding pets data:', error);
    throw error;
  }
}

async function createPetSkillsTable() {
  try {
    // Create pet skills table
    const createPetSkillsTable = `
      CREATE TABLE IF NOT EXISTS PetSkills (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        mana_cost INTEGER NOT NULL,
        cooldown INTEGER NOT NULL DEFAULT 0,
        skill_type ENUM('active', 'passive') NOT NULL,
        pet_role VARCHAR(100),
        damage INTEGER DEFAULT 0,
        healing INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 1,
        effect_description TEXT
      )
    `;
    
    await db.query(createPetSkillsTable);
    console.log('PetSkills table created successfully');
  } catch (error) {
    console.error('Error creating pet skills table:', error);
    throw error;
  }
}

async function seedPetSkills() {
  try {
    // Check if skills already exist
    const [existingSkills] = await db.query('SELECT COUNT(*) as count FROM PetSkills');
    
    if (existingSkills[0].count > 0) {
      console.log('Pet skills already exist. Skipping seed...');
      return;
    }
    
    // Define class-specific skills
    const skills = [
      // Mage skills
      {
        name: 'Arcane Blast',
        description: 'Deal high magic damage to a single target',
        mana_cost: 30,
        cooldown: 0,
        skill_type: 'active',
        pet_role: 'mage',
        damage: 85,
        healing: 0,
        duration: 1,
        effect_description: 'Direct magic damage'
      },
      {
        name: 'Mana Surge',
        description: 'Restore 20% mana to all team members',
        mana_cost: 50,
        cooldown: 3,
        skill_type: 'active',
        pet_role: 'mage',
        damage: 0,
        healing: 0,
        duration: 1,
        effect_description: 'Restores 20% of max mana to all allies'
      },
      
      // Assassin skills
      {
        name: 'Lethal Strike',
        description: 'Deal high physical damage to a single target',
        mana_cost: 30,
        cooldown: 0,
        skill_type: 'active',
        pet_role: 'assassin',
        damage: 90,
        healing: 0,
        duration: 1,
        effect_description: 'Direct physical damage'
      },
      {
        name: 'Counter Stance',
        description: 'Set up to parry the next attack, reducing damage by 70% and counterattacking',
        mana_cost: 20,
        cooldown: 2,
        skill_type: 'active',
        pet_role: 'assassin',
        damage: 60,
        healing: 0,
        duration: 1,
        effect_description: 'Reduces incoming damage by 70% and counterattacks for 60 damage'
      },
      
      // Warrior skills
      {
        name: 'Provoke',
        description: 'Taunt enemies to attack this pet for 2 turns',
        mana_cost: 20,
        cooldown: 3,
        skill_type: 'active',
        pet_role: 'warrior',
        damage: 0,
        healing: 0,
        duration: 2,
        effect_description: 'Forces enemies to target this pet for 2 turns'
      },
      {
        name: 'Defensive Aura',
        description: 'Grant a shield to all team members that absorbs 30% of damage for 2 turns',
        mana_cost: 40,
        cooldown: 4,
        skill_type: 'active',
        pet_role: 'warrior',
        damage: 0,
        healing: 0,
        duration: 2,
        effect_description: 'Creates a shield that absorbs 30% of damage for all allies'
      },
      
      // Healer skills
      {
        name: 'Rejuvenation',
        description: 'Heal all team members for 40% of their max HP',
        mana_cost: 60,
        cooldown: 4,
        skill_type: 'active',
        pet_role: 'healer',
        damage: 0,
        healing: 40,
        duration: 1,
        effect_description: 'Heals 40% of max HP for all allies'
      },
      {
        name: 'Mana Infusion',
        description: 'Restore 40% mana to a single ally',
        mana_cost: 30,
        cooldown: 2,
        skill_type: 'active',
        pet_role: 'healer',
        damage: 0,
        healing: 0,
        duration: 1,
        effect_description: 'Restores 40% of max mana to a single ally'
      },
      {
        name: 'Evasive Aura',
        description: 'Increase dodge chance of all team members by 25% for 2 turns',
        mana_cost: 40,
        cooldown: 4,
        skill_type: 'active',
        pet_role: 'healer',
        damage: 0,
        healing: 0,
        duration: 2,
        effect_description: 'Increases dodge chance by 25% for all allies'
      }
    ];
    
    // Insert skills into the database
    for (const skill of skills) {
      await db.query(`
        INSERT INTO PetSkills 
        (name, description, mana_cost, cooldown, skill_type, pet_role, damage, healing, duration, effect_description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        skill.name,
        skill.description,
        skill.mana_cost,
        skill.cooldown,
        skill.skill_type,
        skill.pet_role,
        skill.damage,
        skill.healing, 
        skill.duration,
        skill.effect_description
      ]);
    }
    
    console.log('Pet skills seeded successfully!');
  } catch (error) {
    console.error('Error seeding pet skills:', error);
    throw error;
  }
}

module.exports = {
  seedPets,
  createPetSkillsTable,
  seedPetSkills
};
