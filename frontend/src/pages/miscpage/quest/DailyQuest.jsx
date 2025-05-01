import React, { useState } from 'react';
import { questsData } from './QuestData';

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
    if (completed === questsData.daily.length && !mainRewardClaimed) {
      alert('Reward diklaim!');
      setMainRewardClaimed(true);
    } else {
      alert('Selesaikan semua quest dulu!');
    }
  };

  const handleGoQuest = (id) => {
    console.log(`Going to quest ${id}`);
  };

  const progressPercent = (completed / questsData.daily.length) * 100;

  return (
    <div className="quest-container">
      <div className="quest-progress-container">
        <div 
          className="daily-circular-progress" 
          style={{"--progress-percent": `${progressPercent}%`}}
        >
          <div className="quest-inner-circle">
            <span>{completed}/{questsData.daily.length}</span>
            <span>Progress</span>
          </div>
        </div>
        <button 
          className="daily-claim-main-btn" 
          onClick={handleClaimMainReward} 
          disabled={mainRewardClaimed || completed < questsData.daily.length}
        >
          {mainRewardClaimed ? 'CLAIMED' : 'CLAIM'} 💎
        </button>
      </div>
      <div className="quest-title">
        {questsData.daily.map((quest) => (
          <div key={quest.id} className="quest-box">
            <div>
              <div>{quest.title}</div>
              <div className="quest-reward">{quest.reward}</div>
            </div>
            {quest.id === 1 ? (
              // Daily Login quest dengan tombol Claim
              <button
                className={claimedQuests.includes(quest.id) ? 'quest-claim-btn' : 'quest-go-btn'}
                onClick={() => handleComplete(quest.id)}
                disabled={claimedQuests.includes(quest.id)}
              >
                {claimedQuests.includes(quest.id) ? 'Claimed' : 'Claim'}
              </button>
            ) : (
              // Quest lainnya dengan tombol Go
              <button
                className="quest-go-btn"
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

export default DailyQuest;