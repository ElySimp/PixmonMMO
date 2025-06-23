// filepath: c:\Users\faldo\VS Code\Projects\Game\PixmonMMO\frontend\src\pages\mainpage\HomeDaily.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeDaily.css";
import { FaGift, FaCalendarCheck, FaClock, FaTrophy, FaHome, FaCalendarAlt } from "react-icons/fa";
import { getUserDailyRewards, claimDailyReward } from "../../services/dailyRewardsService";
import Topbar from "../../components/Topbar";
import Sidebar from "../../components/Sidebar";

const HomeDaily = () => {
  const navigate = useNavigate();
  const [dailyRewards, setDailyRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimStatus, setClaimStatus] = useState(null);
  
  // Topbar event handlers
  const handleMenuClick = () => {
    console.log("Menu clicked");
  };
  
  const handleSupportClick = () => {
    console.log("Support clicked");
    navigate("/support");
  };
  
  const handleSearch = (value) => {
    console.log("Search:", value);
  };
  
  const handleChatClick = () => {
    console.log("Chat clicked");
  };
  
  const handleNotificationClick = () => {
    console.log("Notifications clicked");
  };
  
  const handleBackToHome = () => {
    navigate("/main");
  };

  useEffect(() => {
    const fetchDailyRewards = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setError("User ID not found. Please log in.");
          setLoading(false);
          return;
        }
        
        const response = await getUserDailyRewards(userId);
        setDailyRewards(response.data || response);
      } catch (err) {
        setError("Failed to fetch daily rewards. Please try again later.");
        console.error("Error fetching daily rewards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyRewards();
  }, []);

  const handleClaimReward = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("User ID not found. Please log in.");
        return;
      }

      const rewards = [
        { type: "gold", amount: 250 },
        { type: "gold", amount: 500 },
        { type: "diamond", amount: 5 },
        { type: "gold", amount: 750 },
        { type: "gold", amount: 1000 },
        { type: "diamond", amount: 10 },
        { type: "gold", amount: 1500 }
      ];
      const dayIdx = (dailyRewards.current_day || 1) - 1;
      const reward = rewards[dayIdx];
      
      setLoading(true);
      const response = await claimDailyReward(userId, dailyRewards.current_day, reward.type, reward.amount);
      
      if (response.success) {
        setClaimStatus("success");
        // Update the daily rewards data
        setDailyRewards(prev => ({
          ...prev,
          current_day: (prev.current_day % 7) + 1, // Cycle through 1-7
          streak_count: prev.streak_count + 1,
          total_claimed: prev.total_claimed + 1,
          canClaimToday: false,
          lastClaim: new Date().toISOString()
        }));
      } else {
        setClaimStatus("error");
        setError(response.message || "Failed to claim reward");
      }
    } catch (err) {
      setClaimStatus("error");
      setError("Failed to claim reward. Please try again later.");
      console.error("Error claiming daily reward:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderDailyRewardItems = () => {
    if (!dailyRewards) return null;
    
    // Create an array of 7 days for the daily rewards with specific rewards
    const rewards = [
      "250 Gold",
      "500 Gold",
      "5 Diamonds",
      "750 Gold",
      "1000 Gold",
      "10 Diamonds",
      "1500 Gold"
    ];
    
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const isCurrent = dailyRewards.current_day === i;
      const isClaimed = i < dailyRewards.current_day || 
                       (i === dailyRewards.current_day && !dailyRewards.canClaimToday);
      const isClaimable = i === dailyRewards.current_day && dailyRewards.canClaimToday;
      const isDiamonds = rewards[i-1].includes("Diamonds");
      
      days.push(
        <div 
          key={i} 
          className={`daily-reward-item ${isCurrent ? "current" : ""} ${isClaimed ? "claimed" : ""} ${isClaimable ? "claimable" : ""} ${isDiamonds ? "diamond-reward" : ""}`}
        >
          <div className="day-number">Day {i}</div>
          <div className="reward-icon">
            {isClaimed ? <FaCalendarCheck className="icon claimed" /> : <FaGift className="icon" />}
          </div>
          <div className="reward-value">
            {rewards[i-1]}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const renderLoadingOrError = () => {
    if (loading && !dailyRewards) {
      return <div className="daily-rewards-loading">Loading daily rewards...</div>;
    }

    if (error && !dailyRewards) {
      return <div className="daily-rewards-error">{error}</div>;
    }
    
    return null;
  };

  return (
    <div className="main-container">
      <Sidebar profilePic="/dummy.jpg" />
      <div className="main-content">
        <Topbar 
          onMenuClick={handleMenuClick}
          onSupportClick={handleSupportClick}
          onSearch={handleSearch}
          onChatClick={handleChatClick}
          onNotificationClick={handleNotificationClick}
        />
        
        <div className="daily-content-container">
          <div className="daily-header">
            <h1 className="daily-title">Daily Rewards</h1>
            <button className="back-home-button" onClick={handleBackToHome}>
              <FaHome className="back-icon" /> Back to Home
            </button>
          </div>
          
          {renderLoadingOrError()}
          
          {dailyRewards && (
            <div className="daily-rewards-layout">
              <div className="daily-stats-column">
                <div className="daily-card current-streak-card">
                  <div className="card-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">Current Streak</h3>
                    <div className="card-value">{dailyRewards.streak_count} days</div>
                    <p className="card-description">
                      Keep your streak to earn better rewards!
                    </p>
                  </div>
                </div>
                
                <div className="daily-card total-claimed-card">
                  <div className="card-icon">
                    <FaTrophy />
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">Total Rewards Claimed</h3>
                    <div className="card-value">{dailyRewards.total_claimed}</div>
                    <p className="card-description">
                      Total rewards claimed across all days
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="daily-rewards-column">
                <div className="daily-card rewards-card">
                  <h3 className="rewards-title">Weekly Rewards Calendar</h3>
                  <p className="rewards-description">
                    Log in daily to claim these rewards and boost your progress
                  </p>
                  
                  <div className="daily-rewards-grid">
                    {renderDailyRewardItems()}
                  </div>
                  
                  <div className="daily-action-container">
                    {dailyRewards.canClaimToday ? (
                      <button 
                        className="claim-button" 
                        onClick={handleClaimReward}
                        disabled={loading}
                      >
                        <FaGift className="claim-icon" />
                        Claim Today's Reward
                      </button>
                    ) : (
                      <div className="next-claim-info">
                        <FaClock className="clock-icon" />
                        <span>Next reward available in: {dailyRewards.hoursRemaining}h {dailyRewards.minutesRemaining}m</span>
                      </div>
                    )}
                    
                    {claimStatus === "success" && (
                      <div className="claim-success">Reward claimed successfully!</div>
                    )}
                    
                    {claimStatus === "error" && (
                      <div className="claim-error">{error}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeDaily;
