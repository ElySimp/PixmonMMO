import React, { useState, useEffect } from 'react';
import './Adventure.css';
import Sidebar from '../../../components/Sidebar';
import Topbar from '../../../components/Topbar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../../context/AuthContext';
import { useUserStats } from '../../../context/UserStatsContext';
import { API_URL, TOKEN_KEY } from '../../../utils/config';
import { getRarityInfo } from '../../../utils/rarity';
import adventureStories from '../../../assets/adventure_stories';
import avatarExample from '../../../assets/MAIN/avatar_exaple.gif';
import logo from '../../../assets/MAIN/logo.png';
import healthIcon from '../../../assets/MAIN/health.png';
import attackIcon from '../../../assets/MAIN/battle.png';
import defenseIcon from '../../../assets/MAIN/defence.png';
import diamondsIcon from '../../../assets/MAIN/diamonds2.png';

const DUNGEON_ZONES = [
  {
    id: 'whispering_woods',
    name: 'Whispering Woods',
    levelReq: 1,
    difficulty: 'Normal',
    description: 'A shadowy forest teeming with goblins, wild beasts, and hidden herbal caches.',
    gradient: 'linear-gradient(135deg, #1b382b 0%, #0d1b14 100%)',
    borderColor: '#4CAF50'
  },
  {
    id: 'sunken_caverns',
    name: 'Sunken Caverns',
    levelReq: 6,
    difficulty: 'Hard',
    description: 'Flooded subterranean ruins guarded by cave spiders and ancient golems.',
    gradient: 'linear-gradient(135deg, #153243 0%, #081620 100%)',
    borderColor: '#2196F3'
  },
  {
    id: 'dragons_spire',
    name: 'Dragon’s Spire',
    levelReq: 12,
    difficulty: 'Nightmare',
    description: 'Volcanic peaks inhabited by flame drakes and dragonforged armaments.',
    gradient: 'linear-gradient(135deg, #421b1b 0%, #1f0b0b 100%)',
    borderColor: '#FF5722'
  },
  {
    id: 'void_rift',
    name: 'Void Rift',
    levelReq: 18,
    difficulty: 'Eldritch',
    description: 'A fracture in reality where eldritch horrors and transcendent treasures await.',
    gradient: 'linear-gradient(135deg, #2d1845 0%, #130a1f 100%)',
    borderColor: '#B388FF'
  }
];

