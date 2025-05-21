import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "http://localhost:5000";

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
            // response.data bisa array atau object tergantung backend, cek dulu
            const quests = Array.isArray(response.data) ? response.data : (response.data.data || []);
            setUserQuests(quests);
        } catch (error) {
            console.error("🚨 Error refreshing quest status:", error);
        }
    };

    const handleClaimQuest = async (id) => {
        try {
            const userId = localStorage.getItem('userId');
            const response = await axios.post(`${API_URL}/api/user/${userId}/quest/${id}/claim`);
            if (response.data.success) {
                await refreshQuestStatus();
                alert('✅ Quest Claimed!');
            }
        } catch (error) {
            console.error("🚨 Error claiming quest:", error);
        }
    };

    const handleClaimMainReward = () => {
        if (userQuests.filter(q => q.claimed).length === userQuests.length && !mainRewardClaimed) {
            alert('Reward diklaim!');
            setMainRewardClaimed(true);
        } else {
            alert('Selesaikan semua quest dulu!');
        }
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
            </div>
            <div className="quest-title">
                {userQuests.map((quest) => (
                    <div key={quest.id} className="quest-box">
                        <div>
                            <div>{quest.name}</div>
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