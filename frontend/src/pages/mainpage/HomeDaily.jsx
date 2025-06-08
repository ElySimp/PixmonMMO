import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/Topbar';
import Sidebar from '../../components/Sidebar';
import { FaGem, FaCoins, FaChevronLeft, FaCalendarCheck, FaCalendarAlt, FaTrophy, FaCheck, FaInfoCircle, FaArrowRight, FaGift, FaClock, FaSyncAlt } from 'react-icons/fa';
import './HomeDaily.css';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { getUserDailyRewards, claimDailyReward, formatNextClaimTime } from '../../services/dailyRewardsService';
import { toast } from 'react-toastify';

const HomeDaily = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(null); // Current active day (1-7)
  const [claiming, setClaiming] = useState(false);
  const [claimComplete, setClaimComplete] = useState(false);
  const [streakCount, setStreakCount] = useState(null); // Streak count (days)
  const [totalClaimed, setTotalClaimed] = useState(null); // Total claims lifetime
  const [lastClaimDate, setLastClaimDate] = useState(null); // Last claimed date
  const [canClaimToday, setCanClaimToday] = useState(false); // Can claim today
  const [nextRewardHighlight, setNextRewardHighlight] = useState(false); // Add highlight animation for next reward
  const [nextClaimInfo, setNextClaimInfo] = useState(null); // Time until next claim
  const [claimCountdown, setClaimCountdown] = useState(null); // Formatted countdown string
  
  // Daily rewards configuration
  const dailyRewards = [
    { day: 1, type: 'gold', amount: 250, icon: <FaCoins /> },
    { day: 2, type: 'diamond', amount: 2, icon: <FaGem /> },
    { day: 3, type: 'gold', amount: 500, icon: <FaCoins /> },
    { day: 4, type: 'diamond', amount: 5, icon: <FaGem /> },
    { day: 5, type: 'gold', amount: 750, icon: <FaCoins /> },
    { day: 6, type: 'diamond', amount: 10, icon: <FaGem /> },
    { day: 7, type: 'gold', amount: 1500, icon: <FaCoins className="special-icon" /> }
  ];
  
  // Get next day's reward (the one after current activeDay)
  const getNextDayReward = () => {
    if (!activeDay) return dailyRewards[0];
    
    if (canClaimToday) {
      // If can claim today, next day is the one after current
      const nextDay = activeDay === 7 ? 1 : activeDay + 1;
      return dailyRewards[nextDay - 1];
    } else {
      // If already claimed today, next day is current day
      return dailyRewards[activeDay - 1];
    }
  };

  // Function to refresh the daily rewards data
  const refreshDailyRewardsData = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId') || '1';
      console.log('Refreshing daily rewards data for userId:', userId);
      
      const response = await getUserDailyRewards(userId);
      console.log('Refreshed daily rewards response:', response);
      
      let data;
      if (response && response.success && response.data) {
        data = response.data;
      } else if (response && !response.success) {
        console.error('API returned error when refreshing:', response);
        throw new Error(response.message || 'Failed to refresh daily rewards');
      } else {
        data = response;
      }
      
      console.log('Refreshed daily rewards data:', data);
      
      // Update state with fresh data
      setActiveDay(data.current_day || 1);
      setStreakCount(data.streak_count || 0);
      setTotalClaimed(data.total_claimed || 0);
      setLastClaimDate(data.last_claimed_date);
      setCanClaimToday(data.canClaimToday !== undefined ? data.canClaimToday : true);
      setNextClaimInfo(data.nextClaimInfo || null);
      
      if (data.nextClaimInfo) {
        setClaimCountdown(formatNextClaimTime(data.nextClaimInfo));
      }
      
      toast.info('Daily rewards data refreshed!', {
        position: "top-right",
        autoClose: 2000
      });
    } catch (error) {
      console.error('Error refreshing daily rewards data:', error);
      toast.error('Failed to refresh daily rewards data', {
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };
    // Load user daily rewards data from the database
  useEffect(() => {
    const fetchDailyRewardsData = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        console.log('Current userId from localStorage:', userId);
        console.log('All localStorage keys:', Object.keys(localStorage));
        
        if (!userId) {
          console.error('User ID not found in localStorage');
          // For testing purposes, let's use user ID 1
          console.log('Using fallback user ID 1 for testing');
          localStorage.setItem('userId', '1');
        }
        
        const actualUserId = userId || '1';
        console.log('Fetching daily rewards for userId:', actualUserId);
        const response = await getUserDailyRewards(actualUserId);
        console.log('Daily rewards API response structure:', response);
        
        // Handle different response structures
        let data;
        if (response && response.success === true && response.data) {
          console.log('Using standard API response structure with data property');
          data = response.data;
        } else if (response && response.success === false) {
          console.error('API returned error:', response);
          throw new Error(response.message || 'Failed to fetch daily rewards');
        } else {
          console.log('Using direct response data structure');
          data = response;
        }
        
        // Log the data structure for debugging
        console.log('Parsed daily rewards data:', data);
        console.log('streak_count value:', data.streak_count);
        console.log('current_day value:', data.current_day);
        
        // Update state with the data fields explicitly
        setActiveDay(data.current_day !== undefined ? data.current_day : 1);
        setStreakCount(data.streak_count !== undefined ? data.streak_count : 0);
        setTotalClaimed(data.total_claimed !== undefined ? data.total_claimed : 0);
        setLastClaimDate(data.last_claimed_date || null);
        setCanClaimToday(data.canClaimToday !== undefined ? data.canClaimToday : true);
        setNextClaimInfo(data.nextClaimInfo || null);
        
        // If there's next claim info, set the formatted countdown
        if (data.nextClaimInfo) {
          setClaimCountdown(formatNextClaimTime(data.nextClaimInfo));
        }      } catch (error) {
        console.error('Error fetching daily rewards data:', error);
        toast.error('Failed to load daily rewards data. Please try refreshing.', {
          position: "top-right",
          autoClose: 5000
        });
        // Set default values in case of error
        setActiveDay(1);
        setStreakCount(0);
        setTotalClaimed(0);
        setCanClaimToday(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDailyRewardsData();
  }, []); // Empty dependency array to run only once

  // Set up interval to update claim countdown
  useEffect(() => {
    if (!nextClaimInfo) return;
    
    const countdownInterval = setInterval(() => {
      // Recalculate time remaining
      const now = new Date();
      const nextClaimTime = new Date(nextClaimInfo.nextClaimTime);
      const timeRemaining = nextClaimTime - now;
      
      if (timeRemaining <= 0) {
        // Time's up, user can claim now
        setCanClaimToday(true);
        setNextClaimInfo(null);
        setClaimCountdown(null);
        
        // Notify user
        toast.info("Your daily reward is ready to claim!", {
          position: "top-right",
          autoClose: 5000
        });
      } else {
        // Update countdown
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
        
        setClaimCountdown(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    
    // Clean up interval on component unmount
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [nextClaimInfo]);

  // Periodically highlight next reward to catch user's attention
  useEffect(() => {
    if (!canClaimToday) {
      const highlightInterval = setInterval(() => {
        setNextRewardHighlight(prev => !prev);
      }, 3000);
      
      return () => clearInterval(highlightInterval);
    }
  }, [canClaimToday]);

  // Check if the reward can be claimed (once per day)
  const canClaim = () => {
    return canClaimToday;
  };
    // Handle the claim button click
  const handleClaimReward = async () => {
    if (!canClaim()) return;
    
    setClaiming(true);
    
    try {
      const userId = localStorage.getItem('userId') || '1';
      
      // Get the current reward
      const currentReward = dailyRewards[activeDay - 1];
      
      console.log('Claiming reward for day:', activeDay, 'of type:', currentReward.type, 'amount:', currentReward.amount);
      console.log('Current streak before claiming:', streakCount);
      
      // Call the service to claim the reward
      const result = await claimDailyReward(
        userId, 
        activeDay, 
        currentReward.type, 
        currentReward.amount
      );
      
      console.log('Claim reward API response:', result);
      
      // Check if streak was reset
      if (result.data?.streakWasReset) {
        toast.warning(result.data.message || "Your streak was reset because you missed a day.", {
          position: "top-right",
          autoClose: 5000
        });
      }
      
      // Set claim as complete and disable the button
      setCanClaimToday(false);
      
      // Update data based on the response from the backend
      if (result.data) {
        console.log('Updating state with backend data from claim:', result.data);
        console.log('Backend streak_count:', result.data.streak_count);
        console.log('Backend nextDay:', result.data.nextDay);
        
        // Set next claim info if provided
        if (result.data.nextClaimInfo) {
          setNextClaimInfo(result.data.nextClaimInfo);
          setClaimCountdown(formatNextClaimTime(result.data.nextClaimInfo));
        } else {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          
          setNextClaimInfo({
            hoursRemaining: 24,
            minutesRemaining: 0,
            nextClaimTime: tomorrow.toISOString()
          });
        }
        
        // Update streak count from response
        if (result.data.streak_count !== undefined) {
          console.log('Setting streak count to:', result.data.streak_count);
          setStreakCount(result.data.streak_count);
        } else {
          console.log('Backend did not provide streak_count, incrementing locally');
          setStreakCount(prev => prev + 1);
        }
        
        // Update total claimed from response
        if (result.data.total_claimed !== undefined) {
          setTotalClaimed(result.data.total_claimed);
        } else {
          setTotalClaimed(prev => prev + 1);
        }
        
        // Update active day (next day in the cycle)
        const newDay = result.data.nextDay || (activeDay === 7 ? 1 : activeDay + 1);
        setActiveDay(newDay);
        
        // Update last claimed date
        const today = new Date().toISOString().split('T')[0];
        setLastClaimDate(result.data.last_claimed_date || today);
      }
      
      // After updating based on response, fetch fresh data to ensure consistency
      setTimeout(() => {
        refreshDailyRewardsData();
      }, 1000);
      
      // Show success notification
      toast.success(
        `Daily reward claimed: ${currentReward.amount} ${
          currentReward.type === 'gold' ? 'Gold' : 'Diamonds'
        }!`,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      
      setClaiming(false);
      setClaimComplete(true);
      
      // Reset claim complete animation after a delay
      setTimeout(() => {
        setClaimComplete(false);
      }, 3000);
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      setClaiming(false);
      
      // Extract detailed error message if available
      const errorMessage = error.response?.data?.message || 'Failed to claim daily reward';
      const nextClaimInfo = error.response?.data?.nextClaimInfo;
      
      if (nextClaimInfo) {
        setNextClaimInfo(nextClaimInfo);
      }
      
      // Show error notification
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  return (
    <div className="home-daily">
      <Topbar />
      <div className="main-content">
        <Sidebar />
        <div className="daily-rewards-container">
          <div className="daily-header">
            <button className="back-button" onClick={() => navigate('/main')}>
              <FaChevronLeft /> Back to Home
            </button>
            <h1>Daily Rewards</h1>
            <div className="daily-header-actions">
              <div className="daily-streak">
                <FaCalendarCheck />
                <span>Current Streak: <strong>{streakCount || 0} Days</strong></span>
              </div>
              <button 
                className="refresh-button" 
                onClick={refreshDailyRewardsData} 
                disabled={loading}
              >
                <FaSyncAlt className={loading ? 'spin' : ''} /> {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="rewards-content">
              <div className="rewards-info">
                <h2>Streak: {streakCount} day{streakCount !== 1 ? 's' : ''}</h2>
                <h2>Total Claimed: {totalClaimed}</h2>
                <h2>Last Claimed: {lastClaimDate ? new Date(lastClaimDate).toLocaleDateString() : 'Never'}</h2>
              </div>
              
              <div className="rewards-grid">
                {dailyRewards.map((reward, index) => {
                  const isActive = activeDay === reward.day;
                  const isClaimed = !canClaimToday && index < activeDay - 1;
                  const isNext = canClaimToday && index === activeDay;
                  
                  return (
                    <div
                      key={reward.day}
                      className={`reward-card ${isActive ? 'active' : ''} ${isClaimed ? 'claimed' : ''} ${isNext ? 'next' : ''}`}
                      onClick={() => {
                        if (isActive && canClaimToday) {
                          handleClaimReward();
                        }
                      }}
                    >
                      <div className="reward-icon">
                        {reward.icon}
                      </div>
                      <div className="reward-details">
                        <h3>Day {reward.day}</h3>
                        <p>{reward.amount} {reward.type === 'gold' ? 'Gold' : 'Diamonds'}</p>
                      </div>
                      {isActive && canClaimToday && (
                        <div className="claim-button">
                          {claiming ? <FaSyncAlt className="spinner" /> : <FaCheck />}
                        </div>
                      )}
                      {isClaimed && (
                        <div className="claimed-overlay">
                          <FaTrophy />
                        </div>
                      )}
                      {isNext && !claiming && (
                        <div className="next-reward-highlight">
                          <FaArrowRight />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="next-claim-info">
                {canClaimToday ? (
                  <p>Claim your reward for today!</p>
                ) : (
                  <p>
                    Next claim in: <strong>{claimCountdown}</strong>
                  </p>
                )}
              </div>
              
              <button className="refresh-button" onClick={refreshDailyRewardsData}>
                <FaSyncAlt />
                Refresh Rewards
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeDaily;
