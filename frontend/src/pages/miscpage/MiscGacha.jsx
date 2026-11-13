import React, { useState } from 'react';
import './MiscGacha.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';
import { useUserStats } from '../../context/UserStatsContext';
import { API_URL, TOKEN_KEY } from '../../utils/config';
import { getRarityInfo } from '../../utils/rarity';

const MiscGacha = () => {
  const { user } = useAuth();
  const { gold, diamonds, updateStats } = useUserStats();
  const [pullResults, setPullResults] = useState([]);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const handlePull = async (count) => {
    const requiredGold = count === 10 ? 900 : 100;
    if ((gold || 0) < requiredGold) {
      toast.error(`Not enough Gold! You need ${requiredGold} Gold for ${count}x pull.`);
      return;
    }

    try {
      setIsPulling(true);
      const res = await fetch(`${API_URL}/shop/gacha/pull`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pullCount: count, banner: 'standard' })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Summoning failed');
        return;
      }

      setPullResults(data.results || []);
      setShowResultsModal(true);

      if (data.remainingGold !== undefined) {
        updateStats({ gold: data.remainingGold });
      }

      toast.success(`Summoned ${count} items/pets!`);
    } catch (error) {
      toast.error('Network error during summon');
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="main-container">
      <Sidebar profilePic={user?.profilePic} username={user?.username} />
      <div className="gacha-content">
        <Topbar />
        <ToastContainer position="top-right" autoClose={2500} theme="dark" />

        <div className="gacha-main-layout">
          {/* Header Banner */}
          <div className="gacha-banner-card">
            <div className="gacha-banner-overlay">
              <span className="gacha-banner-tag">SUMMON PORTAL</span>
              <h1 className="gacha-banner-title">Celestial & Eldritch Relics</h1>
              <p className="gacha-banner-desc">
                Summon powerful equipment, weapons, and combat pets across <b>10 Rarity Tiers</b>.
                Tier 9 (Eldritch) and Tier 10 (Transcendent) feature animated looping spritesheets!
              </p>

              <div className="gacha-currency-pill">
                <span>🪙 <b>{gold?.toLocaleString() || 0}</b> Gold</span>
                <span>💎 <b>{diamonds?.toLocaleString() || 0}</b> Diamonds</span>
              </div>
            </div>
          </div>

          {/* Summon Buttons */}
          <div className="gacha-summon-actions">
            <button
              className="gacha-summon-btn single-pull"
              onClick={() => handlePull(1)}
              disabled={isPulling}
            >
              <span className="pull-count">1x Summon</span>
              <span className="pull-cost">🪙 100 Gold</span>
            </button>

            <button
              className="gacha-summon-btn multi-pull"
              onClick={() => handlePull(10)}
              disabled={isPulling}
            >
              <span className="pull-count">10x Summon (10% Off)</span>
              <span className="pull-cost">🪙 900 Gold</span>
            </button>
          </div>

          {/* Rates Table Card */}
          <div className="gacha-rates-card">
            <h3>Summon Rates & Tiers</h3>
            <div className="gacha-rates-grid">
              <div className="rate-pill tier-10">
                <span className="rate-name">Tier 10: Transcendent (Animated 6-Frame)</span>
                <span className="rate-pct">0.4%</span>
              </div>
              <div className="rate-pill tier-9">
                <span className="rate-name">Tier 9: Eldritch (Animated 4-Frame)</span>
                <span className="rate-pct">1.6%</span>
              </div>
              <div className="rate-pill tier-7-8">
                <span className="rate-name">Tiers 7–8: Dragonforged / Astral</span>
                <span className="rate-pct">10.0%</span>
              </div>
              <div className="rate-pill tier-4-6">
                <span className="rate-name">Tiers 4–6: Runic / Abyssal / Radiant</span>
                <span className="rate-pct">40.0%</span>
              </div>
              <div className="rate-pill tier-1-3">
                <span className="rate-name">Tiers 1–3: Crude / Sturdy / Tempered</span>
                <span className="rate-pct">48.0%</span>
              </div>
            </div>
          </div>

          {/* Summon Reveal Modal */}
          {showResultsModal && (
            <div className="gacha-results-modal-overlay">
              <div className="gacha-results-modal">
                <div className="gacha-results-header">
                  <h2>Summoning Results</h2>
                  <button
                    className="gacha-close-btn"
                    onClick={() => setShowResultsModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="gacha-results-grid">
                  {pullResults.map((item, index) => {
                    const rarity = getRarityInfo(item.rarityTier || item.rarityName || 1);
                    return (
                      <div
                        key={index}
                        className="gacha-result-card"
                        style={{
                          borderColor: rarity.border,
                          boxShadow: `0 0 16px ${rarity.glow}`
                        }}
                      >
                        <div
                          className="gacha-result-icon-wrap"
                          style={{ background: rarity.bg }}
                        >
                          <span
                            className={`gacha-result-icon ${rarity.animationClass || ''}`}
                          >
                            {item.type === 'pet' ? '🐾' : '🗡️'}
                          </span>
                        </div>
                        <h4 className="gacha-result-name" style={{ color: rarity.color }}>
                          {item.name}
                        </h4>
                        <span className="gacha-result-rarity" style={{ color: rarity.color }}>
                          {rarity.name} (Tier {rarity.tier})
                        </span>
                        {rarity.animated && (
                          <span className="gacha-animated-badge">✨ {rarity.frames}-Frame Animated</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  className="gacha-confirm-btn"
                  onClick={() => setShowResultsModal(false)}
                >
                  Collect All Items
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiscGacha;
