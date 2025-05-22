import React, { useState, useEffect } from 'react';
import './MiscProfile.css'; 
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import defaultWallpaper from '../../assets/backgrounds/hCUwLQ.png';
import favoritePetImage from '../../assets/MAIN/pets_sample.png'; 
import trophyImage from '../../assets/MAIN/trophy.png';
import { API_URL, TOKEN_KEY } from '../../utils/config';
import axios from 'axios';

const MiscProfile = () => {
  // Navigation handlers - simplified to avoid console clutter
  const handleMenuClick = () => {};
  const handleSupportClick = () => {};
  const handleFriendsClick = () => {};
  const handleSearch = () => {};
  const handleChatClick = () => {};
  const handleNotificationClick = () => {};
  const handleEggClick = () => {};

  // State variables
  const [wallpaper, setWallpaper] = useState(defaultWallpaper);
  const [favoritePet, setFavoritePet] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [xpValue, setXpValue] = useState(0);
  const [maxXp, setMaxXp] = useState();
  const [level, setLevel] = useState(1);
  const [totalSkillPoints, setTotalSkillPoints] = useState(0);
  const [allocatedPoints, setAllocatedPoints] = useState({ hp: 0, damage: 0, agility: 0 });
  const [diamonds, setDiamonds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [petLevel, setPetLevel] = useState(0);
  const [petMaxLevel, setPetMaxLevel] = useState(100);
  const [petRarity, setPetRarity] = useState('');

  const RESET_COST = 10;
  
  const getUserId = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      // Redirect to login if no user ID is found
      window.location.href = '/';
      return null;
    }
    return userId;
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);
      const userId = getUserId();
      
      if (!userId) {
        setError('User ID not found');
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          setError('Authentication token not found');
          setIsLoading(false);
          return;
        }

        // Fetch user profile data
        const response = await axios.get(`${API_URL}/userprofile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data) {
          throw new Error('No data received from server');
        }
        
        const profileData = response.data;

        // Validate profile data
        console.log('Profile data received:', profileData);

        // Update state with fetched data
        setCharacterName(profileData.username || 'Character name');
        setLevel(profileData.level || 1);
        setXpValue(profileData.xp || 0);
        setMaxXp(profileData.maxXp || 1000);
        setStatusMessage(profileData.status_message || '');
        setDiamonds(profileData.diamonds || 0);
        setTotalSkillPoints(profileData.skill_points || 0);
        
        // Set allocated points
        setAllocatedPoints({
          hp: profileData.hp_points || 0,
          damage: profileData.damage_points || 0,
          agility: profileData.agility_points || 0
        });

        // Set wallpaper if exists
        if (profileData.custom_wallpaper_url) {
          setWallpaper(profileData.custom_wallpaper_url);
          setCustomWallpaperUrl(profileData.custom_wallpaper_url);
        }

        // Set favorite pet if exists
        if (profileData.favorite_pet_id) {
          try {
            const petResponse = await axios.get(`${API_URL}/pets/${profileData.favorite_pet_id}`);
            if (petResponse.data) {
              setFavoritePet(petResponse.data.name);
              setPetLevel(petResponse.data.level || 0);
              setPetMaxLevel(petResponse.data.max_level || 100);
              setPetRarity(petResponse.data.rarity || 'Common');
            }
          } catch (petError) {
            console.error('Error fetching pet data:', petError);
          }
        }

        setError(null);
      } catch (apiError) {
        console.error('API Error:', apiError);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsLoaded(true), 300);
      }
    };

    fetchUserProfile();
  }, []);

  const getAvailablePoints = () => {
    const usedPoints = Object.values(allocatedPoints).reduce((a, b) => a + b, 0);
    return totalSkillPoints - usedPoints;
  };

  const handleStatChange = async (statType, increment) => {
    // Prevent decrement below 0 or increment beyond available points
    if ((increment < 0 && allocatedPoints[statType] <= 0) || 
        (increment > 0 && getAvailablePoints() <= 0)) {
      return;
    }

    // Create new points object with the updated value
    const newPoints = { 
      ...allocatedPoints, 
      [statType]: allocatedPoints[statType] + increment 
    };
    
    // Update state immediately for UI responsiveness
    setAllocatedPoints(newPoints);
    setIsSaving(true);
    
    // Save to server
    const userId = getUserId();
    try {
      await saveSkillPoints(userId, {
        hp_points: newPoints.hp,
        damage_points: newPoints.damage,
        agility_points: newPoints.agility,
      });
      // Success - state is already updated
      setSaveError(null);
    } catch (error) {
      // Rollback changes if save fails
      setAllocatedPoints(allocatedPoints);
      console.error('Failed to update skill points', error);
      setSaveError('Failed to update skill points. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSkillPoints = async (userId, pointsData) => {
    try {
      const response = await axios.put(`${API_URL}/userprofile/${userId}/skills`, pointsData, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.skill_points !== undefined) {
        setTotalSkillPoints(response.data.skill_points);
      }
      return response;
    } catch (error) {
      console.error('API Error saving skill points:', error);
      throw error;
    }
  };

  const handleResetWithDiamond = async () => {
    if (diamonds < RESET_COST) {
      alert("Not enough diamonds to reset skill points!");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to reset all skill points? This will cost ${RESET_COST} diamonds.`)) {
      return;
    }
    
    setIsSaving(true);
    const userId = getUserId();
    try {
      const response = await axios.post(`${API_URL}/userprofile/${userId}/reset-skills`, {
        diamonds_cost: RESET_COST,
        hp_points: 0,
        damage_points: 0,
        agility_points: 0
      }, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        // Reset all points to 0
        setAllocatedPoints({ hp: 0, damage: 0, agility: 0 });
        // Update diamonds
        setDiamonds(response.data.diamonds);
        // Reset total skill points to initial value from response
        setTotalSkillPoints(response.data.skill_points || totalSkillPoints);
        alert(`Reset successful! ${RESET_COST} diamonds spent.`);
        setSaveError(null);
      } else {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      console.error('Error resetting skills:', error);
      setSaveError("Failed to reset skill points. Please try again.");
      alert("Failed to reset skill points. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProfile = () => setIsEditing(true);  

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveError(null);
    const userId = getUserId();

    try {
      // Prepare the data to send - only send status_message if we're editing it
      const updateData = {
        status_message: isEditingStatus ? statusMessage : undefined,
        custom_wallpaper_url: customWallpaperUrl,
        hp_points: allocatedPoints.hp,
        damage_points: allocatedPoints.damage,
        agility_points: allocatedPoints.agility
      };

      console.log('Saving profile updates:', updateData);

      // Save the profile updates
      const response = await axios.put(`${API_URL}/userprofile/${userId}`, updateData, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Server response:', response.data);

      if (response.data && response.data.success) {
        // Update local state with server response
        if (isEditingStatus && response.data.status_message !== undefined) {
          setStatusMessage(response.data.status_message);
          setIsEditingStatus(false);
        }
        if (response.data.custom_wallpaper_url) {
          setCustomWallpaperUrl(response.data.custom_wallpaper_url);
          setWallpaper(response.data.custom_wallpaper_url);
        }

        // Exit edit mode
        setIsEditing(false);
        setSaveError(null);
      } else {
        throw new Error('Server returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save changes. Please try again.';
      setSaveError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWallpaperChange = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const tempImageUrl = URL.createObjectURL(file);
    const previousWallpaper = wallpaper;
    setWallpaper(tempImageUrl);
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append('file', file);
    const userId = getUserId();
    
    try {
      console.log('Uploading wallpaper for user:', userId);
      
      const response = await axios.post(`${API_URL}/userprofile/${userId}/wallpaper`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`
        }
      });
      
      console.log('Wallpaper upload response:', response.data);
      
      if (response.data && response.data.url) {
        setCustomWallpaperUrl(response.data.url);
        setWallpaper(response.data.url);
        setSaveError(null);
        console.log('Wallpaper updated successfully');
      } else {
        throw new Error('Invalid server response - no URL received');
      }
    } catch (error) {
      console.error('Error uploading wallpaper:', error);
      setWallpaper(previousWallpaper);
      
      let errorMessage = 'Failed to upload wallpaper. Please try again.';
      if (error.response) {
        errorMessage = error.response.data?.message || `Upload failed: ${error.response.status}`;
      }
      
      setSaveError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsSaving(false);
      // Clean up the temporary URL
      URL.revokeObjectURL(tempImageUrl);
    }
  };

  const handleStatusChange = (e) => setStatusMessage(e.target.value);
  const handleEditStatus = () => setIsEditingStatus(true);

  const getStatBonus = (statType) => (allocatedPoints[statType] * 0.5).toFixed(1);

  // Handle MAX button click - adds all available points to the selected stat
  const handleMaxStat = (statType) => {
    const availablePoints = getAvailablePoints();
    if (availablePoints > 0) {
      handleStatChange(statType, availablePoints);
    }
  };

  const handlePetEdit = () => {
    alert('Pet edit feature will be implemented soon!');
  };

  const handleViewAllAchievements = () => {
    alert('View all achievements feature will be implemented soon!');
  };

  if (isLoading && !isLoaded) {
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
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="misc-profile-error-container">
        <div className="misc-profile-error-message">
          Error: {error?.response?.data?.message || error?.message || 'Failed to load profile data. Please try again later.'}
        </div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

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
          <div className="misc-profile-profile-edit-button-container">
            {isEditing ? (
              <button 
                className="misc-profile-profile-edit-btn" 
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button className="misc-profile-profile-edit-btn" onClick={handleEditProfile}>Edit Profile</button>
            )}
            {saveError && <div className="save-error">{saveError}</div>}
          </div>

          <div 
            className="misc-profile-profile-wallpaper-container" 
            style={{ backgroundImage: `url(${wallpaper})` }}
          >
            <div className="misc-profile-wallpaper-overlay"></div>

            {isEditing && (
              <div className="misc-profile-edit-wallpaper-container">
                <label className="misc-profile-wallpaper-upload-label">
                  Change Wallpaper:
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleWallpaperChange} 
                    className="misc-profile-wallpaper-input"
                    disabled={isSaving}
                  />
                </label>
              </div>
            )}

            <div className="misc-profile-profile-inner-container">
              <div className="misc-profile-profile-character-container">
                <div className="misc-profile-profile-character-avatar">
                  <img src="/dummy1.jpg" alt="Character" className="misc-profile-pixel-character" />
                </div>
                <div className="misc-profile-character-name">{characterName}</div>
              </div>

              <div className="misc-profile-profile-stats-container">
                <div className="misc-profile-level-display">
                  <span className="misc-profile-stat-label">Level</span>
                  <span className="misc-profile-stat-value">{level}</span>
                </div>
                <div className="misc-profile-xp-container">
                  <span className="misc-profile-stat-label">Xp</span>
                  <div className="misc-profile-xp-bar">
                    <div 
                      className="misc-profile-xp-fill"
                      style={{ 
                        width: `${Math.min((xpValue / maxXp) * 100, 100)}%`,
                        backgroundColor: xpValue === 0 ? '#333' : '#ff4444'
                      }}
                    ></div>
                  </div>
                  <span className="misc-profile-stat-value">{xpValue}/{maxXp}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="misc-profile-profile-status-message">
            <div className="misc-profile-status-content">
              {isEditingStatus ? (
                <input 
                  type="text" 
                  value={statusMessage} 
                  onChange={handleStatusChange} 
                  className="misc-profile-status-input"
                  placeholder="Enter your status message..."
                  maxLength={100}
                />
              ) : (
                <span className="misc-profile-status-text">
                  {statusMessage || "No status message"}
                </span>
              )}
            </div>
            
            {isEditing && (
              <div className="misc-profile-status-edit-container">
                {!isEditingStatus ? (
                  <button 
                    className="misc-profile-edit-status-btn" 
                    onClick={handleEditStatus}
                  >
                    Edit Status
                  </button>
                ) : (
                  <div className="misc-profile-status-action-buttons">
                    <button 
                      className="misc-profile-save-status-btn" 
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      className="misc-profile-cancel-status-btn" 
                      onClick={() => {
                        setIsEditingStatus(false);
                        // Reset to the last saved value
                        const userId = getUserId();
                        axios.get(`${API_URL}/userprofile/${userId}`, {
                          headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
                        }).then(response => {
                          if (response.data && response.data.status_message) {
                            setStatusMessage(response.data.status_message);
                          }
                        }).catch(error => {
                          console.error('Error resetting status message:', error);
                        });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="misc-profile-skill-points-container">            
            <div className="misc-profile-skill-points-info">
              <span className="misc-profile-skill-points-label">Skill Points Available</span>
              <span className="misc-profile-skill-points-value">{getAvailablePoints()}</span>
            </div>

            {(getAvailablePoints() < totalSkillPoints) && (
              <button 
                className="misc-profile-reset-points-btn"
                onClick={handleResetWithDiamond}
                title={`Reset all points (costs ${RESET_COST} diamonds)`}
                disabled={isSaving || diamonds < RESET_COST}
              >
                <span className="misc-profile-reset-points-cost">
                  <span className="misc-profile-diamond-icon">💎</span>
                  {RESET_COST}
                </span>
                <i>↺</i>
              </button>
            )}
          </div>
          
          {saveError && <div className="error-message">{saveError}</div>}

          <div className="misc-profile-profile-stats-grid">
            {['hp', 'damage', 'agility'].map((stat, index) => (
              <div 
                key={stat}
                className={`misc-profile-stat-box ${isLoaded ? 'animated' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="misc-profile-stat-info">
                  <div className={`misc-profile-stat-icon ${stat}-icon`}>
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
                  <div className="misc-profile-stat-button-container">
                    {/* Plus button */}
                    <button 
                      className={`misc-profile-stat-plus-btn ${getAvailablePoints() <= 0 ? 'disabled' : ''}`}
                      onClick={() => handleStatChange(stat, 1)}
                      disabled={getAvailablePoints() <= 0 || isSaving}
                    >
                      <div className="misc-profile-plus-icon">+</div>
                    </button>
                    
                    {/* Minus button - only show when available points > 0 (meaning user can still modify) */}
                    {allocatedPoints[stat] > 0 && getAvailablePoints() > 0 && (
                      <button 
                        className="misc-profile-stat-minus-btn"
                        onClick={() => handleStatChange(stat, -1)}
                        disabled={isSaving}
                      >
                        <div className="misc-profile-minus-icon">-</div>
                      </button>
                    )}
                  </div>
                  
                  {/* MAX button */}
                  {getAvailablePoints() > 0 && (
                    <button 
                      className="misc-profile-stat-max-btn"
                      onClick={() => handleMaxStat(stat)}
                      title={`Add all ${getAvailablePoints()} points to this stat`}
                      disabled={isSaving}
                    >
                      MAX
                    </button>
                  )}
                </div>
                
                <div className="misc-profile-stat-bonus">
                  + {getStatBonus(stat)}% {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </div>
              </div>
            ))}
          </div>

          <div className="misc-profile-bottom-section">
            <div className={`misc-profile-favorite-pet-container ${isLoaded ? 'animated' : ''}`}>
              <h3 className="misc-profile-section-title">Favorite Pet</h3>
              <div className="misc-profile-pet-display">
                <img src={favoritePetImage} alt={favoritePet} className="misc-profile-pet-image" />
                
                <div className="misc-profile-pet-info">
                  <div className="misc-profile-pet-detail">
                    <span className="misc-profile-pet-label">Name</span>
                    <span className="misc-profile-pet-value">{favoritePet || 'None selected'}</span>
                  </div>
                  <div className="misc-profile-pet-detail">
                    <span className="misc-profile-pet-label">Level</span>
                    <span className="misc-profile-pet-value">{petLevel}/{petMaxLevel}</span>
                  </div>
                  <div className="misc-profile-pet-detail">
                    <span className="misc-profile-pet-label">Rarity</span>
                    <span className="misc-profile-pet-value">{petRarity}</span>
                  </div>
                </div>
              </div>
              <button 
                className="misc-profile-edit-pet-btn"
                onClick={handlePetEdit}
              >
                Edit
              </button>
            </div>

            <div className={`misc-profile-achievements-container ${isLoaded ? 'animated' : ''}`}>
              <h3 className="misc-profile-section-title">Achievements</h3>
              <div className="misc-profile-achievements-grid">
                <div className="misc-profile-achievement-item">
                  <img src={trophyImage} alt="Achievement Trophy" className="misc-profile-achievement-icon" />
                  <div className="misc-profile-achievement-text">Have Played The Game For 1000 Match</div>
                </div>
                <div className="misc-profile-achievement-item">
                  <img src={trophyImage} alt="Achievement Trophy" className="misc-profile-achievement-icon" />
                  <div className="misc-profile-achievement-text">Have Collected 100 Pets</div>
                </div>
                <div className="misc-profile-achievement-item">
                  <img src={trophyImage} alt="Achievement Trophy" className="misc-profile-achievement-icon" />
                  <div className="misc-profile-achievement-text">Has Reached Max Level</div>
                </div>
              </div>
              <button 
                className="misc-profile-view-achievements-btn"
                onClick={handleViewAllAchievements}
              >
                View All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiscProfile;