import React, { useState, useEffect } from 'react';
import './MiscPets.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { equipPet } from '../../services/petsService';
// For toast notifications
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Default pet images - modify these to match your asset paths
import defaultMageImg from '../../assets/mix pets/dummy1.jpg';
import defaultWarriorImg from '../../assets/mix pets/dummy.jpg';
import defaultAssassinImg from '../../assets/mix pets/dummy3.jpg';
import defaultHealerImg from '../../assets/mix pets/dummy2.jpg';

// Icons
import { FaSearch, FaCrown, FaInfoCircle, FaPaw, FaStar, FaSort, FaChessQueen } from 'react-icons/fa';
import { GiDiamondHard, GiHeartPlus, GiMuscleUp, GiFoodChain, GiSparkles } from 'react-icons/gi';
import { MdShield, MdOutlineSpeed, MdFilterListAlt, MdChevronLeft, MdChevronRight, MdPets } from 'react-icons/md';
import { RiMagicLine, RiHeartPulseFill, RiFireLine, RiShieldFlashLine, RiGamepadLine } from 'react-icons/ri';

const CURRENT_USER_ID = 1; // For testing, we're using user ID 1

// Get pet image based on role
const getPetImage = (role) => {
  switch (role.toLowerCase()) {
    case 'mage': return defaultMageImg;
    case 'warrior': return defaultWarriorImg;
    case 'assassin': return defaultAssassinImg;
    case 'healer': return defaultHealerImg;
    default: return defaultWarriorImg;
  }
};

// Get role icon based on role
const getRoleIcon = (role) => {
  switch (role.toLowerCase()) {
    case 'mage': return <RiMagicLine />;
    case 'warrior': return <RiShieldFlashLine />;
    case 'assassin': return <RiFireLine />;
    case 'healer': return <RiHeartPulseFill />;
    default: return <FaInfoCircle />;
  }
};

// Get stat icon based on stat type
const getStatIcon = (statType) => {
  switch (statType) {
    case 'ATK': return <GiMuscleUp className="stat-icon attack" />;
    case 'HP': return <RiHeartPulseFill className="stat-icon health" />;
    case 'DEF_PHY': return <MdShield className="stat-icon def-phy" />;
    case 'DEF_MAGE': return <RiShieldFlashLine className="stat-icon def-magic" />;
    case 'MAX_MANA': return <RiMagicLine className="stat-icon mana" />;
    case 'AGILITY': return <MdOutlineSpeed className="stat-icon agility" />;
    default: return <FaInfoCircle className="stat-icon" />;
  }
};

// Get color based on rarity
const getRarityColor = (rarity) => {
  switch (rarity?.toLowerCase()) {
    case 'legendary': return '#FFA500';
    case 'epic': return '#9013FE';
    case 'rare': return '#0070DD';
    case 'uncommon': return '#1EFF00';
    case 'common': return '#FFFFFF';
    default: return '#FFFFFF';
  }
};

