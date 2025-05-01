import React, { useState, useRef, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import Sidebar from '../../components/Sidebar'
import DailyQuest from './quest/DailyQuest'
import WeeklyQuest from './quest/WeeklyQuest'
import MonthlyQuest from './quest/MonthlyQuest'
import BountyQuest from './quest/BountyQuest'
import './MiscQuest.css'

// Main MiscQuest Component
const MiscQuest = () => {
    const [activeLayer, setActiveLayer] = useState('daily'); // Default: Daily Quest
    const tabs = ['daily', 'weekly', 'monthly', 'bounty'];
    const tabRefs = useRef({});
    const underlineRef = useRef(null);

    const underlineColors = {
      daily: '#2A73A6',
      weekly: '#C73737',
      monthly: '#E4C21C',
      bounty: '#6EC207',
    };

    useEffect(() => {
        const activeTab = tabRefs.current[activeLayer];
        const underline = underlineRef.current;
        if (activeTab && underline) {
            const rect = activeTab.getBoundingClientRect();
            const parentRect = activeTab.parentNode.getBoundingClientRect();
            underline.style.width = `${rect.width}px`;
            underline.style.left = `${rect.left - parentRect.left}px`;
        }
    }, [activeLayer]);

    const handleMenuClick = () => {
        console.log('Menu clicked');
    };
    
    const handleSupportClick = () => {
        console.log('Support clicked');
    };
    
    const handleFriendsClick = () => {
        console.log('Friends clicked');
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
    
    const handleEggClick = () => {
        console.log('Egg clicked');
    };

    return (
        <div className="main-container">
            <Sidebar 
                profilePic="/dummy.jpg"
            />
          
            <div className="main-content">
                <Topbar 
                    onMenuClick={handleMenuClick}
                    onSupportClick={handleSupportClick}
                    onFriendsClick={handleFriendsClick}
                    onSearch={handleSearch}
                    onChatClick={handleChatClick}
                    onNotificationClick={handleNotificationClick}
                    onEggClick={handleEggClick}
                />
                
                {/* Tab Navigation */}
                <div className="quest-tabs">
                    {tabs.map((layer) => (
                        <button
                        key={layer}
                        ref={(el) => (tabRefs.current[layer] = el)}
                        onClick={() => setActiveLayer(layer)}
                        className={activeLayer === layer ? 'active-tab' : 'non-active-tab'}
                      >
                        {layer.charAt(0).toUpperCase() + layer.slice(1)} Quest
                      </button>
                    ))}

                    <div
                      className="quest-underline-slider"
                      ref={underlineRef}
                      style={{ backgroundColor: underlineColors[activeLayer] }}
                    ></div>
                </div>

                {/* Content based on selected tab */}
                {activeLayer === 'daily' && <DailyQuest />}
                {activeLayer === 'weekly' && <WeeklyQuest />}
                {activeLayer === 'monthly' && <MonthlyQuest />}
                {activeLayer === 'bounty' && <BountyQuest />}
            </div>
        </div>
    );
}

export default MiscQuest;