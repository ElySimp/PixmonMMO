import { API_URL } from '../utils/config';

const TOKEN_KEY = 'TOKEN_KEY';

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
}

/**
 * Fetch all pets from the database
 * @returns {Promise} Promise that resolves to an array of pets
 */
export const getAllPets = async () => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/pets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pets');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching pets:', error);
    throw error;
  }
};

/**
 * Fetch pets owned by a specific user
 * @param {string} userId - The user ID to fetch pets for
 * @returns {Promise} Promise that resolves to an array of user-owned pets
 */
export const getUserPets = async (userId) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/pets/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user pets');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching user pets:', error);
    throw error;
  }
};

/**
 * Fetch pets by role (class type)
 * @param {string} role - The role to filter by (mage, assassin, warrior, healer)
 * @returns {Promise} Promise that resolves to an array of pets of the specified role
 */
export const getPetsByRole = async (role) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/pets/role/${role}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pets by role');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching pets by role:', error);
    throw error;
  }
};

/**
 * Get skills for a specific pet class
 * @param {string} role - The role to get skills for (mage, assassin, warrior, healer)
 * @returns {Promise} Promise that resolves to an array of skills for the specified role
 */
export const getPetSkillsByRole = async (role) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/pets/skills/${role}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pet skills');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching pet skills:', error);
    throw error;
  }
};

/**
 * Add a pet to a user's collection
 * @param {object} petData - Object containing userId, petId, and optional nickname
 * @returns {Promise} Promise that resolves when pet is added
 */
export const addPetToUser = async (petData) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/pets/add-to-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(petData)
    });

    if (!response.ok) {
      throw new Error('Failed to add pet to user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding pet to user:', error);
    throw error;
  }
};

/**
 * Update a pet's status (happiness, hunger, health)
 * @param {string} userPetId - The ID of the user's pet to update
 * @param {object} statusData - Object containing status fields to update
 * @returns {Promise} Promise that resolves when pet status is updated
 */
export const updatePetStatus = async (userPetId, statusData) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/pets/status/${userPetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(statusData)
    });

    if (!response.ok) {
      throw new Error('Failed to update pet status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating pet status:', error);
    throw error;
  }
};

/**
 * Toggle a pet's equipped status
 * @param {object} equipData - Object containing userPetId, userId, and equipped status
 * @returns {Promise} Promise that resolves when pet equipped status is updated
 */
export const toggleEquipPet = async (equipData) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/pets/equip`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(equipData)
    });

    if (!response.ok) {
      throw new Error('Failed to update pet equipped status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error toggling pet equipped status:', error);
    throw error;
  }
};

/**
 * Calculate a pet's stats at a specific level
 * @param {string} petId - The ID of the pet
 * @param {number} level - The level to calculate stats for
 * @returns {Promise} Promise that resolves to the calculated stats
 */
export const calculatePetStats = async (petId, level) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/pets/stats/${petId}/${level}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to calculate pet stats');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error calculating pet stats:', error);
    throw error;
  }
};

/**
 * Equip a pet for a specific user
 * @param {string} userId - The ID of the user
 * @param {string} petId - The ID of the pet to equip
 * @returns {Promise} Promise that resolves to the response data
 */
export const equipPet = async (userId, petId) => {
  try {
    const token = getToken();
    console.log(`Equipping pet ${petId} for user ${userId}`);

    // Find the pet to equip in the user's pets
    let petToEquip = null;
    
    // Try to get user's pets from local storage first
    const userPetsString = localStorage.getItem('userPets');
    if (userPetsString) {
      const userPets = JSON.parse(userPetsString);
      petToEquip = userPets.find(pet => pet.id === parseInt(petId) || pet.id === petId);
    }
    
    // If we couldn't find the pet in localStorage, use a default pet object
    if (!petToEquip) {
      // This is a fallback for development - in production, we should get the actual pet data
      console.log('Pet not found in localStorage, using default pet data');
      petToEquip = {
        id: petId,
        name: "Default Pet",
        role: "mage",
        rarity: "COMMON",
        level: 1,
        image_url: "/assets/pets/default.png"
      };
    }
    
    // Save the equipped pet to localStorage
    localStorage.setItem('equippedPet', JSON.stringify(petToEquip));
    console.log('Saved equipped pet to localStorage:', petToEquip);

    // Make the actual API call
    const response = await fetch(`${API_URL}/v2/pets/${userId}/equip`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ petId })
    });

    if (!response.ok) {
      throw new Error('Failed to equip pet');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error equipping pet:', error);
    throw error;
  }
};

/**
 * Get the currently equipped pet for a user
 * @param {string} userId - The ID of the user
 * @returns {Promise} Promise that resolves to the equipped pet data
 */
export const getEquippedPet = async (userId) => {
  try {
    console.log(`Getting equipped pet for user ${userId}`);

    // Try to get the equipped pet from local storage first
    const storedPet = localStorage.getItem('equippedPet');
    if (storedPet) {
      const parsedPet = JSON.parse(storedPet);
      console.log('Found equipped pet in local storage:', parsedPet);
      return parsedPet;
    }

    // If not in local storage, try to find in user's pets
    const userPetsString = localStorage.getItem('userPets');
    if (userPetsString) {
      const userPets = JSON.parse(userPetsString);
      const equippedPet = userPets.find(pet => pet.is_equipped);
      if (equippedPet) {
        console.log('Found equipped pet in user pets:', equippedPet);
        // Save it to localStorage for future use
        localStorage.setItem('equippedPet', JSON.stringify(equippedPet));
        return equippedPet;
      }
    }
    
    // If not found anywhere, return a default pet
    console.log('DEVELOPMENT MODE: No equipped pet found, returning default');
    
    const defaultPet = {
      id: 1,
      name: "Shadow Dragon",
      role: "mage",
      rarity: "LEGENDARY",
      level: 15,
      image_url: "/assets/pets/dragon.png",
      happiness: 85,
      hunger: 30,
      energy: 70,
      health: 95,
      stats: {
        HP: 2500,
        ATK: 350,
        DEF_PHY: 275,
        DEF_MAGE: 400,
        MAX_MANA: 500,
        AGILITY: 180
      }
    };
    
    // Save default to localStorage
    localStorage.setItem('equippedPet', JSON.stringify(defaultPet));
    return defaultPet;

    /* Uncomment this when the backend is ready
    const token = getToken();
    const response = await fetch(`${API_URL}/v2/pets/${userId}/equipped`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch equipped pet');
    }

    const data = await response.json();
    return data.data || data;
    */
  } catch (error) {
    console.error('Error fetching equipped pet:', error);
    throw error;
  }
};
