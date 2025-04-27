import React, { useState } from 'react';
import './MiscProfile.css'; 
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';

const MiscProfile = () => {
  // Handler functions
  const handleMenuClick = () => console.log('Menu clicked');
  const handleSupportClick = () => console.log('Support clicked');
  const handleFriendsClick = () => console.log('Friends clicked');
  const handleSearch = (value) => console.log('Search:', value);
  const handleChatClick = () => console.log('Chat clicked');
  const handleNotificationClick = () => console.log('Notifications clicked');
  const handleEggClick = () => console.log('Egg clicked');
  
  // For wallpaper upload demo
  const [wallpaper, setWallpaper] = useState(null);
  
  const handleWallpaperChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setWallpaper(imageUrl);
    }
  };

  return (
    <div className="main-container">
      <Sidebar />
      
      <div className="main-content profile-main-content">
        <Topbar
          onMenuClick={handleMenuClick}
          onSupportClick={handleSupportClick}
          onFriendsClick={handleFriendsClick}
          onSearch={handleSearch}
          onChatClick={handleChatClick}
          onNotificationClick={handleNotificationClick}
          onEggClick={handleEggClick}
        />

        <div className="profile-page">
          {/* Edit Profile button */}
          <div className="profile-edit-button-container">
            <button className="profile-edit-btn">Edit Profile</button>
          </div>

          {/* Profile container with wallpaper */}
          <div 
            className="profile-wallpaper-container" 
            style={wallpaper ? { backgroundImage: url({wallpaper}) } : {}}
          >
            {/* Overlay transparan */}
            <div className="wallpaper-overlay"></div>

            {/* Wallpaper upload button (hidden input) */}
            <label className="wallpaper-upload-btn">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleWallpaperChange} 
                style={{ display: 'none' }}
              />
              <span>Change Wallpaper</span>
            </label>
            
            {/* Character profile section inside the wallpaper container */}
            <div className="profile-inner-container">
              <div className="profile-character-container">
                <div className="profile-character-avatar">
                  <img src="/pixel-character.png" alt="Character" className="pixel-character" />
                </div>
                <div className="character-name">Character name</div>
              </div>

              <div className="profile-stats-container">
                <div className="level-display">
                  <span className="stat-label">Level</span>
                  <span className="stat-value">10/100</span>
                </div>
                
                <div className="xp-container">
                  <span className="stat-label">Xp</span>
                  <div className="xp-bar">
                    <div className="xp-fill" style={{ width: '10%' }}></div>
                  </div>
                  <span className="stat-value">10/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status message */}
          <div className="profile-status-message">
            Tetap Semangat jangan putus asa, yang penting mah udah usaha :(
            <button className="edit-status-btn">Edit</button>
          </div>

          {/* Stats section */}
          <div className="profile-stats-grid">
            <div className="stat-box">
              <div className="stat-info">
                <div className="stat-icon heart-icon">❤</div>
                <div className="stat-name">Max Hp</div>
              </div>
              <button className="stat-plus-btn">
                <div className="plus-icon">+</div>
              </button>
              <div className="stat-bonus">+ 0,5% Hp / SP</div>
            </div>
            
            <div className="stat-box">
              <div className="stat-info">
                <div className="stat-icon muscle-icon">💪</div>
                <div className="stat-name">Bonus Damage</div>
              </div>
              <button className="stat-plus-btn">
                <div className="plus-icon">+</div>
              </button>
              <div className="stat-bonus">+ 0,5% Damage / SP</div>
            </div>
            
            <div className="stat-box">
              <div className="stat-info">
                <div className="stat-icon lightning-icon">⚡</div>
                <div className="stat-name">Agility</div>
              </div>
              <button className="stat-plus-btn">
                <div className="plus-icon">+</div>
              </button>
              <div className="stat-bonus">+ 0,5% Agility / SP</div>
            </div>
          </div>

          {/* Skill points */}
          <div className="skill-points-container">
            <span className="skill-points-label">Skill Points</span>
            <span className="skill-points-value">0/10000</span>
          </div>

          {/* Bottom section - Pet and Achievements */}
          <div className="bottom-section">
            {/* Favorite Pet */}
            <div className="favorite-pet-container">
              <h3 className="section-title">Favorite Pet</h3>
              <div className="pet-display">
                <img src="/crocodile-pet.png" alt="Crocodile" className="pet-image" />
                
                <div className="pet-info">
                  <div className="pet-detail">
                    <span className="pet-label">Name</span>
                    <span className="pet-value">Crocodile</span>
                  </div>
                  
                  <div className="pet-detail">
                    <span className="pet-label">Level</span>
                    <span className="pet-value">100/100</span>
                  </div>
                  
                  <div className="pet-detail">
                    <span className="pet-label">Rarity</span>
                    <span className="pet-value">Legendary</span>
                  </div>
                </div>
              </div>
              <button className="edit-pet-btn">Edit</button>
            </div>

            {/* Achievements */}
            <div className="achievements-container">
              <h3 className="section-title">Achievements</h3>
              <div className="achievements-grid">
                <div className="achievement-item">
                  <div className="achievement-icon game-icon"></div>
                  <div className="achievement-text">Have Played The Game For 1000 Match</div>
                </div>
                
                <div className="achievement-item">
                  <div className="achievement-icon pets-icon"></div>
                  <div className="achievement-text">Have Collected 100 Pets</div>
                </div>
                
                <div className="achievement-item">
                  <div className="achievement-icon level-icon"></div>
                  <div className="achievement-text">Has Reached Max Level</div>
                </div>
              </div>
              <button className="edit-achievements-btn">Edit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiscProfile;