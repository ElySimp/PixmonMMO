import React, { useState } from 'react';
import './MainInv.css'
import Topbar from '../../components/Topbar'
import Sidebar from '../../components/Sidebar'


function MaininvInvCreation(count) {
  return Array.from({ length: count }, (_, i) => (
    <InventoryItem key={i} index={i} />
  ));
}

function InventoryItem({ index }) {
  const [isOpen, setIsOpen] = useState(false);  // State to control box visibility

  return (
    <div className="maininv-item-container">
      {/* Clicking this div will open the centered box */}
      <div
        className="maininv-inventory-items"
        onClick={() => setIsOpen(true)}  // Open box when clicked
      >
        Item {index + 1}
      </div>

      {/* Conditionally render the box in the center */}
      {isOpen && (
        <div className="maininv-centered-box">
          <div className="maininv-box-content">
            <span
              className="maininv-close-btn"
              onClick={() => setIsOpen(false)}  // Close box when close button is clicked
            >
              &times;
            </span>
            <p>Details for Item {index + 1}</p>
          </div>
        </div>
      )}
    </div>
  );
}



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

      const count = 60;

      return (
        <div className="maininv-invCont">
            <Sidebar 
                profilePic="/dummy.jpg"
            />
           
            <div className="maininv-invContent">
              <Topbar 
                  onMenuClick={handleMenuClick}
                  onSupportClick={handleSupportClick}
                  onFriendsClick={handleFriendsClick}
                  onSearch={handleSearch}
                  onChatClick={handleChatClick}
                  onNotificationClick={handleNotificationClick}
                  onEggClick={handleEggClick}
                /> 
              <div class="maininv-Inventory-Data-Container">
                <div class="maininv-sortingSquare">
                  <div class="maininv-innerSort"> filter </div>
                  <br></br>
                  <label for="fruit" class="maininv-inventory-sorting-content">Choose a type</label>
                  <br></br>
                  <select id="Sort" name="Choice" class="maininv-inventory-sorting-content">
                    <option value="All">All</option>
                    <option value="Rarity">Rarity</option>
                    <option value="Effectivity">Effectivity</option>
                    <option value="Obtainment">Obtainment</option>
                  </select>

                </div>

                <div class="maininv-right-side-inv"> 
                  <div class="maininv-inventory-Info">
                    <label class="maininv-inv-word">  Inventory </label>
                    <div class="maininv-inventory-capacity">
                      capacity : {count} / 100
                    </div>
                  
                  </div>
                  <div class="maininv-actual-inventory">
                    {MaininvInvCreation(count)}
                  </div>
                </div>

              </div>
              
            </div>
            
        </div>

        // suffering
       

      )
}

export default MainInv 
