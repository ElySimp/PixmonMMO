import { useState } from 'react'
import './MainHome.css'
import Topbar from '../../components/Topbar'
import Sidebar from '../../components/Sidebar'

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
            <div className="egg-icon">🥚</div>
            <h2>Your Journey Begins Here</h2>
            <p>With just a press of a button, you can embark on an adventure of a lifetime.</p>
            <button className="start-dungeon">Start Dungeon</button>
          </div>

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