import { useState } from 'react'
import './MainHome.css'

function MainHome() {
  const [currentPet] = useState({
    name: 'Lorem Ipsum Horsie',
    level: '2,147,483,647',
    class: 'TANK',
    stats: {
      health: '2,147,483,647',
      attack: '2,147,483,647',
      defense: '2,147,483,647',
      speed: '32,767'
    },
    happiness: 127
  });

  const [playerStats] = useState({
    playingPlayers: 32767,
    tasksCompleted: 127,
    diamonds: '2,147,483,647'
  });

  return (
    <div className="main-container">
      {/* Left Sidebar - Full height, fixed width */}
      <aside className="sidebar">
        {/* Profile Section - Shows logo and avatar */}
        <div className="sidebar-section">
          <h1>PIXMON</h1>
          <img src="/dummy.jpg" alt="Profile" className="sidebar-pic" />
        </div>

        {/* Navigation Menu - List of navigation items */}
        <nav className="sidebar-nav">
          <p><b>MAIN MENU</b></p>
          <button className="sidebar-item active">🏠 Home</button>
          <button className="sidebar-item">🎒 Inventory</button>
          <button className="sidebar-item">🏆 Achievement</button>
          <button className="sidebar-item">👤 Profile</button>
          <button className="sidebar-item">🐾 Pets</button>
          <button className="sidebar-item">⚔️ Battle</button>
          <button className="sidebar-item">📜 Quest</button>
          <button className="sidebar-item">🛍️ Shop</button>
        </nav>
      </aside>

      {/* Main Content Area - Contains topbar and main content */}
      <div className="main-content">
        {/* Top Navigation Bar - Next to sidebar */}
        <nav className="topbar">
          <div className="topbar-left">
            <button className="topbar-menu">☰</button>
            <img src="/logo.png" alt="Pixmon" className="topbar-logo" />
          </div>

          <div className="topbar-center">
            <button>Support Service</button>
            <button>Friends</button>
          </div>

          <div className="topbar-right">
            <input type="search" placeholder="Search..." className="topbar-search" />
            <button className="topbar-button">💭</button>
            <button className="topbar-button">🔔</button>
            <button className="topbar-button">🥚</button>
          </div>
        </nav>

        {/* Top row with 2 squares */}
        <div className="top-squares">
          {/* Dungeon Card */}
          <div className="dungeon-card">
            <div className="egg-icon">🥚</div>
            <h2>Your Journey Begins Here</h2>
            <p>With just a press of a button, you can embark on an adventure of a lifetime.</p>
            <button className="start-dungeon">Start Dungeon</button>
          </div>

          {/* Daily Reward Card */}
          <div className="daily-reward">
            <h2>Daily Reward</h2>
            <p>Come here everyday to claim your daily reward</p>
            <button className="claim-reward">Claim Reward</button>
            <div className="reward-stats">
              <div>
                <p>Total Claimed</p>
                <span>{playerStats.playingPlayers}</span>
              </div>
              <div>
                <p>Highest Daily Streak</p>
                <span>4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row with 3 squares */}
        <div className="bottom-squares">
          <div className="square-card">
            <h3>Players Online</h3>
            <div className="stat-value">{playerStats.playingPlayers}</div>
            <button className="view-players">View Players</button>
          </div>
          
          <div className="square-card">
            <h3>Tasks Completed</h3>
            <div className="stat-value">{playerStats.tasksCompleted}</div>
            <button className="view-tasks">View Tasks</button>
          </div>
          
          <div className="square-card">
            <h3>Diamond Store</h3>
            <div className="stat-value">💎 {playerStats.diamonds}</div>
            <button className="buy-diamonds">Buy Diamonds</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainHome 