import React, { useState, useEffect } from 'react';
import './MiscPets.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import dummy from '../../assets/mix pets/dummy.jpg';
import dummy1 from '../../assets/mix pets/dummy1.jpg';
import dummy2 from '../../assets/mix pets/dummy2.jpg';
import dummy3 from '../../assets/mix pets/dummy3.jpg';

const PetStats = ({ stats }) => {
  const maxValues = {
    atk: 10000,
    hp: 20000,
    defPhy: 22250,
    defMage: 30000,
    mana: 15000,
    agility: 15000
  };

  const labels = {
    atk: "ATK",
    hp: "HP",
    defPhy: "DEF PHY",
    defMage: "DEF MAGE",
    mana: "MAX MANA",
    agility: "AGILITY"
  };

  const colors = {
    atk: "#ef4444",
    hp: "#22c55e",
    defPhy: "#3b82f6",
    defMage: "#8b5cf6",
    mana: "#facc15",
    agility: "#ec4899"
  };

  const icons = {
    atk: "⚔️",
    hp: "❤️",
    defPhy: "🛡️",
    defMage: "🔮",
    mana: "💧",
    agility: "💨"
  };

  return (
    <div className="text-white w-72">
      <h2 className="text-lg font-bold mb-4">Pet Stats</h2>
      {Object.entries(stats).map(([key, value]) => {
        const max = maxValues[key];
        const percent = (value / max) * 100;

        return (
          <div className="mb-4" key={key}>
            <div className="flex justify-between text-sm font-semibold">
              <span>{icons[key]} {labels[key]}</span>
              <span>{value}/{max}</span>
            </div>
            <div className="pet-stats-bar-container">
            <div
              className="pet-stats-bar-fill"
              style={{
                width: `${percent}%`,
                background: `linear-gradient(to right, ${colors[key]}, ${colors[key]}99, transparent)`
              }}
            />
          </div>
          </div>
        );
      })}
    </div>
  );
};

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
      ATK: "1500/1500",
      HP: "4000/4000",
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
      ATK: "1000/1000",
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
  const [activeOverlayPet, setActiveOverlayPet] = useState(null);
  const [petStatuses, setPetStatuses] = useState(
    pets.reduce((acc, pet) => {
      acc[pet.name] = { ...pet.status };
      return acc;
    }, {})
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPetStatuses((prev) => {
        const updated = { ...prev };
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

  const parseStats = (statObj) => ({
    atk: Number(statObj.ATK?.split('/')[0] || 0),
    hp: Number(statObj.HP?.split('/')[0] || 0),
    defPhy: Number(statObj.DEF_PHY?.split('/')[0] || 0),
    defMage: Number(statObj.DEF_MAGE?.split('/')[0] || 0),
    mana: Number(statObj.MAX_MANA?.split('/')[0] || 0),
    agility: Number(statObj.AGILITY?.split('/')[0] || 0)
  });

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

  return (
    <div className="main-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="main-content">
        <Topbar />
        <div className="filter-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="filter-controls" style={{ display: 'flex', gap: '0.5rem' }}>
            <select onChange={handleRoleChange} value={selectedRole}>
              <option value="">All Roles</option>
              <option value="assassin">Assassin</option>
              <option value="mage">Mage</option>
              <option value="tank">Tank</option>
              <option value="support">Support</option>
            </select>
            <select onChange={handleRarityChange} value={selectedRarity}>
              <option value="">All Rarities</option>
              <option value="common">Common</option>
              <option value="elite">Elite</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
            <select onChange={handleStatusChange} value={selectedStatus}>
              <option value="">Sort by Stats</option>
              <option value="ATK">ATK</option>
              <option value="HP">HP</option>
              <option value="DEF_PHY">DEF PHY</option>
              <option value="DEF_MAGE">DEF MAGE</option>
              <option value="MAX_MANA">MAX MANA</option>
              <option value="AGILITY">AGILITY</option>
            </select>
            <button onClick={handleResetFilter} className="reset-button">Reset Filters</button>
          </div>

          <button
            className="petshouse-button"
            onClick={() => window.location.href = '/petshouse'}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              cursor: 'pointer'
            }}
          >
            Go to Petshouse
          </button>
        </div>

        {activeOverlayPet && (
          <div className="overlay-backdrop" onClick={() => setActiveOverlayPet(null)}>
            <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={() => setActiveOverlayPet(null)}>✖</button>
              <PetStats stats={parseStats(activeOverlayPet.stats)} />
            </div>
          </div>
        )}

        <div className="card-container">
          {filteredPets.map((pet) => {
            const isEquipped = equippedPetName === pet.name;
            return (
              <div className={`misc-pet-card ${isEquipped ? 'equipped-glow' : ''}`} key={pet.name}>
                <div className="role-icon">
                  {{ assassin: '🗡', tank: '🛡', mage: '🔮', support: '❤' }[pet.role.toLowerCase()] || '❓'}
                </div>
                <div className={`rarity-text rarity-${pet.rarity.toLowerCase()}`}>{pet.rarity}</div>
                <div className="pet-name">{pet.name}</div>
                <img
                  src={pet.image}
                  alt={pet.name}
                  className="pet-image clickable"
                  onClick={() => setActiveOverlayPet(pet)}
                />
                <div className="pet-info">
                  <div>Level: {pet.level}</div>
                  <div>Role: {pet.role}</div>
                </div>
                <div className="real-time-status">
                  {['happiness', 'hunger', 'health'].map((statusKey) => {
                    const value = petStatuses[pet.name]?.[statusKey] ?? 0;
                    return (
                      <div key={statusKey} className="stat-line">
                        <div className="stat-label">{statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}: {value}%</div>
                        <div className="stat-bar-background">
                          <div
                            className="stat-bar-fill"
                            style={{
                              width: `${value}%`,
                              backgroundColor:
                                statusKey === 'hunger' ? '#f39c12' :
                                  statusKey === 'health' ? '#e74c3c' :
                                    '#3498db'
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
                  <button
                    className={`select-button ${isEquipped ? 'equipped' : ''}`}
                    onClick={() => handleEquipClick(pet.name)}
                  >
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
