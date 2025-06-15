import React, { useState, useEffect } from 'react';
import './MainAchievement.css';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/config';

// Category names mapping for display
const categoryNames = {
  'adventure': 'Adventure',
  'level': 'Character Level',
  'wealth': 'Wealth',
  'collection': 'Pixmon Collection'
};

const MainAchievement = () => {
  const [achievements, setAchievements] = useState([]);
  const [groupedAchievements, setGroupedAchievements] = useState({});
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [activeCategory, setActiveCategory] = useState('all');
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (user && user.id) {
      loadUserAchievements();
    } else {
      if (!window.location.pathname.includes('/login')) {
        toast.error('You must be logged in to view achievements');
      }
    }
  }, [user, authLoading]);

  const loadUserAchievements = async () => {
    try {
      console.log(`Fetching achievements from: ${API_URL}/users/${user.id}/achievements`);
      
      // Add a timeout to the request to prevent hanging if the server doesn't respond
      const response = await axios.get(`${API_URL}/users/${user.id}/achievements`, {
        timeout: 10000, // 10-second timeout
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if using token-based authentication
          // 'Authorization': `Bearer ${user.token}` 
        }
      });
      
      console.log('Achievement data received:', response.data);
      
      // Check if the response contains the expected data structure
      if (!response.data || !response.data.achievements) {
        throw new Error('Invalid response format from server');
      }
      
      // Update state with the received data
      setAchievements(response.data.achievements);
      setGroupedAchievements(response.data.groupedAchievements || {});
      setStats(response.data.stats || { completed: 0, total: 0 });
      
      console.log('Achievements loaded successfully');
      
    } catch (error) {
      // Handle specific error types differently
      if (error.response) {
        // The request was made and the server responded with a status code outside the range of 2xx
        console.error('Server error response:', error.response.status, error.response.data);
        toast.error(`Failed to load achievements: ${error.response.status} - ${error.response.data.message || 'Server error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        toast.error('Server not responding. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        toast.error(`Failed to load achievements: ${error.message}`);
      }
    }
  };

  // Filter achievements based on selected category
  const filteredAchievements = activeCategory === 'all' 
    ? achievements 
    : achievements.filter(achievement => achievement.category === activeCategory);

  // Calculate completion percentage
  const completionPercentage = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <div className="mainachievement-container">
      <ToastContainer />
      <Sidebar profilePic="/dummy.jpg" />
      <div className="mainachievement-content">
        <Topbar 
          onMenuClick={() => console.log('Menu clicked')} 
          onSupportClick={() => console.log('Support clicked')} 
          onFriendsClick={() => console.log('Friends clicked')} 
          onSearch={(value) => console.log('Search:', value)} 
          onChatClick={() => console.log('Chat clicked')} 
          onNotificationClick={() => console.log('Notifications clicked')} 
          onEggClick={() => console.log('Egg clicked')} 
        />

        <div className="mainachievement-header">
          <h1>Achievements</h1>
          <div className="mainachievement-summary">
            <div className="mainachievement-progress-container">
              <div 
                className="mainachievement-progress-bar" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
              <span className="mainachievement-progress-text">
                {stats.completed} / {stats.total} ({completionPercentage}%)
              </span>
            </div>
          </div>
        </div>

        <div className="mainachievement-categories">
          <button 
            className={`mainachievement-category-button ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {Object.keys(categoryNames).map(category => (
            <button 
              key={category}
              className={`mainachievement-category-button ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {categoryNames[category]}
            </button>
          ))}
        </div>

        <div className="mainachievement-grid">
            {activeCategory === 'all' ? (
              // Show achievements grouped by category
              Object.keys(groupedAchievements).map(category => (
                <div key={category} className="mainachievement-category-section">
                  <h2>{categoryNames[category] || category}</h2>
                  <div className="mainachievement-items">
                    {groupedAchievements[category].map(achievement => (
                      <div 
                        key={achievement.id} 
                        className={`mainachievement-item ${achievement.completed ? 'completed' : 'locked'}`}
                      >
                        <div className={`mainachievement-icon ${achievement.completed ? 'completed' : 'locked'} ${newlyUnlocked.includes(achievement.id) ? 'pulse' : ''}`}>
                          <img 
                            src={`/achievements/${achievement.icon_name}.png`} 
                            alt={achievement.title}
                            onError={(e) => {
                              e.target.src = '/achievements/default_achievement.png';
                            }}
                          />
                          {!achievement.completed && <div className="mainachievement-lock-overlay"></div>}
                        </div>
                        <div className="mainachievement-details">
                          <h3>{achievement.title}</h3>
                          <p>{achievement.description}</p>
                          <div className="mainachievement-rewards">
                            {achievement.xp_reward > 0 && (
                              <span className="mainachievement-xp-reward">+{achievement.xp_reward} XP</span>
                            )}
                            {achievement.gold_reward > 0 && (
                              <span className="mainachievement-gold-reward">+{achievement.gold_reward} Gold</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Show only selected category
              <div className="mainachievement-category-section">
                <div className="mainachievement-items">
                  {filteredAchievements.map(achievement => (
                    <div 
                      key={achievement.id} 
                      className={`mainachievement-item ${achievement.completed ? 'completed' : 'locked'}`}
                    >
                      <div className={`mainachievement-icon ${achievement.completed ? 'completed' : 'locked'} ${newlyUnlocked.includes(achievement.id) ? 'pulse' : ''}`}>
                        <img 
                          src={`/achievements/${achievement.icon_name}.png`} 
                          alt={achievement.title}
                          onError={(e) => {
                            e.target.src = '/achievements/default_achievement.png';
                          }}
                        />
                        {!achievement.completed && <div className="mainachievement-lock-overlay"></div>}
                      </div>
                      <div className="mainachievement-details">
                        <h3>{achievement.title}</h3>
                        <p>{achievement.description}</p>
                        <div className="mainachievement-rewards">
                          {achievement.xp_reward > 0 && (
                            <span className="mainachievement-xp-reward">+{achievement.xp_reward} XP</span>
                          )}
                          {achievement.gold_reward > 0 && (
                            <span className="mainachievement-gold-reward">+{achievement.gold_reward} Gold</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        
        {/* Animated achievement unlock notification that appears when an achievement is unlocked */}
        <div className="mainachievement-notification" style={{ display: 'none' }}>
          <div className="mainachievement-notification-icon">
            <img src="/achievements/default_achievement.png" alt="Achievement" />
          </div>
          <div className="mainachievement-notification-content">
            <h3>Achievement Unlocked!</h3>
            <p className="mainachievement-notification-title">Achievement Title</p>
            <div className="mainachievement-notification-rewards">
              <span className="mainachievement-xp-reward">+100 XP</span>
              <span className="mainachievement-gold-reward">+50 Gold</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainAchievement;