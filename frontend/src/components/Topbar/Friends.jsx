import React, { useState, useRef, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState('online');
  const [search, setSearch] = useState('');
  const [friends] = useState(dummyFriends);

  // State for DM overlay
  const [dmOpen, setDmOpen] = useState(false);
  const [dmFriend, setDmFriend] = useState(null);
  const [dmMessage, setDmMessage] = useState('');
  const [dmHistory, setDmHistory] = useState([]);

  // --- Tambahan untuk draggable modal ---
  const [modalPos, setModalPos] = useState({ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 150 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  // Filter friends by tab and search
  const filteredFriends = friends.filter(friend => {
    if (activeTab === 'online' && !friend.online) return false;
    if (activeTab === 'all' && !friend.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'online' && !friend.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Open DM overlay
  const handleDmClick = (friend) => {
    setDmFriend(friend);
    setDmOpen(true);
    setDmMessage('');
    setDmHistory([]);
    // Reset modal position to center
    setModalPos({ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 150 });
  };

  // Send message (dummy, hanya frontend)
  const handleSendMessage = () => {
    if (dmMessage.trim() === '') return;
    setDmHistory([...dmHistory, { from: 'me', text: dmMessage }]);
    setDmMessage('');
  };

  // Close overlay
  const handleCloseDm = () => {
    setDmOpen(false);
    setDmFriend(null);
    setDmMessage('');
    setDmHistory([]);
  };

  // --- Drag logic ---
  const handleDragStart = (e) => {
    setDragging(true);
    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    document.body.style.userSelect = 'none';
  };

  const handleDrag = (e) => {
    if (!dragging) return;
    setModalPos({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleDragEnd = () => {
    setDragging(false);
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
    // eslint-disable-next-line
  }, [dragging]);

  return (
    <div className="main-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="main-content">
        <Topbar 
          onMenuClick={() => console.log('Menu clicked')} 
          onSupportClick={() => console.log('Support clicked')} 
          onSearch={setSearch}
          onChatClick={() => console.log('Chat clicked')} 
          onNotificationClick={() => console.log('Notifications clicked')} 
        />

        <div className="friends-container">
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

          {/* Search bar (for Online & All) */}
          {activeTab !== 'add' && (
            <input
              type="text"
              placeholder="Search friends..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="friends-search"
            />
          )}

          {/* Friends List */}
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
              {filteredFriends.map(friend => (
                <li key={friend.id} className="friend-item">
                  <span className={`friend-status ${friend.online ? 'online' : 'offline'}`}></span>
                  <span className="friend-name">{friend.name}</span>
                  <button 
                    className="dm-btn"
                    onClick={() => handleDmClick(friend)}
                  >DM</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* DM Overlay */}
        {dmOpen && dmFriend && (
          <div className="dm-overlay">
            <div
              className="dm-modal"
              ref={modalRef}
              style={{
                position: 'absolute',
                left: modalPos.x,
                top: modalPos.y,
                zIndex: 1002,
                minWidth: 320,
                minHeight: 220,
                maxWidth: '95vw',
                maxHeight: '90vh',
                width: 350,
              }}
            >
              <div
                className="dm-modal-header"
                onMouseDown={handleDragStart}
                style={{
                  cursor: 'move',
                  userSelect: 'none',
                  paddingBottom: '0.5rem',
                  marginBottom: '1rem',
                  borderBottom: '1px solid #232323',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Chat with {dmFriend.name}</span>
                <button className="dm-close" onClick={handleCloseDm}>×</button>
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
            <div className="dm-backdrop" onClick={handleCloseDm}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;