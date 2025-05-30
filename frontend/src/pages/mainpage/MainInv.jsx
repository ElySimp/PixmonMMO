import React, { useState, useEffect } from 'react';
import './MainInv.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import potion from '../../assets/inv_asset/potion.png';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/config';
import axios from 'axios';

const description = "idk what to write";
const testAmount = 5;
const effect = 20;

// Fetch count from backend
async function getInventoryCount(userId) {
  try {
    const res = await fetch(`${API_URL}/users/${userId}/inventoryCount`);

    const data = await res.json();
    if (data.success) return data.count;
    throw new Error('Failed to get inventory count');
  } catch (e) {
    console.error(e);
    return 0;
  }
}

async function getInventoryData(userId) {
  try {
    const res = await fetch(`${API_URL}/users/${userId}/inventoryGet`);

    const data = await res.json();
    if (data.success) return data.inventory; 

    throw new Error('Failed to get inventory data');
  } catch (e) {
    console.error(e);
    return []; 
  }
}

const MainInv = () => {
  const { user, loading: authLoading } = useAuth();
  const [count, setCount] = useState(null); // null = loading
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    if (authLoading) return;

    if (user && user.id) {
      getInventoryCount(user.id)
        .then(setCount)
        .catch(() => setCount(0)); // fallback
    } else {
      console.log('No user found');
      setCount(0);
    }
  }, [user, authLoading]);

  useEffect(() => {
  if (authLoading) return;

  if (user && user.id) {
    getInventoryData(user.id)
      .then(setInventory)
      .catch(() => setInventory([])); // fallback
  } else {
    console.log('No user found');
    setInventory([]);
  }
  }, [user, authLoading]);

  function InventoryItem({ item }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="maininv-item-container">
        <div className="maininv-inventory-items" onClick={() => setIsOpen(true)}>
          <div className="maininv-amt"> x{testAmount} </div>
          <div className="maininv-items">
            <img src={potion} alt="potion" />
          </div>
        </div>

        {isOpen && (
          <div className="maininv-centered-box" onClick={() => setIsOpen(false)}>
            <div className="maininv-box-content" onClick={e => e.stopPropagation()}>
              <span className="maininv-close-btn" onClick={() => setIsOpen(false)}>&times;</span>
              <div className="overlay-name">{item.item_name}</div>
              <div className="maininv-items">
                <img src={potion} alt="potion" />
              </div>
              <div className="maininv-item-stats">effect : {item.effect_value}%</div>
              <div className="maininv-description">{description}</div>
            </div>
          </div>
        )}
      </div>
  );
}

  function MainInvCreation({ inventory }) {
    return inventory.map((item, index) => (
      <InventoryItem key={item.id || index} item={item} />
    ));
  }

  console.log('Inventory:', inventory);


  if (count === null) return <div>Loading inventory...</div>;

  return (
    <div className="maininv-invCont">
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
        <div className="maininv-Inventory-Data-Container">
          <div className="maininv-sortingSquare">
            <div className="maininv-innerSort">filter</div>
            <br />
            <label>Choose a type</label>
            <br />
            <select id="Sort" name="Choice" className="maininv-inventory-sorting-content">
              <option value="All">All</option>
              <option value="Rarity">Rarity</option>
              <option value="Effectivity">Effectivity</option>
              <option value="Obtainment">Obtainment</option>
            </select>
          </div>

          <div className="maininv-right-side-inv">
            <div className="maininv-inventory-Info">
              <label className="maininv-inv-word">Inventory</label>
              <div className="maininv-inventory-capacity">
                capacity : {count} / 100 (User ID: {user?.id})
              </div>
            </div>
            <div className="maininv-actual-inventory">
              <MainInvCreation inventory={inventory} count={count}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainInv;
