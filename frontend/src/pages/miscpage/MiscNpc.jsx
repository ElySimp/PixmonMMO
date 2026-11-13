import React, { useState, useEffect } from 'react';
import './MiscNpc.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';
import { API_URL, TOKEN_KEY } from '../../utils/config';

const MiscNpc = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [npcs, setNpcs] = useState([]);
  const [selectedNpc, setSelectedNpc] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    const fetchNpcs = async () => {
      try {
        const res = await fetch(`${API_URL}/npcs`);
        const data = await res.json();
        if (data.success && Array.isArray(data.npcs)) {
          setNpcs(data.npcs);
          if (data.npcs.length > 0) setSelectedNpc(data.npcs[0]);
        }
      } catch (err) {
        toast.error('Failed to load Town NPCs');
      } finally {
        setLoading(false);
      }
    };
    fetchNpcs();
  }, []);

  const handleHeal = async (npc) => {
    try {
      const res = await fetch(`${API_URL}/npcs/${npc.npcId}/interact`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ actionType: 'heal' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Interaction failed');
      }
    } catch (err) {
      toast.error('Network error talking to NPC');
    }
  };

  const getNpcIcon = (role) => {
    switch (role) {
      case 'blacksmith': return '🔨';
      case 'alchemist': return '⚗️';
      case 'guildmaster': return '🛡️';
      case 'mystic': return '🔮';
      default: return '🧙';
    }
  };

  return (
    <div className="npc-page-container">
      <Sidebar profilePic={user?.profilePic} username={user?.username} />
      <div className="npc-page-content">
        <Topbar />
        <ToastContainer position="top-right" autoClose={2500} theme="dark" />

        <div className="npc-main-layout">
          <div className="npc-header-banner">
            <h2>🏰 Town Square & NPCs</h2>
            <p>Speak with the townsfolk for guidance, healing, quests, and equipment tips.</p>
          </div>

          {loading ? (
            <div className="npc-empty-state">Entering Town Square...</div>
          ) : (
            <div className="npc-workspace">
              <div className="npc-list-grid">
                {npcs.map((npc) => (
                  <div
                    key={npc.npcId}
                    className={`npc-card ${selectedNpc?.npcId === npc.npcId ? 'active' : ''}`}
                    onClick={() => setSelectedNpc(npc)}
                  >
                    <div className="npc-avatar-circle">{getNpcIcon(npc.role)}</div>
                    <div className="npc-card-info">
                      <h3>{npc.name}</h3>
                      <span className="npc-role-tag">{npc.title || npc.role}</span>
                      <span className="npc-location">📍 {npc.location}</span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedNpc && (
                <div className="npc-dialogue-box">
                  <div className="npc-dialogue-header">
                    <span className="npc-dialogue-icon">{getNpcIcon(selectedNpc.role)}</span>
                    <div>
                      <h3>{selectedNpc.name}</h3>
                      <span>{selectedNpc.title || selectedNpc.role}</span>
                    </div>
                  </div>

                  <p className="npc-greeting">“{selectedNpc.defaultGreeting}”</p>

                  <div className="npc-actions-row">
                    <button className="npc-action-btn heal" onClick={() => handleHeal(selectedNpc)}>
                      ❤️ Receive Full Heal & Mana Restore
                    </button>
                    <button className="npc-action-btn nav" onClick={() => navigate('/quest')}>
                      📜 View Quests
                    </button>
                    <button className="npc-action-btn nav" onClick={() => navigate('/shop')}>
                      🛒 Visit Shop
                    </button>
                    <button className="npc-action-btn nav" onClick={() => navigate('/battle')}>
                      ⚔️ Enter Dungeon
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiscNpc;
