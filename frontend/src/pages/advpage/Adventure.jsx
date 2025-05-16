import React, { useState, useEffect } from 'react';
import './Adventure.css';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/config';
import adventureStories from '../../assets/adventure_stories';

import avatarExample from '../../assets/MAIN/avatar_exaple.gif';

const Adventure = () => {
  const [xp, setXp] = useState(0);
  const [gold, setGold] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpToNextLevel, setXpToNextLevel] = useState(0);
  const [story, setStory] = useState('Your adventure begins...');
  const [cooldown, setCooldown] = useState(0);
  const [cooldownEndTime, setCooldownEndTime] = useState(0);
  const { user } = useAuth(); // Get user from auth context

  // Calculate XP required for level up
  const calculateXpCap = (playerLevel) => {
    return Math.floor(50 * Math.pow(playerLevel, 1.4));
  };

  // Get a random adventure story from our collection
  const getRandomStory = (foundRewards) => {
    // Pick random story from the collection
    const randomIndex = Math.floor(Math.random() * adventureStories.length);
    const randomStory = adventureStories[randomIndex];
    
    // If rewards were found, append that information
    if (foundRewards) {
      return `${randomStory} You found some rewards!`;
    }
    
    return randomStory;
  };

  // Check and update cooldown based on the server time or local timer
  useEffect(() => {
    let cooldownTimer;
    
    if (cooldownEndTime > 0) {
      const updateCooldown = () => {
        const now = Date.now();
        const remainingCooldown = Math.max(0, Math.ceil((cooldownEndTime - now) / 1000));
        
        setCooldown(remainingCooldown);
        
        if (remainingCooldown === 0) {
          setCooldownEndTime(0);
          clearInterval(cooldownTimer);
        }
      };
      
      updateCooldown(); // Run immediately
      cooldownTimer = setInterval(updateCooldown, 250); // Update 4 times per second for smoother countdown
    }
    
    return () => {
      if (cooldownTimer) clearInterval(cooldownTimer);
    };
  }, [cooldownEndTime]);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check if user is logged in
        if (!user || !user.id) {
          console.error('User not logged in');
          return;
        }
        
        // Fetch user stats from backend
        const response = await axios.get(`${API_URL}/users/${user.id}/stats`);
        
        // Check if we got valid data back
        if (response.data && typeof response.data === 'object') {
          const { xp: userXp, gold: userGold, level: userLevel, cooldownEnd } = response.data;
          
          console.log('Loaded user stats:', { userXp, userGold, userLevel, cooldownEnd });
          
          // Calculate XP needed for next level
          const xpCap = calculateXpCap(userLevel || 1);
          
          // Check if the player should already be at a higher level
          let adjustedLevel = userLevel || 1;
          let adjustedXp = userXp || 0;
          
          // If XP exceeds the cap for current level, we need to level up
          if (adjustedXp >= xpCap) {
            adjustedLevel = adjustedLevel + 1;
            adjustedXp = 0;
            
            console.log(`LEVEL DEBUG - Auto-leveling up on load: Level ${userLevel} → ${adjustedLevel} (XP: ${userXp} exceeds cap ${xpCap})`);
            
            // Update the backend with the corrected level
            try {
              await axios.post(`${API_URL}/users/${user.id}/update-stats`, {
                xpDelta: 0, // No XP change
                goldDelta: 0, // No gold change
                level: adjustedLevel,
                resetXp: true, // Reset XP to 0
              });
              console.log(`LEVEL DEBUG - Saved auto-level correction to backend`);
            } catch (error) {
              console.error('Failed to save level correction:', error);
            }
          }
          
          // Only update if we got valid numbers back
          setXp(adjustedXp);
          setGold(userGold || 0);
          setLevel(adjustedLevel);
          
          // Set XP cap for the (potentially updated) level
          const finalXpCap = calculateXpCap(adjustedLevel);
          setXpToNextLevel(finalXpCap);
          
          // Check if there's an active cooldown
          if (cooldownEnd) {
            const cooldownEndTimestamp = new Date(cooldownEnd).getTime();
            const now = Date.now();
            
            if (cooldownEndTimestamp > now) {
              setCooldownEndTime(cooldownEndTimestamp);
            }
          }
        } else {
          console.error('Invalid data format from stats API:', response.data);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, [user]); // Re-run when user changes

  const handleStep = async () => {
    // Don't allow steps if on cooldown
    if (cooldown > 0) {
      return;
    }
    
    // Track total steps for achievements
    const totalSteps = localStorage.getItem(`steps_${user.id}`) ? 
      parseInt(localStorage.getItem(`steps_${user.id}`)) : 0;
    
    // Calculate current level XP cap
    const currentXpCap = calculateXpCap(level);
    
    // XP gain: 1% to 4.5% of the level cap with random decimals, 35% chance to not get any XP
    const xpChance = Math.random();
    let randomXp = 0;
    
    if (xpChance > 0.35) { // 65% chance to get XP (100% - 35%)
      // Random percentage between 1% and 4.5%
      const randomPercentage = (Math.random() * 3.5 + 1) / 100;
      randomXp = Math.floor(currentXpCap * randomPercentage);
    }
    
    // Gold gain: 0-50 random, 20% chance to not get any gold
    const goldChance = Math.random();
    let randomGold = 0;
    
    if (goldChance > 0.2) { // 80% chance to get gold (100% - 20%)
      randomGold = Math.floor(Math.random() * 51); // 0-50 inclusive
    }
    
    const randomCooldownSeconds = Math.floor(Math.random() * 8) + 1;
    const cooldownEndTimestamp = Date.now() + (randomCooldownSeconds * 1000);
    
    setCooldownEndTime(cooldownEndTimestamp);
    setCooldown(randomCooldownSeconds);

    // Update XP and calculate if level up
    let newXp = xp + randomXp;
    let newLevel = level;
    let levelUpMessage = '';
    
    // Check if player should level up
    if (newXp >= currentXpCap) {
      newLevel = level + 1;
      levelUpMessage = `Congratulations! You've reached level ${newLevel}!`;
      
      // Reset XP to 0 on level up
      newXp = 0;
      
      // Calculate new XP cap
      const newXpCap = calculateXpCap(newLevel);
      setXpToNextLevel(newXpCap);
      
      toast.info(levelUpMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    
    setXp(newXp);
    setGold(prev => prev + randomGold);
    setLevel(newLevel);
    
    // Get a random adventure story
    const foundRewards = randomXp > 0 || randomGold > 0;
    const newStory = getRandomStory(foundRewards);
    
    // Add level up message if relevant
    const storyWithLevelUp = levelUpMessage ? `${newStory} ${levelUpMessage}` : newStory;
    setStory(storyWithLevelUp);

    // Show notifications for XP and gold gains
    if (randomXp > 0) {
      toast.success(`Gained ${randomXp} XP!`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    
    if (randomGold > 0) {
      toast.success(`Found ${randomGold} Gold!`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }

    // Update backend with all stats including cooldown
    try {
      console.log(`LEVEL DEBUG - Current level: ${level}, New level: ${newLevel}`);
      console.log(`Updating stats for user ${user.id}: XP +${randomXp}, Gold +${randomGold}, Level ${newLevel}, Cooldown until ${new Date(cooldownEndTimestamp).toISOString()}`);
      
      const response = await axios.post(`${API_URL}/users/${user.id}/update-stats`, {
        xpDelta: randomXp,
        goldDelta: randomGold,
        level: newLevel,
        resetXp: newLevel > level, // Tell the backend to reset XP if we leveled up
        cooldownEnd: new Date(cooldownEndTimestamp).toISOString()
      });
      
      console.log('Stats updated successfully:', response.data);
      // Check if level was updated in response
      console.log(`LEVEL DEBUG - Level in response: ${response.data.level}, Expected: ${newLevel}`);
      
      // Increment total steps for achievements and store in localStorage
      const newTotalSteps = totalSteps + 1;
      localStorage.setItem(`steps_${user.id}`, newTotalSteps);
      
      // Check for achievements based on new stats and step count
      try {
        const achievementResponse = await axios.post(`${API_URL}/users/${user.id}/check-achievements`, {
          progressData: {
            totalSteps: newTotalSteps,
          }
        });
        
        // If achievements were unlocked, show notifications
        if (achievementResponse.data.newAchievements && achievementResponse.data.newAchievements.length > 0) {
          // Show achievement notifications
          achievementResponse.data.newAchievements.forEach(achievement => {
            toast.success(
              <div className="achievement-toast">
                <div className="achievement-toast-header">
                  <strong>Achievement Unlocked!</strong>
                </div>
                <div className="achievement-toast-body">
                  <p><b>{achievement.title}</b></p>
                  <p>{achievement.description}</p>
                  {(achievement.rewards.xp > 0 || achievement.rewards.gold > 0) && (
                    <div className="achievement-toast-rewards">
                      {achievement.rewards.xp > 0 && (
                        <span>+{achievement.rewards.xp} XP</span>
                      )}
                      {achievement.rewards.gold > 0 && (
                        <span>+{achievement.rewards.gold} Gold</span>
                      )}
                    </div>
                  )}
                </div>
              </div>,
              {
                position: "top-center",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                className: "achievement-notification-toast"
              }
            );
          });
          
          // Update stats if rewards were given
          if (achievementResponse.data.rewards.xp > 0 || achievementResponse.data.rewards.gold > 0) {
            setXp(prevXp => prevXp + achievementResponse.data.rewards.xp);
            setGold(prevGold => prevGold + achievementResponse.data.rewards.gold);
          }
        }
      } catch (error) {
        console.error('Error checking achievements:', error);
      }
    } catch (error) {
      console.error('Error updating stats:', error);
      toast.error('Failed to save your progress!');
    }
  };

  // Calculate progress percentage for XP bar
  const xpProgressPercentage = xpToNextLevel > 0 ? Math.min(100, (xp / xpToNextLevel) * 100) : 0;
  
  // Calculate cooldown fill percentage (100% when no cooldown, 0% at max cooldown)
  const cooldownPercentage = cooldownEndTime > 0 
    ? Math.max(0, 100 - ((cooldownEndTime - Date.now()) / (cooldown * 1000)) * 100) 
    : 100;

  return (
    <div className="adventure-container">
      <ToastContainer />
      <Sidebar profilePic="/dummy.jpg" />
      <div className="adventure-content">
        <Topbar 
          onMenuClick={() => console.log('Menu clicked')} 
          onSupportClick={() => console.log('Support clicked')} 
          onFriendsClick={() => console.log('Friends clicked')} 
          onSearch={(value) => console.log('Search:', value)} 
          onChatClick={() => console.log('Chat clicked')} 
          onNotificationClick={() => console.log('Notifications clicked')} 
          onEggClick={() => console.log('Egg clicked')} 
        />

        <div className="adventure-grid">
          <div className="adventure-grid-profile">
            <img src={avatarExample} alt="Profile" className="adventure-profile-pic" />
            <div className="adventure-stats">
              <p>Level: {level}</p>
              <p>Gold: {gold}</p>
            </div>
          </div>
          
          {/* XP bar moved outside adventure-stats and directly beneath adventure-grid-profile */}
          <div className="xp-bar-container">
            <div 
              className="xp-bar-fill" 
              style={{ width: `${xpProgressPercentage}%` }}
            ></div>
            <span className="xp-text">XP: {xp} / {xpToNextLevel}</span>
          </div>
          
          <div className="adventure-grid-actions">
            <div className="adventure-story">
              <p>{story}</p>
            </div>
            <button 
              className="adventure-step-button" 
              onClick={handleStep} 
              disabled={cooldown > 0}
            >
              <div 
                className="cooldown-fill" 
                style={{ width: `${cooldownPercentage}%` }}
              ></div>
              <span className="button-text">Take a Step</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Adventure;