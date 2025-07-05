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
    if (data.success) {
      console.log("MiscGacha - Inventory Index Example Path:", data.inventoryIndex?.[0]?.path);
      return data.inventoryIndex;
    }
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
    getIndexInventory()
      .then(data => {
        console.log("Received inventory data:", data);
        console.log("Example image path:", data?.[0]?.path);
        setInventoryIndex(data);
      })
      .catch(() => setInventoryIndex([]));
  }, [authLoading]);

  useEffect(() => {
    if (showResults && currentIndex < rollResult.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [showResults, currentIndex, rollResult]);

  const handleTenPull = async () => {
    function chooseRarity() {
      const random = Math.random() * 100;
      if (random < 60) return 1;
      else if (random < 90) return 2;
      else return 3;
    }

    const result = [];
    let stored = 0;

    while (stored < 10) {
      const chosenRarity = chooseRarity();
      const filtered = inventoryIndex.filter(item => item.rarity === chosenRarity);

      if (filtered.length > 0) {
        const randomIndex = Math.floor(Math.random() * filtered.length);
        if (filtered[randomIndex].index_id === 9 || filtered[randomIndex].index_id === 10) continue;
        result.push(filtered[randomIndex]);
        stored++;
      }
    }

    stored = 0;
    while (stored < 10) {
      fetch(`${API_URL}/users/${user.id}/${result[stored].index_id}/itemInput`);
      stored++;
    }

    setCurrentIndex(0);
    setRollResult(result);
    setShowResults(true);
    console.log("Pulled results:", result);
  };

  const handleOnePull = () => {
    if (user?.id) {
      singlePull(user.id);
    } else {
      console.log("single fail");
    }
  };

  const rarityColors = ['gray', 'green', 'blue', 'gold'];

  return (
    <div className="miscGacha-Container">
      <Sidebar profilePic="dummy.jpg" />
      <div className="miscgacha-secContent">
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
              <div className="miscgacha-pull" onClick={handleOnePull}>Open 1x</div>
              <div className="miscgacha-pull" onClick={handleTenPull}>Open 10x</div>
            </div>
          </div>

  {/* ✅ Overlay now inside the banner area only */}
  {showResults && (
    <div className="gacha-overlay" onClick={() => setShowResults(false)}>
      <div className="gacha-results-center">
        {rollResult.slice(0, currentIndex + 1).map((item, i) => (
          <div
            key={`${item.item_name}-${i}`}
            className="gacha-result-card fade-in"
            style={{
              border: `3px solid ${rarityColors[item.rarity - 1] || 'gray'}`,
              borderRadius: '10px',
            }}
          >
            <img
              src={item.path ? 
                (item.path.startsWith('http') ? 
                  item.path : 
                  item.path.startsWith('/') ?
                    item.path :
                    `/${item.path}`
                ) : 'default.png'}
              alt={item.item_name}
              className="gacha-result-img"
            />
            <p>{item.item_name}</p>
          </div>
        ))}
      </div>
    </div>
  )}
        </div>
      </div>
    </div>
  );
};

export default MiscGacha;
