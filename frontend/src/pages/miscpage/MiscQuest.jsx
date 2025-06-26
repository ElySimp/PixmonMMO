import React, { useState, useRef, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import Sidebar from '../../components/Sidebar'
import DailyQuest from './quest/DailyQuest'
import WeeklyQuest from './quest/WeeklyQuest'
import MonthlyQuest from './quest/MonthlyQuest'
import BountyQuest from './quest/BountyQuest'
import './MiscQuest.css'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const MiscQuest = () => {
    // const [playerStats, setPlayerStats] = useState({ gold: 0, xp: 0, diamonds: 0, quest_points: 0 });
    const [activeLayer, setActiveLayer] = useState('daily');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const tabs = ['daily', 'weekly', 'monthly', 'bounty'];
    const tabRefs = useRef({});
    const underlineRef = useRef(null);

    const underlineColors = {
      daily: '#2A73A6',
      weekly: '#C73737',
      monthly: '#E4C21C',
      bounty: '#6EC207',
    };

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setTimeout(() => setIsLoaded(true), 100);
        }, 700);
    }, []);

    useEffect(() => {
        const updateUnderline = () => {
            const activeTab = tabRefs.current[activeLayer];
            const underline = underlineRef.current;
            if (activeTab && underline) {
                const rect = activeTab.getBoundingClientRect();
                const parentRect = activeTab.parentNode.getBoundingClientRect();
                underline.style.width = `${rect.width}px`;
                underline.style.left = `${rect.left - parentRect.left}px`;
            }
        };

        if (isLoaded) {
            // Sedikit delay agar DOM benar-benar siap
            setTimeout(updateUnderline, 10);
        }
    }, [activeLayer, isLoaded]);

    // Handler notifikasi claim reward
    const handleClaimReward = (msg = "Reward claimed!") => {
        toast.success(msg, {
            position: "top-center",
            autoClose: 2200,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
    };

    if (isLoading && !isLoaded) {
        return (
            <div className="main-container">
                <Sidebar profilePic="/dummy.jpg" />
                <div className="main-content">
                    <Topbar />
                    <div className="miscquest-loading-container">
                        <div className="miscquest-loading-spinner"></div>
                        <p>Loading quests...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-container">
            <Sidebar profilePic="/dummy.jpg" />
            <div className={`main-content miscquest-animate-in ${isLoaded ? 'show' : ''}`}>
                <ToastContainer />
                <Topbar />
                <div className="quest-tabs">
                    {tabs.map((layer) => (
                        <button
                        key={layer}
                        ref={(el) => (tabRefs.current[layer] = el)}
                        onClick={() => setActiveLayer(layer)}
                        className={activeLayer === layer ? 'active-tab' : 'non-active-tab'}
                        disabled={layer === 'weekly' || layer === 'monthly'}
                      >
                        {layer.charAt(0).toUpperCase() + layer.slice(1)} Quest
                        {(layer === 'weekly' || layer === 'monthly') && <span> (Coming Soon)</span>}
                      </button>
                    ))}

                    <div
                      className="quest-underline-slider"
                      ref={underlineRef}
                      style={{ backgroundColor: underlineColors[activeLayer] }}
                    ></div>
                </div>

                {/* Content based on selected tab */}
                {activeLayer === 'daily' && <DailyQuest />}
                {activeLayer === 'weekly' && <WeeklyQuest />}
                {activeLayer === 'monthly' && <MonthlyQuest />}
                {activeLayer === 'bounty' && <BountyQuest key={activeLayer} />}
            </div>
        </div>
    );
}

export default MiscQuest;