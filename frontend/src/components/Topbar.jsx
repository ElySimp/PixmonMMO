import React from 'react';
import './Topbar.css';
import searchIcon from '../assets/MAIN/search.png';
import chatIcon from '../assets/MAIN/chat.png';
import notificationIcon from '../assets/MAIN/notification.png';
import eggIcon from '../assets/MAIN/pets_sample.png';

function Topbar({ 
  onMenuClick, 
  onSupportClick, 
  onFriendsClick, 
  onSearch, 
  onChatClick, 
  onNotificationClick, 
  onEggClick 
}) {
  return (
    <nav className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu" onClick={onMenuClick}>☰</button>
        <button onClick={onSupportClick}>Support Service</button>
        <button onClick={onFriendsClick}>Friends</button>
      </div>

      <div className="topbar-right">
        <input 
          type="search" 
          placeholder="Search..." 
          className="topbar-search" 
          onChange={(e) => onSearch?.(e.target.value)}
        />
        <button className="topbar-button" onClick={onChatClick}>
          <img src={chatIcon} alt="Chat" className="topbar-icon" />
        </button>
        <button className="topbar-button" onClick={onNotificationClick}>
          <img src={notificationIcon} alt="Notifications" className="topbar-icon" />
        </button>
        <button className="topbar-button" onClick={onEggClick}>
          <img src={eggIcon} alt="Egg" className="topbar-icon" />
        </button>
      </div>
    </nav>
  );
}

export default Topbar; 