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
        <div className="invCont">
            <Sidebar 
                profilePic="/dummy.jpg"
            />
           
            <div className="invContent">
              <Topbar 
                  onMenuClick={handleMenuClick}
                  onSupportClick={handleSupportClick}
                  onFriendsClick={handleFriendsClick}
                  onSearch={handleSearch}
                  onChatClick={handleChatClick}
                  onNotificationClick={handleNotificationClick}
                  onEggClick={handleEggClick}
                /> 
              <div class="Inventory-Data-Container">
                <div class="sortingSquare">
                  <div class="innerSort"> filter </div>
                  <br></br>
                  <label for="fruit" class="inventory-sorting-content">Choose a type</label>
                  <br></br>
                  <select id="Sort" name="Choice" class="inventory-sorting-content">
                    <option value="All">All</option>
                    <option value="Rarity">Rarity</option>
                    <option value="Effectivity">Effectivity</option>
                    <option value="Obtainment">Obtainment</option>
                  </select>

                </div>

                <div class="right-side-inv"> 
                  <div class="inventory-Info">
                    <label class="inv-word">  Inventory </label>
                    <div class="inventory-capacity">
                      capacity : 0 / 100
                    </div>
                  
                  </div>
                  <div class="actual-inventory">
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                    <div class="inventory-items"> </div>
                  </div>
                </div>

              </div>
              
            </div>
            
        </div>

        // suffering
       

      )
}

export default MainInv 
