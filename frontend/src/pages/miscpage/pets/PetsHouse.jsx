import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import Topbar from '../../../components/Topbar';
import './PetsHouse.css';
import { useNavigate } from 'react-router-dom';
import { getAllPets, addPetToUser, getPetSkillsByRole, calculatePetStats } from '../../../services/petsService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PetsHouse = () => {
  const [availablePets, setAvailablePets] = useState([]);
  const [petSkills, setPetSkills] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [adoptingPet, setAdoptingPet] = useState(null);
  const [nickname, setNickname] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const petsData = await getAllPets();
        setAvailablePets(petsData);
        
        // Fetch skills for each role
        const roles = ['mage', 'warrior', 'healer', 'assassin'];
        const skillsObj = {};
        
        for (const role of roles) {
          const roleSkills = await getPetSkillsByRole(role);
          skillsObj[role] = roleSkills;
        }
        
        setPetSkills(skillsObj);
      } catch (error) {
        console.error('Failed to fetch pets:', error);
        toast.error('Failed to load available pets');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  const filteredPets = availablePets.filter(pet => {
    if (selectedRole !== 'all' && pet.role !== selectedRole) return false;
    if (selectedRarity !== 'all' && pet.rarity !== selectedRarity) return false;
    return true;
  });

  const handleAdoptPet = async (petId) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('You must be logged in to adopt a pet');
        return;
      }

      await addPetToUser({
        userId,
        petId,
        nickname: nickname || ''
      });

      toast.success('Pet adopted successfully!');
      setAdoptingPet(null);
      setNickname('');
    } catch (error) {
      console.error('Failed to adopt pet:', error);
      toast.error('Failed to adopt pet');
    }
  };

  const handleBackToMiscPets = () => {
    navigate('/misc-pets');
  };

  const getRarityColor = (rarity) => {
    switch(rarity.toLowerCase()) {
      case 'common': return '#aaa';
      case 'uncommon': return '#4CAF50';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return '#fff';
    }
  };

  const getRoleIcon = (role) => {
    switch(role.toLowerCase()) {
      case 'mage': return '🧙‍♂️';
      case 'warrior': return '🛡️';
      case 'healer': return '💚';
      case 'assassin': return '🗡️';
      default: return '❓';
    }
  };

  const handleSelectPet = async (pet) => {
    try {
      // Calculate level 1 and level 10 stats for comparison
      const level1Stats = await calculatePetStats(pet.id, 1);
      const level10Stats = await calculatePetStats(pet.id, 10);
      
      setSelectedPet({
        ...pet,
        level1Stats: level1Stats.stats,
        level10Stats: level10Stats.stats,
        skills: petSkills[pet.role] || []
      });
    } catch (error) {
      console.error('Failed to calculate pet stats:', error);
      toast.error('Failed to load pet details');
    }
  };

  return (
    <div className="pets-house-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="pets-house-content">
        <Topbar />
        <ToastContainer position="top-right" autoClose={3000} />

        <div className="petshouse-header">
          <button className="back-button" onClick={handleBackToMiscPets}>
            ← Back to My Pets
          </button>
          <h1>Pet House</h1>
        </div>

        {/* Filters */}
        <div className="filter-header">
          <h2>Filter Pets</h2>
          <div className="filter-section">
            <div className="filter-group">
              <h3>Class:</h3>
              <div className="filter-buttons">
                <button
                  onClick={() => setSelectedRole('all')}
                  className={`filter-btn ${selectedRole === 'all' ? 'active' : ''}`}
                >
                  All Classes
                </button>
                {['mage', 'warrior', 'healer', 'assassin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`filter-btn ${selectedRole === role ? 'active' : ''}`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)} {getRoleIcon(role)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="filter-group">
              <h3>Rarity:</h3>
              <div className="filter-buttons">
                <button
                  onClick={() => setSelectedRarity('all')}
                  className={`filter-btn ${selectedRarity === 'all' ? 'active' : ''}`}
                >
                  All Rarities
                </button>
                {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((rarity) => (
                  <button
                    key={rarity}
                    onClick={() => setSelectedRarity(rarity)}
                    className={`filter-btn ${selectedRarity === rarity ? 'active' : ''}`}
                    style={{borderColor: getRarityColor(rarity)}}
                  >
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading pets...</div>
        ) : (
          <>
            {/* Pet Grid */}
            <div className="pets-grid">
              {filteredPets.length === 0 ? (
                <div className="no-pets">No pets match your filters.</div>
              ) : (
                filteredPets.map((pet) => (
                  <div 
                    className={`pet-card ${selectedPet?.id === pet.id ? 'selected' : ''}`} 
                    key={pet.id}
                    style={{borderColor: getRarityColor(pet.rarity)}}
                    onClick={() => handleSelectPet(pet)}
                  >
                    <div className="pet-card-header">
                      <span className="pet-role">{getRoleIcon(pet.role)}</span>
                      <h3 className="pet-name">{pet.name}</h3>
                      <span className="pet-rarity" style={{color: getRarityColor(pet.rarity)}}>
                        {pet.rarity.charAt(0).toUpperCase() + pet.rarity.slice(1)}
                      </span>
                    </div>
                    
                    <div className="pet-stats">
                      <div className="stat">
                        <span className="stat-label">ATK</span>
                        <span className="stat-value">{pet.atk}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">HP</span>
                        <span className="stat-value">{pet.hp}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">DEF</span>
                        <span className="stat-value">{pet.def_phy}/{pet.def_magic}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">MANA</span>
                        <span className="stat-value">{pet.max_mana}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">AGI</span>
                        <span className="stat-value">{pet.agility}</span>
                      </div>
                    </div>
                    
                    <button 
                      className="adopt-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdoptingPet(pet);
                      }}
                    >
                      Adopt Pet
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {/* Pet Details Section */}
            {selectedPet && (
              <div className="pet-details">
                <h2>{selectedPet.name} Details</h2>
                <div className="pet-info">
                  <div className="pet-passive">
                    <h3>Passive Skill</h3>
                    <p>{selectedPet.passive_skill}</p>
                  </div>
                  
                  <div className="pet-growth">
                    <h3>Stats Growth (Level 1 → 10)</h3>
                    <div className="growth-stats">
                      <div className="growth-stat">
                        <span>HP: {selectedPet.level1Stats.hp} → {selectedPet.level10Stats.hp}</span>
                        <div className="growth-bar">
                          <div className="growth-fill" style={{width: '100%'}}></div>
                        </div>
                      </div>
                      <div className="growth-stat">
                        <span>ATK: {selectedPet.level1Stats.atk} → {selectedPet.level10Stats.atk}</span>
                        <div className="growth-bar">
                          <div className="growth-fill" style={{width: '100%'}}></div>
                        </div>
                      </div>
                      <div className="growth-stat">
                        <span>DEF: {selectedPet.level1Stats.def_phy}/{selectedPet.level1Stats.def_magic} → {selectedPet.level10Stats.def_phy}/{selectedPet.level10Stats.def_magic}</span>
                        <div className="growth-bar">
                          <div className="growth-fill" style={{width: '100%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pet-skills">
                    <h3>Active Skills</h3>
                    <div className="skills-list">
                      {selectedPet.skills.filter(skill => skill.skill_type === 'active').map(skill => (
                        <div className="skill-item" key={skill.id}>
                          <h4>{skill.name}</h4>
                          <p>{skill.description}</p>
                          <div className="skill-details">
                            <span>Mana: {skill.mana_cost}</span>
                            <span>Cooldown: {skill.cooldown} turns</span>
                            {skill.damage > 0 && <span>Damage: {skill.damage}</span>}
                            {skill.healing > 0 && <span>Healing: {skill.healing}%</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Adopt Pet Modal */}
            {adoptingPet && (
              <div className="adopt-modal-overlay">
                <div className="adopt-modal">
                  <h2>Adopt {adoptingPet.name}</h2>
                  <p>Would you like to give your new pet a nickname?</p>
                  <input
                    type="text"
                    placeholder="Enter nickname (optional)"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="nickname-input"
                  />
                  <div className="modal-buttons">
                    <button className="cancel-btn" onClick={() => setAdoptingPet(null)}>Cancel</button>
                    <button className="confirm-btn" onClick={() => handleAdoptPet(adoptingPet.id)}>
                      Confirm Adoption
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PetsHouse;
