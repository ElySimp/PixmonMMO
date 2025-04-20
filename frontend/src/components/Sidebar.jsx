import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import homeIcon from '../assets/MAIN/home.png';
import inventoryIcon from '../assets/MAIN/inventory.png';
import trophyIcon from '../assets/MAIN/trophy.png';
import peopleIcon from '../assets/MAIN/people.png';
import petsIcon from '../assets/MAIN/pets.png';
import battleIcon from '../assets/MAIN/battle.png';
import questIcon from '../assets/MAIN/quest.png';
import shopIcon from '../assets/MAIN/shop.png';

function Sidebar({ profilePic, username }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/main', icon: homeIcon, label: 'Home' },
    { path: '/inventory', icon: inventoryIcon, label: 'Inventory' },
    { path: '/achievement', icon: trophyIcon, label: 'Achievement' },
    { path: '/profile', icon: peopleIcon, label: 'Profile' },
  ];

  const miscItems = [
    { path: '/pets', icon: petsIcon, label: 'Pets' },
    { path: '/battle', icon: battleIcon, label: 'Battle' },
    { path: '/quest', icon: questIcon, label: 'Quest' },
    { path: '/shop', icon: shopIcon, label: 'Shop' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      {/* Profile Section */}
      <div className="sidebar-section">
        <h1>PIXMON</h1>
        <img 
          src={profilePic || '/dummy.jpg'} 
          alt={username || 'Profile'} 
          className="sidebar-pic" 
        />
        {username && <p className="sidebar-username">{username}</p>}
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <p><b>MAIN MENU</b></p>
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <img src={item.icon} alt={item.label} className="sidebar-icon" />
            {item.label}
          </button>
        ))}
        
        {/* Divider between main menu and misc */}
        <div className="sidebar-divider"></div>
        <p><b>MISC</b></p>
        {miscItems.map((item) => (
          <button
            key={item.path}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <img src={item.icon} alt={item.label} className="sidebar-icon" />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar; 