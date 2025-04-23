import React from 'react'
import './MainHome.css'
import { FaEgg, FaChartBar, FaGem, FaDungeon, FaCheck } from 'react-icons/fa'
import Topbar from '../../components/Topbar'
import Sidebar from '../../components/Sidebar'

import peopleIcon from '../../assets/MAIN/people.png';
import checkmarkIcon from '../../assets/MAIN/checkmark.png';
import diamondsIcon from '../../assets/MAIN/diamonds2.png';
import pawIcon from '../../assets/MAIN/pets.png';
import logo from '../../assets/MAIN/logo.png';
import avatarExample from '../../assets/MAIN/avatar_exaple.gif';

const MainHome = () => {
  const handleMenuClick = () => {
    console.log('Menu clicked');
  };

  const handleSupportClick = () => {
    console.log('Support clicked');
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
          <div className="dungeon-card">
            <div className="dungeon-content">
              <img src={avatarExample} alt="Avatar" className="dungeon-avatar" />
              <h2 className="dungeon-title">Your Journey Begins Here</h2>
              <p className="dungeon-description">With just a press of a button, <br /> you can embark on an adventure of a lifetime.</p>
              <button className="start-dungeon">Start Adventure</button>
            </div>
          </div>
          
          <div className="pet-card">
            <div className="pet-header">
              <div className="pet-header-group">
                <div className="rarity-tag">LEGENDARY</div>
                <img src={pawIcon} alt="Paw" className="paw-icon" />
              </div>
              <h3>CURRENT PET</h3>
              <div className="pet-header-group">
                <img src={pawIcon} alt="Paw" className="paw-icon" />
                <div className="rarity-tag">LEGENDARY</div>
              </div>
            </div>

            <div className="pet-content">
              <div className="pet-left">
                <div className="pet-image-container">
                  <img src={logo} alt="Pet" className="pet-image" />
                  <div className="pet-level">Level 99999</div>
                </div>
                <div className="pet-info">
                  <h4 className="pet-name">Developer's Shadow Eater</h4>
                  <span className="pet-class">Hidden Class</span>
                </div>
              </div>

              <div className="pet-stats">
                <div className="stat-row">
                  <div className="pet-stat">
                    <div className="stat-label">
                      <span className="stat-icon happiness"></span>
                      Happiness
                    </div>
                    <div className="stat-bar">
                      <div className="stat-fill happiness" style={{ width: '85%' }}></div>
                    </div>
                    <span className="stat-value">85%</span>
                  </div>
                </div>

                <div className="stat-row">
                  <div className="pet-stat">
                    <div className="stat-label">
                      <span className="stat-icon energy"></span>
                      Energy
                    </div>
                    <div className="stat-bar">
                      <div className="stat-fill energy" style={{ width: '70%' }}></div>
                    </div>
                    <span className="stat-value">70%</span>
                  </div>
                </div>

                <div className="stat-row">
                  <div className="pet-stat">
                    <div className="stat-label">
                      <span className="stat-icon hunger"></span>
                      Hunger
                    </div>
                    <div className="stat-bar">
                      <div className="stat-fill hunger" style={{ width: '95%' }}></div>
                    </div>
                    <span className="stat-value">95%</span>
                  </div>
                </div>

                <div className="combat-stats">
                  <div className="combat-stat">
                    <span className="combat-icon health"></span>
                    <span className="combat-value">2,147,483,647</span>
                    <span className="combat-label">HP</span>
                  </div>
                  <div className="combat-stat">
                    <span className="combat-icon attack"></span>
                    <span className="combat-value">32,767</span>
                    <span className="combat-label">ATK</span>
                  </div>
                  <div className="combat-stat">
                    <span className="combat-icon defense"></span>
                    <span className="combat-value">24,576</span>
                    <span className="combat-label">DEF</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="view-collection">View Collection</button>
          </div>

          <div className="notifications-container">
            <div className="notifications-card">
              <h3>Notifications</h3>
              {/* Add notifications content here */}
            </div>
          </div>
        </div>

        <div className="bottom-squares">
          <div className="daily-card">
            <div className="daily-header">
              <h2>Daily Reward</h2>
              <p>Come here everyday to claim your daily reward</p>
            </div>
            
            <div className="rewards-container">
              <div className="reward-preview">
                <div className="reward-item current">
                  <div className="reward-icon">
                    <FaGem style={{ color: '#0275D8' }} />
                  </div>
                  <span className="day-label">Day 1</span>
                  <span className="reward-value">500 Coins</span>
                </div>
              </div>

              <div className="reward-stats">
                <div className="reward-stat">
                  <span className="stat-label">Total Claimed</span>
                  <span className="stat-value">32,767</span>
                </div>
                <div className="reward-stat">
                  <span className="stat-label">Current Streak</span>
                  <span className="stat-value">4 Days</span>
                </div>
              </div>
            </div>

            <button className="claim-reward">Claim Reward</button>
          </div>

          <div className="stats-card">
            <div className="stats-top">
              <div className="stat-item">
                <img src={peopleIcon} alt="Players" className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">32,767</span>
                  <span className="stat-label">Playing</span>
                </div>
                <button className="stat-link">View Players</button>
              </div>

              <div className="stats-divider"></div>

              <div className="stat-item">
                <img src={checkmarkIcon} alt="Tasks" className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">127</span>
                  <span className="stat-label">Task Completed</span>
                </div>
                <button className="stat-link">View Tasks</button>
              </div>
            </div>

            <div className="stats-bottom">
              <div className="diamond-stat">
                <img src={diamondsIcon} alt="Diamonds" className="stat-icon diamond-icon" />
                <div className="stat-info">
                  <span className="stat-value">2,147,483,647</span>
                  <span className="stat-label">Diamonds Remaining</span>
                </div>
                <button className="stat-link">Spend Diamonds</button>
              </div>
            </div>
          </div>

          <div className="sale-card">
            <div className="sale-header">
              <div className="diamond-icons">
                <img src={diamondsIcon} alt="Diamonds" className="diamond-icon left" />
                <h3><b>DIAMOND STORE SALE !!!</b></h3>
                <img src={diamondsIcon} alt="Diamonds" className="diamond-icon right" />
              </div>
              <div className="sale-info">
                <p>Get 20% off all diamond purchases on the Web App.</p>
                <p>Get 700 diamonds for the price of 600 on the Mobile App, as well as 300 diamonds for the price of 270.</p>
                <p className="bonus-text">Selected rewards and upgrades have sales on top of sales!</p>
              </div>
            </div>
            <div className="sale-buttons">
              <button className="sale-button primary">Buy Diamonds</button>
              <button className="sale-button secondary">View Upgrades</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainHome 