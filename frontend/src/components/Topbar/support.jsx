import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Support.css';
import Sidebar from '../Sidebar';
import Topbar from '../Topbar';

const Support = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleCreateTicket = () => {
    console.log('Creating support ticket');
    // This would eventually open a form or redirect to a ticket creation page
  };

  const handleViewTickets = () => {
    console.log('Viewing existing support tickets');
    // This would eventually show existing tickets
  };
    const handleFaqSearch = (e) => {
    setSearchQuery(e.target.value);
    console.log('Searching for:', e.target.value);
    // In a real implementation, this would filter the FAQs or fetch results
  };
  
  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleCommunityWiki = () => {
    console.log('Opening community wiki');
    // This would eventually open the community wiki page
  };

  const handleContactGuardian = () => {
    console.log('Contacting a guardian');
    // This would eventually open a chat with a guardian
  };

  const handleContactModerator = () => {
    console.log('Contacting a moderator');
    // This would eventually open a chat with a moderator
  };
  const handleMenuClick = () => {
    console.log('Menu clicked');
  };

  const handleSupportClick = () => {
    console.log('Support clicked');
  };

  const handleSearch = (value) => {
    console.log('Search:', value);
  };

  const handleChatClick = () => {
    console.log('Chat clicked');
  };

  const handleNotificationClick = () => {
    console.log('Notifications clicked');
  };

  return (
    <div className="main-container">
      <Sidebar 
        profilePic="/dummy.jpg"
      />      <div className="main-content">
        <Topbar 
          onMenuClick={handleMenuClick}
          onSupportClick={handleSupportClick}
          onSearch={handleSearch}
          onChatClick={handleChatClick}
          onNotificationClick={handleNotificationClick}
        />
        
        <div className="support-container">
          <div className="support-header">
            <h1 className="support-title">Support</h1>
            <button className="support-back-button" onClick={handleBackClick}>
              <span className="back-icon">←</span> Go Back
            </button>
          </div>      <div className="support-hero">
        <span className="support-decoration top-left">🎮</span>
        <span className="support-decoration top-right">🔧</span>
        <span className="support-decoration bottom-left">💬</span>
        <span className="support-decoration bottom-right">🛟</span>

        <div className="support-status">
          <div className="status-indicator online"></div>
          <span className="status-text">Support Online</span>
        </div>
        
        <h2 className="support-hero-title">How can we help?</h2>
        <p className="support-hero-subtitle">Open up a support ticket to get the help you need.</p>
        
        <div className="support-actions">
          <button className="support-button primary" onClick={handleCreateTicket}>
            Create Support Ticket
          </button>
          <button className="support-button secondary" onClick={handleViewTickets}>
            View Existing Support Tickets
          </button>
        </div>      </div>      <div className="support-search">
        <span className="search-icon">🔍</span>
        <input 
          type="text"
          className="search-input"
          placeholder="Search for help topics, FAQs, or keywords..."
          value={searchQuery}
          onChange={handleFaqSearch}
        />
      </div>

      <div className="support-options">
        <div className="support-option" onClick={handleCommunityWiki}>
          <div className="option-icon community">
            <span className="icon">👥</span>
          </div>
          <div className="option-content">
            <h3 className="option-title">Community Wiki</h3>
            <p className="option-description">Read the community wiki</p>
          </div>
        </div>

        <div className="support-option" onClick={handleContactGuardian}>
          <div className="option-icon guardian">
            <span className="icon">🛡️</span>
          </div>
          <div className="option-content">
            <h3 className="option-title">Contact a guardian</h3>
            <p className="option-description">Get help from an online guardian</p>
          </div>
        </div>

        <div className="support-option" onClick={handleContactModerator}>
          <div className="option-icon moderator">
            <span className="icon">🛡️</span>
          </div>
          <div className="option-content">
            <h3 className="option-title">Contact a moderator</h3>
            <p className="option-description">Get help from an online moderator</p>
          </div>
        </div>
      </div>      <div className="support-faq">
        <h3 className="faq-title">Frequently Asked Questions</h3>
        <div className="faq-items">
          <div className="faq-item" onClick={() => toggleFaq(0)}>
            <h4 className="faq-question">
              How do I level up my pets?
              <span className={`faq-toggle ${openFaqIndex === 0 ? 'open' : ''}`}></span>
            </h4>
            <p className={`faq-answer ${openFaqIndex === 0 ? 'visible' : ''}`}>
              To level up your pets, you need to take them on adventures or feed them special treats that can be found in the shop. 
              The more adventures you complete with a pet, the faster it will level up. Each level increases your pet's stats 
              and may unlock special abilities!
            </p>
          </div>
          <div className="faq-item" onClick={() => toggleFaq(1)}>
            <h4 className="faq-question">
              How do I earn more diamonds?
              <span className={`faq-toggle ${openFaqIndex === 1 ? 'open' : ''}`}></span>
            </h4>
            <p className={`faq-answer ${openFaqIndex === 1 ? 'visible' : ''}`}>
              Diamonds can be earned by completing quests, participating in events, or reaching certain milestones in the game. 
              You can also purchase them in the shop. Daily logins also provide diamonds as rewards, and some rare pets 
              found during adventures can be sold for diamonds.
            </p>
          </div>
          <div className="faq-item" onClick={() => toggleFaq(2)}>
            <h4 className="faq-question">
              What happens if I lose connection during an adventure?
              <span className={`faq-toggle ${openFaqIndex === 2 ? 'open' : ''}`}></span>
            </h4>
            <p className={`faq-answer ${openFaqIndex === 2 ? 'visible' : ''}`}>
              Don't worry! If you lose connection during an adventure, your progress will be saved and you can continue 
              from where you left off once you reconnect. The game automatically saves your progress at various checkpoints 
              throughout your adventure. Just make sure to log back in within 24 hours to continue from your checkpoint.
            </p>
          </div>
          <div className="faq-item" onClick={() => toggleFaq(3)}>
            <h4 className="faq-question">
              How do I get rare pets in the game?
              <span className={`faq-toggle ${openFaqIndex === 3 ? 'open' : ''}`}></span>
            </h4>
            <p className={`faq-answer ${openFaqIndex === 3 ? 'visible' : ''}`}>
              Rare pets can be obtained through various methods: participating in special events, completing difficult quests, 
              using the gacha system with diamonds, or finding them in specific adventure locations. The rarer the pet, 
              the better its starting stats and unique abilities will be!
            </p>
          </div>
        </div>
      </div></div>
      </div>
    </div>
  );
};

export default Support;