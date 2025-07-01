import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, TOKEN_KEY } from '../utils/config';
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
      
      // Get token from localStorage
      const token = localStorage.getItem(TOKEN_KEY);
      
      // Add authorization header if token exists
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_URL}/users/${userId}/stats`, { headers });
      
      // Log received stats for debugging
      console.log('Stats received from backend:', response.data);
      
      if (response.data && typeof response.data === 'object') {
        const { xp: userXp, gold: userGold, diamonds: userDiamonds, level: userLevel, cooldownEnd } = response.data;
        
        // Calculate XP needed for next level
        const xpCap = calculateXpCap(userLevel || 1);
        
        // Check if the player should already be at a higher level
        let adjustedLevel = userLevel || 1;
        let adjustedXp = userXp || 0;
        
        // Add some debugging for received XP and level cap
        console.log(`XP check: User has ${adjustedXp}/${xpCap} XP at level ${adjustedLevel}`);
        
        // If XP exceeds the cap for current level, we need to level up
        // Add a small buffer to avoid floating point issues (e.g., 50.0001 >= 50)
        if (adjustedXp >= xpCap + 0.001) {
          console.log(`Auto level up triggered: ${adjustedLevel} -> ${adjustedLevel + 1}`);
          
          const newLevel = adjustedLevel + 1;
          
          // Update the backend with the corrected level
          try {
            // Get token from localStorage
            const token = localStorage.getItem(TOKEN_KEY);
            
            // Add authorization header if token exists
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            console.log(`Sending level correction to backend: Level ${adjustedLevel} -> ${newLevel}`);
            
            const response = await axios.post(`${API_URL}/users/${userId}/update-stats`, {
              xpDelta: 0,
              goldDelta: 0,
              level: newLevel,
              resetXp: true,
            }, { headers });
            
            // Log successful update
            console.log('Level correction saved successfully:', response.data);
            
            // Update our local variables
            adjustedLevel = newLevel;
            adjustedXp = 0;
          } catch (error) {
            console.error('Failed to save level correction:', error);
            // In case of failure, don't adjust the level locally to maintain consistency with backend
            console.log('Reverting to backend values due to error');
            adjustedLevel = userLevel || 1;
            adjustedXp = userXp || 0;
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
      // Save the previous state for rollback if needed
      const previousStats = { ...stats };
      
      // Log the current state and what we're updating
      console.log('Current stats before update:', previousStats);
      console.log('Applying updates:', updates);
      
      // Calculate what the new values should be
      const newValues = { 
        xp: previousStats.xp + (updates.xpDelta || 0),
        gold: previousStats.gold + (updates.goldDelta || 0),
        diamonds: previousStats.diamonds + (updates.diamondsDelta || 0),
        level: updates.level !== undefined ? updates.level : previousStats.level,
        cooldownEnd: updates.cooldownEnd !== undefined ? new Date(updates.cooldownEnd).getTime() : previousStats.cooldownEnd
      };
      
      if (updates.resetXp) {
        newValues.xp = 0;
      }
      
      console.log('Calculated new values:', newValues);
      
      // Update backend first before optimistic update
      const token = localStorage.getItem(TOKEN_KEY);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('Sending stats update to backend:', updates);
      const response = await axios.post(`${API_URL}/users/${user.id}/update-stats`, updates, { headers });
      console.log('Backend update response:', response.data);
      
      // Important: Use the values from the server response instead of our calculated values
      // This ensures frontend and backend stay in sync
      if (response.data && typeof response.data === 'object') {
        const { xp, gold, diamonds, level, cooldownEnd } = response.data;
        
        console.log('Setting stats from server response:', response.data);
        
        setStats(prev => ({
          ...prev,
          xp: xp !== undefined ? xp : prev.xp,
          gold: gold !== undefined ? gold : prev.gold,
          diamonds: diamonds !== undefined ? diamonds : prev.diamonds,
          level: level !== undefined ? level : prev.level,
          cooldownEnd: cooldownEnd ? new Date(cooldownEnd).getTime() : prev.cooldownEnd,
          // Also update the XP cap based on potentially new level
          xpToNextLevel: level !== undefined ? calculateXpCap(level) : prev.xpToNextLevel
        }));
      } else {
        // Fallback to our calculated values if the response doesn't contain stats
        console.log('Using calculated values as fallback');
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
      }
    } catch (error) {
      console.error('Error updating stats:', error);
      // If there's an error, reload the stats to ensure consistency
      loadUserStats(user.id);
    }
  };
  
  // Check for level up based on current XP
  const checkAndProcessLevelUp = async () => {
    const { level, xp, xpToNextLevel } = stats;
    
    console.log(`Checking for level up: XP ${xp}/${xpToNextLevel} at level ${level}`);
    
    // Add a small buffer to avoid floating point comparison issues
    if (xp >= xpToNextLevel + 0.001) {
      const newLevel = level + 1;
      console.log(`Level up condition met: Level ${level} -> ${newLevel}`);
      
      // Save current stats before attempting level up
      const statsBefore = { ...stats };
      
      try {
        // Process level up and update both backend and frontend
        await updateStats({
          level: newLevel,
          resetXp: true
        });
        
        console.log(`Level up processed successfully: Level ${level} -> ${newLevel}`);
        
        return {
          didLevelUp: true, 
          newLevel
        };
      } catch (error) {
        console.error('Failed to process level up:', error);
        
        // Verify if the level up actually happened on the backend by reloading stats
        try {
          await loadUserStats(user.id);
          
          // Check if level increased after reload
          if (stats.level > statsBefore.level) {
            console.log(`Level up confirmed after reload: Level ${statsBefore.level} -> ${stats.level}`);
            return {
              didLevelUp: true,
              newLevel: stats.level
            };
          }
        } catch (reloadError) {
          console.error('Failed to reload stats after level up error:', reloadError);
        }
        
        // If level up fails and reload doesn't confirm it, return false
        return { didLevelUp: false };
      }
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
