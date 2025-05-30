import React, { useState, useEffect } from 'react';
import './MainInv.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import potion from '../../assets/inv_asset/potion.png';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/config';

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

async function getIndexInventory() {
  try {
    const res = await fetch(`${API_URL}/inventoryIndex`);
    const data = await res.json();
    if (data.success) return data.inventoryIndex;
    console.error('Failed to get inventory index');
    return [];
  } catch (error) {
    console.error("Error fetching inventory index:", error);
    return [];
  }
}

const MainInv = () => {
  const { user, loading: authLoading } = useAuth();
  const [count, setCount] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [inventoryIndex, setInventoryIndex] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    getIndexInventory()
      .then(setInventoryIndex)
      .catch(() => setInventoryIndex([]));
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (user && user.id) {
      getInventoryCount(user.id)
        .then(setCount)
        .catch(() => setCount(0));
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
        .catch(() => setInventory([]));
    } else {
      console.log('No user found');
      setInventory([]);
    }
  }, [user, authLoading]);

  function InventoryItem({ item }) {
    const [isOpen, setIsOpen] = useState(false);

    // Safely get description and image with fallbacks
    return (
      <div className="maininv-item-container">
        <div className="maininv-inventory-items" onClick={() => setIsOpen(true)}>
          <div className="maininv-amt"> x{item.amount || 1} </div>
          <div className="maininv-items">
            <img src={potion} alt="potion"/>
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
              <div className="maininv-item-stats">effect : {item.effect_value || 0}%</div>
              <div className="maininv-description">{inventoryIndex[item.index_id].description}</div>
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
                capacity : {count} / 100 (User ID: {user?.id}) {inventoryIndex[0].description}
              </div>
            </div>
            <div className="maininv-actual-inventory">
              <MainInvCreation inventory={inventory}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainInv;
