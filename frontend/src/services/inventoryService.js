import { API_URL } from '../utils/config';

const TOKEN_KEY = 'TOKEN_KEY';

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
}

/**
 * Get user's inventory items
 * @param {string} userId - The user ID
 * @returns {Promise} Promise that resolves to array of inventory items
 */
export const getUserInventory = async (userId) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/users/${userId}/inventoryGet`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }

    const data = await response.json();
    return data.inventory || [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
};

/**
 * Use an inventory item (e.g., food) on a pet
 * @param {string} itemId - The inventory item ID
 * @param {string} petId - The user pet ID to apply the item to
 * @returns {Promise} Promise that resolves when item is used
 */
export const useInventoryItem = async (itemId, petId) => {
  try {
    const token = getToken();
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || !userData.id) {
      throw new Error('User not authenticated');
    }
    
    // Since our API uses the ItemUse endpoint format
    const response = await fetch(`${API_URL}/users/${userData.id}/${itemId}/ItemUse?petId=${petId}`, {
      method: 'GET',  // Changed to GET based on existing API patterns
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to use item');
    }

    return await response.json();
  } catch (error) {
    console.error('Error using inventory item:', error);
    throw error;
  }
};

/**
 * Get inventory items by type
 * @param {string} userId - The user ID
 * @param {string} itemType - The type of items to retrieve
 * @returns {Promise} Promise that resolves to array of items of specified type
 */
export const getInventoryByType = async (userId, itemType) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/inventory/${userId}/type/${itemType}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${itemType} items`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error(`Error fetching ${itemType} items:`, error);
    throw error;
  }
};
