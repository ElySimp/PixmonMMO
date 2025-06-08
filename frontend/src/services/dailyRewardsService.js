import axios from 'axios';
import { API_URL } from '../utils/config';

/**
 * Get the user's daily rewards data
 * @param {string} userId - The user ID
 * @returns {Promise} Promise that resolves to the user's daily rewards data
 */
export const getUserDailyRewards = async (userId) => {
  try {
    console.log(`[DailyRewardsService] Fetching daily rewards for userId: ${userId}`);
    console.log(`[DailyRewardsService] API URL: ${API_URL}/users/${userId}/daily-rewards`);
    
    const response = await axios.get(`${API_URL}/users/${userId}/daily-rewards`);
    
    console.log(`[DailyRewardsService] API response status: ${response.status}`);
    console.log('[DailyRewardsService] API response data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('[DailyRewardsService] Error fetching daily rewards:', error);
    console.error('[DailyRewardsService] Error details:', error.response?.data || 'No response data');
    throw error;
  }
};

/**
 * Claim the daily reward for a user
 * @param {string} userId - The user ID
 * @param {number} dayCompleted - The day being claimed (1-7)
 * @param {string} rewardType - The type of reward ('gold' or 'diamond')
 * @param {number} rewardAmount - The amount of the reward
 * @returns {Promise} Promise that resolves to the claim result
 */
export const claimDailyReward = async (userId, dayCompleted, rewardType, rewardAmount) => {
  try {
    console.log(`[DailyRewardsService] Claiming daily reward for userId: ${userId}`);
    console.log(`[DailyRewardsService] Claim details:`, { dayCompleted, rewardType, rewardAmount });
    
    const response = await axios.post(`${API_URL}/users/${userId}/claim-daily-reward`, {
      dayCompleted,
      rewardType,
      rewardAmount
    });
    
    console.log(`[DailyRewardsService] Claim API response status: ${response.status}`);
    console.log('[DailyRewardsService] Claim API response data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('[DailyRewardsService] Error claiming daily reward:', error);
    console.error('[DailyRewardsService] Error details:', error.response?.data || 'No response data');
    throw error;
  }
};

/**
 * Format the time until next claim in human-readable format
 * @param {Object} nextClaimInfo - Information about the next claim time
 * @returns {string} Human-readable time until next claim
 */
export const formatNextClaimTime = (nextClaimInfo) => {
  if (!nextClaimInfo) return 'Now';
  
  const { hoursRemaining, minutesRemaining } = nextClaimInfo;
  
  if (hoursRemaining === 0) {
    return `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;
  } else {
    return `${hoursRemaining}h ${minutesRemaining}m`;
  }
};
