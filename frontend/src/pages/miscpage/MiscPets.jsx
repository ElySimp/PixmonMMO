import React, { useState } from 'react';
import './MiscPets.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import dummy from '../../assets/mix pets/dummy.jpg';
import dummy1 from '../../assets/mix pets/dummy1.jpg';
import dummy2 from '../../assets/mix pets/dummy2.jpg';
import dummy3 from '../../assets/mix pets/dummy3.jpg';

const pets = [
  {
    name: "Cyndaquil",
    level: 350,
    role: "Assassin",
    image: dummy,
    stats: {
      ATK: "5000/5000",
      HP: "1500/1500",
      DEF_PHY: "2250/2250",
      DEF_MAGE: "2000/2000",
      MAX_MANA: "1200/1200",
      AGILITY: "500/500"
    }
  },
  {
    name: "Oshawott",
    level: 280,
    role: "Mage",
    image: dummy1,
    stats: {
      ATK: "3000/3000",
      HP: "2000/2000",
      DEF_PHY: "1000/1000",
      DEF_MAGE: "3000/3000",
      MAX_MANA: "5000/5000",
      AGILITY: "400/400"
    }
  },
  {
    name: "Snivy",
    level: 250,
    role: "Tank",
    image: dummy2,
    stats: {
      ATK: "3000/3000",
      HP: "2000/2000",
      DEF_PHY: "1000/1000",
      DEF_MAGE: "3000/3000",
      MAX_MANA: "5000/5000",
      AGILITY: "400/400"
    }
  },
  {
    name: "Chikorita",
    level: 230,
    role: "Support",
    image: dummy3,
    stats: {
      ATK: "3000/3000",
      HP: "2000/2000",
      DEF_PHY: "1000/1000",
      DEF_MAGE: "3000/3000",
      MAX_MANA: "5000/5000",
      AGILITY: "400/400"
    }
  }
];

const MiscPets = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [equippedPetName, setEquippedPetName] = useState('');

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value.toLowerCase());
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value.toUpperCase().replace('-', '_'));
  };

  const handleResetFilter = () => {
    setSelectedRole('');
    setSelectedStatus('');
  };

  const handleEquipClick = (petName) => {
    setEquippedPetName((prev) => (prev === petName ? '' : petName));
  };

  const getStatPercent = (statString) => {
    const [current, max] = statString.split('/').map(Number);
    return Math.round((current / max) * 100);
  };

  let filteredPets = pets;

  if (selectedRole) {
    filteredPets = filteredPets.filter(
      (pet) => pet.role.toLowerCase() === selectedRole
    );
  }

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

        {/* Filter Section */}
        <div className="filter-container">
          <div className="filter-item">
            <label htmlFor="roleFilter" className="role-label">Sort by Role:</label>
            <select id="roleFilter" onChange={handleRoleChange} value={selectedRole}>
              <option value="">All Roles</option>
              <option value="assassin">Assassin</option>
              <option value="tank">Tank</option>
              <option value="mage">Mage</option>
              <option value="support">Support</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="statusFilter" className="status-label">Sort by Status:</label>
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

          <div className="filter-item">
            <button className="reset-button" onClick={handleResetFilter}>Reset Filter</button>
          </div>
        </div>

        {/* Pet Cards */}
        <div className="card-container">
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
                        <div className="stat-label">
                          {key.replace('_', ' ')}: {value}
                        </div>
                        <div className="stat-bar-background">
                          <div
                            className="stat-bar-fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
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
