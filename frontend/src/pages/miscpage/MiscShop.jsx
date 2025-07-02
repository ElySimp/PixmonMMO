import './MiscShop.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import React, { useState, useEffect } from 'react';

import { API_URL } from '../../utils/config';

const MAIN_TABS = [
  { key: 'itemshop', label: 'Item Shop', icon: '🛒' },
  { key: 'diamondmarket', label: 'Diamond Market', icon: '💎' },
  { key: 'playermarket', label: 'Player Market', icon: '🧑‍🤝‍🧑' }
];

const ITEM_CATEGORIES = [
  { key: 'potions', label: 'Potions', icon: '🧪' },
  { key: 'weapons', label: 'Weapons', icon: '🗡️' },
  { key: 'foods', label: 'Foods', icon: '🍔' },
  { key: 'others', label: 'Other Items', icon: '📦' }
];

const DUMMY_ITEMS = {
  potions: [
    { icon: '🧪', title: 'Health Potion', price: 100 },
    { icon: '🧪', title: 'Mana Potion', price: 120 },
    { icon: '🧪', title: 'Stamina Potion', price: 90 }
  ],
  weapons: [
    { icon: '🗡️', title: 'Iron Sword', price: 200 },
    { icon: '🗡️', title: 'Steel Sword', price: 350 },
    { icon: '🗡️', title: 'Wooden Bow', price: 180 }
  ],
  foods: [
    { icon: '🍔', title: 'Burger', price: 80 },
    { icon: '🍟', title: 'French Fries', price: 60 },
    { icon: '🍕', title: 'Pizza Slice', price: 75 }
  ],
  others: [
    { icon: '📦', title: 'Starter Pack', price: 500 },
    { icon: '🎒', title: 'Adventurer Bag', price: 300 },
    { icon: '🧭', title: 'Compass', price: 150 }
  ]
};

const DIAMOND_MARKET = [
  { seller: 'PlayerA', item: '100 Diamonds', price: 900 },
  { seller: 'PlayerB', item: '50 Diamonds', price: 480 },
  { seller: 'PlayerC', item: '30 Diamonds', price: 300 }
];

const PLAYER_MARKET = [
  { seller: 'PlayerD', item: 'Iron Sword', price: 500 },
  { seller: 'PlayerE', item: 'Burger', price: 70 },
  { seller: 'PlayerF', item: 'Steel Sword', price: 350 }
];

const MiscShop = () => {
  const [playerStats, setPlayerStats] = useState({ gold: 0, diamonds: 0 });
  const [mainTab, setMainTab] = useState('itemshop');
  const [itemCategory, setItemCategory] = useState('potions');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    fetch(`${API_URL}/users/${userId}/stats`)
      .then(res => res.json())
      .then(data => {
        setPlayerStats(data.data || data);
      });
  }, []);

  return (
    <div className="main-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="shop-content">
        <Topbar />
        <div className="shop-header-stats">
          <div className='shop-header-gold'>
            <span>🪙</span>
            <span>{playerStats.gold} Gold</span>
          </div>
          <div className='shop-header-diamonds'>
            <span>💎</span>
            <span>{playerStats.diamonds} Diamonds</span>
          </div>
        </div>
        <div className="shop-main-flex">
          
          {/* Sidebar Tabs */}
          <div className="shop-sidebar-tabs">
            {MAIN_TABS.map(tab => (
              <div
                key={tab.key}
                className={`shop-sidebar-tab${mainTab === tab.key ? ' active' : ''}`}
                onClick={() => setMainTab(tab.key)}
              >
                <span className="shop-sidebar-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            ))}
          </div>

          {/* Main Panel */}
          <div className="shop-right-panel">
            {/* Item Shop */}
            {mainTab === 'itemshop' && (
              <div className="shop-panel-content">
                {/* Category selector moved to top */}
                <div className="shop-item-categories-top">
                  {ITEM_CATEGORIES.map(cat => (
                    <div
                      key={cat.key}
                      className={`shop-item-category${itemCategory === cat.key ? ' active' : ''}`}
                      onClick={() => setItemCategory(cat.key)}
                    >
                      <span className="shop-sidebar-icon">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </div>
                  ))}
                </div>
                <h3>{ITEM_CATEGORIES.find(cat => cat.key === itemCategory)?.label}</h3>
                <div className="shop-items-list">
                  {DUMMY_ITEMS[itemCategory].map((item, idx) => (
                    <div className="shop-item-card" key={idx}>
                      <span className="shop-item-icon">{item.icon}</span>
                      <div className="shop-item-info">
                        <div className="shop-item-title">{item.title}</div>
                        <div className="shop-item-price">{item.price} Gold</div>
                      </div>
                      <button className="shop-item-btn blue">Buy</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Diamond Market */}
            {mainTab === 'diamondmarket' && (
              <div className="shop-panel-content">
                <h3>Diamond Market</h3>
                <div className="shop-items-list">
                  {DIAMOND_MARKET.map((entry, idx) => (
                    <div className="shop-item-card" key={idx}>
                      <span className="shop-item-icon">💎</span>
                      <div className="shop-item-info">
                        <div className="shop-item-title">{entry.seller} menjual {entry.item}</div>
                        <div className="shop-item-price">{entry.price} Gold</div>
                      </div>
                      <button className="shop-item-btn blue">Buy</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Player Market */}
            {mainTab === 'playermarket' && (
              <div className="shop-panel-content">
                <h3>Player Market</h3>
                <div className="shop-items-list">
                  {PLAYER_MARKET.map((entry, idx) => (
                    <div className="shop-item-card" key={idx}>
                      <span className="shop-item-icon">🧑‍🤝‍🧑</span>
                      <div className="shop-item-info">
                        <div className="shop-item-title">{entry.seller} menjual {entry.item}</div>
                        <div className="shop-item-price">{entry.price} Gold</div>
                      </div>
                      <button className="shop-item-btn blue">Buy</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiscShop;