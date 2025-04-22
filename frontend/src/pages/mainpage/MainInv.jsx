import React from 'react'
import './MainInv.css'
import Topbar from '../../components/Topbar'
import Sidebar from '../../components/Sidebar'

const MainInv = () => {
    const handleMenuClick = () => {
        console.log('Menu clicked');
      };
    
      const handleSupportClick = () => {
        console.log('Support clicked');
      };
    
      const handleFriendsClick = () => {
        console.log('Friends clicked');
      };
    
      const handleSearch = (value) => {
        console.log('Search:', value);
      };
    
      const handleChatClick = () => {
        console.log('Chat clicked');
      };
    
      const handleNotificationClick = () => {
        console.log('Notifications clicked');
      };
    
      const handleEggClick = () => {
        console.log('Egg clicked');
      };


      return (
        <div className="main-container">
            <Sidebar 
                profilePic="/dummy.jpg"
            />
          
            <div className="main-content">
            <Topbar 
              onMenuClick={handleMenuClick}
              onSupportClick={handleSupportClick}
              onFriendsClick={handleFriendsClick}
              onSearch={handleSearch}
              onChatClick={handleChatClick}
              onNotificationClick={handleNotificationClick}
              onEggClick={handleEggClick}
            />
            </div>

            <div class="sortingSquare">
               
            </div>
        </div>

        // suffering
       

      )
}

export default MainInv 
