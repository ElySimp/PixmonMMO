import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import './Petshouse.css';
import { useNavigate } from 'react-router-dom';
import { getUserPets, getEquippedPet, updatePetStatus } from '../../services/petsService';
import { getUserInventory, useInventoryItem } from '../../services/inventoryService';
import { toast } from 'react-toastify';

const Petshouse = () => {
  // State for pet data
  const [currentPet, setCurrentPet] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingCooldown, setPlayingCooldown] = useState(false);
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [petStats, setPetStats] = useState({});
  
  const navigate = useNavigate();
  
  // Load pet and inventory data on component mount
  useEffect(() => {
    fetchPetData();
  }, []);
  
  // Countdown timer for play button cooldown
  useEffect(() => {
    let interval;
    
    if (playingCooldown && remainingCooldown > 0) {
      interval = setInterval(() => {
        setRemainingCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setPlayingCooldown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [playingCooldown, remainingCooldown]);

  // Health regeneration effect, hunger increases and happiness decreases over time
  useEffect(() => {
    let statsInterval;
    
    if (currentPet) {
      // Every 10 seconds, update pet stats (faster for testing purposes)
      statsInterval = setInterval(() => {
        // Regenerate health if pet is well-fed (hunger high) and happy
        if (currentPet.hunger > 70 && currentPet.happiness > 50 && currentPet.health < 100) {
          updatePetStats(1, 0, 0); // +1 health, no change to hunger or happiness
        }
        
        // Increase hunger over time (hunger = 100 means full, 0 means starving)
        if (currentPet.hunger > 0) {
          updatePetStats(0, -2, 0); // No change to health, -2 hunger (getting hungrier), no change to happiness
        }
        
        // Decrease happiness over time for testing - MARK: ADJUST THIS TIMING FOR PRODUCTION
        if (currentPet.happiness > 0) {
          updatePetStats(0, 0, -3); // No change to health, no change to hunger, -3 happiness (faster for testing)
        }
        
        // Decrease health if very hungry
        if (currentPet.hunger < 20 && currentPet.health > 0) {
          updatePetStats(-1, 0, 0); // -1 health, no change to hunger, no change to happiness
        }
      }, 10000); // 10 seconds - MARK: INCREASE THIS TO 30000 OR 60000 FOR PRODUCTION
    }
    
    return () => {
      if (statsInterval) clearInterval(statsInterval);
    };
  }, [currentPet]);

  // Fetch pet and inventory data
  const fetchPetData = async () => {
    try {
      setLoading(true);
      
      // Get user data from local storage or use a default mock ID
      let userId = 1; // Default mock user ID
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData && userData.id) {
          userId = userData.id;
        }
      } catch (error) {
        console.warn('Using default user ID for development');
      }
      
      // Fetch user's equipped pet
      const equippedPet = await getEquippedPet(userId).catch(() => {
        // If API fails, use mock data
        return {
          id: 5,
          name: "Frostweaver",
          nickname: "Frosty",
          current_level: 3,
          role: "mage",
          class_type: "Mage",
          health: 75,
          hunger: 60,
          happiness: 85,
          avatar_url: "/dummy1.png",
          current_hp: 100,
          current_mana: 50,
          current_atk: 30,
          current_def_phy: 15,
          current_def_magic: 45,
          current_agility: 20
        };
      });
      
      // Ensure pet stats are integers, not strings, and are within valid range (0-100)
      if (equippedPet) {
        equippedPet.health = Math.min(100, Math.max(0, parseInt(equippedPet.health) || 0));
        equippedPet.hunger = Math.min(100, Math.max(0, parseInt(equippedPet.hunger) || 0));
        equippedPet.happiness = Math.min(100, Math.max(0, parseInt(equippedPet.happiness) || 0));
      }
      
      if (!equippedPet) {
        toast.info('You don\'t have a pet equipped. Please equip a pet first.');
        setLoading(false);
        return;
      }
      
      // Fetch user's inventory for food items
      const inventory = await getUserInventory(userId).catch(() => {
        // If API fails, use mock food data
        return [
          { index_id: 1, item_name: 'Apple', item_type: 'food', amount: 5, pet_hunger: 15, pet_happiness: 10 },
          { index_id: 2, item_name: 'Cookie', item_type: 'food', amount: 3, pet_hunger: 10, pet_happiness: 15 },
          { index_id: 3, item_name: 'Steak', item_type: 'food', amount: 2, pet_hunger: 25, pet_happiness: 5 }
        ];
      });
      
      // Filter out food items from inventory
      const foodItems = Array.isArray(inventory) 
        ? inventory.filter(item => item.item_type === 'food' || item.item_type === 'Food')
        : [];
      
      // Calculate additional pet stats
      const petStats = {
        attackPower: equippedPet.current_atk || 0,
        defense: equippedPet.current_def_phy || 0,
        magicDefense: equippedPet.current_def_magic || 0,
        agility: equippedPet.current_agility || 0,
        experience: equippedPet.experience || 0,
        nextLevelExp: (equippedPet.current_level || 1) * 100,
      };
      
      setCurrentPet(equippedPet);
      setFoodItems(foodItems);
      setPetStats(petStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pet data:', error);
      setLoading(false);
      toast.error('Failed to load pet data');
    }
  };

  // Helper function to update pet stats both locally and in the database
  const updatePetStats = async (healthChange, hungerChange, happinessChange) => {
    if (!currentPet) return;
    
    // Convert current values to numbers if they're strings and calculate new values
    const currentHealth = parseInt(currentPet.health) || 0;
    const currentHunger = parseInt(currentPet.hunger) || 0;
    const currentHappiness = parseInt(currentPet.happiness) || 0;
    
    const newHealth = Math.min(100, Math.max(0, currentHealth + healthChange));
    const newHunger = Math.min(100, Math.max(0, currentHunger + hungerChange));
    const newHappiness = Math.min(100, Math.max(0, currentHappiness + happinessChange));
    
    // Only update if something changed
    if (newHealth === currentHealth && newHunger === currentHunger && newHappiness === currentHappiness) {
      return;
    }
    
    // Update local state immediately for responsive UI
    setCurrentPet(prev => ({
      ...prev,
      health: newHealth,
      hunger: newHunger,
      happiness: newHappiness
    }));
    
    // Try to update in the database (but don't block UI on failure)
    try {
      await updatePetStatus(currentPet.id, {
        health: newHealth,
        hunger: newHunger,
        happiness: newHappiness
      });
      
      console.log('Pet stats updated in database');
    } catch (error) {
      console.error('Failed to update pet stats in database:', error);
      // No need to show error toast as we've already updated the UI
    }
  };
  
  // Handle feeding the pet
  const handleFeedPet = async (foodItem) => {
    if (!foodItem || !currentPet) return;
    
    try {
      // Calculate health, hunger and happiness changes
      const hungerChange = (foodItem.pet_hunger || 10); // Increase hunger (positive = more full)
      const happinessChange = foodItem.pet_happiness || 5; // Increase happiness
      const healthChange = hungerChange > 20 ? 5 : 0; // Bonus health for very nutritious food
      
      // Update pet stats
      await updatePetStats(healthChange, hungerChange, happinessChange);
      
      // Update food item in inventory
      try {
        await useInventoryItem(foodItem.index_id, 1); // Use 1 unit of this item
        
        // Update local food items state
        setFoodItems(prev => {
          const updated = prev.map(item => {
            if (item.index_id === foodItem.item_id) {
              return { ...item, amount: item.amount - 1 };
            }
            return item;
          }).filter(item => item.amount > 0); // Remove items with 0 quantity
          
          return updated;
        });
      } catch (error) {
        console.error('Error using inventory item:', error);
      }
      
      toast.success(`Fed ${currentPet.nickname || currentPet.name} with ${foodItem.item_name}!`);
    } catch (error) {
      console.error('Error feeding pet:', error);
      toast.error('Failed to feed pet');
    }
  };
  
  // Handle playing with the pet
  const handlePlayWithPet = async () => {
    try {
      if (playingCooldown) {
        toast.info(`Play button on cooldown: ${remainingCooldown} seconds remaining`);
        return;
      }
      
      // Random happiness increase between 20-30%
      const happinessIncrease = Math.floor(Math.random() * 11) + 20; // 20-30
      
      // Update pet stats (allowing API call to fail gracefully)
      // Playing makes pet happier but hungrier (-5 hunger means getting hungrier)
      await updatePetStats(0, -5, happinessIncrease);
      
      // Set cooldown
      setPlayingCooldown(true);
      setRemainingCooldown(30); // 30 seconds (reduced for testing)
      
      toast.success(`Played with ${currentPet.nickname || currentPet.name}! Happiness increased by ${happinessIncrease}%`);
    } catch (error) {
      console.error('Error playing with pet:', error);
      // Don't show error toast in development to avoid annoying users
      // Instead, try to continue with local state changes
      setCurrentPet(prev => {
        if (!prev) return null;
        
        // Apply happiness increase and hunger decrease locally
        const newHappiness = Math.min(100, Math.max(0, prev.happiness + 25));
        const newHunger = Math.min(100, Math.max(0, prev.hunger - 5)); // Hunger decreases (gets hungrier)
        
        return {
          ...prev,
          happiness: newHappiness,
          hunger: newHunger
        };
      });
    }
  };

  // Calculate color for stat bars
  const getStatColor = (value) => {
    if (value <= 25) return '#ff5252'; // Red for low values
    if (value <= 50) return '#FFC107'; // Yellow for medium values
    if (value <= 75) return '#4CAF50'; // Green for good values
    return '#2ECC71'; // Bright green for excellent values
  };

  const handleBackToMiscPets = () => {
    navigate('/misc-pets');
  };

  if (loading) {
    return (
      <div className="petshouse-main-container">
        <Sidebar profilePic="/dummy.jpg" />
        <div className="petshouse-main-content">
          <Topbar />
          <div className="petshouse-loading-container">
            <div className="petshouse-loading-spinner"></div>
            <p>Loading pet data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!currentPet) {
    return (
      <div className="petshouse-main-container">
        <Sidebar profilePic="/dummy.jpg" />
        <div className="petshouse-main-content">
          <Topbar />
          <div className="petshouse-header">
            <button className="petshouse-back-button" onClick={handleBackToMiscPets}>
              ← Back to My Pets
            </button>
            <h1>Pet House</h1>
          </div>
          <div className="petshouse-content">
            <div className="petshouse-no-pet-message">
              <h2>No Pet Equipped</h2>
              <p>You need to equip a pet before you can interact with it in the Pet House.</p>
              <button className="petshouse-back-button" onClick={handleBackToMiscPets}>
                Go to My Pets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="petshouse-main-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="petshouse-main-content">
        <Topbar />

        <div className="petshouse-header">
          <button className="petshouse-back-button" onClick={handleBackToMiscPets}>
            ← Back to My Pets
          </button>
          <h1>Pet House</h1>
        </div>

        <div className="petshouse-content">
          <div className="petshouse-details-card">
            <div className="petshouse-avatar-container">
              <div className="petshouse-avatar">
                <img 
                  src={currentPet.avatar_url || `/dummy1.png`} 
                  alt={currentPet.name}
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "/dummy1.png";
                  }}
                />
                <div className="petshouse-level">Level {currentPet.current_level || 1}</div>
              </div>
            </div>
            
            <div className="petshouse-info">
              <h2 className="petshouse-name">{currentPet.nickname || currentPet.name}</h2>
              <p className="petshouse-class">{currentPet.role || currentPet.class_type}</p>
              
              <div className="petshouse-stats">
                <div className="petshouse-stat">
                  <span className="petshouse-stat-label">Health</span>
                  <div className="petshouse-stat-bar">
                    <div 
                      className="petshouse-stat-fill health" 
                      style={{ 
                        width: `${currentPet.health}%`,
                        backgroundColor: getStatColor(currentPet.health)
                      }}
                    ></div>
                  </div>
                  <span className="petshouse-stat-value">{parseInt(currentPet.health) || 0}%</span>
                </div>
                
                <div className="petshouse-stat">
                  <span className="petshouse-stat-label">Hunger</span>
                  <div className="petshouse-stat-bar">
                    <div 
                      className="petshouse-stat-fill hunger" 
                      style={{ 
                        width: `${currentPet.hunger}%`,
                        backgroundColor: getStatColor(currentPet.hunger)
                      }}
                    ></div>
                  </div>
                  <span className="petshouse-stat-value">{parseInt(currentPet.hunger) || 0}%</span>
                </div>
                
                <div className="petshouse-stat">
                  <span className="petshouse-stat-label">Happiness</span>
                  <div className="petshouse-stat-bar">
                    <div 
                      className="petshouse-stat-fill happiness" 
                      style={{ 
                        width: `${currentPet.happiness}%`,
                        backgroundColor: getStatColor(currentPet.happiness)
                      }}
                    ></div>
                  </div>
                  <span className="petshouse-stat-value">{parseInt(currentPet.happiness) || 0}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="petshouse-actions">
            <button 
              className={`petshouse-action-button ${playingCooldown ? 'cooldown' : ''}`}
              onClick={handlePlayWithPet}
              disabled={playingCooldown}
            >
              {playingCooldown 
                ? `Play (${remainingCooldown}s)` 
                : 'Play with Pet'}
            </button>
            
            <button 
              className="petshouse-action-button"
              onClick={() => setShowFoodMenu(!showFoodMenu)}
            >
              {showFoodMenu ? 'Hide Food Menu' : 'Feed Pet'}
            </button>
          </div>
          
          {showFoodMenu && (
            <div className="petshouse-food-menu">
              <h3>Available Food</h3>
              {foodItems.length === 0 ? (
                <p className="petshouse-no-food-message">You don't have any food items.</p>
              ) : (
                <div className="petshouse-food-items-grid">
                  {foodItems.map((food) => (
                    <div className="petshouse-food-item" key={food.index_id}>
                      <div className="petshouse-food-item-name">{food.item_name}</div>
                      <div className="petshouse-food-item-qty">Qty: {food.amount}</div>
                      <button 
                        className="petshouse-food-use-button"
                        onClick={() => handleFeedPet(food)}
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="petshouse-info-card">
            <h3>Pet Stats</h3>
            <div className="petshouse-info-grid">
              <div className="petshouse-info-item">
                <span className="petshouse-info-label">Attack Power</span>
                <span className="petshouse-info-value">{petStats.attackPower || currentPet.current_atk || 0}</span>
              </div>
              <div className="petshouse-info-item">
                <span className="petshouse-info-label">Physical Defense</span>
                <span className="petshouse-info-value">{petStats.defense || currentPet.current_def_phy || 0}</span>
              </div>
              <div className="petshouse-info-item">
                <span className="petshouse-info-label">Magic Defense</span>
                <span className="petshouse-info-value">{petStats.magicDefense || currentPet.current_def_magic || 0}</span>
              </div>
              <div className="petshouse-info-item">
                <span className="petshouse-info-label">Agility</span>
                <span className="petshouse-info-value">{petStats.agility || currentPet.current_agility || 0}</span>
              </div>
              <div className="petshouse-info-item">
                <span className="petshouse-info-label">Experience</span>
                <span className="petshouse-info-value">
                  {petStats.experience || 0} / {petStats.nextLevelExp || 100}
                </span>
              </div>
              <div className="petshouse-info-item">
                <span className="petshouse-info-label">Mana</span>
                <span className="petshouse-info-value">{currentPet.current_mana || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="petshouse-status-message">
            {currentPet.hunger <= 20 && (
              <p className="petshouse-status-warning">Your pet is very hungry! Feed it soon.</p>
            )}
            {currentPet.happiness <= 20 && (
              <p className="petshouse-status-warning">Your pet is unhappy! Play with it to cheer it up.</p>
            )}
            {currentPet.health <= 20 && (
              <p className="petshouse-status-warning">Your pet's health is low! Make sure it's fed and happy.</p>
            )}
            {currentPet.hunger > 70 && currentPet.happiness > 70 && currentPet.health > 70 && (
              <p className="petshouse-status-good">Your pet is doing great! Keep it up!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Petshouse;
