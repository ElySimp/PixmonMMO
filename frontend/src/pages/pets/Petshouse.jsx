import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import './Petshouse.css';
import { useNavigate } from 'react-router-dom';

const Petshouse = () => {
  const pets = ["PETS1", "PETS2", "PETS3", "PETS4"];
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  const filteredPets = filter === "All" ? pets : pets.filter(p => p === filter);

  const handleBackToMiscPets = () => {
    navigate('/misc-pets');
  };

  return (
    <div className="main-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="main-content">
        <Topbar />

        <div className="petshouse-header">
          <button className="back-button" onClick={handleBackToMiscPets}>
            ← Back to My Pets
          </button>
          <h1>Pet House</h1>
        </div>

        {/* Filters */}
        <div className="filter-header">
          <h2>-------------- FILTERS -------------</h2>
          <div className="filter-buttons">
            {["All", ...pets].map((pet) => (
              <button
                key={pet}
                onClick={() => setFilter(pet)}
                className={`filter-btn ${filter === pet ? 'active' : ''}`}
              >
                {pet}
              </button>
            ))}
          </div>
        </div>

        {/* Pet Grid */}
        <div className="pets-grid">
          {filteredPets.map((pet, index) => (
            <div className="pet-card" key={index}>
              <h3>{pet}</h3>
              <button className="adopt-btn">Pelihara</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Petshouse;
