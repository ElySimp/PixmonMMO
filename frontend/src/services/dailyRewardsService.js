import { API_URL } from '../utils/config';

/**
 * Get daily rewards for a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} - The daily rewards data
 */
export const getUserDailyRewards = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/daily-rewards`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch daily rewards: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getUserDailyRewards:', error);
    throw error;
  }
};

/**
 * Claim daily reward for a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} - The result of the claim operation
 */
export const claimDailyReward = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/claim-daily-reward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to claim daily reward: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in claimDailyReward:', error);
    throw error;
  }
};
