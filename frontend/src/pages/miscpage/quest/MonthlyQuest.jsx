import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../../../utils/config';

function MonthlyQuest() {
  const [monthlyQuests, setMonthlyQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMonthlyQuests = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API_URL}/user/${userId}/quests`);
      const quests = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setMonthlyQuests(quests.filter((q) => q.repeat_type === 'monthly'));
    } catch (error) {
      toast.error('Failed to load monthly quests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyQuests();
  }, []);

  const handleClaimQuest = async (quest) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      const res = await axios.post(`${API_URL}/user/${userId}/quest/${quest.quest_id || quest.id}/claim`);
      if (res.data?.success) {
        toast.success(`Claimed +${quest.xp_reward} XP, +${quest.gold_reward} Gold!`);
        fetchMonthlyQuests();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not claim quest reward yet');
    }
  };

  const completedCount = monthlyQuests.filter((q) => q.claimed).length;
  const totalCount = monthlyQuests.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="quest-container">
      <div className="quest-progress-container">
        <div
          className="monthly-circular-progress"
          style={{ '--progress-percent': `${progressPercent}%` }}
        >
          <div className="quest-inner-circle">
            <span>{completedCount}/{monthlyQuests.length}</span>
            <span>Claimed</span>
          </div>
        </div>
      </div>

      <div className="quest-title">
        {loading ? (
          <div className="quest-box">Loading monthly quests...</div>
        ) : monthlyQuests.length === 0 ? (
          <div className="quest-box">No monthly quests available yet.</div>
        ) : (
          monthlyQuests.map((quest) => {
            const isReady = quest.completed && !quest.claimed;
            return (
              <div key={quest.id} className="quest-box">
                <div>
                  <div>{quest.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>{quest.description}</div>
                  <div className="quest-reward">
                    Progress: {quest.progress || 0}/{quest.target || 1} | Reward: {quest.xp_reward} XP, {quest.gold_reward} Gold
                  </div>
                </div>
                <button
                  className={quest.claimed ? 'quest-claim-btn' : isReady ? 'quest-claim-btn' : 'quest-go-btn'}
                  disabled={!isReady || quest.claimed}
                  onClick={() => handleClaimQuest(quest)}
                >
                  {quest.claimed ? 'CLAIMED' : isReady ? 'CLAIM' : 'IN PROGRESS'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MonthlyQuest;
