import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from "moment-timezone";

import { API_URL } from '../../../utils/config';

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
    const [playerStats, setPlayerStats] = useState({ level: 1, gold: 0, xp: 0, diamonds: 0, quest_points: 0 });
    const [steps, setSteps] = useState(0);
    const [loading, setLoading] = useState(true); // Tambahkan state loading
    const [serverTime, setServerTime] = useState('');
    const [nextReset, setNextReset] = useState('');

    // localStorage.setItem('userId', response.data.data.user.id);
    useEffect(() => {
        axios.get(`${API_URL}/api/server-time`).then(res => {
            setServerTime(res.data.serverTime);
            setNextReset(res.data.nextDailyReset);
        });
    }, []);

    useEffect(() => {
        setLoading(true);
        refreshQuestStatus();
    }, []);

    const refreshQuestStatus = async () => {
        try {
            const userId = localStorage.getItem('userId'); // Ambil userId yang sedang login
            const response = await axios.get(`${API_URL}/api/user/${userId}/quests`);
            const quests = Array.isArray(response.data) ? response.data : (response.data.data || []);
            const dailyQuests = quests.filter(q => q.repeat_type === "daily");
            setUserQuests(dailyQuests);
        } catch (error) {
            console.error("🚨 Error refreshing quest status:", error);
        } finally {
            setLoading(false); 
        }
    };
    
    useEffect(() => {
        refreshPlayerStats();
    }, []);

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
                setPlayerStats(data.data || data);

                // Cek apakah main reward sudah di-claim hari ini
                const lastClaim = (data.data || data).last_daily_main_reward;
                if (lastClaim) {
                    const today = moment().tz("Asia/Jakarta").format('YYYY-MM-DD');
                    const claimedDate = moment(lastClaim).tz("Asia/Jakarta").format('YYYY-MM-DD');
                    setMainRewardClaimed(claimedDate === today);
                } else {
                    setMainRewardClaimed(false);
                }
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

        const lastClaim = (data.data || data).last_daily_main_reward;
        if (lastClaim) {
            const today = moment().tz("Asia/Jakarta").format('YYYY-MM-DD');
            const claimedDate = moment(lastClaim).tz("Asia/Jakarta").format('YYYY-MM-DD');
            setMainRewardClaimed(claimedDate === today);
        } else {
            setMainRewardClaimed(false);
        }
    };

    const handleClaimMainReward = async () => {
        const userId = localStorage.getItem('userId');
        const res = await axios.post(`${API_URL}/api/user/${userId}/claim-daily-main-reward`);
        // setMainRewardClaimed(true);
        await refreshPlayerStats(); // Tambahkan ini!
        toast.success(res.data.message || '🎉 5 Diamonds & 1 Key Claimed!');
    };

    const handleGoQuest = (id) => {
        console.log(`Going to quest ${id}`);
    };

    // const completed = userQuests.filter(q => q.completed).length;
    const claimed = userQuests.filter(q => q.claimed).length;
    const progressPercent = userQuests.length > 0 ? (claimed / userQuests.length) * 100 : 0;

    if (loading) {
        return (
            <div className="miscquest-loading-container">
                <div className="miscquest-loading-spinner"></div>
                <div>Loading...</div>
            </div>
        );
    }

    return (
        <div className="quest-container">
            {/* hanya untuk cek servertime */}
            {/* <div>
                Server: {serverTime && new Date(serverTime).toLocaleString()}<br/>
                Next Reset: {nextReset && new Date(nextReset).toLocaleString()}
            </div> */}

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
                    <div className="stats-row">
                        <span className="stats-label">Level</span>
                        <span className="stats-value">{playerStats.level} 🎮</span>
                    </div>
                    <div className="stats-row">
                        <span className="stats-label">XP</span>
                        <span className="stats-value">{playerStats.xp} ✨</span>
                    </div>

                    {/* buat bar */}
                    {/* <div className="stats-progress-bar">
                        <div
                        className="stats-progress-bar-inner"
                        style={{
                            width: `${playerStats.xp_next ? Math.min((playerStats.xp / playerStats.xp_next) * 100, 100) : 0}%`
                        }}
                        />
                    </div> */}
                    
                    <hr style={{ width: '100%', border: '1px solid #e0e0e0', margin: '0.2rem 0' }} />

                    <div className="stats-row">
                        <span className="stats-label">Daily Quest Streak</span>
                        <span className="stats-streak">{playerStats.streak || 0} 🔥</span>
                    </div>
                    <div className="stats-row">
                        <span className="stats-label">Gold</span>
                        <span className="stats-value">{playerStats.gold} 🪙</span>
                    </div>
                    <div className="stats-row">
                        <span className="stats-label">Diamonds</span>
                        <span className="stats-value">{playerStats.diamonds} 💎</span>
                    </div>

                    <hr style={{ width: '100%', border: '1px solid #e0e0e0', margin: '0.2rem 0' }} />

                    <div className="stats-row">
                        <span className="stats-label">Quest Points</span>
                        <span className="stats-value">{playerStats.quest_points} 📜</span>
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