import React, { useState, useEffect } from 'react';
import './MiscGacha.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/config';

async function tenPull(userId) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/tenPull`);
    const data = await response.json();
    if (!response.ok) {
      console.error('Server error:', data.error || 'Unknown error');
      return;
    }
    return data.results;
  } catch (e) {
    console.error('Fetch failed:', e);
  }
}

async function singlePull(userId) {
  try {
    await fetch(`${API_URL}/users/${userId}/onePull`);
  } catch (e) {
    console.error(e);
  }
}

async function getIndexInventory() {
  try {
    const res = await fetch(`${API_URL}/inventoryIndex`);
    const data = await res.json();
    if (data.success) return data.inventoryIndex;
    return [];
  } catch (error) {
    console.error("Error fetching inventory index:", error);
    return [];
  }
}

const MiscGacha = () => {
  const { user, loading: authLoading } = useAuth();
  const [rollResult, setRollResult] = useState([]);
  const [inventoryIndex, setInventoryIndex] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    getIndexInventory().then(setInventoryIndex).catch(() => setInventoryIndex([]));
  }, [authLoading]);

  useEffect(() => {
    if (showResults && currentIndex < rollResult.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showResults, currentIndex, rollResult]);

  const handleTenPull = async () => {
    if (user?.id) {
      const results = await tenPull(user.id);
      if (results) {
        setRollResult(results);
        setCurrentIndex(0);
        setShowResults(true);
      }
    } else {
      console.log('User not logged in yet');
    }
  };

  const handleOnePull = () => {
    if (user?.id) {
      singlePull(user.id);
    } else {
      console.log("single fail");
    }
  };

  return (
    <div className="miscGacha-Container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="maininv-invContent">
        <Topbar
          onMenuClick={() => console.log('Menu clicked')}
          onSupportClick={() => console.log('Support clicked')}
          onFriendsClick={() => console.log('Friends clicked')}
          onSearch={(value) => console.log('Search:', value)}
          onChatClick={() => console.log('Chat clicked')}
          onNotificationClick={() => console.log('Notifications clicked')}
          onEggClick={() => console.log('Egg clicked')}
        />

        <div className="miscgacha-content">
          <div className="miscgacha-banner-select">
            <div className="miscgacha-selection">Steel Banner</div>
            <div className="miscgacha-selection">TBA</div>
          </div>

          <div className="miscgacha-content-container">
            <div className="miscgacha-rates">View Details</div>
            <div className="miscgacha-pull-container">
              <div
                className="miscgacha-pull"
                onClick={handleOnePull}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter') handleOnePull(); }}
              >
                1x Pull
              </div>

              <div
                className="miscgacha-pull"
                onClick={handleTenPull}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter') handleTenPull(); }}
              >
                10x Pull
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gacha Results Overlay */}
      {showResults && (
        <div className="gacha-overlay" onClick={() => setShowResults(false)}>
          <div className="gacha-results-center">
            {rollResult.slice(0, currentIndex + 1).map((item, i) => {
              const match = inventoryIndex.find(inv => inv.index_id === item.index_id);
              return (
                <div key={`${item.index_id}-${i}`} className="gacha-result-card fade-in">
                  {match && (
                    <img
                      src={match.path}
                      alt={item.item_name}
                      className="gacha-result-img"
                    />
                  )}
                  <p>{item.item_name}</p>
                  <p>Rarity: {item.rarity}</p>
                  <p>Type: {item.item_type}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MiscGacha;
