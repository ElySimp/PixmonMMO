import React, { useState } from 'react';
import './Adventure.css';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';

import avatarExample from '../../assets/MAIN/avatar_exaple.gif';

const Adventure = () => {
  const [xp, setXp] = useState(0);
  const [gold, setGold] = useState(0);
  const [story, setStory] = useState('Your adventure begins...');
  const [cooldown, setCooldown] = useState(0);

  const handleStep = () => {
    if (cooldown > 0) return;

    const randomXp = Math.random() > 0.5 ? Math.floor(Math.random() * 50) : 0;
    const randomGold = Math.random() > 0.5 ? Math.floor(Math.random() * 20) : 0;
    const randomCooldown = Math.floor(Math.random() * 8) + 1;

    setXp(prev => prev + randomXp);
    setGold(prev => prev + randomGold);
    setStory(`You took a step and ${randomXp > 0 || randomGold > 0 ? 'gained rewards!' : 'found nothing.'}`);
    setCooldown(randomCooldown);

    const button = document.querySelector('.adventure-step-button');
    if (button) {
      button.style.setProperty('--fill-width', '0%');
      button.style.transition = `width ${randomCooldown}s linear`;
      button.style.setProperty('--fill-width', '100%');
    }

    setTimeout(() => setCooldown(0), randomCooldown * 1000);
  };

  return (
    <div className="adventure-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="adventure-content">
        <Topbar 
          onMenuClick={() => console.log('Menu clicked')} 
          onSupportClick={() => console.log('Support clicked')} 
          onFriendsClick={() => console.log('Friends clicked')} 
          onSearch={(value) => console.log('Search:', value)} 
          onChatClick={() => console.log('Chat clicked')} 
          onNotificationClick={() => console.log('Notifications clicked')} 
          onEggClick={() => console.log('Egg clicked')} 
        />

        <div className="adventure-grid">
          <div className="adventure-grid-profile">
            <img src={avatarExample} alt="Profile" className="adventure-profile-pic" />
            <div className="adventure-stats">
              <p>XP: {xp}</p>
              <p>Level: 100 Gold: {gold}</p>
            </div>
          </div>
          <div className="adventure-grid-actions">
            <div className="adventure-story">
              <p>{story}</p>
            </div>
            <button 
              className="adventure-step-button" 
              onClick={handleStep} 
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `Wait ${cooldown}s` : 'Take a Step'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Adventure;