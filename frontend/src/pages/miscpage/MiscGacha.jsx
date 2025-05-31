import React, { useState, useEffect } from 'react';
import './MiscGacha.css';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import potion from '../../assets/inv_asset/potion.png';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/config';

const MiscGacha = () => {
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

            <div class="miscgacha-content">
                <div class="miscgacha-banner-select">
                    <div class="miscgacha-selection">
                        Steel Banner
                    </div>
                    <div class="miscgacha-selection">
                        Mythical Banner
                    </div>
                </div>

                <div class="miscgacha-content-container">
                    <div class="miscgacha-rates">
                        View Details
                    </div>

                    <div class="miscgacha-pull-container">
                        <div class="miscgacha-pull">
                            1x Pull
                        </div>

                        <div class="miscgacha-pull">
                            10x Pull
                        </div>
                    </div>
                </div>
            </div>

            </div>
        </div>
     
);
}



export default MiscGacha;