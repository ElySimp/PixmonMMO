import React, { useState, useEffect } from 'react';
import axios from 'axios';
import questIcon from '../../../assets/MAIN/quest.png';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "http://localhost:5000";

function BountyQuest() {
  const [questPoints, setQuestPoints] = useState(10);
  const [bountyQuests, setBountyQuests] = useState([]);
  const [claimedQuests, setClaimedQuests] = useState({});
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState({
    level: 1, gold: 0, xp: 0, diamonds: 0, quest_points: 0
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        // Fetch player stats
        const statsRes = await axios.get(`${API_URL}/api/users/${userId}/stats`);
        const statsData = statsRes.data.data || statsRes.data;
        setQuestPoints(statsData.quest_points || 0);
        setPlayerStats(statsData);

        // Fetch all quests, filter bounty
        const questRes = await axios.get(`${API_URL}/api/quests`);
        const bounty = Array.isArray(questRes.data)
          ? questRes.data.filter(q => q.repeat_type === 'bounty')
          : [];
        setBountyQuests(bounty);

        // Fetch user quest status
        const userQuestRes = await axios.get(`${API_URL}/api/user/${userId}/quests`);
        const userQuests = Array.isArray(userQuestRes.data) ? userQuestRes.data : (userQuestRes.data.data || []);
        const claimedMap = {};
        userQuests.forEach(q => {
          if (q.claimed) claimedMap[q.id] = 'claimed';
          else if (q.completed) claimedMap[q.id] = 'claim';
        });
        setClaimedQuests(claimedMap);
      } catch (err) {
        console.error('Error fetching bounty quest data:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="quest-container">
      <ToastContainer position="top-right" autoClose={2000} />
      {/* Quest Point Section */}
      <div className="bounty-progress">
        <div className='bounty-progress-bar-top'>
          Quest Points
          <img className='quest-point-icon' src={questIcon} alt="quest-point-icon" />
        </div>
        <div className='bounty-progress-bar'>
          <div
            className="bounty-progress-bar-inner"
            style={{ "--progress-percent": `${progressPercent}%` }}
          ></div>
        </div>
        <div className='bounty-progress-bar-bottom'>
          <span>{questPoints}/10</span>
          {questPoints < 10 && (
            <button onClick={handleRestoreQuestPoint}>Restore with 1 Diamond</button>
          )}
        </div>
        {/* Player Stats Bar (seperti di DailyQuest) */}
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

      {/* Quest List */}
      <div className="quest-title">
        {bountyQuests.length === 0 && <div>No bounty quests available.</div>}
        {bountyQuests.map((quest) => (
          <div key={quest.id} className="quest-box">
            <div>
              <div>{quest.name}</div>
              <div className="quest-description">{quest.description}</div>
              <div className="quest-reward">
                {quest.gold_reward} Gold, {quest.xp_reward} XP
              </div>
            </div>
            {claimedQuests[quest.id] === 'claim' ? (
              <button className="quest-claim-btn" onClick={() => handleClaimReward(quest.id)}>
                Claim Reward
              </button>
            ) : claimedQuests[quest.id] === 'claimed' ? (
              <button className="quest-claim-btn" disabled>
                Claimed
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