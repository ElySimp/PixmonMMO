import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "http://localhost:5000";

function getDailyKeyDate() {
  const now = new Date();
  if (now.getHours() < 7) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().slice(0,10).replace(/-/g,'');
}

function DailyQuest() {
    const [userQuests, setUserQuests] = useState([]);
    const [mainRewardClaimed, setMainRewardClaimed] = useState(false);
    // localStorage.setItem('userId', response.data.data.user.id);

    useEffect(() => {
        refreshQuestStatus();
    }, []);

    const refreshQuestStatus = async () => {
        try {
            const userId = localStorage.getItem('userId'); // Ambil userId yang sedang login
            const response = await axios.get(`${API_URL}/api/user/${userId}/quests`);
            const quests = Array.isArray(response.data) ? response.data : (response.data.data || []);
            setUserQuests(quests);
        } catch (error) {
            console.error("🚨 Error refreshing quest status:", error);
        }
    };
    const [playerStats, setPlayerStats] = useState({ level: 1, gold: 0, xp: 0, diamonds: 0, quest_points: 0 });

    const [steps, setSteps] = useState(0);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const dailyKey = `steps_${userId}_${getDailyKeyDate()}`;
        const storedSteps = parseInt(localStorage.getItem(dailyKey) || '0');
        setSteps(storedSteps);

        // Polling agar update realtime
        const interval = setInterval(() => {
            const newSteps = parseInt(localStorage.getItem(dailyKey) || '0');
            setSteps(newSteps);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        fetch(`${API_URL}/api/users/${userId}/stats`)
            .then(res => res.json())
            .then(data => {
                console.log('Stats API response:', data); // Tambahkan ini
                setPlayerStats(data.data || data)
            });
    }, []);

    const handleClaimQuest = async (id) => {
        try {
            const userId = localStorage.getItem('userId');
            const response = await axios.post(`${API_URL}/api/user/${userId}/quest/${id}/claim`);
            if (response.data.success) {
                await refreshQuestStatus();
                await refreshPlayerStats();
                toast.success('✅ Quest Claimed!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "🚨 Error claiming quest");        }
    };

    const refreshPlayerStats = async () => {
        const userId = localStorage.getItem('userId');
        const res = await fetch(`${API_URL}/api/users/${userId}/stats`);
        const data = await res.json();
        setPlayerStats(data.data || data);
    };

    const handleClaimMainReward = async () => {
        const userId = localStorage.getItem('userId');
        const res = await axios.post(`${API_URL}/api/user/${userId}/claim-daily-main-reward`);
        setMainRewardClaimed(true);
        await refreshPlayerStats(); // Tambahkan ini!
        toast.success(res.data.message || '🎉 5 Diamonds & 1 Key Claimed!');
    };

    const handleGoQuest = (id) => {
        console.log(`Going to quest ${id}`);
    };

    // const completed = userQuests.filter(q => q.completed).length;
    const claimed = userQuests.filter(q => q.claimed).length;
    const progressPercent = userQuests.length > 0 ? (claimed / userQuests.length) * 100 : 0;

    return (
        <div className="quest-container">
            <div className="quest-progress-container">
                <div 
                    className="daily-circular-progress" 
                    style={{"--progress-percent": `${progressPercent}%`}}
                >
                    <div className="quest-inner-circle">
                        <span>{claimed}/{userQuests.length}</span>
                        <span>Progress</span>
                    </div>
                </div>
                
                <button 
                    className="daily-claim-main-btn" 
                    onClick={handleClaimMainReward} 
                    disabled={mainRewardClaimed || claimed < userQuests.length}
                >
                    {mainRewardClaimed ? 'CLAIMED' : 'CLAIM'} 💎
                </button>

                <div className="player-stats-bar">
                    <div className='player-stats-bar-left'>
                        <span>Level</span>
                        <span>Gold</span>
                        <span>XP</span>
                        <span>Diamonds</span>
                        <span>QP</span>
                    </div>

                    <div className='player-stats-bar-right'>
                        <span>{playerStats.level}</span>
                        <span>{playerStats.gold}</span>
                        <span>{playerStats.xp}</span>
                        <span>{playerStats.diamonds}</span>
                        <span>{playerStats.quest_points}</span>
                    </div> 
                </div>
            </div>
            <div className="quest-title">
                {userQuests.map((quest) => (
                    <div key={quest.id} className="quest-box">
                        <div>
                            <div>{quest.name}</div>
                            <div className="quest-description">
                                {quest.name === "Take 5 Steps"
                                ? `${steps}/5 steps`
                                : quest.description}
                            </div>
                            <div className="quest-reward">{quest.gold_reward} Gold &nbsp; {quest.xp_reward} XP</div>
                        </div>
                        {quest.claimed ? (
                            <button className="quest-claim-btn" disabled>
                                Claimed
                            </button>
                        ) : quest.completed ? (
                            <button className="quest-claim-btn" onClick={() => handleClaimQuest(quest.id)}>
                                Claim
                            </button>
                        ) : (
                            <button className="quest-go-btn" onClick={() => handleGoQuest(quest.id)}>
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