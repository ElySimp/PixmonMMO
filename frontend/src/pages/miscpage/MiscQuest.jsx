import React, { useState } from 'react'
import Topbar from '../../components/Topbar'
import Sidebar from '../../components/Sidebar'
import './MiscQuest.css'

// Daily Quest Component
const questsData = [
  { id: 1, title: 'Daily Login', reward: '✨ 50 XP 💰 20 Gold' },
  { id: 2, title: 'Play 5 Match', reward: '✨ 50 XP 💰 20 Gold' },
  { id: 3, title: 'Win 3 Match', reward: '✨ 50 XP 💰 20 Gold' },
  { id: 4, title: 'Quest', reward: '✨ 50 XP 💰 20 Gold' },
  { id: 5, title: 'Quest', reward: '✨ 50 XP 💰 20 Gold' }
];

function DailyQuest() {
  const [completed, setCompleted] = useState(0);
  const [claimedQuests, setClaimedQuests] = useState([]);
  const [mainRewardClaimed, setMainRewardClaimed] = useState(false);

  const handleComplete = (id) => {
    if (!claimedQuests.includes(id)) {
      setCompleted(prev => prev + 1);
      setClaimedQuests(prev => [...prev, id]);
    }
  };

  const handleClaimMainReward = () => {
    if (completed === questsData.length && !mainRewardClaimed) {
      alert('Reward diklaim!');
      setMainRewardClaimed(true);
    } else {
      alert('Selesaikan semua quest dulu!');
    }
  };

  const progressPercent = (completed / questsData.length) * 100;

  return (
    <div className="daily-quest-container">
      <div className="daily-quest-progress-section">
        <div className="daily-progress-container">
          <div 
            className="daily-circular-progress" 
            style={{"--progress-percent": `${progressPercent}%`}}
          >
            <div className="daily-inner-circle">
              <span>{completed}/{questsData.length}</span>
              <span>Progress</span>
            </div>
          </div>
          <button 
            className="daily-claim-main-btn" 
            onClick={handleClaimMainReward} 
            disabled={mainRewardClaimed || completed < questsData.length}
          >
            {mainRewardClaimed ? 'CLAIMED' : 'CLAIM'} 💎
          </button>
        </div>
      </div>
      <div className="daily-quest-title">
        {questsData.map((quest) => (
          <div key={quest.id} className="daily-quest-box">
            <div>
              <div>{quest.title}</div>
              <div className="daily-reward">{quest.reward}</div>
            </div>
            {quest.id === 1 ? (
              // Daily Login quest dengan tombol Claim
              <button
                className={claimedQuests.includes(quest.id) ? 'daily-claim-btn' : 'daily-go-btn'}
                onClick={() => handleComplete(quest.id)}
                disabled={claimedQuests.includes(quest.id)}
              >
                {claimedQuests.includes(quest.id) ? 'Claimed' : 'Claim'}
              </button>
            ) : (
              // Quest lainnya dengan tombol Go
              <button
                className="daily-go-btn"
                onClick={() => handleGoQuest(quest.id)}
              >
                Go!
              </button>
            )}
          </div>
        ))}
      </div>
      
    </div>
  );
}

// Main MiscQuest Component
const MiscQuest = () => {
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
                
                <DailyQuest />
            </div>
        </div>
    );
}

export default MiscQuest