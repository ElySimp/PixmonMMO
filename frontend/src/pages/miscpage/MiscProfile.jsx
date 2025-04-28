import React, { useState, useEffect } from 'react';
import './MiscProfile.css'; 
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import defaultWallpaper from '../../assets/backgrounds/hCUwLQ.png'; // Import wallpaper default
import favoritePetImage from '../../assets/MAIN/pets_sample.png'; 
import trophyImage from '../../assets/MAIN/trophy.png';

const MiscProfile = () => {
  const handleMenuClick = () => console.log('Menu clicked');
  const handleSupportClick = () => console.log('Support clicked');
  const handleFriendsClick = () => console.log('Friends clicked');
  const handleSearch = (value) => console.log('Search:', value);
  const handleChatClick = () => console.log('Chat clicked');
  const handleNotificationClick = () => console.log('Notifications clicked');
  const handleEggClick = () => console.log('Egg clicked');

  const [wallpaper, setWallpaper] = useState(defaultWallpaper); // Mulai dengan wallpaper default
  const [favoritePet, setFavoritePet] = useState('Crocodile'); // Nama hewan peliharaan favorit default
  
  const [characterName, setCharacterName] = useState('Character name'); // Nama karakter default
  const [isEditing, setIsEditing] = useState(false); // Mode editing

  const [isLoaded, setIsLoaded] = useState(false);
  const [xpValue, setXpValue] = useState(10);
  const [maxXp] = useState(100);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 300);
  }, []);

  const handleStatIncrement = (statType) => {
    console.log(`Increasing ${statType} stat`);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveChanges = () => {
    setIsEditing(false);
  };

  const handleWallpaperChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setWallpaper(imageUrl);
    }
  };

  const handleNameChange = (e) => {
    setCharacterName(e.target.value);
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

        <div className={`misc-profile-profile-page ${isLoaded ? 'loaded' : ''}`}>
          {/* Edit Profile button */}
          <div className="misc-profile-profile-edit-button-container">
            {isEditing ? (
              <button className="misc-profile-profile-edit-btn" onClick={handleSaveChanges}>Save Changes</button>
            ) : (
              <button className="misc-profile-profile-edit-btn" onClick={handleEditProfile}>Edit Profile</button>
            )}
          </div>

          {/* Profile container with wallpaper */}
          <div 
            className="misc-profile-profile-wallpaper-container" 
            style={{ backgroundImage: `url(${wallpaper})` }}
          >
            <div className="misc-profile-wallpaper-overlay"></div>

            {isEditing && (
              <div className="misc-profile-edit-wallpaper-container">
                <label className="wallpaper-upload-label">
                  Change Wallpaper:
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleWallpaperChange} 
                    style={{ display: 'block', marginTop: '5px' }}
                  />
                </label>
              </div>
            )}

            <div className="misc-profile-profile-inner-container">
             <div className="misc-profile-profile-character-container">
                <div className="misc-profile-profile-character-avatar">
                <img src="/dummy1.jpg" alt="Character" className="misc-profile-pixel-character" />
                </div>

                {isEditing ? (
                  <input 
                    type="text" 
                    value={characterName} 
                    onChange={handleNameChange} 
                    className="misc-profile-character-name-input"
                  />
                ) : (
                  <div className="misc-profile-character-name">{characterName}</div>
                )}
              </div>

              <div className="misc-profile-profile-stats-container">
                <div className="misc-profile-level-display">
                  <span className="misc-profile-stat-label">Level</span>
                  <span className="misc-profile-stat-value">10/100</span>
                </div>
                
                <div className="misc-profile-xp-container">
                  <span className="misc-profile-stat-label">Xp</span>
                  <div className="misc-profile-xp-bar">
                    <div 
                      className="misc-profile-xp-fill" 
                      style={{ '--fill-width': `${xpValue}%` }}
                    ></div>
                  </div>
                  <span className="misc-profile-stat-value">{xpValue}/{maxXp}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status message */}
          <div className="misc-profile-profile-status-message">
            Tetap Semangat jangan putus asa, yang penting mah udah usaha :(
            <button className="misc-profile-edit-status-btn">Edit</button>
          </div>

          {/* Stats section */}
          <div className="misc-profile-profile-stats-grid">
            {/* Semua stat box */}
            {['hp', 'damage', 'agility'].map((stat, index) => (
              <div 
                key={stat}
                className={`misc-profile-stat-box ${isLoaded ? 'animated' : ''}`}
                style={{ '--animation-order': index + 1 }}
              >
                <div className="misc-profile-stat-info">
                  <div className={`stat-icon ${stat}-icon`}>
                    {stat === 'hp' ? '❤' : stat === 'damage' ? '💪' : '⚡'}
                  </div>
                  <div className="misc-profile-stat-name">
                    {stat === 'hp' ? 'Max Hp' : stat === 'damage' ? 'Bonus Damage' : 'Agility'}
                  </div>
                </div>
                <button 
                  className="misc-profile-stat-plus-btn"
                  onClick={() => handleStatIncrement(stat)}
                >
                  <div className="misc-profile-plus-icon">+</div>
                </button>
                <div className="misc-profile-stat-bonus">+ 0,5% {stat.charAt(0).toUpperCase() + stat.slice(1)} / SP</div>
              </div>
            ))}
          </div>

          {/* Skill Points */}
          <div className="misc-profile-skill-points-container">
            <span className="misc-profile-skill-points-label">Skill Points</span>
            <span className="misc-profile-skill-points-value">0/100</span>
          </div>

          {/* Bottom section */}
          <div className="misc-profile-bottom-section">
            {/* Favorite Pet */}
            <div className={`misc-profile-favorite-pet-container ${isLoaded ? 'animated' : ''}`}>
              <h3 className="misc-profile-section-title">Favorite Pet</h3>
              <div className="misc-profile-pet-display">
              <img src={favoritePetImage} alt="Crocodile" className="misc-profile-pet-image" />
                
                <div className="misc-profile-pet-info">
                  <div className="misc-profile-pet-detail">
                    <span className="misc-profile-pet-label">Name</span>
                    <span className="misc-profile-pet-value">Crocodile</span>
                  </div>
                  <div className="misc-profile-pet-detail">
                    <span className="misc-profile-pet-label">Level</span>
                    <span className="misc-profile-pet-value">100/100</span>
                  </div>
                  <div className="misc-profile-pet-detail">
                    <span className="misc-profile-pet-label">Rarity</span>
                    <span className="misc-profile-pet-value">Legendary</span>
                  </div>
                </div>
              </div>
              <button className="misc-profile-edit-pet-btn">Edit</button>
            </div>

            {/* Achievements */}
            <div className={`misc-profile-achievements-container ${isLoaded ? 'animated' : ''}`}>
              <h3 className="misc-profile-section-title">Achievements</h3>
              <div className="misc-profile-achievements-grid">
                <div className="misc-profile-achievement-item">
                <img src={trophyImage} alt="misc-profile-achievement-trophy"className="misc-profile-achievement-icon" />
                  <div className="misc-profile-achievement-text">Have Played The Game For 1000 Match</div>
                </div>
                <div className="misc-profile-achievement-item">
                <img src={trophyImage} alt="misc-profile-achievement Trophy" className="misc-profile-achievement-icon" />
                  <div className="misc-profile-achievement-text">Have Collected 100 Pets</div>
                </div>
                <div className="misc-profile-achievement-item">
                <img src={trophyImage} alt="misc-profile-achievement Trophy" className="misc-profile-achievement-icon" />
                  <div className="misc-profile-achievement-text">Has Reached Max Level</div>
                </div>
              </div>
              <button className="misc-profile-edit-achievements-btn">Edit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiscProfile;