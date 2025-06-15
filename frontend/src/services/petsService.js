import { API_URL } from '../utils/config';

/**
 * Fetch all pets from the database
 * @returns {Promise} Promise that resolves to an array of pets
 */
export const getAllPets = async () => {
  try {
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
