import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Topbar.css';
import chatIcon from '../assets/MAIN/chat.png';
import notificationIcon from '../assets/MAIN/notification.png';
const profileImage = '/dummy1.jpg'; 

function Topbar({ 
  onMenuClick, 
  onSupportClick, 
  onSearch, 
  onChatClick, 
  onNotificationClick 
}) {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const profileCardRef = useRef(null);
  const profileButtonRef = useRef(null);

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
    // Tambahkan navigasi ke halaman top up atau buka modal top up
  };

  const handleCurrencyAdd = (currencyType) => {
    console.log(`Add ${currencyType} clicked`);
    // Logika untuk menambahkan mata uang
  };

  const handleRefill = () => {
    console.log('Refill energy clicked');
    // Logika untuk mengisi ulang energi
  };

  const handleMembershipClick = () => {
    console.log('Membership clicked');
    // Navigasi ke halaman membership
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
    // Navigasi ke halaman settings
  };


  const handleMyProfileClick = () => {
    navigate('/profile');
    setShowProfileCard(false);
  };
  
   // Perbaikan untuk fungsi handleLogoutClick
  const handleLogoutClick = () => {
  console.log('Logout clicked');
  
  try {
    // Hapus semua data pengguna dari localStorage
    localStorage.removeItem('token'); // atau sesuaikan dengan nama key token Anda
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    
    // Atau hapus semua localStorage (opsional)
    // localStorage.clear();
    
    // Tutup profile card
    setShowProfileCard(false);
    
    // Redirect ke halaman utama
    navigate('/');
    
    // Refresh halaman untuk memastikan state ter-reset (opsional)
    // window.location.reload();
    
  } catch (error) {
    console.error('Error during logout:', error);
    // Tetap redirect meskipun ada error
    navigate('/');
   }
 };

  return (
    <nav className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu" onClick={onMenuClick}>☰</button>
        <button onClick={onSupportClick}>Support Service</button>
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

        {/* Profile Button and Dropdown */}
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
                  <div className="profile-username">Username</div>
                  <div className="profile-level">Lvl 99999</div>
                  <div className="profile-xp-bar">
                    <div className="xp-bar">
                      <div className="xp-progress"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="profile-currencies">
                <div className="currency-item">
                  <span className="currency-icon">🪙</span>
                  <span className="currency-label">Gold</span>
                  <span className="currency-amount">123.456.789</span>
                  <button 
                    className="currency-add" 
                    onClick={() => handleCurrencyAdd('gold')}
                  >+</button>
                </div>
                <div className="currency-item">
                  <span className="currency-icon">💎</span>
                  <span className="currency-label">Diamond</span>
                  <span className="currency-amount">123.456.789</span>
                  <button 
                    className="currency-add"
                    onClick={() => handleCurrencyAdd('diamond')}
                  >+</button>
                </div>
              </div>
              
              <div className="profile-stats">
                <div className="stat-item">
                  <div className="stat-label">
                    <span>Quest Point <span className="stat-icon">📜</span></span>
                    <span className="stat-value">8/10</span>
                  </div>
                  <div className="stat-bar-container">
                    <div className="stat-bar quest-bar">
                      <div className="stat-progress" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-label">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Energy Point <span className="stat-icon">⚡</span></span>
                      <span className="energy-timer">4h 09:40</span>
                      <button 
                        className="refill-btn"
                        onClick={handleRefill}
                      >Refill?</button>
                    </div>
                    <span className="stat-value">2/5</span>
                  </div>
                  <div className="energy-row">
                    <div className="energy-bar">
                      <div className="stat-progress" style={{ width: '40%' }}></div>
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
                  <span className="action-icon">⚙</span>
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
  );
}

export default Topbar;