import React, { useState, useEffect } from 'react';
import './MiscPets.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import dummy from '../../assets/mix pets/dummy.jpg';
import dummy1 from '../../assets/mix pets/dummy1.jpg';
import dummy2 from '../../assets/mix pets/dummy2.jpg';
import dummy3 from '../../assets/mix pets/dummy3.jpg';

const pets = [
  {
    name: "Cyndaquil",
    level: 350,
    role: "Assassin",
    rarity: "Legendary",
    image: dummy,
    stats: {
      ATK: "5000/5000",
      HP: "1500/1500",
      DEF_PHY: "2250/2250",
      DEF_MAGE: "2000/2000",
      MAX_MANA: "1200/1200",
      AGILITY: "500/500"
    },
    status: { happiness: 100, hunger: 50, health: 100 }
  },
  {
    name: "Oshawott",
    level: 280,
    role: "Mage",
    rarity: "Epic",
    image: dummy1,
    stats: {
      ATK: "3000/3000",
      HP: "2000/2000",
      DEF_PHY: "1000/1000",
      DEF_MAGE: "3000/3000",
      MAX_MANA: "5000/5000",
      AGILITY: "400/400"
    },
    status: { happiness: 100, hunger: 40, health: 100 }
  },
  {
    name: "Snivy",
    level: 250,
    role: "Tank",
    rarity: "Elite",
    image: dummy3,
    stats: {
      ATK: "3000/3000",
      HP: "2000/2000",
      DEF_PHY: "1000/1000",
      DEF_MAGE: "3000/3000",
      MAX_MANA: "5000/5000",
      AGILITY: "400/400"
    },
    status: { happiness: 100, hunger: 30, health: 100 }
  },
  {
    name: "Chikorita",
    level: 230,
    role: "Support",
    rarity: "Common",
    image: dummy2,
    stats: {
      ATK: "3000/3000",
      HP: "2000/2000",
      DEF_PHY: "1000/1000",
      DEF_MAGE: "3000/3000",
      MAX_MANA: "5000/5000",
      AGILITY: "400/400"
    },
    status: { happiness: 100, hunger: 20, health: 100 }
  }
];

const MiscPets = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [equippedPetName, setEquippedPetName] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const navigate = useNavigate();

  const [petStatuses, setPetStatuses] = useState(
    pets.reduce((acc, pet) => {
      acc[pet.name] = { ...pet.status };
      return acc;
    }, {})
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPetStatuses((prevStatuses) => {
        const updated = { ...prevStatuses };
        Object.keys(updated).forEach((name) => {
          updated[name] = {
            happiness: Math.max(0, updated[name].happiness - 1),
            hunger: Math.min(100, updated[name].hunger + 1),
            health: Math.max(0, updated[name].health - (updated[name].hunger > 80 ? 1 : 0))
          };
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = (e) => setSelectedRole(e.target.value.toLowerCase());
  const handleStatusChange = (e) => setSelectedStatus(e.target.value.toUpperCase().replace('-', '_'));
  const handleRarityChange = (e) => setSelectedRarity(e.target.value.toLowerCase());
  const handleResetFilter = () => {
    setSelectedRole('');
    setSelectedStatus('');
    setSelectedRarity('');
  };
  const handleEquipClick = (petName) => setEquippedPetName((prev) => (prev === petName ? '' : petName));

  const feedPet = (name) => setPetStatuses((prev) => ({
    ...prev,
    [name]: { ...prev[name], hunger: Math.max(0, prev[name].hunger - 20) }
  }));

  const playWithPet = (name) => setPetStatuses((prev) => ({
    ...prev,
    [name]: { ...prev[name], happiness: Math.min(100, prev[name].happiness + 10) }
  }));

  const healPet = (name) => setPetStatuses((prev) => ({
    ...prev,
    [name]: { ...prev[name], health: Math.min(100, prev[name].health + 15) }
  }));

  const getStatPercent = (statString) => {
    const [current, max] = statString.split('/').map(Number);
    return Math.round((current / max) * 100);
  };

  let filteredPets = pets;
  if (selectedRole) filteredPets = filteredPets.filter((pet) => pet.role.toLowerCase() === selectedRole);
  if (selectedRarity) filteredPets = filteredPets.filter((pet) => pet.rarity.toLowerCase() === selectedRarity);
  if (selectedStatus) {
    filteredPets = [...filteredPets].sort((a, b) => {
      const aVal = Number(a.stats[selectedStatus]?.split('/')[0] || 0);
      const bVal = Number(b.stats[selectedStatus]?.split('/')[0] || 0);
      return bVal - aVal;
    });
  }

  const handleGoToPetHouse = () => {
    navigate('/pet-house');
  };  return (
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
                  <option value="tank">Tank</option>
                  <option value="mage">Mage</option>
                  <option value="support">Support</option>
                </select>
              </div>
              <div className="misc-pets-filter-item">
                <label htmlFor="statusFilter">Sort by Status:</label>
                <select id="statusFilter" onChange={handleStatusChange} value={selectedStatus}>
                  <option value="">All Status</option>
                  <option value="atk">ATK</option>
                  <option value="hp">HP</option>
                  <option value="def-phy">DEF PHY</option>
                  <option value="def-mage">DEF MAGIC</option>
                  <option value="max-mana">MAX MANA</option>
                  <option value="agility">AGILITY</option>
                </select>
              </div>
              <div className="misc-pets-filter-item">
                <label htmlFor="rarityFilter">Sort by Rarity:</label>
                <select id="rarityFilter" onChange={handleRarityChange} value={selectedRarity}>
                  <option value="">All Rarity</option>
                  <option value="legendary">Legendary</option>
                  <option value="epic">Epic</option>
                  <option value="elite">Elite</option>
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
          {filteredPets.map((pet, index) => {
            const isEquipped = equippedPetName === pet.name;
            return (
              <div className={`misc-pet-card ${isEquipped ? 'equipped-glow' : ''}`} key={index}>
                <div className="role-icon">
                  {{
                    assassin: '🗡',
                    tank: '🛡',
                    mage: '🔮',
                    support: '❤'
                  }[pet.role.toLowerCase()] || '❓'}
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
                    const value = petStatuses[pet.name]?.[statusKey] ?? 0;
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
                  <button className="action-button" onClick={() => feedPet(pet.name)}>🍖 Feed</button>
                  <button className="action-button" onClick={() => playWithPet(pet.name)}>🎾 Play</button>
                  <button className="action-button" onClick={() => healPet(pet.name)}>💊 Heal</button>
                </div>
                <div className="select-button-container">
                  <button className={`select-button ${isEquipped ? 'equipped' : ''}`} onClick={() => handleEquipClick(pet.name)}>
                    {isEquipped ? 'Equipped ✅' : 'Equip'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MiscPets;
