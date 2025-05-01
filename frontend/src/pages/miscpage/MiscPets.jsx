import React, { useState, useEffect } from 'react';
import './MiscPets.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';

const pets = [
  {
    name: "Cyndaquil",
    level: 350,
    role: "Assassin",
    image: "/assets/20a8f537-08df-45ac-815b-6e4f7be0d1aa.png",
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
    image: "/assets/4b591ae1-3185-408d-a2b9-28946629d942.png",
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
    image: "/assets/4b591ae1-3185-408d-a2b9-28946629d942.png",
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
    image: "/assets/4b591ae1-3185-408d-a2b9-28946629d942.png",
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
  const [customImages, setCustomImages] = useState({});

  // Load from localStorage on mount
  useEffect(() => {
    const storedImages = localStorage.getItem('customImages');
    if (storedImages) {
      setCustomImages(JSON.parse(storedImages));
    }
  }, []);

  // Save to localStorage whenever customImages changes
  useEffect(() => {
    localStorage.setItem('customImages', JSON.stringify(customImages));
  }, [customImages]);

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

  const handleImageUpload = (e, petName) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImages((prevImages) => ({
          ...prevImages,
          [petName]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
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

        <div className="card-container">
          {filteredPets.map((pet, index) => {
            const getStatPercent = (statString) => {
              const [current, max] = statString.split('/').map(Number);
              return Math.round((current / max) * 100);
            };

            const isEquipped = equippedPetName === pet.name;
            const petImage = customImages[pet.name] || pet.image;

            return (
              <div className={`misc-pet-card ${isEquipped ? 'equipped-glow' : ''}`} key={index}>
                <div className="role-icon">
                  {(() => {
                    switch (pet.role.toLowerCase()) {
                      case 'assassin': return '🗡️';
                      case 'tank': return '🛡️';
                      case 'mage': return '🔮';
                      case 'support': return '❤️';
                      default: return '❓';
                    }
                  })()}
                </div>

                <div className="pet-name">{pet.name}</div>
                <img src={petImage} alt={pet.name} className="pet-image" />

                <label className="upload-label">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, pet.name)}
                    className="upload-input"
                  />
                </label>

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
                          <div className="stat-bar-fill" style={{ width: `${percent}%` }} />
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
