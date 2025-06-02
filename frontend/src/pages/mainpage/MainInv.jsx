import React, { useState, useEffect } from 'react';
import './MainInv.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import potion from '../../assets/inv_asset/potion.png';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/config';

// Add CSS for empty inventory message
const emptyInventoryStyle = {
  textAlign: 'center',
  padding: '20px',
  color: '#777',
  fontSize: '16px'
};

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
  const [count, setCount] = useState(0); // Initialize with 0 instead of null
  const [inventory, setInventory] = useState([]);
  const [inventoryIndex, setInventoryIndex] = useState([]);
  const [selectedOption, setSelectedOption] = useState("all");
  const [showInventory, setShowInventory] = useState(true);

  const handleChange = (e) => {
  const newValue = e.target.value;

  // Hide inventory content immediately
  setShowInventory(false);

  // Update the filter option
  setSelectedOption(newValue);

  // Show the inventory again after state update
  setTimeout(() => {
    setShowInventory(true);
  }, 0);
};

  

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

  function InventoryItem({ item , filter}) {
    const [isOpen, setIsOpen] = useState(false);
    if ( filter === "all" ){
      console.log("no filter");
    }
    else if (filter !== item.item_type) {
      return null;
    }
    
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
              </div>              <div className="maininv-item-stats">effect : {item.effect_value || 0}%</div>
              <div className="maininv-description">
                {inventoryIndex && item.index_id && inventoryIndex[item.index_id - 1] 
                  ? inventoryIndex[item.index_id - 1].description 
                  : "No description available"}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

 function MainInvCreation({ inventory, filter }) {
  return inventory.map((item, index) => (
    <InventoryItem key={item.id || index} item={item} filter={filter}/>
  ));
}


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
            <select
                id="Sort"
                name="Choice"
                className="maininv-inventory-sorting-content"
                value={selectedOption}
                onChange={handleChange}
              >
                <option value="all">All</option>
                <option value="potion">Potion</option>
                <option value="food">Food</option>
                <option value="key">Key</option>
              </select>
          </div>

          <div className="maininv-right-side-inv">
            <div className="maininv-inventory-Info">
              <label className="maininv-inv-word">Inventory</label>              <div className="maininv-inventory-capacity">
                capacity : {count} / 100 (User ID: {user?.id})
              </div>
            </div>            <div className="maininv-actual-inventory">              {showInventory && (
                inventory.length > 0 ? (
                  <MainInvCreation inventory={inventory} filter={selectedOption} />
                ) : (
                  <div style={emptyInventoryStyle}>Your inventory is empty</div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainInv;
