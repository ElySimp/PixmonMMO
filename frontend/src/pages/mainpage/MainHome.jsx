import React, { useState, useEffect } from 'react'
import './MainHome.css'
import { FaEgg, FaChartBar, FaGem, FaDungeon, FaCheck } from 'react-icons/fa'
import Topbar from '../../components/Topbar'
import Sidebar from '../../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import { getUserDailyRewards } from '../../services/dailyRewardsService'
import { API_URL } from '../../utils/config'

import peopleIcon from '../../assets/MAIN/people.png';
import checkmarkIcon from '../../assets/MAIN/checkmark.png';
import diamondsIcon from '../../assets/MAIN/diamonds2.png';
import pawIcon from '../../assets/MAIN/pets.png';
import logo from '../../assets/MAIN/logo.png';
import avatarExample from '../../assets/MAIN/avatar_exaple.gif';

import healthIcon from '../../assets/MAIN/health.png';
import attackIcon from '../../assets/MAIN/battle.png';
import defenseIcon from '../../assets/MAIN/defence.png';
import agilityIcon from '../../assets/MAIN/agility.png';

const MainHome = () => {
  const navigate = useNavigate();
  
  // State for daily rewards and user stats
  const [dailyRewards, setDailyRewards] = useState(null);
  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    gold: 0,
    diamonds: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.error('No user ID found');
          setLoading(false);
          return;
        }        // Fetch daily rewards data
        try {
          const dailyRewardsResponse = await getUserDailyRewards(userId);
          console.log('Daily rewards response:', dailyRewardsResponse);
          
          // Extract data from the API response structure
          const dailyRewardsData = dailyRewardsResponse.success ? dailyRewardsResponse.data : dailyRewardsResponse;
          console.log('Daily rewards data:', dailyRewardsData);
          setDailyRewards(dailyRewardsData);
        } catch (error) {
          console.error('Error fetching daily rewards:', error);          // Set default values if API fails
          setDailyRewards({
            current_day: 1,
            streak_count: 0,
            total_claimed: 0,
            canClaimToday: false
          });
        }

        // Fetch user stats
        try {
          const response = await fetch(`${API_URL}/api/users/${userId}/stats`);
          const statsData = await response.json();
          setUserStats(statsData.data || statsData);
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleMenuClick = () => {
    console.log('Menu clicked');
  };
  const handleSupportClick = () => {
    console.log('Support clicked');
    navigate('/support');
  };

  const handleFriendsClick = () => {
    console.log('Friends clicked');
  };

  const handleSearch = (value) => {
    console.log('Search:', value);
  };

  const handleChatClick = () => {
    console.log('Chat clicked');
  };

  const handleNotificationClick = () => {
    console.log('Notifications clicked');
  };

  const handleEggClick = () => {
    console.log('Egg clicked');
  };
  const handleStartAdventure = () => {
    navigate('/adventure');
  };
  const handleDailyRewards = () => {
    console.log('Daily Rewards clicked');
    navigate('/daily');
  };
  return (
    <div className="main-container">
      <Sidebar 
        profilePic="/dummy.jpg"
      />
      
      <div className="main-content">
        <Topbar 
          onMenuClick={handleMenuClick}
          onSupportClick={handleSupportClick}
          onFriendsClick={handleFriendsClick}
          onSearch={handleSearch}
          onChatClick={handleChatClick}
          onNotificationClick={handleNotificationClick}
          onEggClick={handleEggClick}
        />

        <div className="top-squares">
          <div className="mainhome-dungeon-card">
            <div className="mainhome-dungeon-content">
              <img src={avatarExample} alt="Avatar" className="mainhome-dungeon-avatar" />
              <h2 className="mainhome-dungeon-title">Your Journey Begins Here</h2>
              <p className="mainhome-dungeon-description">With just a press of a button, <br /> you can embark on an adventure of a lifetime.</p>
              <button className="mainhome-start-dungeon" onClick={handleStartAdventure}>Start Adventure</button>
            </div>
          </div>

          <div className="mainhome-pet-card">
            <div className="mainhome-pet-header">
              <div className="mainhome-pet-header-group">
                <div className="mainhome-rarity-tag">LEGENDARY</div>
                <img src={pawIcon} alt="Paw" className="mainhome-paw-icon" />
              </div>
              <h3>CURRENT PET</h3>
              <div className="mainhome-pet-header-group">
                <img src={pawIcon} alt="Paw" className="mainhome-paw-icon" />
                <div className="mainhome-rarity-tag">LEGENDARY</div>
              </div>
            </div>

            <div className="mainhome-pet-content">
              <div className="mainhome-pet-left">
                <div className="mainhome-pet-image-container">
                  <img src={logo} alt="Pet" className="mainhome-pet-image" />
                  <div className="mainhome-pet-level">Level 99999</div>
                </div>
                <div className="mainhome-pet-info">
                  <h4 className="mainhome-pet-name">Developer's Shadow Eater</h4>
                  <span className="mainhome-pet-class">Hidden Class</span>
                </div>
              </div>

              <div className="mainhome-pet-stats">
                <div className="mainhome-stat-row">
                  <div className="mainhome-pet-stat">
                    <div className="mainhome-pet-stat-label">
                      <span className="mainhome-pet-stat-icon happiness"></span>
                      Happiness
                    </div>
                    <div className="mainhome-pet-stat-bar">
                      <div className="mainhome-pet-stat-fill happiness" style={{ width: '85%' }}></div>
                    </div>
                    <span className="mainhome-pet-stat-value">85%</span>
                  </div>
                </div>

                <div className="mainhome-stat-row">
                  <div className="mainhome-pet-stat">
                    <div className="mainhome-pet-stat-label">
                      <span className="mainhome-pet-stat-icon energy"></span>
                      Energy
                    </div>
                    <div className="mainhome-pet-stat-bar">
                      <div className="mainhome-pet-stat-fill energy" style={{ width: '70%' }}></div>
                    </div>
                    <span className="mainhome-pet-stat-value">70%</span>
                  </div>
                </div>

                <div className="mainhome-stat-row">
                  <div className="mainhome-pet-stat">
                    <div className="mainhome-pet-stat-label">
                      <span className="mainhome-pet-stat-icon hunger"></span>
                      Hunger
                    </div>
                    <div className="mainhome-pet-stat-bar">
                      <div className="mainhome-pet-stat-fill hunger" style={{ width: '95%' }}></div>
                    </div>
                    <span className="mainhome-pet-stat-value">95%</span>
                  </div>
                </div>

                <div className="mainhome-combat-stats">
                  <div className="mainhome-combat-stat">
                    <img src={healthIcon} alt="Health" className="mainhome-combat-icon" />
                    <div className="mainhome-combat-stat-info">
                      <span className="mainhome-combat-label">Health</span>
                      <span className="mainhome-combat-value">2,500</span>
                    </div>
                  </div>

                  <div className="mainhome-combat-stat">
                    <img src={attackIcon} alt="Attack" className="mainhome-combat-icon" />
                    <div className="mainhome-combat-stat-info">
                      <span className="mainhome-combat-label">Attack</span>
                      <span className="mainhome-combat-value">350</span>
                    </div>
                  </div>

                  <div className="mainhome-combat-stat">
                    <img src={defenseIcon} alt="Defense" className="mainhome-combat-icon" />
                    <div className="mainhome-combat-stat-info">
                      <span className="mainhome-combat-label">Defense</span>
                      <span className="mainhome-combat-value">275</span>
                    </div>
                  </div>

                  <div className="mainhome-combat-stat">
                    <img src={agilityIcon} alt="Agility" className="mainhome-combat-icon" />
                    <div className="mainhome-combat-stat-info">
                      <span className="mainhome-combat-label">Agility</span>
                      <span className="mainhome-combat-value">180</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button className="mainhome-view-collection">View Collection</button>
          </div>

          <div className="mainhome-notifications-container">
            <div className="mainhome-notifications-card">
              <h3>Notifications</h3>
              {/* Add notifications content here */}
            </div>
          </div>
        </div>

        <div className="mainhome-bottom-squares">
          <div className="mainhome-daily-card">
            <div className="mainhome-daily-header">
              <h2>Daily Reward</h2>
              <p>Come here everyday to claim your daily reward</p>
            </div>
            
            <div className="mainhome-rewards-container">              <div className="mainhome-reward-preview">
                <div className="mainhome-reward-item current">
                  <div className="mainhome-reward-icon">
                    <FaGem style={{ color: '#4a90e2' }} />
                  </div>
                  <span className="mainhome-day-label">
                    Day {loading ? '...' : (dailyRewards?.current_day || 1)}
                  </span>
                  <span className="mainhome-reward-value">500 Coins</span>
                </div>
              </div><div className="mainhome-reward-stats">
                <div className="mainhome-reward-stat">
                  <span className="mainhome-stat-label">Total Claimed</span>
                  <span className="mainhome-stat-value">
                    {loading ? '...' : (dailyRewards?.total_claimed || 0)}
                  </span>
                </div>                <div className="mainhome-reward-stat">
                  <span className="mainhome-stat-label">Current Streak</span>
                  <span className="mainhome-stat-value">
                    {loading ? '...' : `${dailyRewards?.streak_count || 0} Days`}
                  </span>
                </div>
              </div>
            </div>

            <button className="mainhome-claim-reward" onClick={handleDailyRewards}>
              {dailyRewards?.canClaimToday ? 'Claim Reward' : 'View Rewards'}
            </button>
          </div>
          
          <div className="mainhome-statistics-card">            <div className="mainhome-statistics-top">
              <div className="mainhome-statistics-item">
                <img src={peopleIcon} alt="Players" className="mainhome-statistics-icon" />
                <div className="mainhome-statistics-info">
                  <span className="mainhome-statistics-value">1,247</span>
                  <span className="mainhome-statistics-label">Playing</span>
                </div>
                <button className="mainhome-statistics-link">View Players</button>
              </div>

              <div className="mainhome-statistics-divider"></div>

              <div className="mainhome-statistics-item">
                <img src={checkmarkIcon} alt="Tasks" className="mainhome-statistics-icon" />
                <div className="mainhome-statistics-info">
                  <span className="mainhome-statistics-value">
                    {loading ? '...' : (dailyRewards?.total_claimed || 0)}
                  </span>
                  <span className="mainhome-statistics-label">Rewards Claimed</span>
                </div>
                <button className="mainhome-statistics-link">View Tasks</button>
              </div>
            </div>            <div className="mainhome-statistics-bottom">
              <div className="mainhome-statistics-item">
                <img src={diamondsIcon} alt="Diamonds" className="mainhome-statistics-icon mainhome-diamond-icon" />
                <div className="mainhome-statistics-info">
                  <span className="mainhome-statistics-value">
                    {loading ? '...' : (userStats?.diamonds || 0).toLocaleString()}
                  </span>
                  <span className="mainhome-statistics-label">Diamonds Available</span>
                </div>
                <button className="mainhome-statistics-link">Spend Diamonds</button>
              </div>
            </div>
          </div>
          
          <div className="mainhome-sale-card">
            <div className="mainhome-sale-header">
              <div className="mainhome-diamond-icons">
                <img src={diamondsIcon} alt="Diamonds" className="mainhome-diamond-icon mainhome-left" />
                <h3><b>DIAMOND STORE SALE !!!</b></h3>
                <img src={diamondsIcon} alt="Diamonds" className="mainhome-diamond-icon mainhome-right" />
              </div>
              <div className="mainhome-sale-info">
                <p>Get 20% off all diamond purchases on the Web App.</p>
                <p>Get 700 diamonds for the price of 600 on the Mobile App, as well as 300 diamonds for the price of 270.</p>
                <p className="mainhome-bonus-text">Selected rewards and upgrades have sales on top of sales!</p>
              </div>
            </div>
            <div className="mainhome-sale-buttons">
              <button className="mainhome-sale-button mainhome-primary">Buy Diamonds</button>
              <button className="mainhome-sale-button mainhome-secondary">View Upgrades</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainHome