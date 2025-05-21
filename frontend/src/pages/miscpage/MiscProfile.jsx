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
  
  // State untuk skill points
  const [totalSkillPoints, setTotalSkillPoints] = useState(10); // Total skill points yang tersedia
  const [allocatedPoints, setAllocatedPoints] = useState({
    hp: 0,
    damage: 0,
    agility: 0
  });
  
  // State untuk diamond
  const [diamonds, setDiamonds] = useState(100); // Jumlah diamond yang dimiliki user
  const RESET_COST = 10; // Biaya reset dalam diamond
  
  // State untuk menampilkan panel alokasi
  const [showAllocationPanel, setShowAllocationPanel] = useState(false);
  const [currentStat, setCurrentStat] = useState('');
  
  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 300);
  }, []);

  // Mendapatkan jumlah available points
  const getAvailablePoints = () => {
    const usedPoints = Object.values(allocatedPoints).reduce((a, b) => a + b, 0);
    return totalSkillPoints - usedPoints;
  };

  const handleStatIncrement = (statType) => {
    if (getAvailablePoints() > 0) {
      setAllocatedPoints(prev => ({
        ...prev,
        [statType]: prev[statType] + 1
      }));
    }
  };
  
  const handleStatDecrement = (statType) => {
    if (allocatedPoints[statType] > 0) {
      setAllocatedPoints(prev => ({
        ...prev,
        [statType]: prev[statType] - 1
      }));
    }
  };
  
  const handleMaxAllocation = (statType) => {
    const availablePoints = getAvailablePoints();
    if (availablePoints > 0) {
      setAllocatedPoints(prev => ({
        ...prev,
        [statType]: prev[statType] + availablePoints
      }));
    }
  };
  
  // Fungsi untuk mereset skill points dengan diamond
  const handleResetWithDiamond = () => {
    if (diamonds >= RESET_COST) {
      // Kurangi jumlah diamond
      setDiamonds(prev => prev - RESET_COST);
      
      // Reset alokasi points
      setAllocatedPoints({
        hp: 0,
        damage: 0,
        agility: 0
      });
      
      // Tambahkan efek animasi atau notifikasi jika diinginkan
      alert(`Reset successful! ${RESET_COST} diamonds spent.`);
    } else {
      alert("Not enough diamonds to reset skill points!");
    }
  };
  
  const handleResetAllocation = () => {
    setAllocatedPoints({
      hp: 0,
      damage: 0,
      agility: 0
    });
  };
  
  const toggleAllocationPanel = (statType) => {
    setCurrentStat(statType);
    setShowAllocationPanel(!showAllocationPanel);
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
  
  // Mendapatkan bonus stat berdasarkan allocated points
  const getStatBonus = (statType) => {
    const bonus = allocatedPoints[statType] * 0.5;
    return bonus.toFixed(1);
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
                  <span className="misc-profile-stat-value">10</span>
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

          {/* Skill Points */}          
          <div className="misc-profile-skill-points-container">            
            <div className="misc-profile-skill-points-info">
              <span className="misc-profile-skill-points-label">Skill Points</span>
              <span className="misc-profile-skill-points-value">{getAvailablePoints()}</span>
            </div>

            {/* Reset button with diamond cost */}
            {getAvailablePoints() < totalSkillPoints && (
              <button 
                className="misc-profile-reset-points-btn"
                onClick={handleResetWithDiamond}
                title={`Reset all points`}
              >
                <span className="misc-profile-reset-points-cost">
                  <span className="misc-profile-diamond-icon">💎</span>
                  {RESET_COST}
                </span>
                <i>↺</i>
              </button>
            )}
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
                  
                  {allocatedPoints[stat] > 0 && (
                    <div className="misc-profile-allocated-counter">
                      +{allocatedPoints[stat]}
                    </div>
                  )}
                </div>
                
                <div className="misc-profile-stat-controls">
                  {/* Container untuk tombol + dan - */}
                  <div className="misc-profile-stat-button-container" style={{ display: 'flex', justifyContent: 'center' }}>
                    {/* Tombol plus */}
                    <button 
                      className={`misc-profile-stat-plus-btn ${getAvailablePoints() === 0 ? 'disabled' : ''}`}
                      onClick={() => handleStatIncrement(stat)}
                      disabled={getAvailablePoints() === 0}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%',
                        backgroundColor: '#333',
                        border: '2px solid #555',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        margin: '10px 5px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div className="misc-profile-plus-icon">+</div>
                    </button>                    {/* Tombol minus - hanya muncul jika ada allocated points dan masih ada skill points tersisa */}
                    {allocatedPoints[stat] > 0 && getAvailablePoints() > 0 && (
                      <button 
                        className="misc-profile-stat-minus-btn"
                        onClick={() => handleStatDecrement(stat)}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%',
                          backgroundColor: '#333',
                          border: '2px solid #555',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',
                          margin: '10px 5px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div className="misc-profile-minus-icon" style={{ fontSize: '24px', color: 'white', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>-</div>
                      </button>
                    )}
                  </div>
                  
                  {/* Tombol MAX untuk alokasi maksimum */}
                  {getAvailablePoints() > 0 && (
                    <button 
                      className="misc-profile-stat-max-btn"
                      onClick={() => handleMaxAllocation(stat)}
                      title={`Add all ${getAvailablePoints()} points to this stat`}
                      style={{
                        backgroundColor: '#333',
                        color: '#3498db',
                        border: '1px solid #555',
                        borderRadius: '15px',
                        padding: '5px 15px',
                        margin: '5px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      MAX
                    </button>
                  )}
                </div>
                
                <div className="misc-profile-stat-bonus">
                  + {getStatBonus(stat)}% {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </div>
                
                {allocatedPoints[stat] > 0 && (
                  <div className="misc-profile-stat-progress">
                    <div 
                      className="misc-profile-stat-bar-fill"
                      style={{ width: `${Math.min(allocatedPoints[stat] * 10, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>          {/* Reset button removed from here */}

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