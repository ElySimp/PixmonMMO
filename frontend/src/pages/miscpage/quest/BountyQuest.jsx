import React, { useState, useEffect } from 'react';
import questIcon from '../../../assets/MAIN/quest.png';
import { questsData } from './QuestData';

function BountyQuest() {
  const [questPoints, setQuestPoints] = useState(() => {
    return parseInt(localStorage.getItem('questPoints')) || 10; // Default: 10
  });
  const [nextPointIn, setNextPointIn] = useState(1800); // 30 menit
  const [claimedQuests, setClaimedQuests] = useState({}); 

  useEffect(() => {
    let interval;

    if (questPoints < 10) { 
      interval = setInterval(() => {
        setNextPointIn(prev => prev - 1);

        if (nextPointIn <= 0) {
          setQuestPoints(prev => Math.min(prev + 1, 10)); 
          setNextPointIn(1800);
          localStorage.setItem('questPoints', questPoints + 1);
        }
      }, 1000);
    }

    return () => clearInterval(interval); 
  }, [nextPointIn, questPoints]);

  const handleTakeQuest = (questId) => {
    if (questPoints > 0) {
      setQuestPoints(prev => prev - 1);
      localStorage.setItem('questPoints', questPoints - 1);
      setClaimedQuests(prev => ({ ...prev, [questId]: 'claim' }));
    }
  };

  const handleClaimReward = (questId) => {
    setClaimedQuests(prev => ({ ...prev, [questId]: 'claimed' }));
  };

  const progressPercent = (questPoints / 10) * 100;

  return (
    <div className="quest-container">
      {/* Quest Point Section */}
      <div className="bounty-progress">
        <div className='bounty-progress-bar-top'>
          Quest Points
          <img className='quest-point-icon' src={questIcon} alt="quest-point-icon" />
        </div>
        
        <div className='bounty-progress-bar'>
          <div 
            className="bounty-progress-bar-inner" 
            style={{"--progress-percent": `${progressPercent}%`}}
          >
          </div>
        </div>
         
        <div className='bounty-progress-bar-bottom'>
          <span>{questPoints}/10</span>
          {questPoints < 10 && (
            <span className='quest-point-timer'>
              +1 in {String(Math.floor(nextPointIn / 60)).padStart(2, '0')}:
              {String(nextPointIn % 60).padStart(2, '0')}
            </span>
          )}
        </div>
      </div>

      {/* Quest List */}
      <div className="quest-title">
        {questsData.bounty.map((quest) => (
          <div key={quest.id} className="quest-box">
            <div>
              <div>{quest.title}</div>
              <div className="quest-reward">{quest.reward}</div>
            </div>
            {claimedQuests[quest.id] === 'claim' ? (
              <button className="quest-claim-btn" onClick={() => handleClaimReward(quest.id)}>
                Claim Reward
              </button>
            ) : claimedQuests[quest.id] === 'claimed' ? (
              <button className="quest-claim-btn" disabled>
                Claimed ✅
              </button>
            ) : (
              <button className="quest-go-btn" onClick={() => handleTakeQuest(quest.id)} disabled={questPoints <= 0}>
                {questPoints > 0 ? 'Take Quest' : 'Not Enough Quest Points'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BountyQuest;