const Adventure = () => {
  const { user } = useAuth();
  const { level, xp, gold, diamonds, updateStats, calculateXpCap } = useUserStats();

  // Navigation / Dungeon State
  const [dungeonSession, setDungeonSession] = useState(null);
  const [selectedZone, setSelectedZone] = useState(DUNGEON_ZONES[0]);
  const [loading, setLoading] = useState(false);
  const [energy, setEnergy] = useState(10);
  const [maxEnergy, setMaxEnergy] = useState(10);

  // Stepping Action Delay (Cooldown)
  const [stepCooldown, setStepCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Combat State
  const [combatState, setCombatState] = useState(null);
  const [combatLogs, setCombatLogs] = useState([]);
  const [isHitPlayer, setIsHitPlayer] = useState(false);
  const [isHitMonster, setIsHitMonster] = useState(false);
  const [equippedPet, setEquippedPet] = useState(null);
  const [currentStoryText, setCurrentStoryText] = useState('');

  // Fetch active session & user energy on mount
  useEffect(() => {
    fetchActiveSession();
    fetchEquippedPet();
  }, [user]);

  // Handle action delay timer
  useEffect(() => {
    let timer;
    if (stepCooldown && cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            setStepCooldown(false);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stepCooldown, cooldownSeconds]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchActiveSession = async () => {
    try {
      const res = await fetch(`${API_URL}/dungeon/active`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.hasActiveSession) {
        setDungeonSession(data.session);
        if (data.session.status === 'in_combat' && data.session.combatState) {
          setCombatState(data.session.combatState);
          setCombatLogs(data.session.combatState.combatLogs || []);
        }
      }
    } catch (err) {
      // Quiet fail on network check
    }
  };

  const fetchEquippedPet = async () => {
    try {
      const userId = user?.id || localStorage.getItem('userId');
      if (!userId) return;
      const res = await fetch(`${API_URL}/pets/user/${userId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.pets)) {
        const equipped = data.pets.find(p => p.equipped === 'yes' || p.is_equipped === true);
        if (equipped) setEquippedPet(equipped);
      }
    } catch (err) {
      // Quiet fail
    }
  };

  // 1. Enter Dungeon (Costs 1 Energy, 1-8 steps)
  const handleEnterDungeon = async (zone) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/dungeon/enter`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to enter dungeon. Check your energy.');
        setLoading(false);
        return;
      }

      setDungeonSession(data.session);
      if (data.remainingEnergy !== undefined) {
        setEnergy(data.remainingEnergy);
      }
      setSelectedZone(zone);
      toast.success(`Entered ${zone.name}! Generated ${data.session.totalSteps} steps.`);
    } catch (error) {
      toast.error('Network error connecting to dungeon.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Take a Step (Enforces brief action delay)
  const handleTakeStep = async () => {
    if (stepCooldown) return;

    try {
      setStepCooldown(true);
      setCooldownSeconds(1); // 1-second action delay

      // Pick random ambient story text
      const randomStory = adventureStories[Math.floor(Math.random() * adventureStories.length)];
      setCurrentStoryText(randomStory);

      const res = await fetch(`${API_URL}/dungeon/step`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to advance step');
        return;
      }

      setDungeonSession(data.session);

      if (data.status === 'in_combat' && data.session.combatState) {
        setCombatState(data.session.combatState);
        setCombatLogs(data.session.combatState.combatLogs || []);
        toast.warn(`Monster encountered! Step ${data.stepIndex} of ${data.totalSteps}`);
      } else if (data.currentStep?.eventType === 'loot') {
        const loot = data.currentStep.loot;
        toast.info(`Found Treasure! +${loot.gold || 0} Gold, ${loot.name || 'item'}`);
      } else if (data.isCompleted) {
        toast.success('Dungeon Run Completed! Claim your loot.');
      }
    } catch (error) {
      toast.error('Error taking dungeon step');
    }
  };

  // 3. Combat Action (Attack, Pet Skill, Potion, Flee)
  const handleCombatAction = async (actionType, itemId = null) => {
    try {
      const res = await fetch(`${API_URL}/dungeon/action`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: actionType, itemId })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Combat action failed');
        return;
      }

      if (data.fled) {
        toast.info('You fled the battle safely.');
        setCombatState(null);
        setDungeonSession(null);
        return;
      }

      setCombatState(data.combatState);
      setCombatLogs(data.combatState.combatLogs || []);

      // Visual hit flashes
      setIsHitMonster(true);
      setTimeout(() => setIsHitMonster(false), 300);

      if (data.combatState?.playerCurrentHp < (combatState?.playerCurrentHp || 100)) {
        setIsHitPlayer(true);
        setTimeout(() => setIsHitPlayer(false), 300);
      }

      if (data.combatFinished) {
        if (data.victory) {
          toast.success('Victory! Monster defeated.');
          setCombatState(null);
        } else {
          toast.error('You were defeated in battle!');
          setCombatState(null);
        }
      }

      // Refresh session state
      fetchActiveSession();
    } catch (error) {
      toast.error('Error processing combat action');
    }
  };

  // 4. Claim Dungeon Rewards
  const handleClaimRewards = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/dungeon/claim`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to claim rewards');
        return;
      }

      toast.success(`Claimed +${data.rewards.xp} XP, +${data.rewards.gold} Gold, and ${data.rewards.items.length} items!`);

      // Update global context stats
      if (data.player) {
        updateStats({
          level: data.player.level,
          xp: data.player.xp,
          gold: data.player.gold,
          diamonds: data.player.diamonds
        });
      }

      setDungeonSession(null);
      setCombatState(null);
    } catch (error) {
      toast.error('Error claiming rewards');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = dungeonSession?.steps?.[(dungeonSession?.currentStepIndex || 1) - 1];
  const monster = currentStep?.monster;

  return (
    <div className="adventure-container">
      <Sidebar profilePic={user?.profilePic} username={user?.username} />
      <div className="adventure-content">
        <Topbar />
        <ToastContainer position="top-right" autoClose={2500} theme="dark" />

        <div className="adventure-main-layout">
          {/* Header Status Bar */}
          <div className="adventure-header-banner">
            <div className="adventure-header-player">
              <img src={avatarExample} alt="Avatar" className="adventure-header-avatar" />
              <div>
                <h3 className="adventure-player-name">{user?.username || 'Hero'}</h3>
                <span className="adventure-player-lvl">Level {level} Adventurer</span>
              </div>
            </div>

            <div className="adventure-header-stats">
              <div className="adventure-stat-badge">
                <span className="badge-icon">⚡</span>
                <span>Energy: <b>{energy} / {maxEnergy}</b></span>
              </div>
              <div className="adventure-stat-badge">
                <span className="badge-icon">🪙</span>
                <span>Gold: <b>{gold?.toLocaleString() || 0}</b></span>
              </div>
              <div className="adventure-stat-badge">
                <img src={diamondsIcon} alt="Diamonds" className="badge-diamond-icon" />
                <span>Diamonds: <b>{diamonds?.toLocaleString() || 0}</b></span>
              </div>
            </div>
          </div>

          {/* MAIN VIEW CONTROLLER */}
          {!dungeonSession ? (
            /* VIEW 1: DUNGEON ZONE SELECTOR */
            <div className="adventure-zone-selector">
              <div className="zone-selector-header">
                <h2>Choose a Dungeon</h2>
                <p>Each dungeon run costs <b>1 Energy</b>. Steps are randomized between <b>1 and 8 steps</b> with monsters, treasure, and relics.</p>
              </div>

              <div className="zones-grid">
                {DUNGEON_ZONES.map((zone) => (
                  <div
                    key={zone.id}
                    className="zone-card"
                    style={{ background: zone.gradient, borderColor: zone.borderColor }}
                  >
                    <div className="zone-card-top">
                      <span className="zone-difficulty-tag" style={{ color: zone.borderColor }}>
                        {zone.difficulty}
                      </span>
                      <span className="zone-energy-cost">⚡ 1 Energy</span>
                    </div>

                    <h3 className="zone-title">{zone.name}</h3>
                    <p className="zone-desc">{zone.description}</p>
                    <div className="zone-rec-level">Recommended Level: {zone.levelReq}+</div>

                    <button
                      className="zone-enter-button"
                      onClick={() => handleEnterDungeon(zone)}
                      disabled={loading || level < zone.levelReq}
                    >
                      {level < zone.levelReq ? `Requires Lv. ${zone.levelReq}` : 'Enter Dungeon'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : combatState && dungeonSession.status === 'in_combat' ? (
            /* VIEW 2: TURN-BASED COMBAT ARENA */
            <div className="adventure-combat-arena">
              <div className="combat-arena-header">
                <h3>⚔️ Turn-Based Battle — Round {combatState.turn || 1}</h3>
                <span className="combat-step-indicator">
                  Step {dungeonSession.currentStepIndex} of {dungeonSession.totalSteps}
                </span>
              </div>

              <div className="combat-arena-stage">
                {/* Player & Pet Side */}
                <div className={`combat-unit-card player-unit ${isHitPlayer ? 'combat-hit' : ''}`}>
                  <div className="combat-unit-avatar-wrap">
                    <img src={avatarExample} alt="Player" className="combat-unit-avatar" />
                    {equippedPet && (
                      <div className="combat-pet-badge pet-anim-tier-mid">
                        <span className="combat-pet-role">🐾 {equippedPet.name || 'Pet'}</span>
                      </div>
                    )}
                  </div>
                  <h4 className="combat-unit-name">{user?.username || 'Hero'} (Lv. {level})</h4>

                  {/* Player HP Bar */}
                  <div className="combat-bar-container">
                    <div className="combat-bar-label">
                      <span>HP</span>
                      <span>{combatState.playerCurrentHp || 100} / 100</span>
                    </div>
                    <div className="combat-bar-track">
                      <div
                        className="combat-bar-fill hp"
                        style={{ width: `${Math.max(0, Math.min(100, combatState.playerCurrentHp || 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Pet Status */}
                  {equippedPet && (
                    <div className="combat-pet-assist-banner">
                      <span>Pet Support Active: +{equippedPet.current_atk || 15} ATK</span>
                    </div>
                  )}
                </div>

                {/* VS Divider */}
                <div className="combat-vs-divider">
                  <span>VS</span>
                </div>

                {/* Monster Side */}
                <div className={`combat-unit-card monster-unit ${isHitMonster ? 'combat-hit' : ''}`}>
                  <div className="combat-unit-avatar-wrap">
                    <img
                      src={monster?.assetPath || logo}
                      alt={monster?.name || 'Monster'}
                      className="combat-monster-avatar spritesheet-anim-4frame"
                    />
                  </div>
                  <h4 className="combat-unit-name monster-name">{monster?.name || 'Enemy'} (Lv. {monster?.level || 1})</h4>

                  {/* Monster HP Bar */}
                  <div className="combat-bar-container">
                    <div className="combat-bar-label">
                      <span>HP</span>
                      <span>{combatState.monsterCurrentHp} / {combatState.monsterMaxHp}</span>
                    </div>
                    <div className="combat-bar-track">
                      <div
                        className="combat-bar-fill monster-hp"
                        style={{
                          width: `${Math.max(0, Math.min(100, (combatState.monsterCurrentHp / (combatState.monsterMaxHp || 1)) * 100))}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="combat-monster-stats">
                    <span>ATK: {monster?.atk || 12}</span>
                    <span>DEF: {monster?.defPhy || 5}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="combat-actions-panel">
                <button
                  className="combat-action-btn btn-attack"
                  onClick={() => handleCombatAction('attack')}
                >
                  ⚔️ Attack
                </button>
                <button
                  className="combat-action-btn btn-potion"
                  onClick={() => handleCombatAction('use_item', 'potion_hp')}
                >
                  🧪 Minor Potion (+50 HP)
                </button>
                <button
                  className="combat-action-btn btn-flee"
                  onClick={() => handleCombatAction('flee')}
                >
                  🏃 Flee Dungeon
                </button>
              </div>

              {/* Combat Log */}
              <div className="combat-log-console">
                <h4>Battle Log</h4>
                <div className="combat-log-feed">
                  {combatLogs.slice().reverse().map((log, index) => (
                    <div key={index} className={`combat-log-entry ${log.actor}`}>
                      <span className="log-round">R{log.round || 1}</span>
                      <span className="log-text">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 3: ACTIVE DUNGEON STEPPING & LOOT */
            <div className="adventure-dungeon-run">
              <div className="dungeon-run-header">
                <div className="dungeon-run-title-group">
                  <h2>{selectedZone.name}</h2>
                  <span className="dungeon-progress-badge">
                    Step <b>{dungeonSession.currentStepIndex}</b> of <b>{dungeonSession.totalSteps}</b>
                  </span>
                </div>

                <div className="dungeon-progress-bar-wrap">
                  <div
                    className="dungeon-progress-bar-fill"
                    style={{
                      width: `${(dungeonSession.currentStepIndex / dungeonSession.totalSteps) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Scene Card */}
              <div className="dungeon-scene-card">
                <div className="dungeon-scene-icon">
                  {dungeonSession.status === 'completed' ? '🏆' : currentStep?.eventType === 'loot' ? '🎁' : '🌲'}
                </div>
                <h3 className="dungeon-scene-title">
                  {dungeonSession.status === 'completed'
                    ? 'Dungeon Conquered!'
                    : currentStep?.eventType === 'loot'
                    ? 'Treasure Found!'
                    : `Exploring Step ${dungeonSession.currentStepIndex}`}
                </h3>
                <p className="dungeon-scene-narrative">
                  {currentStoryText || 'You venture deeper into the dungeon corridors, your footsteps echoing against the ancient stone...'}
                </p>

                {/* Accumulated Rewards Pill */}
                <div className="dungeon-accumulated-pill">
                  <span>Accumulated: <b>+{dungeonSession.accumulatedRewards?.xp || 0} XP</b></span>
                  <span><b>+{dungeonSession.accumulatedRewards?.gold || 0} Gold</b></span>
                  {dungeonSession.accumulatedRewards?.diamonds > 0 && (
                    <span><b>+{dungeonSession.accumulatedRewards.diamonds} Diamonds</b></span>
                  )}
                  {dungeonSession.accumulatedRewards?.items?.length > 0 && (
                    <span><b>{dungeonSession.accumulatedRewards.items.length} Items</b></span>
                  )}
                </div>
              </div>

              {/* Stepping Action Button */}
              <div className="dungeon-run-controls">
                {dungeonSession.status === 'completed' ? (
                  <button
                    className="dungeon-claim-btn"
                    onClick={handleClaimRewards}
                    disabled={loading}
                  >
                    🏆 Claim All Rewards & Exit
                  </button>
                ) : (
                  <button
                    className={`dungeon-step-btn ${stepCooldown ? 'step-delay-pulse' : ''}`}
                    onClick={handleTakeStep}
                    disabled={stepCooldown}
                  >
                    {stepCooldown ? `Taking Step... (${cooldownSeconds}s)` : '👣 Take Next Step'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Adventure;
