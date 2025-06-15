import React, { useState, useEffect } from 'react';
import './MiscPets.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Default pet images - modify these to match your asset paths
import defaultMageImg from '../../assets/mix pets/dummy1.jpg';
import defaultWarriorImg from '../../assets/mix pets/dummy.jpg';
import defaultAssassinImg from '../../assets/mix pets/dummy3.jpg';
import defaultHealerImg from '../../assets/mix pets/dummy2.jpg';

const API_URL = 'http://localhost:5000/api'; // Update with your actual API base URL
const CURRENT_USER_ID = 1; // For testing, we're using user ID 1

// Function to get the appropriate pet image based on role
const getPetImage = (role) => {
  switch (role.toLowerCase()) {
    case 'mage':
      return defaultMageImg;
    case 'warrior':
      return defaultWarriorImg;
    case 'assassin':
      return defaultAssassinImg;
    case 'healer':
      return defaultHealerImg;
    default:
      return defaultWarriorImg; // Default image
  }
};

// Function to get the appropriate role icon based on role
const getRoleIcon = (role) => {
  switch (role.toLowerCase()) {
    case 'mage':
      return '🔮';
    case 'warrior':
      return '🛡';
    case 'assassin':
      return '🗡';
    case 'healer':
      return '❤';
    default:
      return '❓';
  }
};

const MiscPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [equippedPetId, setEquippedPetId] = useState(null);
  const navigate = useNavigate();

  // Pet status simulation (happiness, hunger, health)
  const [petStatuses, setPetStatuses] = useState({});

  // Fetch user's pets from the API
  useEffect(() => {
    const fetchUserPets = async () => {
      try {
        setLoading(true);
        
        // In a real app, you'd fetch from your actual API endpoint
        // For now, we'll simulate by fetching from our local UserPets table
        // const response = await axios.get(`${API_URL}/pets/user/${CURRENT_USER_ID}`);
        
        // For demo/development: Use hardcoded data since our API might require auth
        const mockPets = [
          {
            id: 5,
            name: "Frostweaver",
            level: 1,
            role: "mage",
            rarity: "epic",
            image: getPetImage('mage'),
            equipped: true,
            stats: {
              ATK: "80/80",
              HP: "40/40",
              DEF_PHY: "30/30",
              DEF_MAGE: "70/70",
              MAX_MANA: "90/90",
              AGILITY: "40/40"
            }
          },
          {
            id: 6,
            name: "Viperstrike",
            level: 1,
            role: "assassin",
            rarity: "epic",
            image: getPetImage('assassin'),
            equipped: false,
            stats: {
              ATK: "90/90",
              HP: "42/42",
              DEF_PHY: "50/50",
              DEF_MAGE: "30/30",
              MAX_MANA: "60/60",
              AGILITY: "95/95"
            }
          },
          {
            id: 7,
            name: "Stoneguard",
            level: 1,
            role: "warrior",
            rarity: "epic",
            image: getPetImage('warrior'),
            equipped: false,
            stats: {
              ATK: "40/40",
              HP: "95/95",
              DEF_PHY: "90/90",
              DEF_MAGE: "85/85",
              MAX_MANA: "30/30",
              AGILITY: "20/20"
            }
          },
          {
            id: 8,
            name: "Natureblossom",
            level: 1,
            role: "healer",
            rarity: "epic",
            image: getPetImage('healer'),
            equipped: false,
            stats: {
              ATK: "40/40",
              HP: "60/60",
              DEF_PHY: "40/40",
              DEF_MAGE: "60/60",
              MAX_MANA: "80/80",
              AGILITY: "65/65"
            }
          }
        ];
        
        setPets(mockPets);
        
        // Initialize pet statuses
        const mockStatuses = {};
        mockPets.forEach(pet => {
          mockStatuses[pet.id] = { 
            happiness: 100, 
            hunger: Math.floor(Math.random() * 50),
            health: 100 
          };
        });
        setPetStatuses(mockStatuses);
        
        // Set initially equipped pet
        const equippedPet = mockPets.find(pet => pet.equipped);
        if (equippedPet) {
          setEquippedPetId(equippedPet.id);
        }

      } catch (err) {
        console.error('Error fetching pets:', err);
        setError('Failed to fetch your pets. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPets();
  }, []);

  // Simulate pet status changes over time
  useEffect(() => {
    const interval = setInterval(() => {
      setPetStatuses((prevStatuses) => {
        const updated = { ...prevStatuses };
        Object.keys(updated).forEach((id) => {
          updated[id] = {
            happiness: Math.max(0, updated[id].happiness - 1),
            hunger: Math.min(100, updated[id].hunger + 1),
            health: Math.max(0, updated[id].health - (updated[id].hunger > 80 ? 1 : 0))
          };
        });
        return updated;
      });
    }, 10000); // Slower rate for demo purposes
    return () => clearInterval(interval);
  }, []);

  // Event handlers for filters
  const handleRoleChange = (e) => setSelectedRole(e.target.value.toLowerCase());
  const handleStatusChange = (e) => setSelectedStatus(e.target.value.toUpperCase().replace('-', '_'));
  const handleRarityChange = (e) => setSelectedRarity(e.target.value.toLowerCase());
  const handleResetFilter = () => {
    setSelectedRole('');
    setSelectedStatus('');
    setSelectedRarity('');
  };

  // Pet interaction handlers
  const handleEquipClick = async (petId) => {
    try {
      // In a real app, you'd make an API call to update the pet's equipped status
      // For now, we'll just update the state locally
      setEquippedPetId(prevId => prevId === petId ? null : petId);
      
      // Update the UI immediately for better UX
      setPets(prevPets => 
        prevPets.map(pet => ({
          ...pet,
          equipped: pet.id === petId ? !pet.equipped : false
        }))
      );
      
      // Here you would make an actual API call:
      // await axios.post(`${API_URL}/pets/equip`, { userId: CURRENT_USER_ID, petId, equipped: true });
      
    } catch (err) {
      console.error('Error equipping pet:', err);
      // Revert the UI change if the API call fails
    }
  };

  const feedPet = (id) => {
    setPetStatuses(prev => ({
      ...prev,
      [id]: { ...prev[id], hunger: Math.max(0, prev[id].hunger - 20) }
    }));
    
    // In a real app, you'd also make an API call to update the pet's status
  };

  const playWithPet = (id) => {
    setPetStatuses(prev => ({
      ...prev,
      [id]: { ...prev[id], happiness: Math.min(100, prev[id].happiness + 10) }
    }));
    
    // In a real app, you'd also make an API call to update the pet's status
  };

  const healPet = (id) => {
    setPetStatuses(prev => ({
      ...prev,
      [id]: { ...prev[id], health: Math.min(100, prev[id].health + 15) }
    }));
    
    // In a real app, you'd also make an API call to update the pet's status
  };

  const getStatPercent = (statString) => {
    const [current, max] = statString.split('/').map(Number);
    return Math.round((current / max) * 100);
  };

  // Filter pets based on selected filters
  let filteredPets = [...pets];
  if (selectedRole) filteredPets = filteredPets.filter(pet => pet.role.toLowerCase() === selectedRole);
  if (selectedRarity) filteredPets = filteredPets.filter(pet => pet.rarity.toLowerCase() === selectedRarity);
  if (selectedStatus) {
    filteredPets.sort((a, b) => {
      const aVal = Number(a.stats[selectedStatus]?.split('/')[0] || 0);
      const bVal = Number(b.stats[selectedStatus]?.split('/')[0] || 0);
      return bVal - aVal;
    });
  }

  const handleGoToPetHouse = () => {
    navigate('/pet-house');
  };

  if (loading) {
    return (
      <div className="misc-pets-container">
        <Sidebar profilePic="/dummy.jpg" />
        <div className="misc-pets-content">
          <Topbar />
          <div className="loading-container">
            <h2>Loading your pets...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="misc-pets-container">
        <Sidebar profilePic="/dummy.jpg" />
        <div className="misc-pets-content">
          <Topbar />
          <div className="error-container">
            <h2>Error!</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="misc-pets-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="misc-pets-content">
        <Topbar />
        
        <div className="misc-pets-header-container">
          <div className="misc-pets-header">
            <h1>My Pets</h1>
          </div>
          
          <div className="misc-pets-controls">
            <button className="misc-pets-house-button" onClick={handleGoToPetHouse}>
              Go to Pet House
            </button>
            
            <div className="misc-pets-filter-container">
              <div className="misc-pets-filter-item">
                <label htmlFor="roleFilter">Sort by Role:</label>
                <select id="roleFilter" onChange={handleRoleChange} value={selectedRole}>
                  <option value="">All Roles</option>
                  <option value="assassin">Assassin</option>
                  <option value="warrior">Warrior</option>
                  <option value="mage">Mage</option>
                  <option value="healer">Healer</option>
                </select>
              </div>
              <div className="misc-pets-filter-item">
                <label htmlFor="statusFilter">Sort by Status:</label>
                <select id="statusFilter" onChange={handleStatusChange} value={selectedStatus}>
                  <option value="">All Status</option>
                  <option value="ATK">ATK</option>
                  <option value="HP">HP</option>
                  <option value="DEF_PHY">DEF PHY</option>
                  <option value="DEF_MAGE">DEF MAGIC</option>
                  <option value="MAX_MANA">MAX MANA</option>
                  <option value="AGILITY">AGILITY</option>
                </select>
              </div>
              <div className="misc-pets-filter-item">
                <label htmlFor="rarityFilter">Sort by Rarity:</label>
                <select id="rarityFilter" onChange={handleRarityChange} value={selectedRarity}>
                  <option value="">All Rarity</option>
                  <option value="legendary">Legendary</option>
                  <option value="epic">Epic</option>
                  <option value="rare">Rare</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="common">Common</option>
                </select>
              </div>
              <div className="misc-pets-filter-item">
                <button className="misc-pets-reset-button" onClick={handleResetFilter}>Reset Filter</button>
              </div>
            </div>
          </div>
        </div>

        <div className="misc-pets-card-container">
          {filteredPets.length > 0 ? (
            filteredPets.map((pet) => {
              const isEquipped = pet.equipped;
              return (
                <div className={`misc-pet-card ${isEquipped ? 'equipped-glow' : ''}`} key={pet.id}>
                  <div className="role-icon">
                    {getRoleIcon(pet.role)}
                  </div>
                  <div className={`rarity-text rarity-${pet.rarity.toLowerCase()}`}>{pet.rarity}</div>
                  <div className="pet-name">{pet.name}</div>
                  <img src={pet.image} alt={pet.name} className="pet-image" />
                  <div className="pet-info">
                    <div>Level: {pet.level}</div>
                    <div>Role: {pet.role}</div>
                  </div>
                  <div className="pet-stats">
                    {Object.entries(pet.stats).map(([key, value]) => {
                      const percent = getStatPercent(value);
                      return (
                        <div key={key} className="stat-line">
                          <div className="stat-label">{key.replace('_', ' ')}: {value}</div>
                          <div className="stat-bar-background">
                            <div className="stat-bar-fill" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="real-time-status">
                    {['happiness', 'hunger', 'health'].map((statusKey) => {
                      const value = petStatuses[pet.id]?.[statusKey] ?? 0;
                      const barColor = 
                        statusKey === 'hunger' ? '#f39c12' : 
                        statusKey === 'health' ? '#e74c3c' : '#3498db';
                      
                      return (
                        <div key={statusKey} className="stat-line">
                          <div className="stat-label">{statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}: {value}%</div>
                          <div className="stat-bar-background">
                            <div
                              className="stat-bar-fill"
                              style={{ 
                                width: `${value}%`, 
                                backgroundColor: barColor 
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pet-actions">
                    <button className="action-button" onClick={() => feedPet(pet.id)}>🍖 Feed</button>
                    <button className="action-button" onClick={() => playWithPet(pet.id)}>🎾 Play</button>
                    <button className="action-button" onClick={() => healPet(pet.id)}>💊 Heal</button>
                  </div>
                  <div className="select-button-container">
                    <button 
                      className={`select-button ${isEquipped ? 'equipped' : ''}`} 
                      onClick={() => handleEquipClick(pet.id)}
                    >
                      {isEquipped ? 'Equipped ✅' : 'Equip'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-pets-message">
              <h2>No pets match your filters</h2>
              <button onClick={handleResetFilter}>Reset Filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiscPets;
