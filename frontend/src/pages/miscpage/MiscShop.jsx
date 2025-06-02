import './MiscShop.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import React, { useState } from 'react';

const diamondPackages = [
  { id: 1, amount: 50, price: 10000 },
  { id: 2, amount: 120, price: 22000 },
  { id: 3, amount: 300, price: 50000 },
  { id: 4, amount: 700, price: 110000 },
];

const premiumItems = [
  { id: 1, name: 'Change Username', price: 200, desc: 'Change your in-game name', img: '/change-username.png' },
  { id: 2, name: 'Change Name Color', price: 150, desc: 'Customize your name color', img: '/change-color.png' },
  { id: 3, name: 'Upgrade QP Cap', price: 300, desc: 'Increase your Quest Point cap', img: '/upgrade-qp.png' },
  { id: 4, name: 'Upgrade EP Cap', price: 300, desc: 'Increase your Energy Point cap', img: '/upgrade-ep.png' },
  { id: 5, name: 'Normal Key', price: 100, desc: 'Open normal chest', img: '/normal-key.png' },
  { id: 6, name: 'Premium Key', price: 500, desc: 'Open premium chest', img: '/premium-key.png' },
];

const dummyItems = [
  { id: 1, name: 'Potion', price: 100, img: '/potion.png' },
  { id: 2, name: 'Super Ball', price: 300, img: '/superball.png' },
  { id: 3, name: 'Revive', price: 500, img: '/revive.png' },
  { id: 4, name: 'Rare Candy', price: 1000, img: '/rare-candy.png' },
];

const tabList = [
  { key: 'diamonds', label: 'Diamonds' },
  { key: 'premium', label: 'Premium' },
  { key: 'items', label: 'Items' },
];

const MiscShop = () => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('diamonds');

  const filteredItems = dummyItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPremium = premiumItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="main-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="main-content">
        <Topbar />
        <div className="shop-container">
          <h2 className="shop-title">Shop</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem', width: '100%' }}>
            {tabList.map(t => (
              <button
                key={t.key}
                className={`shop-tab-btn${tab === t.key ? ' active' : ''}`}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1,
                  padding: '0.6rem 0',
                  borderRadius: 6,
                  border: 'none',
                  background: tab === t.key ? '#0275D8' : '#18191a',
                  color: tab === t.key ? '#fff' : '#aaa',
                  fontWeight: tab === t.key ? 'bold' : 'normal',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'background 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="shop-search"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ display: tab === 'items' || tab === 'premium' ? 'block' : 'none' }}
          />
          <div className="shop-items">
            {tab === 'diamonds' && (
              diamondPackages.map(pkg => (
                <div className="shop-item" key={pkg.id}>
                  <img src="/diamond.png" alt="Diamond" className="shop-item-img" />
                  <div className="shop-item-info">
                    <div className="shop-item-name">{pkg.amount} Diamonds</div>
                    <div className="shop-item-price">Rp{pkg.price.toLocaleString()}</div>
                  </div>
                  <button className="shop-buy-btn">Top Up</button>
                </div>
              ))
            )}
            {tab === 'premium' && (
              filteredPremium.length === 0 ? (
                <div className="shop-empty">No premium items found.</div>
              ) : (
                filteredPremium.map(item => (
                  <div className="shop-item" key={item.id}>
                    <img src={item.img} alt={item.name} className="shop-item-img" />
                    <div className="shop-item-info">
                      <div className="shop-item-name">{item.name}</div>
                      <div style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: 4 }}>{item.desc}</div>
                      <div className="shop-item-price">{item.price} <span className="shop-currency">⦿</span></div>
                    </div>
                    <button className="shop-buy-btn">Buy</button>
                  </div>
                ))
              )
            )}
            {tab === 'items' && (
              filteredItems.length === 0 ? (
                <div className="shop-empty">No items found.</div>
              ) : (
                filteredItems.map(item => (
                  <div className="shop-item" key={item.id}>
                    <img src={item.img} alt={item.name} className="shop-item-img" />
                    <div className="shop-item-info">
                      <div className="shop-item-name">{item.name}</div>
                      <div className="shop-item-price">{item.price} <span className="shop-currency">⦿</span></div>
                    </div>
                    <button className="shop-buy-btn">Buy</button>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiscShop;