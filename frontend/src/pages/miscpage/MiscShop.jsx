import React, { useState, useEffect } from 'react';
import './MiscShop.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';
import { useUserStats } from '../../context/UserStatsContext';
import { API_URL, TOKEN_KEY } from '../../utils/config';
import { getRarityInfo } from '../../utils/rarity';

const MAIN_TABS = [
  { key: 'itemshop', label: 'Item Shop', icon: '🛒' },
  { key: 'sell', label: 'Sell Inventory', icon: '💰' },
  { key: 'diamondmarket', label: 'Diamond Market', icon: '💎' }
];

const ITEM_CATEGORIES = [
  { key: 'all', label: 'All Items', icon: '📦' },
  { key: 'potions', label: 'Potions', icon: '🧪' },
  { key: 'equipment', label: 'Equipment', icon: '🗡️' },
  { key: 'keys', label: 'Keys', icon: '🗝️' }
];

const MiscShop = () => {
  const { user } = useAuth();
  const { gold, diamonds, updateStats } = useUserStats();
  const [catalog, setCatalog] = useState([]);
  const [userInventory, setUserInventory] = useState([]);
  const [mainTab, setMainTab] = useState('itemshop');
  const [itemCategory, setItemCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCatalog();
    fetchInventory();
  }, [user]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch(`${API_URL}/shop/catalog`);
      const data = await res.json();
      if (data.success && Array.isArray(data.catalog)) {
        setCatalog(data.catalog);
      }
    } catch (err) {
      // Quiet fail
    }
  };

  const fetchInventory = async () => {
    try {
      const userId = user?.id || localStorage.getItem('userId');
      if (!userId) return;
      const res = await fetch(`${API_URL}/users/${userId}/inventoryGet`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.inventory)) {
        setUserInventory(data.inventory);
      }
    } catch (err) {
      // Quiet fail
    }
  };

  const handleBuy = async (item) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/shop/buy`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ itemId: item.itemId, amount: 1, currency: 'gold' })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Purchase failed');
        return;
      }

      toast.success(`Purchased ${item.name}!`);
      updateStats({ gold: data.remainingGold, diamonds: data.remainingDiamonds });
      fetchInventory();
    } catch (err) {
      toast.error('Network error during purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async (invItem) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/shop/sell`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ itemId: invItem.itemId || invItem.index_id, amount: 1 })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to sell item');
        return;
      }

      toast.success(data.message || `Sold ${invItem.item_name || invItem.name}!`);
      updateStats({ gold: data.currentGold });
      fetchInventory();
    } catch (err) {
      toast.error('Network error selling item');
    } finally {
      setLoading(false);
    }
  };

  const filteredCatalog = catalog.filter((item) => {
    if (itemCategory === 'all') return true;
    return item.category?.toLowerCase() === itemCategory.toLowerCase();
  });

  return (
    <div className="main-container">
      <Sidebar profilePic={user?.profilePic} username={user?.username} />
      <div className="shop-content">
        <Topbar />
        <ToastContainer position="top-right" autoClose={2500} theme="dark" />

        <div className="shop-header-stats">
          <div className="shop-header-gold">
            <span>🪙</span>
            <span>{gold?.toLocaleString() || 0} Gold</span>
          </div>
          <div className="shop-header-diamonds">
            <span>💎</span>
            <span>{diamonds?.toLocaleString() || 0} Diamonds</span>
          </div>
        </div>

        <div className="shop-main-flex">
          {/* Sidebar Tabs */}
          <div className="shop-sidebar-tabs">
            {MAIN_TABS.map((tab) => (
              <div
                key={tab.key}
                className={`shop-sidebar-tab ${mainTab === tab.key ? 'active' : ''}`}
                onClick={() => setMainTab(tab.key)}
              >
                <span className="shop-sidebar-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            ))}
          </div>

          {/* Main Panel */}
          <div className="shop-right-panel">
            {/* TAB 1: ITEM SHOP */}
            {mainTab === 'itemshop' && (
              <div className="shop-panel-content">
                <div className="shop-item-categories-top">
                  {ITEM_CATEGORIES.map((cat) => (
                    <div
                      key={cat.key}
                      className={`shop-item-category ${itemCategory === cat.key ? 'active' : ''}`}
                      onClick={() => setItemCategory(cat.key)}
                    >
                      <span className="shop-sidebar-icon">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </div>
                  ))}
                </div>

                <div className="shop-items-list">
                  {filteredCatalog.map((item) => {
                    const rarity = getRarityInfo(item.rarityTier || item.rarityName);
                    return (
                      <div
                        className="shop-item-card"
                        key={item.itemId}
                        style={{ borderColor: rarity.border }}
                      >
                        <div className="shop-item-icon-wrap" style={{ background: rarity.bg }}>
                          <span className={`shop-item-icon ${rarity.animationClass || ''}`}>
                            {item.category === 'potions' ? '🧪' : item.category === 'equipment' ? '🗡️' : '📦'}
                          </span>
                        </div>
                        <div className="shop-item-info">
                          <div className="shop-item-title" style={{ color: rarity.color }}>
                            {item.name}
                          </div>
                          <div className="shop-item-tier-badge" style={{ color: rarity.color }}>
                            {rarity.name} (Tier {rarity.tier})
                          </div>
                          <div className="shop-item-price">
                            {item.buyPriceDiamonds > 0 ? `💎 ${item.buyPriceDiamonds} Diamonds` : `🪙 ${item.buyPriceGold} Gold`}
                          </div>
                        </div>
                        <button
                          className="shop-item-btn blue"
                          onClick={() => handleBuy(item)}
                          disabled={loading}
                        >
                          Buy
                        </button>
                      </div>
                    );
                  })}
                  {filteredCatalog.length === 0 && (
                    <div className="shop-empty-msg">No items found in this category.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SELL INVENTORY */}
            {mainTab === 'sell' && (
              <div className="shop-panel-content">
                <h3>Sell Items from Your Inventory</h3>
                <div className="shop-items-list">
                  {userInventory.map((item, idx) => {
                    const rarity = getRarityInfo(item.rarityTier || item.rarityName || 1);
                    return (
                      <div className="shop-item-card" key={idx} style={{ borderColor: rarity.border }}>
                        <div className="shop-item-icon-wrap" style={{ background: rarity.bg }}>
                          <span className={`shop-item-icon ${rarity.animationClass || ''}`}>📦</span>
                        </div>
                        <div className="shop-item-info">
                          <div className="shop-item-title" style={{ color: rarity.color }}>
                            {item.item_name || item.name || item.itemId}
                          </div>
                          <div className="shop-item-qty">Quantity: <b>{item.amount || 1}</b></div>
                          <div className="shop-item-price">🪙 15 Gold each</div>
                        </div>
                        <button
                          className="shop-item-btn sell-btn"
                          onClick={() => handleSell(item)}
                          disabled={loading}
                        >
                          Sell 1x
                        </button>
                      </div>
                    );
                  })}
                  {userInventory.length === 0 && (
                    <div className="shop-empty-msg">Your inventory is empty. Complete dungeons to earn loot!</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: DIAMOND MARKET */}
            {mainTab === 'diamondmarket' && (
              <div className="shop-panel-content">
                <h3>Diamond Exchange Market</h3>
                <div className="shop-items-list">
                  <div className="shop-item-card">
                    <span className="shop-item-icon">💎</span>
                    <div className="shop-item-info">
                      <div className="shop-item-title">Pouch of 50 Diamonds</div>
                      <div className="shop-item-price">🪙 1,000 Gold</div>
                    </div>
                    <button className="shop-item-btn blue" onClick={() => toast.info('Market exchange available soon!')}>
                      Exchange
                    </button>
                  </div>
                  <div className="shop-item-card">
                    <span className="shop-item-icon">💎</span>
                    <div className="shop-item-info">
                      <div className="shop-item-title">Chest of 250 Diamonds</div>
                      <div className="shop-item-price">🪙 4,500 Gold</div>
                    </div>
                    <button className="shop-item-btn blue" onClick={() => toast.info('Market exchange available soon!')}>
                      Exchange
                    </button>
                  </div>
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
