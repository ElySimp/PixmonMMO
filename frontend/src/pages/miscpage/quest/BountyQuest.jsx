import React, { useState, useEffect } from 'react';
import axios from 'axios';
import questIcon from '../../../assets/MAIN/quest.png';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { API_URL } from '../../../utils/config';

function BountyQuest() {
  const [questPoints, setQuestPoints] = useState(10);
  const [bountyQuests, setBountyQuests] = useState([]);
  const [nextRegen, setNextRegen] = useState(null); // waktu regen berikutnya (Date)
  const [regenCountdown, setRegenCountdown] = useState(""); // string waktu mundur
  const [claimedQuests, setClaimedQuests] = useState({});
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState({
    level: 1, gold: 0, xp: 0, diamonds: 0, quest_points: 0
  });
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState(null);

  const openOverlay = (quest) => {
    setSelectedQuest(quest);
    setShowOverlay(true);
  };

  const closeOverlay = () => {
    setShowOverlay(false);
    setSelectedQuest(null);
  };
  
  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
    const start = Date.now();
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const [statsRes, questRes, userQuestRes] = await Promise.all([
        axios.get(`${API_URL}/api/users/${userId}/stats`),
        axios.get(`${API_URL}/api/quests/bounty`),
        axios.get(`${API_URL}/api/user/${userId}/quests/bounty`)
      ]);
      const statsData = statsRes.data.data || statsRes.data;
      setQuestPoints(statsData.quest_points || 0);
      setPlayerStats(statsData);

      if (statsData.quest_point_last_update && statsData.quest_points < 10) {
        const last = new Date(statsData.quest_point_last_update);
        const next = new Date(last.getTime() + 10 * 60 * 1000);
        setNextRegen(next);
      } else {
        setNextRegen(null);
      }

      const bounty = Array.isArray(questRes.data) ? questRes.data : [];
      setBountyQuests(bounty);

      const userQuests = Array.isArray(userQuestRes.data.data) ? userQuestRes.data.data : [];
      const claimedMap = {};
      userQuests.forEach(q => {
        if (q.claimed) claimedMap[q.id] = 'claimed';
        else if (q.completed) claimedMap[q.id] = 'claim';
      });
      setClaimedQuests(claimedMap);
    } finally {
      setLoading(false);
      console.log('[BountyQuest] Data loaded in', Date.now() - start, 'ms');
    }
  };
    fetchData();
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (!nextRegen) {
      setRegenCountdown("");
      return;
    }
    const interval = setInterval(() => {
      const now = new Date();
      const diff = nextRegen - now;
      if (diff <= 0) {
        setRegenCountdown("Soon!");
      } else {
        const min = Math.floor(diff / 60000);
        const sec = Math.floor((diff % 60000) / 1000);
        setRegenCountdown(`${min}:${sec.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextRegen]);

  // Fungsi restore quest point
  const handleRestoreQuestPoint = async () => {
    try {
      const userId = localStorage.getItem('userId');
      await axios.post(`${API_URL}/api/user/${userId}/restore-quest-point`);
      // Refresh stats
      const statsRes = await axios.get(`${API_URL}/api/users/${userId}/stats`);
      const statsData = statsRes.data.data || statsRes.data;
      setQuestPoints(statsData.quest_points || 0);
      setPlayerStats(statsData);
      toast.success('Quest point restored!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore quest point');
    }
  };

  // Fungsi ambil quest
  const handleTakeQuest = async (questId) => {
    if (questPoints > 0) {
      try {
        const userId = localStorage.getItem('userId');
        await axios.post(`${API_URL}/api/user/${userId}/decrement-quest-point`);
        await axios.post(`${API_URL}/api/user/${userId}/quest/${questId}/start`);

        // Jika quest id 6, lakukan 90% chance langsung complete & claim
        if (questId === 6) {
          const chance = Math.random();
          if (chance <= 0.9) {
            // Tandai quest sebagai completed dulu
            await axios.post(`${API_URL}/api/user/${userId}/quest/${questId}/complete`);
            // Lalu claim reward
            await axios.post(`${API_URL}/api/user/${userId}/quest/${questId}/claim`);
            toast.success('Success! You cleared the quest and got the reward!');
          } else {
            toast.error('Failed! You did not clear the quest. QP still deducted.');
          }
        } else {
          toast.success('Quest taken! Complete it to claim reward.');
        }

        // Refresh stats & claimedQuests
        const statsRes = await axios.get(`${API_URL}/api/users/${userId}/stats`);
        const statsData = statsRes.data.data || statsRes.data;
        setQuestPoints(statsData.quest_points || 0);
        setPlayerStats(statsData);

        const userQuestRes = await axios.get(`${API_URL}/api/user/${userId}/quests`);
        const userQuests = Array.isArray(userQuestRes.data) ? userQuestRes.data : (userQuestRes.data.data || []);
        const claimedMap = {};
        userQuests.forEach(q => {
          if (q.claimed) claimedMap[q.id] = 'claimed';
          else if (q.completed) claimedMap[q.id] = 'claim';
        });
        setClaimedQuests(claimedMap);

      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to take quest');
      }
    }
  };

  // Fungsi claim reward
  const handleClaimReward = async (questId) => {
    try {
      const userId = localStorage.getItem('userId');
      await axios.post(`${API_URL}/api/user/${userId}/quest/${questId}/claim`);
      // Refresh claimedQuests & stats
      const userQuestRes = await axios.get(`${API_URL}/api/user/${userId}/quests`);
      const userQuests = Array.isArray(userQuestRes.data) ? userQuestRes.data : (userQuestRes.data.data || []);
      const claimedMap = {};
      userQuests.forEach(q => {
        if (q.claimed) claimedMap[q.id] = 'claimed';
        else if (q.completed) claimedMap[q.id] = 'claim';
      });
      setClaimedQuests(claimedMap);

      // Refresh stats
      const statsRes = await axios.get(`${API_URL}/api/users/${userId}/stats`);
      const statsData = statsRes.data.data || statsRes.data;
      setPlayerStats(statsData);

      toast.success('Reward claimed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim reward');
    }
  };

  const progressPercent = (questPoints / 10) * 100;

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
      <ToastContainer position="top-right" autoClose={2000} />
      
      {/* Quest Point Section */}
      <div className="bounty-progress">
        <div className='bounty-progress-bar-top'>
          Quest Points 📜
        </div>
        <div className='bounty-progress-bar'>
          <div
            className="bounty-progress-bar-inner"
            style={{ "--progress-percent": `${progressPercent}%` }}
          ></div>
        </div>
        <div className='bounty-progress-bar-bottom'> {questPoints}/10 </div>
        <div className='restore-qp'>
          {questPoints < 10 && (
            <>
              <button onClick={handleRestoreQuestPoint}>Restore with 1 Diamond</button>
              <span className="quest-point-timer">
                Regen : {regenCountdown}
              </span>
            </>
          )}
        </div>

        {/* Player Stats Bar*/}
        <div className="player-stats-bar">
          <div className="stats-row">
              <span className="stats-label">Level</span>
              <span className="stats-value">{playerStats.level} 🎮</span>
          </div>
          <div className="stats-row">
              <span className="stats-label">XP</span>
              <span className="stats-value">{playerStats.xp} ✨</span>
          </div>
          
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
        </div>
      </div>

      {/* Quest List */}
      <div className="quest-title">
        {bountyQuests.length === 0 && <div>No bounty quests available.</div>}
        {bountyQuests.map((quest) => (
          <div key={quest.id} className="quest-box">
            <div>{quest.name}</div>
            <button
              className="quest-go-btn"
              onClick={() => openOverlay(quest)}
            >
              Info
            </button>
          </div>
        ))}
      </div>

      {/* Quest Overlay */}
      {showOverlay && selectedQuest && (
      <div className="bounty-overlay" onClick={closeOverlay}>
        <div className="bounty-overlay-content" onClick={e => e.stopPropagation()}>
          <h2>{selectedQuest.name}</h2>
          <p>{selectedQuest.description}</p>
          <div className="quest-reward">
            Reward: {selectedQuest.gold_reward} Gold, {selectedQuest.xp_reward} XP
          </div>
          {/* Tombol dinamis sesuai status quest */}
          {claimedQuests[selectedQuest.id] === 'claim' ? (
            <button
              className="quest-claim-btn"
              onClick={async () => {
                await handleClaimReward(selectedQuest.id);
                closeOverlay();
              }}
              style={{margin: '1rem 0'}}
            >
              Claim Reward
            </button>
          ) : claimedQuests[selectedQuest.id] === 'claimed' ? (
            <button className="quest-claim-btn" disabled style={{margin: '1rem 0'}}>
              Claimed
            </button>
          ) : (
            <button
              className="quest-go-btn"
              onClick={async () => {
                await handleTakeQuest(selectedQuest.id);
                closeOverlay();
              }}
              style={{margin: '1rem 0'}}
              disabled={questPoints <= 0}
            >
              {questPoints > 0 ? 'Take Quest' : 'Not Enough Quest Points'}
            </button>
          )}
          <button
            onClick={closeOverlay}
            className="quest-close-btn"
          >
            Close
          </button>
        </div>
      </div>
    )}

    </div>
  );
}

export default BountyQuest;