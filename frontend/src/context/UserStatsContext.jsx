import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { useAuth } from './AuthContext';

// Create context
const UserStatsContext = createContext(null);

// Custom hook to use the user stats context
export const useUserStats = () => {
  const context = useContext(UserStatsContext);
  if (!context) {
    throw new Error('useUserStats must be used within a UserStatsProvider');
  }
  return context;
};

// Provider component that will wrap your app
export const UserStatsProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    level: 1,
    xp: 0,
    gold: 0,
    diamonds: 0,
    cooldownEnd: null,
    xpToNextLevel: 50,
    isLoading: true
  });

  // Calculate XP required for level up
  const calculateXpCap = (playerLevel) => {
    return Math.floor(50 * Math.pow(playerLevel, 1.4));
  };

  // Fetch user stats on auth change
  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading
    
    if (user && user.id) {
      loadUserStats(user.id);
    } else {
      // Reset stats if user is not logged in
      setStats(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  }, [user, authLoading]);

  // Function to load user stats
  const loadUserStats = async (userId) => {
    try {
      setStats(prev => ({ ...prev, isLoading: true }));
      
      const response = await axios.get(`${API_URL}/users/${userId}/stats`);
      
      if (response.data && typeof response.data === 'object') {
        const { xp: userXp, gold: userGold, diamonds: userDiamonds, level: userLevel, cooldownEnd } = response.data;
        
        // Calculate XP needed for next level
        const xpCap = calculateXpCap(userLevel || 1);
        
        // Check if the player should already be at a higher level
        let adjustedLevel = userLevel || 1;
        let adjustedXp = userXp || 0;
        
        // If XP exceeds the cap for current level, we need to level up
        if (adjustedXp >= xpCap) {
          adjustedLevel = adjustedLevel + 1;
          adjustedXp = 0;
          
          // Update the backend with the corrected level
          try {
            await axios.post(`${API_URL}/users/${userId}/update-stats`, {
              xpDelta: 0,
              goldDelta: 0,
              level: adjustedLevel,
              resetXp: true,
            });
          } catch (error) {
            console.error('Failed to save level correction:', error);
          }
        }
        
        // Set XP cap for the (potentially updated) level
        const finalXpCap = calculateXpCap(adjustedLevel);
        
        setStats({
          level: adjustedLevel,
          xp: adjustedXp,
          gold: userGold || 0,
          diamonds: userDiamonds || 0,
          cooldownEnd: cooldownEnd ? new Date(cooldownEnd).getTime() : null,
          xpToNextLevel: finalXpCap,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Function to update stats (used after actions that change stats)
  const updateStats = async (updates) => {
    if (!user || !user.id) return;
    
    try {
      // Optimistically update local state first
      setStats(prev => {
        const updatedStats = { ...prev };
        
        if (updates.xpDelta !== undefined) {
          updatedStats.xp += updates.xpDelta;
        }
        
        if (updates.goldDelta !== undefined) {
          updatedStats.gold += updates.goldDelta;
        }
        
        if (updates.diamondsDelta !== undefined) {
          updatedStats.diamonds += updates.diamondsDelta;
        }
        
        if (updates.level !== undefined) {
          updatedStats.level = updates.level;
        }
        
        if (updates.resetXp) {
          updatedStats.xp = 0;
        }
        
        if (updates.cooldownEnd !== undefined) {
          updatedStats.cooldownEnd = new Date(updates.cooldownEnd).getTime();
        }
        
        // Recalculate XP cap if level changed
        if (updates.level !== undefined) {
          updatedStats.xpToNextLevel = calculateXpCap(updates.level);
        }
        
        return updatedStats;
      });
      
      // Then update the backend
      await axios.post(`${API_URL}/users/${user.id}/update-stats`, updates);
      
    } catch (error) {
      console.error('Error updating stats:', error);
      // If there's an error, reload the stats to ensure consistency
      loadUserStats(user.id);
    }
  };
  
  // Check for level up based on current XP
  const checkAndProcessLevelUp = () => {
    const { level, xp, xpToNextLevel } = stats;
    
    if (xp >= xpToNextLevel) {
      const newLevel = level + 1;
      
      updateStats({
        level: newLevel,
        resetXp: true
      });
      
      return {
        didLevelUp: true, 
        newLevel
      };
    }
    
    return { didLevelUp: false };
  };

  const value = {
    ...stats,
    loadUserStats,
    updateStats,
    checkAndProcessLevelUp,
    calculateXpCap
  };

  return (
    <UserStatsContext.Provider value={value}>
      {children}
    </UserStatsContext.Provider>
  );
};
