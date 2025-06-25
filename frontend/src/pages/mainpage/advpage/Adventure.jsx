import React, { useState, useEffect } from 'react';
import './Adventure.css';
import Sidebar from '../../../components/Sidebar';
import Topbar from '../../../components/Topbar';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../../context/AuthContext';
import { useUserStats } from '../../../context/UserStatsContext';
import { API_URL } from '../../../utils/config';
import adventureStories from '../../../assets/adventure_stories';
import educationalStories from '../../../assets/educational_stories';
import avatarExample from '../../../assets/MAIN/avatar_exaple.gif';

function getDailyKeyDate() {
  const now = new Date();
  if (now.getHours() < 7) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().slice(0,10).replace(/-/g,'');
}
const Adventure = () => {
  // Use the UserStatsContext for instant access to user stats
  const { 
    level, 
    xp, 
    gold, 
    diamonds, 
    xpToNextLevel,
    cooldownEnd: contextCooldownEnd,
    isLoading: statsLoading,
    updateStats,
    calculateXpCap,
    checkAndProcessLevelUp
  } = useUserStats();

  const [story, setStory] = useState('Your adventure begins...');
  const [cooldown, setCooldown] = useState(0);
  const [cooldownEndTime, setCooldownEndTime] = useState(contextCooldownEnd || 0);
  
  // Educational story states
  const [currentEduStory, setCurrentEduStory] = useState(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [inEduStoryMode, setInEduStoryMode] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  
  const { user } = useAuth(); // Get user from auth context

  // We're now using calculateXpCap from UserStatsContext

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

  // Update cooldown effect from context
  useEffect(() => {
    if (contextCooldownEnd) {
      setCooldownEndTime(contextCooldownEnd);
    }
  }, [contextCooldownEnd]);

  // Start a new educational story sequence
  const startNewEduStory = () => {
    // Pick a random educational story
    const randomIndex = Math.floor(Math.random() * educationalStories.length);
    const story = educationalStories[randomIndex];
    
    setCurrentEduStory(story);
    setCurrentSentenceIndex(0);
    setShowQuestion(false);
    setInEduStoryMode(true);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    
    // Display first sentence with EVENT STORIES header
    setStory(`EVENT STORIES\n${story.sentences[0]}`);
  };
  
  // Handle answer selection for educational stories
  const handleAnswerSelection = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };
  
  // Submit the answer and check if correct
  const submitAnswer = async () => {
    if (selectedAnswer === null) return;
    
    setAnswerSubmitted(true);
    
    // Check if answer is correct
    const isCorrect = selectedAnswer === currentEduStory.correctAnswer;
    
    if (isCorrect) {
      // Award 2 diamonds for correct answer
      const diamondReward = 2;
      
      // Use context to update diamonds
      updateStats({
        diamondsDelta: diamondReward
      });
      
      toast.success(`Correct! You earned ${diamondReward} diamonds!`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else {
      toast.error("Sorry, that's not correct. Keep learning!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    
    // Reset edu story mode after displaying result
    setTimeout(() => {
      setInEduStoryMode(false);
      setCurrentEduStory(null);
      setStory("Continue your adventure...");
    }, 3000);
  };

  const handleStep = async () => {
    // Don't allow steps if on cooldown
    if (cooldown > 0) {
      return;
    }

    const userId = localStorage.getItem('userId');
    const dailyKey = `steps_${userId}_${getDailyKeyDate()}`;
    const steps = parseInt(localStorage.getItem(dailyKey) || '0') + 1;
    localStorage.setItem(dailyKey, steps);
    
    console.log('Steps after step:', steps);

    // Jika sudah 5 langkah, mark quest completed
    const questId = 2;
    if (steps === 5) {
      try {
        const res = await axios.post(`${API_URL}/user/${userId}/quest/${questId}/complete`);
        console.log('Complete quest response:', res.data);
        toast.success("Quest 'Take 5 Steps' completed!");
      } catch (err) {
        console.error('Error completing quest:', err.response?.data || err.message);
        toast.error('Failed to complete quest!');
      }
    }

    // uji coba 
    if (steps === 10) {
      try {
        const res = await axios.post(`${API_URL}/user/${userId}/quest/3/complete`);
        console.log('Complete quest response:', res.data);
        toast.success("Dummy Quest completed!");
      } catch (err) {
        console.error('Error completing quest:', err.response?.data || err.message);
        toast.error('Failed to complete quest!');
      }
    }

    if (steps === 10) {
      try {
        const res = await axios.post(`${API_URL}/user/${userId}/quest/4/complete`);
        console.log('Complete quest response:', res.data);
        toast.success("Dummy Quest completed!");
      } catch (err) {
        console.error('Error completing quest:', err.response?.data || err.message);
        toast.error('Failed to complete quest!');
      }
    }


    if (steps === 10) {
      try {
        const res = await axios.post(`${API_URL}/user/${userId}/quest/5/complete`);
        console.log('Complete quest response:', res.data);
        toast.success("Dummy Quest completed!");
      } catch (err) {
        console.error('Error completing quest:', err.response?.data || err.message);
        toast.error('Failed to complete quest!');
      }
    }

    
    // Track total steps for achievements
    const totalSteps = localStorage.getItem(`steps_${user.id}`) ? 
      parseInt(localStorage.getItem(`steps_${user.id}`)) : 0;
    
    // Apply cooldown first to prevent spamming
    const randomCooldownSeconds = Math.floor(Math.random() * 5) + 3; // 3-7 seconds cooldown
    const cooldownEndTimestamp = Date.now() + (randomCooldownSeconds * 1000);
    setCooldownEndTime(cooldownEndTimestamp);
    setCooldown(randomCooldownSeconds);
    
    // If we're in an educational story mode
    if (inEduStoryMode) {
      // If showing a question, don't progress until answer is submitted
      if (showQuestion) {
        if (!answerSubmitted) {
          toast.info("Please select an answer", {
            position: "top-center",
            autoClose: 1500,
          });
        }
        return;
      }
      
      // Move to next sentence in the story
      const nextIndex = currentSentenceIndex + 1;
      
      // If we've reached the end of the sentences, show the question
      if (nextIndex >= currentEduStory.sentences.length) {
        setShowQuestion(true);
        setStory(`EVENT STORIES\n${currentEduStory.question}`);
        return;
      }
      
      // Show the next sentence
      setCurrentSentenceIndex(nextIndex);
      setStory(`EVENT STORIES\n${currentEduStory.sentences[nextIndex]}`);
      return;
    }
    
    // Determine if this step triggers an educational story (40% chance)
    const triggerEduStory = Math.random() < 0.05;
    
    if (triggerEduStory) {
      startNewEduStory();
      
      // Early return - don't process normal rewards
      // Cooldown is already applied at the beginning of handleStep
      return;
    }
    
    // Regular adventure - Calculate current level XP cap
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
    
    // Cooldown is already applied at the beginning of handleStep

    // Use the context's updateStats method for local and backend updates
    const updates = {
      xpDelta: randomXp,
      goldDelta: randomGold,
      cooldownEnd: new Date(cooldownEndTimestamp).toISOString()
    };
    
    // Update stats in context (updates local state and sends to backend)
    updateStats(updates);
    
    // Check if player should level up
    const { didLevelUp, newLevel: leveledUpTo } = checkAndProcessLevelUp();
    let levelUpMessage = '';
    
    if (didLevelUp) {
      levelUpMessage = `Congratulations! You've reached level ${leveledUpTo}!`;
      
      toast.info(levelUpMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    
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

    // We don't need to update the backend here - the context handles that for us!
    try {
      // Validate the user ID before proceeding with achievements
      if (!user || !user.id) {
        console.error('Invalid user ID:', user?.id);
        toast.error('Authentication error: Invalid user ID. Try logging in again.');
        return;
      }
      
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
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      // More detailed error logging
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response error status:', error.response.status);
        console.error('Response error headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request was made but no response received');
        console.error(error.request);
      }
      
      // User-facing error message
      let errorMessage = 'Failed to save your progress!';
      
      if (error.response?.data?.message) {
        errorMessage = `Failed to save your progress: ${error.response.data.message}`;
      } else if (error.message && error.message.includes('Network Error')) {
        errorMessage = 'Network error: Could not reach the server. Check your internet connection.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast.error(errorMessage);
      
      // Set a flag in localStorage so we know an error occurred
      localStorage.setItem('adventure_error_occurred', 'true');
      localStorage.setItem('adventure_error_message', errorMessage);
      
      // Continue the game locally despite the error
      console.log('Continuing with local state despite server error');
    }
  };

  // Calculate progress percentage for XP bar
  const xpProgressPercentage = xpToNextLevel > 0 ? Math.min(100, (xp / xpToNextLevel) * 100) : 0;
  
  // Calculate cooldown fill percentage (100% when no cooldown, 0% at max cooldown)
  const cooldownPercentage = cooldownEndTime > 0 
    ? Math.max(0, 100 - ((cooldownEndTime - Date.now()) / (cooldown * 500)) * 100) 
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
        
        {statsLoading ? (
          <div className="adventure-loading">
            <div className="loading-spinner"></div>
            <p>Loading your adventure...</p>
          </div>
        ) : (
          <div className="adventure-grid">
          <div className="adventure-grid-profile">
            <img src={avatarExample} alt="Profile" className="adventure-profile-pic" />
            <div className="adventure-stats">
              <p>Level: {level}</p>
              <p>Gold: {gold}</p>
              <p>Diamonds: {diamonds}</p>
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
              
              {/* Educational Story Question UI */}
              {showQuestion && currentEduStory && (
                <div className="edu-question-container">
                  {currentEduStory.choices.map((choice, index) => (
                    <div 
                      key={index} 
                      className={`edu-answer-choice ${selectedAnswer === index ? 'selected' : ''} ${answerSubmitted && index === currentEduStory.correctAnswer ? 'correct' : ''} ${answerSubmitted && selectedAnswer === index && selectedAnswer !== currentEduStory.correctAnswer ? 'incorrect' : ''}`}
                      onClick={() => !answerSubmitted && handleAnswerSelection(index)}
                    >
                      <span className="choice-letter">{String.fromCharCode(65 + index)}</span>
                      <span className="choice-text">{choice}</span>
                    </div>
                  ))}
                  
                  {selectedAnswer !== null && !answerSubmitted && (
                    <button 
                      className="submit-answer-button"
                      onClick={submitAnswer}
                    >
                      Submit Answer
                    </button>
                  )}
                </div>
              )}
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
              <span className="button-text">{showQuestion ? 'Submit' : 'Take a Step'}</span>
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Adventure;