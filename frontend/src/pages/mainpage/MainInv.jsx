import React, { useState, useEffect } from 'react';
import './MainInv.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';
import { API_URL, TOKEN_KEY } from '../../utils/config';
import { getRarityInfo } from '../../utils/rarity';

const USAGE_TYPES = ['All', 'Equip', 'Consumables', 'Materials'];

const MainInv = () => {
  const { user, loading: authLoading } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [selectedUsage, setSelectedUsage] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchInventory = async () => {
    const userId = user?.id || localStorage.getItem('userId');
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users/${userId}/inventoryGet`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.inventory)) {
        setInventory(data.inventory);
        if (!selectedItem && data.inventory.length > 0) {
          setSelectedItem(data.inventory[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchInventory();
    }
  }, [user, authLoading]);

  const handleEquipToggle = async (item) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_URL}/inventory/equip`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ itemId: item.itemId || item.index_id })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Could not equip item');
        return;
      }

      toast.success(data.message);
      await fetchInventory();
    } catch (err) {
      toast.error('Error updating equipment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUseItem = async (item) => {
    const userId = user?.id || localStorage.getItem('userId');
    if (!userId) return;

    try {
      setActionLoading(true);
      const res = await fetch(`${API_URL}/users/${userId}/${item.itemId || item.index_id}/ItemUse`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        toast.error('Failed to use item');
        return;
      }
      toast.success(`Used ${item.name || item.item_name}`);
      await fetchInventory();
    } catch (err) {
      toast.error('Error using item');
    } finally {
      setActionLoading(false);
    }
  };

  const isEquippable = (type) => ['weapon', 'armor', 'accessory', 'tool'].includes(String(type).toLowerCase());

  const getItemIcon = (type) => {
    switch (String(type).toLowerCase()) {
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'accessory': return '💍';
      case 'tool': return '⛏️';
      case 'potion':
      case 'consumable': return '🧪';
      case 'key': return '🗝️';
      default: return '📦';
    }
  };

  const equippedItems = inventory.filter((i) => i.isEquipped);
  const totalBonusAtk = equippedItems.reduce((sum, i) => sum + (i.item_stats?.atk || 0), 0);
  const totalBonusDef = equippedItems.reduce((sum, i) => sum + (i.item_stats?.defPhy || 0), 0);

  const filteredInventory = inventory.filter((item) => {
    const type = String(item.item_type || '').toLowerCase();
    if (selectedUsage === 'All') return true;
    if (selectedUsage === 'Equip') return isEquippable(type);
    if (selectedUsage === 'Consumables') return ['potion', 'consumable', 'food'].includes(type);
    if (selectedUsage === 'Materials') return !isEquippable(type) && !['potion', 'consumable', 'food'].includes(type);
    return true;
  });

  return (
    <div className="inv-page-container">
      <Sidebar profilePic={user?.profilePic} username={user?.username} />
      <div className="inv-page-content">
        <Topbar />
        <ToastContainer position="top-right" autoClose={2500} theme="dark" />

        <div className="inv-main-layout">
          {/* Equipped Gear Summary Banner */}
          <div className="inv-equipped-banner">
            <div className="inv-equipped-info">
              <h2>🎒 Adventurer Inventory</h2>
              <p>Equip gear to boost your combat stats in dungeons. Tier 9 & 10 relics feature animated sprites.</p>
            </div>
            <div className="inv-gear-bonuses">
              <div className="gear-bonus-pill">⚔️ Gear ATK: <b>+{totalBonusAtk}</b></div>
              <div className="gear-bonus-pill">🛡️ Gear DEF: <b>+{totalBonusDef}</b></div>
              <div className="gear-bonus-pill">📦 Items: <b>{inventory.length}</b></div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="inv-filter-bar">
            {USAGE_TYPES.map((tab) => (
              <button
                key={tab}
                className={`inv-filter-btn ${selectedUsage === tab ? 'active' : ''}`}
                onClick={() => setSelectedUsage(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Two-column Grid: Items Grid + Details Inspector */}
          <div className="inv-workspace">
            <div className="inv-grid-panel">
              {loading ? (
                <div className="inv-empty-state">Loading inventory...</div>
              ) : filteredInventory.length === 0 ? (
                <div className="inv-empty-state">
                  No items found in this category. Explore dungeons or visit the Shop!
                </div>
              ) : (
                <div className="inv-items-grid">
                  {filteredInventory.map((item) => {
                    const rarity = getRarityInfo(item.rarityTier || item.rarityName || 1);
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`inv-item-slot ${isSelected ? 'selected' : ''} ${item.isEquipped ? 'equipped' : ''}`}
                        style={{
                          borderColor: isSelected ? '#fff' : rarity.border,
                          background: rarity.bg
                        }}
                        onClick={() => setSelectedItem(item)}
                      >
                        {item.isEquipped && <span className="inv-equipped-badge">E</span>}
                        <span className="inv-amount-badge">x{item.amount}</span>
                        <span className={`inv-slot-icon ${rarity.animationClass || ''}`}>
                          {getItemIcon(item.item_type)}
                        </span>
                        <span className="inv-slot-name" style={{ color: rarity.color }}>
                          {item.name || item.item_name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Item Inspector Panel */}
            <div className="inv-inspector-panel">
              {selectedItem ? (
                (() => {
                  const rarity = getRarityInfo(selectedItem.rarityTier || selectedItem.rarityName || 1);
                  const equippable = isEquippable(selectedItem.item_type);
                  return (
                    <div className="inv-inspector-card" style={{ borderColor: rarity.border }}>
                      <div className="inspector-icon-wrap" style={{ background: rarity.bg, borderColor: rarity.border }}>
                        <span className={`inspector-icon ${rarity.animationClass || ''}`}>
                          {getItemIcon(selectedItem.item_type)}
                        </span>
                      </div>

                      <h3 style={{ color: rarity.color }}>{selectedItem.name || selectedItem.item_name}</h3>
                      <div className="inspector-rarity-pill" style={{ color: rarity.color, borderColor: rarity.border }}>
                        Tier {rarity.tier}: {rarity.name}
                      </div>

                      {rarity.animated && (
                        <div className="inspector-anim-tag">✨ {rarity.frames}-Frame Looping Spritesheet</div>
                      )}

                      <p className="inspector-desc">{selectedItem.description || 'A mysterious item from the world of Pixmon.'}</p>

                      {selectedItem.item_stats && Object.keys(selectedItem.item_stats).length > 0 && (
                        <div className="inspector-stats-box">
                          {selectedItem.item_stats.atk > 0 && <div>⚔️ ATK: +{selectedItem.item_stats.atk}</div>}
                          {selectedItem.item_stats.defPhy > 0 && <div>🛡️ DEF: +{selectedItem.item_stats.defPhy}</div>}
                          {selectedItem.item_stats.hp > 0 && <div>❤️ HP: +{selectedItem.item_stats.hp}</div>}
                        </div>
                      )}

                      <div className="inspector-actions">
                        {equippable ? (
                          <button
                            className={`inspector-btn ${selectedItem.isEquipped ? 'btn-unequip' : 'btn-equip'}`}
                            onClick={() => handleEquipToggle(selectedItem)}
                            disabled={actionLoading}
                          >
                            {selectedItem.isEquipped ? 'Unequip Gear' : 'Equip Gear'}
                          </button>
                        ) : (
                          <button
                            className="inspector-btn btn-use"
                            onClick={() => handleUseItem(selectedItem)}
                            disabled={actionLoading}
                          >
                            Use Item
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="inv-empty-state">Select an item to inspect its stats.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainInv;
