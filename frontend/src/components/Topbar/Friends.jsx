import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import Topbar from '../Topbar';
import './Friends.css';

const dummyFriends = [
  { id: 1, name: 'Alice', online: true },
  { id: 2, name: 'Bob', online: false },
  { id: 3, name: 'Charlie', online: true },
  { id: 4, name: 'David', online: false },
];

const Friends = () => {
  const [activeNav, setActiveNav] = useState('friends'); // 'friends' or friendId
  const [activeTab, setActiveTab] = useState('online');
  const [search, setSearch] = useState('');
  const [dmHistory, setDmHistory] = useState([]);
  const [dmMessage, setDmMessage] = useState('');

  const filteredFriends = dummyFriends.filter(friend =>
    friend.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle DM send (dummy)
  const handleSendMessage = () => {
    if (!dmMessage.trim()) return;
    setDmHistory([...dmHistory, { from: 'me', text: dmMessage }]);
    setDmMessage('');
  };

  return (
    <div className="main-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="main-content">
        <Topbar/>
        <div className="friends-layout">
          {/* Left Navigation */}
          <div className="friends-nav">
            <div
              className={`friends-nav-btn${activeNav === 'friends' ? ' active' : ''}`}
              onClick={() => setActiveNav('friends')}
              title="Friends"
            >
              <span className="friends-nav-icon">👥</span>
            </div>
            <div className="friends-nav-divider" />
            <div className="friends-nav-list">
              {dummyFriends.map(friend => (
                <div
                  key={friend.id}
                  className={`friends-nav-friend${activeNav === friend.id ? ' active' : ''}`}
                  onClick={() => setActiveNav(friend.id)}
                  title={friend.name}
                >
                  <span className={`friend-status ${friend.online ? 'online' : 'offline'}`}></span>
                  <span className="friends-nav-avatar">{friend.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content */}
          <div className="friends-main-content">
            {activeNav === 'friends' ? (
              <div className="friends-content">
                {/* Tabs */}
                <div className="friends-tabs">
                  <button
                    className={activeTab === 'online' ? 'active' : ''}
                    onClick={() => setActiveTab('online')}
                  >Online</button>
                  <button
                    className={activeTab === 'all' ? 'active' : ''}
                    onClick={() => setActiveTab('all')}
                  >All</button>
                  <button
                    className={activeTab === 'add' ? 'active' : ''}
                    onClick={() => setActiveTab('add')}
                  >Add Friends</button>
                </div>
                {/* Search */}
                {activeTab !== 'add' && (
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="friends-search"
                  />
                )}
                {/* List/Add */}
                {activeTab === 'add' ? (
                  <div className="add-friends-section">
                    <input
                      type="text"
                      placeholder="Enter username to add..."
                      className="add-friends-input"
                    />
                    <button className="add-friends-btn">Add</button>
                  </div>
                ) : (
                  <ul className="friends-list">
                    {filteredFriends.length === 0 && <li>No friends found.</li>}
                    {filteredFriends
                      .filter(f => activeTab === 'all' || f.online)
                      .map(friend => (
                        <li key={friend.id} className="friend-item">
                          <span className={`friend-status ${friend.online ? 'online' : 'offline'}`}></span>
                          <span className="friend-name">{friend.name}</span>
                          <button
                            className="dm-btn"
                            onClick={() => setActiveNav(friend.id)}
                          >🗨️</button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ) : (
              // DM Chat
              <div className="dm-chat-content">
                <div className="dm-chat-header">
                  <button className="dm-back-btn" onClick={() => setActiveNav('friends')}>←</button>
                  <span>{dummyFriends.find(f => f.id === activeNav)?.name}</span>
                </div>
                <div className="dm-history">
                  {dmHistory.length === 0 && (
                    <div className="dm-empty">No messages yet.</div>
                  )}
                  {dmHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`dm-message ${msg.from === 'me' ? 'from-me' : 'from-them'}`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>
                <div className="dm-input-row">
                  <input
                    type="text"
                    value={dmMessage}
                    onChange={e => setDmMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="dm-input"
                    onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                  />
                  <button className="dm-send-btn" onClick={handleSendMessage}>Send</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;