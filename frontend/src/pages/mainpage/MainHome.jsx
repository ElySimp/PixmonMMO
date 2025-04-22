import React from 'react'
import './MainHome.css'
import { FaEgg, FaChartBar, FaGem, FaDungeon } from 'react-icons/fa'
import Topbar from '../../components/Topbar'
import Sidebar from '../../components/Sidebar'

const MainHome = () => {
  const [currentPet] = React.useState({
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

  const [playerStats] = React.useState({
    playingPlayers: 32767,
    tasksCompleted: 127,
    diamonds: '2,147,483,647'
  });

  const handleMenuClick = () => {
    console.log('Menu clicked');
  };

  const handleSupportClick = () => {
    console.log('Support clicked');
  };

  const handleFriendsClick = () => {
    console.log('Friends clicked');
  };

  const handleSearch = (value) => {
    console.log('Search:', value);
  };

  const handleChatClick = () => {
    console.log('Chat clicked');
  };

  const handleNotificationClick = () => {
    console.log('Notifications clicked');
  };

  const handleEggClick = () => {
    console.log('Egg clicked');
  };

  return (
    <div className="main-container">
      <Sidebar 
        profilePic="/dummy.jpg"
      />
      
      <div className="main-content">
        <Topbar 
          onMenuClick={handleMenuClick}
          onSupportClick={handleSupportClick}
          onFriendsClick={handleFriendsClick}
          onSearch={handleSearch}
          onChatClick={handleChatClick}
          onNotificationClick={handleNotificationClick}
          onEggClick={handleEggClick}
        />

        <div className="top-squares">
          <div className="dungeon-card">
            <FaDungeon style={{ fontSize: '3rem', color: '#007BFF' }} />
            <h2>Your Journey Begins Here</h2>
            <p>With just a press of a button, you can embark on an adventure of a lifetime.</p>
            <button className="start-dungeon">Start Adventure</button>
          </div>
          
          <div className="pet-card">
            <div className="egg-icon">
              <FaEgg style={{ color: '#007BFF' }} />
            </div>
            <h2>Your Pets</h2>
            <p>Hatch and train your pets to become stronger!</p>
            <button className="card-button">View Collection</button>
          </div>
        </div>

        <div className="bottom-squares">
          <div className="daily-card">
            <h2>Daily Rewards</h2>
            <div className="reward-stats">
              <div>
                <p>Current Streak</p>
                <span className="stat-value">5 Days</span>
              </div>
              <div>
                <p>Next Reward</p>
                <span className="stat-value">2h 30m</span>
              </div>
            </div>
            <button className="claim-reward">Claim Reward</button>
          </div>

          <div className="stats-card">
            <FaChartBar style={{ fontSize: '2.5rem', color: '#28a745' }} />
            <h3 className="card-title">Server Status</h3>
            <div className="stat-value">740 Players Online</div>
            <button className="card-button view-players">View Details</button>
          </div>

          <div className="sale-card">
            <FaGem style={{ fontSize: '2.5rem', color: '#dc3545' }} />
            <h3 className="card-title">Diamond Sale</h3>
            <div className="stat-value">50% OFF</div>
            <button className="card-button view-tasks">Shop Now</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainHome 