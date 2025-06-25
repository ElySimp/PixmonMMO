import React, { useState, useEffect, useRef } from 'react';
import './MiscProfile.css'; 
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import defaultWallpaper from '../../assets/backgrounds/hCUwLQ.png';
import favoritePetImage from '../../assets/MAIN/pets_sample.png'; 
import trophyImage from '../../assets/MAIN/trophy.png';
import { API_URL, TOKEN_KEY } from '../../utils/config';
import axios from 'axios';
import { getUserPets } from '../../services/petsService';
import { useUserProfile } from '../../context/UserProfileContext';

// Preset data
const PRESET_AVATARS = [
  { id: 1, name: 'Knight', image_path: '/assets/avatars/avatar1.jpg' },
  { id: 2, name: 'Mage', image_path: '/assets/avatars/avatar2.jpg' },
  { id: 3, name: 'Archer', image_path: '/assets/avatars/avatar3.jpg' },
  { id: 4, name: 'Warrior', image_path: '/assets/avatars/avatar4.jpg' },
  { id: 5, name: 'Paladin', image_path: '/assets/avatars/avatar5.jpg' }
];

const PRESET_WALLPAPERS = [
  { id: 1, name: 'Classic', wallpaper_url: '/assets/wallpapers/wallpaper1.jpg' },
  { id: 2, name: 'NightSky', wallpaper_url: '/assets/wallpapers/wallpaper2.jpg' },
  { id: 3, name: 'Forest', wallpaper_url: '/assets/wallpapers/wallpaper3.jpg' },
  { id: 4, name: 'Beach', wallpaper_url: '/assets/wallpapers/wallpaper4.jpg' },
  { id: 5, name: 'Mountains', wallpaper_url: '/assets/wallpapers/wallpaper5.jpg' }
];

// Avatar Selection Modal Component
const AvatarSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvatars();
    }
  }, [isOpen]);

  const fetchAvatars = async () => {
    setLoading(true);
    try {
      setAvatars(PRESET_AVATARS);
    } catch (error) {
      setAvatars(PRESET_AVATARS);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarSrc = (avatar) => avatar.image_path || avatar.image_url || '';

  if (!isOpen) return null;

  return (
    <div className="misc-profile-modal-overlay">
      <div className="misc-profile-avatar-modal">
        <h3>Select Avatar</h3>
        <div className="misc-profile-avatar-grid">
          {loading ? (
            <div>Loading avatars...</div>
          ) : avatars.length === 0 ? (
            <div>No avatars available</div>
          ) : (
            avatars.map(avatar => (
              <div 
                key={avatar.id} 
                className="misc-profile-avatar-item"
                onClick={() => onSelect(avatar)}
              >
                <img 
                  src={getAvatarSrc(avatar)} 
                  alt={`Avatar ${avatar.id}`} 
                  className="misc-profile-avatar-preview"
                />
              </div>
            ))
          )}
        </div>
        <button onClick={onClose} className="misc-profile-close-modal-btn">Close</button>
      </div>
    </div>
  );
};

// Wallpaper Selection Modal Component
const WallpaperSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWallpapers();
    }
  }, [isOpen]);

  const fetchWallpapers = async () => {
    setLoading(true);
    try {
      setWallpapers(PRESET_WALLPAPERS);
    } catch (error) {
      setWallpapers(PRESET_WALLPAPERS);
    } finally {
      setLoading(false);
    }
  };

  const getWallpaperSrc = (wallpaper) => wallpaper.wallpaper_url || wallpaper.image_url || '';

  if (!isOpen) return null;

  return (
    <div className="misc-profile-modal-overlay">
      <div className="misc-profile-wallpaper-modal">
        <h3>Select Wallpaper</h3>
        <div className="misc-profile-wallpaper-grid">
          {loading ? (
            <div>Loading wallpapers...</div>
          ) : wallpapers.length === 0 ? (
            <div>No wallpapers available</div>
          ) : (
            wallpapers.map(wallpaper => (
              <div 
                key={wallpaper.id} 
                className="misc-profile-wallpaper-item"
                onClick={() => onSelect(wallpaper)}
              >
                <img 
                  src={getWallpaperSrc(wallpaper)} 
                  alt={`Wallpaper ${wallpaper.id}`} 
                  className="misc-profile-wallpaper-preview"
                />
              </div>
            ))
          )}
        </div>
        <button onClick={onClose} className="misc-profile-close-modal-btn">Close</button>
      </div>
    </div>
  );
};


// Pet Selection Modal Component
const PetSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      fetchUserPetsModal();
    }
  }, [isOpen]);

  const fetchUserPetsModal = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const pets = await getUserPets(userId);
      setPets(Array.isArray(pets) ? pets : []);
    } catch (error) {
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="miscprofile-pet-modal-overlay">
      <div className="miscprofile-pet-modal">
        <h3 className="miscprofile-pet-modal-title">Select Favorite Pet</h3>
        <div className="miscprofile-pet-grid">
          {loading ? (
            <div>Loading pets...</div>
          ) : pets.length === 0 ? (
            <div>No pets available</div>
          ) : (
            pets.map(pet => (
              <div 
                key={pet.id} 
                className="miscprofile-pet-item"
                onClick={() => onSelect(pet)}
              >
                <img src={pet.image_url} alt={pet.name} className="miscprofile-pet-image" />
                <div className="miscprofile-pet-info">
                  <div className="miscprofile-pet-name">{pet.name}</div>
                  <div className="miscprofile-pet-level">Level {pet.current_level}</div>
                  <div className={`miscprofile-pet-rarity ${pet.rarity?.toLowerCase()}`}>{pet.rarity}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <button onClick={onClose} className="miscprofile-pet-close-modal-btn">Close</button>
      </div>
    </div>
  );
};

// Achievement Selection Modal Component
const AchievementSelectionModal = ({ isOpen, onClose, onSelect, selectedAchievements, onSave }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [localSelected, setLocalSelected] = useState(selectedAchievements || []);

  useEffect(() => {
    if (isOpen) {
      fetchUserAchievements();
      setLocalSelected(selectedAchievements || []);
    }
  }, [isOpen, selectedAchievements]);

  const fetchUserAchievements = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.get(`${API_URL}/users/${userId}/achievements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unlocked = (Array.isArray(response.data.achievements) ? response.data.achievements : []).filter(a => a.completed);
      setAchievements(unlocked);
    } catch (error) {
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAchievement = (achievement) => {
    const isSelected = localSelected.some(a => a.id === achievement.id);
    if (isSelected) {
      setLocalSelected(localSelected.filter(a => a.id !== achievement.id));
    } else if (localSelected.length < 3) {
      setLocalSelected([...localSelected, achievement]);
    }
  };

  const handleSave = () => {
    onSelect(localSelected);
    if (onSave) onSave(localSelected);
    onClose();
  };

  if (!isOpen) return null;
  
  return (
    <div className="miscprofile-achievement-modal-overlay">
      <div className="miscprofile-achievement-modal">
        <h3 className="miscprofile-achievement-modal-title">Select Achievements to Display (Max 3)</h3>
        <div className="miscprofile-achievement-grid">
          {loading ? (
            <div>Loading achievements...</div>
          ) : achievements.length === 0 ? (
            <div>No achievements unlocked</div>
          ) : (
            achievements.map(achievement => (
              <div 
                key={achievement.id} 
                className={`miscprofile-achievement-item ${localSelected.some(a => a.id === achievement.id) ? 'selected' : ''}`}
                onClick={() => handleToggleAchievement(achievement)}
              >
                <img 
                  src={achievement.icon_path || (achievement.icon_name ? `/achievements/${achievement.icon_name}.png` : trophyImage)}
                  alt={achievement.title || achievement.name} 
                  className="miscprofile-achievement-icon"
                />
                <div className="miscprofile-achievement-info">
                  <div className="miscprofile-achievement-name">{achievement.title || achievement.name}</div>
                  <div className="miscprofile-achievement-description">{achievement.description}</div>
                </div>
                {localSelected.some(a => a.id === achievement.id) && (
                  <div className="miscprofile-achievement-selected-indicator">✓</div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="miscprofile-achievement-selected-count">
          Selected: {localSelected.length}/3
        </div>
        <button onClick={handleSave} className="miscprofile-achievement-close-modal-btn">Done</button>
      </div>
    </div>
  );
};

const MiscProfile = () => {
  // Navigation handlers - simplified to avoid console clutter
  const handleMenuClick = () => {};
  const handleSupportClick = () => {};
  const handleFriendsClick = () => {};
  const handleSearch = () => {};
  const handleChatClick = () => {};
  const handleNotificationClick = () => {};
  const handleEggClick = () => {};
  
  // Get profile data from context
  const { 
    avatarUrl: contextAvatarUrl,
    wallpaper: contextWallpaper,
    characterName: contextCharacterName,
    statusMessage: contextStatusMessage,
    favoritePet: contextFavoritePet,
    selectedAchievements: contextSelectedAchievements,
    isLoading: profileLoading,
    updateUserProfile,
    fetchUserProfile: refreshUserProfile
  } = useUserProfile();
  
  // Local state variables
  const [wallpaper, setWallpaper] = useState(defaultWallpaper);
  const [avatarUrl, setAvatarUrl] = useState('/dummy1.jpg');
  const [favoritePet, setFavoritePet] = useState('');
  const [favoritePetData, setFavoritePetData] = useState(null);
  const [characterName, setCharacterName] = useState('Character name');
  const [statusMessage, setStatusMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');
  const [isLoaded, setIsLoaded] = useState(true); // Add back isLoaded state
  const [error, setError] = useState(null);
  const [xpValue, setXpValue] = useState(0);
  const [maxXp, setMaxXp] = useState();
  const [level, setLevel] = useState(1);
  const [totalSkillPoints, setTotalSkillPoints] = useState(0);
  const [allocatedPoints, setAllocatedPoints] = useState({ hp: 0, damage: 0, agility: 0 });
  const [diamonds, setDiamonds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [selectedAchievements, setSelectedAchievements] = useState([]);
  
  // Modal states
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);
  const [showWallpaperSelection, setShowWallpaperSelection] = useState(false);
  const [showPetSelection, setShowPetSelection] = useState(false);
  const [showAchievementSelection, setShowAchievementSelection] = useState(false);
  
  const RESET_COST = 100;
  const SKILL_POINTS_PER_LEVEL = 1;
  
  // Helper functions
  const getUserCredentials = () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!userId || !token) {
      console.error('Missing credentials:', { userId: !!userId, token: !!token });
      return null;
    }
    
    return { userId, token };
  };
  
  const getUserId = () => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      console.log('No userId found, redirecting to login');
      window.location.href = '/';
      return null;
    }
    
    return userId;
  };
  
  const calculateTotalSkillPoints = (userLevel) => {
    return userLevel * SKILL_POINTS_PER_LEVEL;
  };
  
  const getAvailablePoints = () => {
    const usedPoints = Object.values(allocatedPoints).reduce((a, b) => a + b, 0);
    return totalSkillPoints - usedPoints;
  };
  
  const getStatBonus = (statType) => (allocatedPoints[statType] * 0.5).toFixed(1);
    // Single fetchUserProfile function (removed duplication)
  const fetchUserProfile = async () => {
    // We don't set isLoading to true here anymore to prevent the loading screen
    setError(null);
    
    const credentials = getUserCredentials();
    if (!credentials) {
      setError('Authentication error');
      return;
    }
    
    try {
      // Fetch user profile data
      const response = await axios.get(`${API_URL}/userprofile/${credentials.userId}?timestamp=${Date.now()}`, {
        headers: { Authorization: `Bearer ${credentials.token}` }
      });
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      const profileData = response.data;
      console.log('Profile data received:', profileData);
      // Update state with fetched data
      setCharacterName(profileData.username || 'Character name');
      setLevel(profileData.level || 1);
      setXpValue(profileData.xp || 0);
      setMaxXp(profileData.maxXp || 1000);
      setStatusMessage(profileData.status_message || '');
      setDiamonds(profileData.diamonds || 0);
      
      // Calculate total skill points based on level
      const calculatedSkillPoints = calculateTotalSkillPoints(profileData.level || 1);
      setTotalSkillPoints(calculatedSkillPoints);
      
      // Set allocated points
      setAllocatedPoints({
        hp: profileData.hp_points || 0,
        damage: profileData.damage_points || 0,
        agility: profileData.agility_points || 0
      });
      // Set avatar if exists
      if (profileData.avatar_url) {
        setAvatarUrl(profileData.avatar_url);
      }
      // Set wallpaper if exists
      if (profileData.custom_wallpaper_url) {
        setWallpaper(profileData.custom_wallpaper_url);
        setCustomWallpaperUrl(profileData.custom_wallpaper_url);
      } else {
        setWallpaper(profileData.wallpaper || defaultWallpaper);
      }
      // Set favorite pet if exists
      if (profileData.favorite_pet_id) {
        try {
          const petResponse = await axios.get(`${API_URL}/pets/${profileData.favorite_pet_id}`, {
            headers: { Authorization: `Bearer ${credentials.token}` }
          });
          if (petResponse.data) {
            setFavoritePet(petResponse.data.name);
            setFavoritePetData(petResponse.data);
          }
        } catch (petError) {
          console.error('Error fetching pet data:', petError);
        }
      }
      // Fetch selected achievements
      try {
        const achievementResponse = await axios.get(`${API_URL}/userprofile/${credentials.userId}/selected-achievements`, {
          headers: { Authorization: `Bearer ${credentials.token}` }
        });
        if (achievementResponse.data) {
          setSelectedAchievements(achievementResponse.data);
        }
      } catch (achievementError) {
        console.error('Error fetching selected achievements:', achievementError);
      }
      setError(null);    } catch (apiError) {
      console.error('API Error:', apiError);
      setError('Failed to load profile data. Please try again later.');
    } finally {
      // We don't need the timeout anymore as we've set isLoaded to true by default
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  // Sync local state with context
  useEffect(() => {
    if (!profileLoading) {
      setAvatarUrl(contextAvatarUrl);
      setWallpaper(contextWallpaper);
      setCharacterName(contextCharacterName);
      setStatusMessage(contextStatusMessage);
      setIsLoaded(true); // Update isLoaded when profile finishes loading
      
      if (contextFavoritePet) {
        setFavoritePet(contextFavoritePet.id);
        setFavoritePetData(contextFavoritePet);
      }
      
      if (contextSelectedAchievements?.length) {
        setSelectedAchievements(contextSelectedAchievements);
      }
    }
  }, [
    profileLoading, 
    contextAvatarUrl, 
    contextWallpaper, 
    contextCharacterName, 
    contextStatusMessage, 
    contextFavoritePet,
    contextSelectedAchievements
  ]);
  
  // Skill points handlers
  const handleStatChange = async (statType, increment) => {
    if ((increment < 0 && allocatedPoints[statType] <= 0) || 
        (increment > 0 && getAvailablePoints() <= 0)) {
      return;
    }
    const newPoints = { 
      ...allocatedPoints, 
      [statType]: allocatedPoints[statType] + increment 
    };
    
    setAllocatedPoints(newPoints);
    setIsSaving(true);
    
    const credentials = getUserCredentials();
    if (!credentials) return;
    try {
      await saveSkillPoints(credentials.userId, {
        hp_points: newPoints.hp,
        damage_points: newPoints.damage,
        agility_points: newPoints.agility,
      });
      setSaveError(null);
    } catch (error) {
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
    const credentials = getUserCredentials();
    if (!credentials) return;
    try {
      const response = await axios.post(`${API_URL}/userprofile/${credentials.userId}/reset-skills`, {
        diamonds_cost: RESET_COST,
        hp_points: 0,
        damage_points: 0,
        agility_points: 0
      }, {
        headers: { 
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        setAllocatedPoints({ hp: 0, damage: 0, agility: 0 });
        setDiamonds(response.data.diamonds);
        alert(`Reset successful! ${RESET_COST} diamonds spent.`);
        setSaveError(null);
      } else {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      console.error('Error resetting skills:', error);
      setSaveError("Failed to reset skill points. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleMaxStat = (statType) => {
    const availablePoints = getAvailablePoints();
    if (availablePoints > 0) {
      handleStatChange(statType, availablePoints);
    }
  };
  
  // Profile editing handlers
  const handleEditProfile = () => setIsEditing(true);
  
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    const credentials = getUserCredentials();
    if (!credentials) {
      setSaveError('Please log in again');
      setIsSaving(false);
      return;
    }
    
    try {
      const updateData = {};
      
      // Status message
      if (isEditingStatus) {
        updateData.status_message = statusMessage;
      }
      
      
      // Skill points - only if there are changes
      updateData.hp_points = allocatedPoints.hp;
      updateData.damage_points = allocatedPoints.damage;
      updateData.agility_points = allocatedPoints.agility;
      console.log('Sending update data:', updateData); // Debug log
      const response = await axios.put(
        `${API_URL}/userprofile/${credentials.userId}`, 
        updateData, 
        {
          headers: { 
            'Authorization': `Bearer ${credentials.token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );
      console.log('Server response:', response.data); // Debug log
      if (response.data) {
        // Update state based on response
        if (response.data.status_message !== undefined) {
          setStatusMessage(response.data.status_message);
          setIsEditingStatus(false);
        }
        
        if (response.data.custom_wallpaper_url) {
          setCustomWallpaperUrl(response.data.custom_wallpaper_url);
          setWallpaper(response.data.custom_wallpaper_url);
        }
        setIsEditing(false);
        setSaveError(null);
        
        // Refresh profile data
        await fetchUserProfile();
        
        alert('Profile updated successfully!');
      } else {
        throw new Error('Server returned empty response');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      
      let errorMessage = 'Failed to save changes.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      } else if (error.response) {
        console.log('Error response:', error.response.data);
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Achievement selection handlers
  const handleViewAllAchievements = () => {
    window.location.href = '/achievement';
  };
  
  const handleSelectAchievements = () => {
    setShowAchievementSelection(true);
  };
  
  const handleAchievementSelect = async (achievements) => {
    setIsSaving(true);
    const credentials = getUserCredentials();
    if (!credentials) return;
    try {
      const response = await axios.put(`${API_URL}/userprofile/${credentials.userId}/selected-achievements`, {
        achievement_ids: achievements.map(a => a.id)
      }, {
        headers: { 
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data && response.data.success) {
        setSelectedAchievements(achievements);
        setSaveError(null);
        await fetchUserProfile();
        alert('Achievements updated!');
      } else {
        throw new Error('Failed to update selected achievements');
      }
    } catch (error) {
      setSaveError('Failed to update selected achievements. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Avatar and Wallpaper handlers
  const handleAvatarSelect = async (avatar) => {
    setIsSaving(true);
    const credentials = getUserCredentials();
    if (!credentials) return;
    try {
      const response = await axios.put(
        `${API_URL}/userprofile/${credentials.userId}/avatar`,
        { avatar_id: avatar.id },
        {
          headers: { 
            'Authorization': `Bearer ${credentials.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data && response.data.success) {
        setAvatarUrl(`/assets/avatars/avatar${avatar.id}.jpg`);
        setShowAvatarSelection(false);
        setSaveError(null);
        await fetchUserProfile();
        alert('Avatar updated successfully!');
      } else {
        throw new Error('Failed to update avatar');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      setSaveError('Failed to update avatar. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWallpaperSelect = async (wallpaper) => {
    setIsSaving(true);
    const credentials = getUserCredentials();
    if (!credentials) return;
    try {
      const response = await axios.put(
        `${API_URL}/userprofile/${credentials.userId}/wallpaper`,
        { wallpaper_id: wallpaper.id },
        {
          headers: { 
            'Authorization': `Bearer ${credentials.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data && response.data.success) {
        setWallpaper(`/assets/wallpapers/wallpaper${wallpaper.id}.jpg`);
        setShowWallpaperSelection(false);
        setSaveError(null);
        await fetchUserProfile();
        alert('Wallpaper updated successfully!');
      } else {
        throw new Error('Failed to update wallpaper');
      }
    } catch (error) {
      console.error('Error updating wallpaper:', error);
      setSaveError('Failed to update wallpaper. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleStatusChange = (event) => {
    setStatusMessage(event.target.value);
  };
  
  const handleEditStatus = () => {
    setIsEditingStatus(true);
  };
  
  const handleResetStatus = () => {
    setIsEditingStatus(false);
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
  };
  
  const handlePetEdit = () => {
    setShowPetSelection(true);
  };
  
  const handlePetSelect = async (pet) => {
    setIsSaving(true);
    const credentials = getUserCredentials();
    if (!credentials) return;
    try {
      const response = await axios.put(
        `${API_URL}/userprofile/${credentials.userId}/favorite-pet`,
        { pet_id: pet.id },
        {
          headers: { 
            'Authorization': `Bearer ${credentials.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data && response.data.success) {
        setFavoritePet(pet.name);
        setFavoritePetData(pet);
        setShowPetSelection(false);
        setSaveError(null);
        await fetchUserProfile();
        alert('Favorite pet updated!');
      } else {
        throw new Error('Failed to update favorite pet');
      }
    } catch (error) {
      console.error('Error updating favorite pet:', error);
      setSaveError('Failed to update favorite pet. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
    // Show loading state when profile data is loading
  if (profileLoading) {
    // Make sure isLoaded is false during loading
    if (isLoaded) setIsLoaded(false);
    
    return (
      <div className="profile-loading-container">
        <div className="profile-loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }
  
  // Error state
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
                  <button 
                    className="misc-profile-wallpaper-select-btn"
                    onClick={() => setShowWallpaperSelection(true)}
                    disabled={isSaving}
                  >
                    Change Wallpaper
                  </button>
                </div>
              )}
              <div className="misc-profile-profile-inner-container">
                <div className="misc-profile-profile-character-container">
                  <div className="misc-profile-profile-character-avatar">
                    <img src={avatarUrl} alt="Character" className="misc-profile-pixel-character" />
                    {isEditing && (
                      <div className="misc-profile-avatar-edit-overlay">
                        <button 
                          className="misc-profile-avatar-select-btn"
                          onClick={() => setShowAvatarSelection(true)}
                          disabled={isSaving}
                        >
                          Change Avatar
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="misc-profile-character-name">{characterName}</div>
                </div>
                <div className="misc-profile-profile-stats-container">
                  <div className="misc-profile-level-display">
                    <span className="misc-profile-stat-label">Level</span>
                    <span className="misc-profile-stat-value">{level}</span>
                  </div>
                  <div className="misc-profile-xp-container">
                    <span className="misc-profile-stat-label">XP</span>
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
                        onClick={handleResetStatus}
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
                  disabled={isSaving || diamonds < RESET_COST}
                  title={`Reset all points (costs ${RESET_COST} diamonds)`}
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
                    <button 
                      className={`misc-profile-stat-plus-btn ${getAvailablePoints() <= 0 ? 'disabled' : ''}`}
                      onClick={() => handleStatChange(stat, 1)}
                      disabled={getAvailablePoints() <= 0 || isSaving}
                     >
                      <div className="misc-profile-plus-icon">+</div>
                      </button>
                      </div>
                        
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
                  <img 
                    src={favoritePetData?.image_url || favoritePetImage} 
                    alt={favoritePet} 
                    className="misc-profile-pet-image" 
                  />
                  
                  <div className="misc-profile-pet-info">
                    <div className="misc-profile-pet-detail">
                      <span className="misc-profile-pet-label">Name</span>
                      <span className="misc-profile-pet-value">{favoritePet || 'None selected'}</span>
                    </div>
                    <div className="misc-profile-pet-detail">
                      <span className="misc-profile-pet-label">Level</span>
                      <span className="misc-profile-pet-value">
                        {favoritePetData ? `${favoritePetData.level}` : '0'}
                      </span>
                    </div>
                    <div className="misc-profile-pet-detail">
                      <span className="misc-profile-pet-label">Rarity</span>
                      <span className={`rarity ${favoritePetData?.rarity?.toLowerCase() || 'common'}`}>
                        {favoritePetData?.rarity || 'Common'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  className="misc-profile-edit-pet-btn"
                  onClick={() => setShowPetSelection(true)}
                >
                  Edit
                </button>
              </div>
              <div className={`misc-profile-achievements-container ${isLoaded ? 'animated' : ''}`}>
                <h3 className="misc-profile-section-title">Achievements</h3>
                <div className="misc-profile-achievements-grid">
                  {selectedAchievements.length > 0 ? (
                    selectedAchievements.map(achievement => (
                      <div key={achievement.id} className="misc-profile-achievement-item">
                        <img 
                          src={achievement.icon_path || (achievement.icon_name ? `/achievements/${achievement.icon_name}.png` : trophyImage)}
                          alt={achievement.title || achievement.name} 
                          className="misc-profile-achievement-icon" 
                        />
                        <div className="misc-profile-achievement-text">
                          <div className="misc-profile-achievement-title">{achievement.title || achievement.name}</div>
                          {achievement.description && (
                            <div className="misc-profile-achievement-desc">{achievement.description}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="misc-profile-achievement-item placeholder">
                        <img src={trophyImage} alt="Achievement Trophy" className="misc-profile-achievement-icon" />
                        <div className="misc-profile-achievement-text">No achievements selected</div>
                      </div>
                      <div className="misc-profile-achievement-item placeholder">
                        <img src={trophyImage} alt="Achievement Trophy" className="misc-profile-achievement-icon" />
                        <div className="misc-profile-achievement-text">Select your achievements</div>
                      </div>
                      <div className="misc-profile-achievement-item placeholder">
                        <img src={trophyImage} alt="Achievement Trophy" className="misc-profile-achievement-icon" />
                        <div className="misc-profile-achievement-text">to display here</div>
                      </div>
                    </>
                  )}
                </div>
                <div className="misc-profile-achievement-buttons">
                  <button 
                    className="misc-profile-view-achievements-btn"
                    onClick={handleViewAllAchievements}
                  >
                    View All
                  </button>
                  <button 
                    className="misc-profile-select-achievements-btn"
                    onClick={() => setShowAchievementSelection(true)}
                  >
                    Select ({selectedAchievements.length}/3)
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Modals */}
          <AvatarSelectionModal
            isOpen={showAvatarSelection}
            onClose={() => setShowAvatarSelection(false)}
            onSelect={handleAvatarSelect}
          />
          <WallpaperSelectionModal
            isOpen={showWallpaperSelection}
            onClose={() => setShowWallpaperSelection(false)}
            onSelect={handleWallpaperSelect}
          />
          <PetSelectionModal
            isOpen={showPetSelection}
            onClose={() => setShowPetSelection(false)}
            onSelect={handlePetSelect}
          />
          <AchievementSelectionModal
            isOpen={showAchievementSelection}
            onClose={() => setShowAchievementSelection(false)}
            onSelect={setSelectedAchievements}
            selectedAchievements={selectedAchievements}
            onSave={handleAchievementSelect}
          />
        </div>
      </div>
  );
};
  
export default MiscProfile;