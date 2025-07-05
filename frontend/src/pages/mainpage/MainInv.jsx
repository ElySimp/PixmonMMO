import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainInv.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import potion from '../../assets/inv_asset/potion.png';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/config';

const USAGE_TYPES = ['All', 'Consumables', 'Equip', 'Gacha'];
const EQUIP_CATEGORIES = ['All', 'Weapon', 'Armor', 'Accessory']; // Placeholder values
const ITEM_TYPES = ['All', 'Potion', 'Food', 'Key'];

const emptyInventoryStyle = {
  textAlign: 'center',
  padding: '20px',
  color: '#777',
  fontSize: '16px'
};

async function itemUse(userId, index_id) {
  try {
    await fetch(`${API_URL}/users/${userId}/${index_id}/ItemUse`);
  } catch (error) {
    console.error(error);
  }
}

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
    if (data.success) {
      return data.inventoryIndex; // ← Just return raw data with no path manipulation
    }
    return [];
  } catch (error) {
    console.error("Error fetching inventory index:", error);
    return [];
  }
}


const MainInv = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [inventoryIndex, setInventoryIndex] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedUsage, setSelectedUsage] = useState('All');
  const [equipCategory, setEquipCategory] = useState('All');
  const [showInventory, setShowInventory] = useState(true);

  const reloadInventory = async () => {
    if (user && user.id) {
      const [newInventory, newCount] = await Promise.all([
        getInventoryData(user.id),
        getInventoryCount(user.id)
      ]);
      setInventory(newInventory);
      setCount(newCount);
    }
  };

  const handleTypeChange = (e) => {
    setShowInventory(false);
    setSelectedType(e.target.value);
    setTimeout(() => setShowInventory(true), 0);
  };

  const handleUsageChange = (e) => {
    const value = e.target.value;
    setShowInventory(false);
    setSelectedUsage(value);
    if (value !== 'Equip') setEquipCategory('All');
    setTimeout(() => setShowInventory(true), 0);
  };

  const handleEquipCategoryChange = (e) => {
    setShowInventory(false);
    setEquipCategory(e.target.value);
    setTimeout(() => setShowInventory(true), 0);
  };

  useEffect(() => {
    if (authLoading) return;
    getIndexInventory().then(setInventoryIndex).catch(() => setInventoryIndex([]));
  }, [authLoading]);

  useEffect(() => {
    if (authLoading || !user?.id) return;
    getInventoryCount(user.id).then(setCount).catch(() => setCount(0));
    getInventoryData(user.id).then((data) => {
      setInventory(data);
      // Debug inventory data
      if (data && data.length > 0) {
        console.log("First inventory item:", data[0]);
      }
    }).catch(() => setInventory([]));
  }, [user, authLoading]);

  // Add debug effect for inventory and inventoryIndex
  useEffect(() => {
    if (inventory.length > 0 && inventoryIndex.length > 0) {
      console.log("Inventory items count:", inventory.length);
      console.log("Inventory index count:", inventoryIndex.length);
      
      // Check a sample item path
      const sampleItem = inventory[0];
      if (sampleItem && sampleItem.index_id) {
        const indexItem = inventoryIndex[sampleItem.index_id - 1];
        console.log("Sample inventory item:", sampleItem);
        console.log("Corresponding index item:", indexItem);
        console.log("Image path to load:", indexItem?.path);
      }
    }
  }, [inventory, inventoryIndex]);

  const InventoryItem = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);
    const itemData = inventoryIndex[item.index_id - 1] || {};
    const { rarity = 1, description = 'No description available', item_category = 'none' } = itemData;

    const usageType =
      item.item_type === 'potion' || item.item_type === 'food' ? 'Consumables'
      : item.item_type === 'key' ? 'Gacha'
      : 'Equip';

    if ((selectedType !== 'All' && selectedType.toLowerCase() !== item.item_type) ||
        (selectedUsage !== 'All' && selectedUsage !== usageType)) {
      return null;
    }

    if (selectedUsage === 'Equip' && equipCategory !== 'All') {
      console.warn('Equip filtering is currently skipped — waiting for backend data structure.');
    }

    const handleUse = async () => {
      await itemUse(user.id, item.index_id);
      setIsOpen(false);
      await reloadInventory();
    };

    const effect = item.item_stats?.health_regen || item.item_stats?.hunger_value || item.item_stats?.mana_regen || 0;
    const statLabel = item.item_stats?.health_regen ? 'Health Regen'
      : item.item_stats?.hunger_value ? 'Hunger Value'
      : item.item_stats?.mana_regen ? 'Mana Regen'
      : 'No Effect';

    const rarityColors = ['gray', 'green', 'blue', 'gold'];

    return (
      <div className="maininv-item-container">
        <div
          className="maininv-inventory-items"
          style={{ border: `2px solid ${rarityColors[rarity - 1]}` }}
          onClick={() => setIsOpen(true)}
        >
          <img 
            src={inventoryIndex[item.index_id - 1]?.path || ''}
            alt="fix this shet" 
            onError={(e) => {
              console.error("Image failed to load:", e.target.src);
              
              // Try fallback paths
              if (e.target.src) {
                const currentSrc = e.target.src;
                const pathParts = currentSrc.split('/');
                const filename = pathParts[pathParts.length - 1];
                
                if (!currentSrc.includes('/items/')) {
                  console.log("Trying fallback path with /items/ prefix");
                  e.target.src = `/items/${filename}`;
                  return;
                }
              }
              
              e.target.onerror = null;
            }}
          />  
          <div className="maininv-amt">x{item.amount}</div>
        </div>

        {isOpen && (
          <div className="maininv-centered-box" onClick={() => setIsOpen(false)}>
            <div className="maininv-box-content" onClick={e => e.stopPropagation()}>
              <h3 className="overlay-name">{item.item_name}</h3>
              <img 
                className="maininv-img" 
                src={inventoryIndex[item.index_id - 1]?.path || ''}
                alt="fix this shet" 
                onError={(e) => {
                  console.error("Modal image failed to load:", e.target.src);
                  
                  // Try fallback paths
                  if (e.target.src) {
                    const currentSrc = e.target.src;
                    const pathParts = currentSrc.split('/');
                    const filename = pathParts[pathParts.length - 1];
                    
                    if (!currentSrc.includes('/items/')) {
                      console.log("Trying fallback path with /items/ prefix");
                      e.target.src = `/items/${filename}`;
                      return;
                    }
                  }
                  
                  e.target.onerror = null;
                }}
              />
              <div className="maininv-item-stats">{statLabel}: {effect}%</div>
              <div className="maininv-description">{description}</div>
              <div className="maininv-buttons">
                <button className="maininv-use-btn" onClick={handleUse}>Use</button>
                <button className="maininv-close-btn" onClick={() => setIsOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const MainInvCreation = () => (
    inventory.map((item, index) => (
      <InventoryItem key={item.id || index} item={item} />
    ))
  );

  return (
    <div className="maininv-invCont">
      <Sidebar profilePic="dummy.jpg" />
      <div className="maininv-invContent">
        <Topbar
          onMenuClick={() => console.log('Menu clicked')}
          onSupportClick={() => navigate('/support')}
          onFriendsClick={() => console.log('Friends clicked')}
          onSearch={(value) => console.log('Search:', value)}
          onChatClick={() => console.log('Chat clicked')}
          onNotificationClick={() => console.log('Notifications clicked')}
          onEggClick={() => console.log('Egg clicked')}
        />
        <div className="maininv-Inventory-Data-Container">
          <div className="maininv-sortingSquare">
            <div className="maininv-innerSort">Filter by Type</div>
              <select value={selectedType} onChange={handleTypeChange}>
                {ITEM_TYPES.map(type => (
                  <option  className = "maininv-option" key={type} value={type}>{type}</option>
                ))}
              </select>
              <br></br>
              <br></br>
              <div className="maininv-innerSort">Filter by Usage</div>
              <select value={selectedUsage} onChange={handleUsageChange}>
                {USAGE_TYPES.map(type => (
                  <option className = "maininv-option" key={type} value={type}>{type}</option>
                ))}
              </select>
              <br></br>
              <br></br>
              {selectedUsage === 'Equip' && (
                <>
                  <div className="maininv-innerSort">Equip Category</div>
                  <select className="maininv-option" value={equipCategory} onChange={handleEquipCategoryChange}>
                    {EQUIP_CATEGORIES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
              </>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div className="maininv-inventory-Info">
              <label className="maininv-inv-word">Inventory</label>
              <div className="maininv-inventory-capacity">
                Capacity : {count} / 100 
              </div>
            </div>

            <div className="maininv-actual-inventory">
              {showInventory && (inventory.length > 0 ? (
                <MainInvCreation />
              ) : (
                <div style={emptyInventoryStyle}>Your inventory is empty</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainInv;