const MiscPets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStat, setSelectedStat] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [activeTab, setActiveTab] = useState('collection');
  const [selectedPet, setSelectedPet] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const navigate = useNavigate();

  // Pet status simulation (happiness, hunger, health)
  const [petStatuses, setPetStatuses] = useState({});
  
  // Fetch user's pets from the API
  useEffect(() => {
    const fetchUserPets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a production app, we'd use:
        // const response = await axios.get(`/api/users/${CURRENT_USER_ID}/pets`);
        // const userPets = response.data;
        
        // For now, using static data for user_id 1 (pets with IDs 5-8)
        const mockPets = [
          {
            id: 5,
            name: "Frostweaver",
            level: 3,
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
            },
            description: "A powerful frost mage with mastery over ice and snow, specializing in crowd control and area damage."
          },
          {
            id: 6,
            name: "Viperstrike",
            level: 2,
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
            },
            description: "A venomous assassin pet that specializes in dealing damage over time through deadly poisons."
          },
          {
            id: 7,
            name: "Stoneguard",
            level: 2,
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
            },
            description: "An earthen warrior with rocky skin, granting immense durability at the cost of mobility."
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
            },
            description: "A nature-attuned healer pet that harnesses the power of plants to provide healing and regenerative support."
          }
        ];
        
        // Load pets from localStorage if available
        const savedPets = localStorage.getItem('userPets');
        let petsToUse = mockPets;
        
        if (savedPets) {
          try {
            const parsedPets = JSON.parse(savedPets);
            if (Array.isArray(parsedPets) && parsedPets.length > 0) {
              petsToUse = parsedPets;
              console.log('Loaded pets from localStorage:', petsToUse);
            }
          } catch (e) {
            console.error('Error parsing saved pets:', e);
          }
        }
        
        // Make sure we have consistent equipped/is_equipped property
        petsToUse = petsToUse.map(pet => ({
          ...pet,
          equipped: pet.equipped || pet.is_equipped || false,
          is_equipped: pet.equipped || pet.is_equipped || false
        }));
        
        // Save to localStorage for persistence
        localStorage.setItem('userPets', JSON.stringify(petsToUse));
        
        setPets(petsToUse);
        
        // Initialize pet statuses with random values for simulation
        const mockStatuses = {};
        petsToUse.forEach(pet => {
          mockStatuses[pet.id] = { 
            happiness: Math.floor(Math.random() * 30) + 70, // 70-100%
            hunger: Math.floor(Math.random() * 40) + 10,    // 10-50%
            health: Math.floor(Math.random() * 20) + 80     // 80-100%
          };
        });
        setPetStatuses(mockStatuses);
        
        // Set initially equipped pet
        const equippedPet = petsToUse.find(pet => pet.equipped || pet.is_equipped);
        if (equippedPet) {
          setSelectedPet(equippedPet);
          
          // Make sure the equipped pet is saved properly
          localStorage.setItem('equippedPet', JSON.stringify(equippedPet));
        } else if (petsToUse.length > 0) {
          setSelectedPet(petsToUse[0]);
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

  // Real-time pet status simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPetStatuses(prevStatuses => {
        const updated = { ...prevStatuses };
        Object.keys(updated).forEach(id => {
          // Slowly decrease happiness, increase hunger, and adjust health based on hunger
          updated[id] = {
            happiness: Math.max(0, updated[id].happiness - 0.3),
            hunger: Math.min(100, updated[id].hunger + 0.4),
            health: Math.max(0, updated[id].health - (updated[id].hunger > 70 ? 0.2 : 0))
          };
        });
        return updated;
      });
    }, 10000); // Every 10 seconds for demo purposes
    
    return () => clearInterval(interval);
  }, []);

  // Handle filters and sorting
  const handleRoleFilter = (e) => setSelectedRole(e.target.value);
  const handleStatSort = (e) => setSelectedStat(e.target.value);
  const handleRarityFilter = (e) => setSelectedRarity(e.target.value);
  const handleSearch = (e) => setSearchQuery(e.target.value);
  const handleSortOrderToggle = () => setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
  
  const resetFilters = () => {
    setSelectedRole('');
    setSelectedStat('');
    setSelectedRarity('');
    setSearchQuery('');
    setSortOrder('desc');
  };

  // Pet interaction handlers
  const handleEquipPet = async (petId) => {
    try {
      const userId = localStorage.getItem('userId') || CURRENT_USER_ID;

      // Find the complete pet object
      const petToEquip = pets.find((pet) => pet.id === petId);
      if (!petToEquip) {
        throw new Error(`Pet with ID ${petId} not found`);
      }

      // Update local state first for immediate feedback
      setPets((prevPets) =>
        prevPets.map((pet) => ({
          ...pet,
          equipped: pet.id === petId,
          is_equipped: pet.id === petId, // Set both properties for compatibility
        }))
      );

      // Set selected pet as equipped
      if (selectedPet && selectedPet.id === petId) {
        setSelectedPet({
          ...selectedPet,
          equipped: true,
          is_equipped: true,
        });
      }

      // Get the pet name for the toast
      const petName = petToEquip.name || 'Pet';

      // Save the complete pet object to localStorage for persistence
      localStorage.setItem('userPets', JSON.stringify(
        pets.map(pet => ({
          ...pet,
          equipped: pet.id === petId,
          is_equipped: pet.id === petId
        }))
      ));

      // Call the API to update the equipped pet in the database and save to localStorage
      await equipPet(userId, petId);

      toast.success(`${petName} equipped successfully!`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      toast.error('Failed to equip pet. Please try again.');
      console.error('Error in handleEquipPet:', error);

      // Revert the local state change if the API call failed
      setPets((prevPets) =>
        prevPets.map((pet) => ({
          ...pet,
          equipped: pet.id !== petId && pet.equipped,
          is_equipped: pet.id !== petId && pet.is_equipped,
        }))
      );
    }
  };

  const feedPet = (id) => {
    try {
      setPetStatuses(prev => ({
        ...prev,
        [id]: { 
          ...prev[id], 
          hunger: Math.max(0, prev[id].hunger - 20),
          health: Math.min(100, prev[id].health + 5) 
        }
      }));
      
      // Get the pet name for the toast
      const petName = pets.find(pet => pet.id === id)?.name || 'Pet';
      toast.success(`${petName} has been fed!`, {
        position: "top-right",
        autoClose: 2000,
      });
      
      // In a real app, you'd make an API call here to update the pet's status
    } catch (error) {
      toast.error('Failed to feed pet. Please try again.');
      console.error('Error in feedPet:', error);
    }
  };

  const playWithPet = (id) => {
    try {
      setPetStatuses(prev => ({
        ...prev,
        [id]: { 
          ...prev[id], 
          happiness: Math.min(100, prev[id].happiness + 15),
          hunger: Math.min(100, prev[id].hunger + 5)
        }
      }));
      
      // Get the pet name for the toast
      const petName = pets.find(pet => pet.id === id)?.name || 'Pet';
      toast.success(`You played with ${petName}!`, {
        position: "top-right",
        autoClose: 2000,
      });
      
      // In a real app, you'd make an API call here to update the pet's status
    } catch (error) {
      toast.error('Failed to play with pet. Please try again.');
      console.error('Error in playWithPet:', error);
    }
  };

  const healPet = (id) => {
    try {
      setPetStatuses(prev => ({
        ...prev,
        [id]: { ...prev[id], health: Math.min(100, prev[id].health + 25) }
      }));
      
      // Get the pet name for the toast
      const petName = pets.find(pet => pet.id === id)?.name || 'Pet';
      toast.success(`${petName} has been healed!`, {
        position: "top-right",
        autoClose: 2000,
      });
      
      // In a real app, you'd make an API call here to update the pet's status
    } catch (error) {
      toast.error('Failed to heal pet. Please try again.');
      console.error('Error in healPet:', error);
    }
  };

  // Navigation between pets in detail view
  const handleSelectPet = (pet) => {
    setSelectedPet(pet);
    setActiveTab('details');
  };

  const navigateToPrevPet = () => {
    if (!selectedPet) return;
    const currentIndex = pets.findIndex(pet => pet.id === selectedPet.id);
    const prevIndex = (currentIndex - 1 + pets.length) % pets.length;
    setSelectedPet(pets[prevIndex]);
  };

  const navigateToNextPet = () => {
    if (!selectedPet) return;
    const currentIndex = pets.findIndex(pet => pet.id === selectedPet.id);
    const nextIndex = (currentIndex + 1) % pets.length;
    setSelectedPet(pets[nextIndex]);
  };

  // Calculate stat percentage for progress bars
  const getStatPercent = (statString) => {
    const [current, max] = statString.split('/').map(Number);
    return Math.round((current / max) * 100);
  };

  // Filter and sort pets
  let filteredPets = [...pets];
  
  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredPets = filteredPets.filter(pet => 
      pet.name.toLowerCase().includes(query) || 
      pet.role.toLowerCase().includes(query) ||
      pet.rarity.toLowerCase().includes(query)
    );
  }
  
  // Apply role filter
  if (selectedRole) {
    filteredPets = filteredPets.filter(pet => 
      pet.role.toLowerCase() === selectedRole.toLowerCase()
    );
  }
  
  // Apply rarity filter
  if (selectedRarity) {
    filteredPets = filteredPets.filter(pet => 
      pet.rarity.toLowerCase() === selectedRarity.toLowerCase()
    );
  }
  
  // Apply stat sorting
  if (selectedStat) {
    filteredPets.sort((a, b) => {
      const aVal = Number(a.stats[selectedStat]?.split('/')[0] || 0);
      const bVal = Number(b.stats[selectedStat]?.split('/')[0] || 0);
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  // Handle navigation to Pet House
  const handleGoToPetHouse = () => {
    navigate('/pet-house');
  };

  // Loading state
  if (loading) {
    return (
      <div className="pets-container">
        <Sidebar profilePic="/dummy.jpg" />
        <div className="pets-content">
          <Topbar />
          <div className="pets-loading pets-animated-fade">
            <div className="pets-loading-spinner"></div>
            <h2>Loading your pets collection...</h2>
            <p>This won't take long...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pets-container">
        <Sidebar profilePic="/dummy.jpg" />
        <div className="pets-content">
          <Topbar />
          <div className="pets-error pets-animated-fade">
            <div className="pets-error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="pets-retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pets-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="pets-content">
        <Topbar />
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        
        {/* Main Header with Tabs */}
        <div className="pets-header">
          <div className="pets-title-wrapper">
            <div className="pets-title-icon">
              <MdPets />
            </div>
            <h1 className="pets-title">My Pets Collection</h1>
          </div>
          
          <div className="pets-tabs">
            <button 
              className={`pets-tab ${activeTab === 'collection' ? 'active' : ''}`}
              onClick={() => setActiveTab('collection')}
            >
              <FaPaw className="tab-icon" />
              Collection
            </button>
            <button 
              className={`pets-tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => selectedPet && setActiveTab('details')}
              disabled={!selectedPet}
            >
              <FaInfoCircle className="tab-icon" />
              Pet Details
            </button>            
              <button className="pets-house-btn" onClick={handleGoToPetHouse}>
              <GiSparkles className="btn-icon" />
              Pet House
            </button>
          </div>
        </div>
        
        {/* Collection View */}
        {activeTab === 'collection' && (
          <div className="pets-collection">
            {/* Search & Filter Bar */}
            <div className="pets-control-panel">
              <div className="pets-search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search pets..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pets-search-input"
                />
              </div>
              
              <div className="pets-filter-controls">
                <button 
                  className="pets-filter-toggle"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <MdFilterListAlt />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                
                <button 
                  className="pets-sort-toggle"
                  onClick={handleSortOrderToggle}
                  title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  <FaSort />
                  {sortOrder === 'asc' ? 'ASC' : 'DESC'}
                </button>
              </div>
            </div>
            
            {/* Filter Panel */}
            {showFilters && (
              <div className="pets-filters-panel">
                <div className="filter-group">
                  <label htmlFor="role-filter">Role</label>
                  <select 
                    id="role-filter" 
                    value={selectedRole}
                    onChange={handleRoleFilter}
                  >
                    <option value="">All Roles</option>
                    <option value="mage">Mage</option>
                    <option value="warrior">Warrior</option>
                    <option value="assassin">Assassin</option>
                    <option value="healer">Healer</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="stat-sort">Sort by Stat</label>
                  <select 
                    id="stat-sort" 
                    value={selectedStat}
                    onChange={handleStatSort}
                  >
                    <option value="">No Sorting</option>
                    <option value="ATK">Attack</option>
                    <option value="HP">Health</option>
                    <option value="DEF_PHY">Physical Defense</option>
                    <option value="DEF_MAGE">Magical Defense</option>
                    <option value="MAX_MANA">Mana</option>
                    <option value="AGILITY">Agility</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="rarity-filter">Rarity</label>
                  <select 
                    id="rarity-filter" 
                    value={selectedRarity}
                    onChange={handleRarityFilter}
                  >
                    <option value="">All Rarities</option>
                    <option value="legendary">Legendary</option>
                    <option value="epic">Epic</option>
                    <option value="rare">Rare</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="common">Common</option>
                  </select>
                </div>
                
                <button 
                  className="reset-filters-btn"
                  onClick={resetFilters}
                >
                  Reset Filters
                </button>
              </div>
            )}
            
            {/* Pet Cards Grid */}
            <div className="pets-grid">
              {filteredPets.length > 0 ? (
                filteredPets.map((pet, index) => (
                  <div 
                    key={pet.id}
                    className={`pet-card pets-animated-fade ${pet.is_equipped ? 'equipped' : ''}`}
                    onClick={() => handleSelectPet(pet)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    aria-label={`${pet.name}, ${pet.rarity} ${pet.role} pet, level ${pet.level}`}
                    tabIndex={0}
                  >
                    <div className="pet-card-header">
                      <div 
                        className="pet-role"
                        style={{ color: getRarityColor(pet.rarity) }}
                      >
                        {getRoleIcon(pet.role)}
                        <span>{pet.role}</span>
                      </div>
                      
                      <div className="pet-rarity">
                        <FaStar className="rarity-icon" style={{ color: getRarityColor(pet.rarity) }} />
                        <span style={{ color: getRarityColor(pet.rarity) }}>{pet.rarity}</span>
                      </div>
                      
                      {pet.is_equipped && (
                        <div className="pet-equipped-badge pulse-animation">
                          <FaChessQueen />
                        </div>
                      )}
                    </div>
                    
                    <div className="pet-card-content">
                      <div className="pet-image-container">
                        <img 
                          src={pet.image} 
                          alt={pet.name} 
                          className="pet-image" 
                        />
                        <div className="pet-level-badge">LVL {pet.level}</div>
                      </div>
                      
                      <div className="pet-info">
                        <h3 className="pet-name">{pet.name}</h3>
                        
                        <div className="pet-status-bars">
                          <div className="pet-status">
                            <div className="status-label">
                              <RiHeartPulseFill className="status-icon health" />
                              <span>Health</span>
                            </div>
                            <div className="status-bar">
                              <div 
                                className="status-fill health"
                                style={{ width: `${petStatuses[pet.id]?.health || 0}%` }}
                              ></div>
                            </div>
                            <span className="status-value">{petStatuses[pet.id]?.health || 0}%</span>
                          </div>
                          
                          <div className="pet-status">
                            <div className="status-label">
                              <GiFoodChain className="status-icon hunger" />
                              <span>Hunger</span>
                            </div>
                            <div className="status-bar">
                              <div 
                                className="status-fill hunger"
                                style={{ width: `${petStatuses[pet.id]?.hunger || 0}%` }}
                              ></div>
                            </div>
                            <span className="status-value">{petStatuses[pet.id]?.hunger || 0}%</span>
                          </div>
                          
                          <div className="pet-status">
                            <div className="status-label">
                              <GiHeartPlus className="status-icon happiness" />
                              <span>Happiness</span>
                            </div>
                            <div className="status-bar">
                              <div 
                                className="status-fill happiness"
                                style={{ width: `${petStatuses[pet.id]?.happiness || 0}%` }}
                              ></div>
                            </div>
                            <span className="status-value">{petStatuses[pet.id]?.happiness || 0}%</span>
                          </div>
                        </div>
                        
                        <div className="pet-stats-summary">
                          {Object.entries(pet.stats)
                            .filter(([key]) => ['ATK', 'HP', 'AGILITY'].includes(key))
                            .map(([key, value]) => (
                              <div className="pet-stat" key={key}>
                                <div className="stat-icon-wrapper">
                                  {getStatIcon(key)}
                                </div>
                                <div className="stat-value">{value}</div>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="pet-card-actions">
                      <button 
                        className="pet-action feed hover-effect" 
                        onClick={(e) => { e.stopPropagation(); feedPet(pet.id); }}
                        aria-label={`Feed ${pet.name}`}
                      >
                        <GiFoodChain /> Feed
                      </button>
                      <button 
                        className="pet-action play hover-effect" 
                        onClick={(e) => { e.stopPropagation(); playWithPet(pet.id); }}
                        aria-label={`Play with ${pet.name}`}
                      >
                        <RiGamepadLine /> Play
                      </button>
                      <button 
                        className="pet-action heal hover-effect" 
                        onClick={(e) => { e.stopPropagation(); healPet(pet.id); }}
                        aria-label={`Heal ${pet.name}`}
                      >
                        <RiHeartPulseFill /> Heal
                      </button>
                      <button
                        className={`pet-action equip hover-effect ${pet.is_equipped ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEquipPet(pet.id);
                        }}
                        aria-pressed={pet.is_equipped}
                        aria-label={pet.is_equipped ? `${pet.name} is equipped` : `Equip ${pet.name}`}
                      >
                        {pet.is_equipped ? 'Equipped' : 'Equip'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="pets-empty pets-animated-fade">
                  <MdFilterListAlt className="empty-icon" />
                  <h3>No pets found matching your filters</h3>
                  <p>Try adjusting your search criteria or filters</p>
                  <button className="reset-btn" onClick={resetFilters}>Reset All Filters</button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Pet Details View */}
        {activeTab === 'details' && selectedPet && (
          <div className="pet-details pets-animated-fade">
            {/* Detail Navigation */}
            <div className="pet-nav">
              <button 
                className="nav-btn prev hover-effect" 
                onClick={navigateToPrevPet}
                aria-label="Previous pet"
              >
                <MdChevronLeft />
              </button>
              <span className="pet-position">
                {pets.findIndex(p => p.id === selectedPet.id) + 1} of {pets.length}
              </span>
              <button 
                className="nav-btn next hover-effect" 
                onClick={navigateToNextPet}
                aria-label="Next pet"
              >
                <MdChevronRight />
              </button>
            </div>
            
            <div className="pet-detail-card">
              {/* Pet Header */}
              <div className="pet-detail-header">
                <div 
                  className="pet-detail-role-icon hover-rotate"
                  style={{ backgroundColor: getRarityColor(selectedPet.rarity), color: '#fff' }}
                >
                  {getRoleIcon(selectedPet.role)}
                </div>
                <div className="pet-detail-title">
                  <h2>{selectedPet.name}</h2>
                  <div className="pet-detail-subtitle">
                    <span className="pet-detail-level">Level {selectedPet.level}</span>
                    <span className="pet-detail-role">{selectedPet.role}</span>
                    <span 
                      className="pet-detail-rarity"
                      style={{ color: getRarityColor(selectedPet.rarity) }}
                    >
                      {selectedPet.rarity}
                    </span>
                  </div>
                </div>
                <button 
                  className={`pet-detail-equip hover-effect ${selectedPet.equipped ? 'equipped' : ''}`}
                  onClick={() => handleEquipPet(selectedPet.id)}
                  aria-pressed={selectedPet.equipped}
                >
                  {selectedPet.equipped ? 'Equipped' : 'Equip Pet'}
                </button>
              </div>
              
              {/* Pet Detail Body */}
              <div className="pet-detail-body">
                <div className="pet-detail-left">
                  <div className="pet-detail-image-container">
                    <img 
                      src={selectedPet.image} 
                      alt={selectedPet.name}
                      className="pet-detail-image" 
                    />
                  </div>
                  
                  <div className="pet-status-bars">
                    <div className="pet-detail-status">
                      <div className="detail-status-label">
                        <RiHeartPulseFill className="detail-status-icon health" />
                        <span>Health</span>
                      </div>
                      <div className="detail-status-bar">
                        <div 
                          className="detail-status-fill health"
                          style={{ width: `${petStatuses[selectedPet.id]?.health || 0}%` }}
                        ></div>
                      </div>
                      <span className="detail-status-value">
                        {petStatuses[selectedPet.id]?.health || 0}%
                      </span>
                    </div>
                    
                    <div className="pet-detail-status">
                      <div className="detail-status-label">
                        <GiFoodChain className="detail-status-icon hunger" />
                        <span>Hunger</span>
                      </div>
                      <div className="detail-status-bar">
                        <div 
                          className="detail-status-fill hunger"
                          style={{ width: `${petStatuses[selectedPet.id]?.hunger || 0}%` }}
                        ></div>
                      </div>
                      <span className="detail-status-value">
                        {petStatuses[selectedPet.id]?.hunger || 0}%
                      </span>
                    </div>
                    
                    <div className="pet-detail-status">
                      <div className="detail-status-label">
                        <GiHeartPlus className="detail-status-icon happiness" />
                        <span>Happiness</span>
                      </div>
                      <div className="detail-status-bar">
                        <div 
                          className="detail-status-fill happiness"
                          style={{ width: `${petStatuses[selectedPet.id]?.happiness || 0}%` }}
                        ></div>
                      </div>
                      <span className="detail-status-value">
                        {petStatuses[selectedPet.id]?.happiness || 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="pet-actions">
                    <button 
                      className="pet-detail-action feed hover-effect"
                      onClick={() => feedPet(selectedPet.id)}
                      aria-label="Feed your pet"
                    >
                      <GiFoodChain className="action-icon" />
                      <span>Feed Pet</span>
                    </button>
                    <button 
                      className="pet-detail-action play hover-effect"
                      onClick={() => playWithPet(selectedPet.id)}
                      aria-label="Play with your pet"
                    >
                      <RiGamepadLine className="action-icon" />
                      <span>Play</span>
                    </button>
                    <button 
                      className="pet-detail-action heal hover-effect"
                      onClick={() => healPet(selectedPet.id)}
                      aria-label="Heal your pet"
                    >
                      <RiHeartPulseFill className="action-icon" />
                      <span>Heal</span>
                    </button>
                  </div>
                </div>
                
                <div className="pet-detail-right">
                  <div className="pet-description">
                    <h3 className="detail-section-title">About</h3>
                    <p>{selectedPet.description}</p>
                  </div>
                  
                  <div className="pet-combat-stats">
                    <h3 className="detail-section-title">Combat Stats</h3>
                    <div className="stats-grid">
                      {Object.entries(selectedPet.stats).map(([key, value]) => {
                        const percent = getStatPercent(value);
                        return (
                          <div className="stat-item" key={key}>
                            <div className="stat-header">
                              {getStatIcon(key)}
                              <span className="stat-name">
                                {key.replace('_', ' ')}
                              </span>
                              <span className="stat-value">{value}</span>
                            </div>
                            <div className="stat-progress-bar">
                              <div 
                                className={`stat-progress-fill ${key.toLowerCase()}`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="pet-skills-section">
                    <h3 className="detail-section-title">Pet Skills</h3>
                    <div className="pet-skills-list">
                      <div className="pet-skill locked">
                        <div className="skill-icon">?</div>
                        <div className="skill-info">
                          <div className="skill-name">Unknown Skill</div>
                          <div className="skill-description">
                            Will unlock at level 5
                          </div>
                        </div>
                      </div>
                      <div className="pet-skill locked">
                        <div className="skill-icon">?</div>
                        <div className="skill-info">
                          <div className="skill-name">Unknown Skill</div>
                          <div className="skill-description">
                            Will unlock at level 10
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiscPets;
