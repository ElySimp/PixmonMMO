import './MiscShop.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import React, { useState } from 'react';

const dummyItems = [
  { id: 1, name: 'Potion', price: 100, img: '/potion.png' },
  { id: 2, name: 'Super Ball', price: 300, img: '/superball.png' },
  { id: 3, name: 'Revive', price: 500, img: '/revive.png' },
  { id: 4, name: 'Rare Candy', price: 1000, img: '/rare-candy.png' },
];

const MiscShop = () => {
  const [search, setSearch] = useState('');
  const [items] = useState(dummyItems);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="main-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="main-content">
        <Topbar />
        <div className="shop-container">
          <h2 className="shop-title">Shop</h2>
          <input
            type="text"
            className="shop-search"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="shop-items">
            {filteredItems.length === 0 && <div className="shop-empty">No items found.</div>}
            {filteredItems.map(item => (
              <div className="shop-item" key={item.id}>
                <img src={item.img} alt={item.name} className="shop-item-img" />
                <div className="shop-item-info">
                  <div className="shop-item-name">{item.name}</div>
                  <div className="shop-item-price">{item.price} <span className="shop-currency">⦿</span></div>
                </div>
                <button className="shop-buy-btn">Buy</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiscShop;