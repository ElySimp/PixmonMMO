import React from 'react';
import './MiscGacha.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/config';

async function sendInventoryCountRequest(userId) {
  try {
    await fetch(`${API_URL}/users/${userId}/tenPull`);
    
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

const MiscGacha = () => {
  const { user, loading: authLoading } = useAuth();

  // Optionally, disable button if auth is loading or no user yet
  const handleTenPull = () => {
    if (user?.id) {
      sendInventoryCountRequest(user.id);
    } else {
      console.log('User not logged in yet');
    }
  };

  const handleOnePull = () => {
    if (user?.id) {
      singlePull(user.id);
    } else {
      console.log("single fail");
    }
  }

  return (
    <div className="miscGacha-Container">
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

        <div className="miscgacha-content">
          <div className="miscgacha-banner-select">
            <div className="miscgacha-selection">Steel Banner</div>
            <div className="miscgacha-selection">Mythical Banner</div>
          </div>

          <div className="miscgacha-content-container">
            <div className="miscgacha-rates">View Details</div>

            <div className="miscgacha-pull-container">
              <div
                className="miscgacha-pull"
                onClick={handleOnePull}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if(e.key === 'Enter') handleOnePull(); }}
              >
                1x Pull
              </div>

              <div
                className="miscgacha-pull"
                onClick={handleTenPull}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if(e.key === 'Enter') handleTenPull(); }}
              >
                10x Pull
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiscGacha;
