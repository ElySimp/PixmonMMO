import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Topbar.css';
import chatIcon from '../assets/MAIN/chat.png';
import notificationIcon from '../assets/MAIN/notification.png';
const profileImage = '/dummy1.jpg'; 
import { API_URL } from '../utils/config';

function Topbar({ 
  onMenuClick, 
  onSupportClick, 
  onSearch, 
  onChatClick, 
  onNotificationClick 
}) {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false); // State untuk alert logout
  const [overlayProfile, setOverlayProfile] = useState({
    username: 'Loading...', 
    level: 1,
    xp: 0,
    maxXp: 50,
    gold: 0,
    diamonds: 0,
    questPoints: 8,
    maxQuestPoints: 10,
    energyPoints: 2,
    maxEnergyPoints: 5,
    energyTimer: '4h 09:40',
    questCompleted: 0,
    questClaimed: 0
  });

  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const profileCardRef = useRef(null);
  const profileButtonRef = useRef(null);

  // Fetch overlay profile data dengan perbaikan untuk username
  useEffect(() => {
    const fetchOverlayProfile = async () => {
      try {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
          console.error('No userId found in localStorage');
          return;
        }

        console.log('Fetching profile for userId:', userId);
        
        // SOLUSI 1: Fetch stats data
        const statsResponse = await fetch(`${API_URL}/users/${userId}/stats`);
        
        if (!statsResponse.ok) {
          console.error('Failed to fetch stats:', statsResponse.status, statsResponse.statusText);
          return;
        }

        const statsData = await statsResponse.json();
        console.log('Stats API response:', statsData);
        
        const stats = statsData.data || statsData;
        const maxXp = Math.floor(50 * Math.pow(stats.level || 1, 1.4));

        // SOLUSI 2: Fetch username dari tabel userlogin
        let username = 'Unknown User';
        
        try {
          // Option A: Jika ada endpoint khusus untuk get user profile
          const userResponse = await fetch(`${API_URL}/userprofile/${userId}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            username = userData.username || userData.data?.username || 'Unknown User';
            console.log('User profile response:', userData);
          } else {
            // Option B: Jika menggunakan endpoint userlogin
            const loginResponse = await fetch(`${API_URL}/userlogin/${userId}`);
            if (loginResponse.ok) {
              const loginData = await loginResponse.json();
              username = loginData.username || loginData.data?.username || 'Unknown User';
              console.log('UserLogin response:', loginData);
            }
          }
        } catch (userError) {
          console.log('Error fetching username from API, trying localStorage:', userError);
          
          // SOLUSI 3: Fallback ke localStorage
          const storedUserProfile = localStorage.getItem('userProfile');
          const storedUsername = localStorage.getItem('username');
          
          if (storedUsername) {
            username = storedUsername;
          } else if (storedUserProfile) {
            try {
              const userProfile = JSON.parse(storedUserProfile);
              username = userProfile.username || userProfile.name || 'Unknown User';
            } catch (parseError) {
              console.error('Error parsing userProfile from localStorage:', parseError);
            }
          }
        }

        // SOLUSI 4: Jika username masih kosong, coba dari stats response
        if (username === 'Unknown User' && stats.username) {
          username = stats.username;
        }
        
        setOverlayProfile({
          username: username,
          level: stats.level || 1,
          xp: stats.xp || 0,
          maxXp: maxXp,
          gold: stats.gold || 0,
          diamonds: stats.diamonds || 0,
          questPoints: stats.quest_points || 0,
          maxQuestPoints: 10,
          energyPoints: stats.energy_points || 2,
          maxEnergyPoints: 5,
          energyTimer: stats.energy_timer || '4h 09:40',
          questCompleted: stats.quest_completed || 0,
          questClaimed: stats.quest_claimed || 0
        });

        console.log('Final profile data:', {
          username,
          level: stats.level,
          gold: stats.gold,
          diamonds: stats.diamonds
        });

      } catch (error) {
        console.error('Error fetching overlay profile:', error);
      }
    };

    fetchOverlayProfile();
  }, []);

  // TAMBAHAN: Re-fetch ketika ada perubahan user
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userId' || e.key === 'userProfile' || e.key === 'username') {
        console.log('Storage changed, refetching profile...');
        // Re-fetch profile data
        const fetchOverlayProfile = async () => {
          try {
            const userId = localStorage.getItem('userId');
            
            if (!userId) {
              console.error('No userId found in localStorage');
              return;
            }

            const statsResponse = await fetch(`${API_URL}/users/${userId}/stats`);
            
            if (!statsResponse.ok) {
              console.error('Failed to fetch stats:', statsResponse.status);
              return;
            }

            const statsData = await statsResponse.json();
            const stats = statsData.data || statsData;
            const maxXp = Math.floor(50 * Math.pow(stats.level || 1, 1.4));

            let username = 'Unknown User';
            
            try {
              const userResponse = await fetch(`${API_URL}/userprofile/${userId}`);
              if (userResponse.ok) {
                const userData = await userResponse.json();
                username = userData.username || userData.data?.username || 'Unknown User';
              } else {
                const loginResponse = await fetch(`${API_URL}/userlogin/${userId}`);
                if (loginResponse.ok) {
                  const loginData = await loginResponse.json();
                  username = loginData.username || loginData.data?.username || 'Unknown User';
                }
              }
            } catch (userError) {
              const storedUsername = localStorage.getItem('username');
              const storedUserProfile = localStorage.getItem('userProfile');
              
              if (storedUsername) {
                username = storedUsername;
              } else if (storedUserProfile) {
                try {
                  const userProfile = JSON.parse(storedUserProfile);
                  username = userProfile.username || userProfile.name || 'Unknown User';
                } catch (parseError) {
                  console.error('Error parsing userProfile:', parseError);
                }
              }
            }

            if (username === 'Unknown User' && stats.username) {
              username = stats.username;
            }
            
            setOverlayProfile({
              username: username,
              level: stats.level || 1,
              xp: stats.xp || 0,
              maxXp: maxXp,
              gold: stats.gold || 0,
              diamonds: stats.diamonds || 0,
              questPoints: stats.quest_points || 0,
              maxQuestPoints: 10,
              energyPoints: stats.energy_points || 2,
              maxEnergyPoints: 5,
              energyTimer: stats.energy_timer || '4h 09:40',
              questCompleted: stats.quest_completed || 0,
              questClaimed: stats.quest_claimed || 0
            });

          } catch (error) {
            console.error('Error refetching overlay profile:', error);
          }
        };

        fetchOverlayProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close profile card when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showProfileCard && 
        profileCardRef.current && 
        !profileCardRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setShowProfileCard(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileCard]);

  const handleProfileClick = () => {
    setShowProfileCard(!showProfileCard);
  };

  const handleTopUpClick = () => {
    console.log('Top Up clicked');
    navigate('/Shop', { state: { selectedSection: 'topup' } });
    setShowProfileCard(false);
  };

  const handleCurrencyAdd = (currencyType) => {
    console.log(`Add ${currencyType} clicked`);
    navigate('/Shop', { state: { selectedCurrency: currencyType } });
    setShowProfileCard(false);
  };

  const handleRefill = () => {
    console.log('Refill energy clicked');
    navigate('/Shop', { state: { selectedCurrency: 'energy' } });
    setShowProfileCard(false);
  };

  const handleMembershipClick = () => {
    console.log('Membership clicked');
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
  };

  const handleMyProfileClick = () => {
    navigate('/profile');
    setShowProfileCard(false);
  };
  
  // Handler untuk menampilkan alert logout
  const handleLogoutClick = () => {
    setShowLogoutAlert(true);
  };

  // Handler untuk konfirmasi logout
  const handleConfirmLogout = () => {
    console.log('Logout confirmed');
    
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('username');
      
      setShowLogoutAlert(false);
      setShowProfileCard(false);
      navigate('/');
      
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/');
    }
  };

  // Handler untuk membatalkan logout
  const handleCancelLogout = () => {
    setShowLogoutAlert(false);
  };

  return (
    <>
      <nav className="topbar">
        <div className="topbar-left">
          <button className="topbar-menu" onClick={onMenuClick}>☰</button>
          <button 
            className={`topbar-item support-service-btn ${isActive('/support') ? 'active' : ''}`}
            onClick={() => {
              onSupportClick?.();
              navigate('/support');
            }}
          >
            Support Service
          </button>
          <button 
            className={`topbar-item ${isActive('/friends') ? 'active' : ''}`}
            onClick={() => navigate('/friends')}>Friends</button>
        </div>

        <div className="topbar-right">
          <input 
            type="search" 
            placeholder="Search..." 
            className="topbar-search" 
            onChange={(e) => onSearch?.(e.target.value)}
          />
          <button className="topbar-button" onClick={onChatClick}>
            <img src={chatIcon} alt="Chat" className="topbar-icon" />
          </button>
          <button className="topbar-button" onClick={onNotificationClick}>
            <img src={notificationIcon} alt="Notifications" className="topbar-icon" />
          </button>

          <div className="topbar-button profile-dropdown-container">
            <button 
              ref={profileButtonRef}
              onClick={handleProfileClick} 
              className="profile-button"
            >
              <img 
                src={profileImage}
                alt="Profile" 
                className="topbar-icon" 
              />
            </button>
            
            {showProfileCard && (
              <div className="profile-card" ref={profileCardRef}>
                <div className="profile-header">
                  <div className="profile-avatar">
                    <img src={profileImage} alt="Profile" />
                  </div>
                  <div className="profile-info">
                    <div className="profile-username">{overlayProfile.username}</div>
                    <div className="profile-level">Lvl {overlayProfile.level}</div>
                    <div className="profile-xp-bar">
                      <div className="xp-bar">
                        <div 
                          className="xp-progress"  
                          style={{ width: `${(overlayProfile.xp / overlayProfile.maxXp) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="profile-currencies">
                  <div className="currency-item">
                    <span className="currency-icon">🪙</span>
                    <span className="currency-label">Gold</span>
                    <span className="currency-amount">{overlayProfile.gold.toLocaleString()}</span>
                    <button 
                      className="currency-add" 
                      onClick={() => handleCurrencyAdd('gold')}
                    >+</button>
                  </div>
                  <div className="currency-item">
                    <span className="currency-icon">💎</span>
                    <span className="currency-label">Diamond</span>
                    <span className="currency-amount">{overlayProfile.diamonds.toLocaleString()}</span>
                    <button 
                      className="currency-add"
                      onClick={() => handleCurrencyAdd('diamonds')}
                    >+</button>
                  </div>
                </div>
                
                <div className="profile-stats">
                  <div className="stat-item">
                    <div className="stat-label">
                      <span>Quest Point <span className="stat-icon">📜</span></span>
                      <span className="stat-value">{overlayProfile.questPoints}/{overlayProfile.maxQuestPoints}</span>
                    </div>
                    <div className="stat-bar-container">
                      <div className="stat-bar quest-bar">
                        <div 
                          className="stat-progress" 
                          style={{ width: `${(overlayProfile.questPoints / overlayProfile.maxQuestPoints) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-label">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span>Energy Point <span className="stat-icon">⚡</span></span>
                        <span className="energy-timer">{overlayProfile.energyTimer}</span>
                        <button 
                          className="refill-btn"
                          onClick={handleRefill}
                        >Refill?</button>
                      </div>
                      <span className="stat-value">{overlayProfile.energyPoints}/{overlayProfile.maxEnergyPoints}</span>
                    </div>
                    <div className="energy-row">
                      <div className="energy-bar">
                        <div 
                          className="stat-progress" 
                          style={{ width: `${(overlayProfile.energyPoints / overlayProfile.maxEnergyPoints) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="profile-actions">
                  <button className="action-button profile" onClick={handleMyProfileClick}>
                    <span className="action-icon">👤</span>
                    <span>My Profile</span>
                  </button>
                  <button className="action-button membership" onClick={handleMembershipClick}>
                    <span className="action-icon">👑</span>
                    <span>Membership</span>
                  </button>
                  <button className="action-button settings" onClick={handleSettingsClick}>
                    <span className="action-icon">⚙️</span>
                    <span>Settings</span>
                  </button>
                  <button className="action-button logout" onClick={handleLogoutClick}>
                    <span className="action-icon">🚪</span>
                    <span>Log Out</span>
                  </button>
                </div>
                
                <div 
                  className="topup-banner"
                  onClick={handleTopUpClick}
                >
                  TOP UP SEKARANG JUGA !
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Alert */}
      {showLogoutAlert && (
        <div className="logout-alert-overlay">
          <div className="logout-alert-modal">
            <div className="logout-alert-header">
              <h3>Confirm Logout</h3>
            </div>
            <div className="logout-alert-body">
              <p>Are you sure you want to log out?</p>
             
            </div>
            <div className="logout-alert-actions">
              <button 
                className="logout-cancel-btn" 
                onClick={handleCancelLogout}
              >
                Cancel
              </button>
              <button 
                className="logout-confirm-btn" 
                onClick={handleConfirmLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Topbar;