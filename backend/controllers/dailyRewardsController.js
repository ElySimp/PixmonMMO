const DailyRewards = require('../models/DailyRewards');
const User = require('../models/User');

// Helper function to calculate time until next claim
const calculateTimeUntilNextClaim = (lastClaimedDate) => {
    if (!lastClaimedDate) return { canClaimNow: true };
    
    const now = new Date();
    const lastClaimed = new Date(lastClaimedDate);
    
    // Reset hours to compare just the dates
    const lastClaimedDay = new Date(
        lastClaimed.getFullYear(),
        lastClaimed.getMonth(),
        lastClaimed.getDate()
    );
    
    const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );
    
    // If dates are different, claim is available
    if (today > lastClaimedDay) {
        return { canClaimNow: true };
    }
    
    // Calculate time remaining until midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeRemaining = tomorrow - now;
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
        canClaimNow: false,
        hoursRemaining: hours,
        minutesRemaining: minutes,
        nextClaimTime: tomorrow.toISOString()
    };
};

// Get the user's daily rewards data
exports.getUserDailyRewards = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Check if streak was broken and reset if needed
        await DailyRewards.checkAndResetStreak(userId);
        
        // Get the daily rewards data
        const dailyRewardsData = await DailyRewards.getUserDailyRewards(userId);
        
        // Add time until next claim information
        const timeUntilNextClaim = calculateTimeUntilNextClaim(dailyRewardsData.last_claimed_date);
        
        res.json({
            success: true,
            data: {
                ...dailyRewardsData,
                canClaimToday: timeUntilNextClaim.canClaimNow,
                nextClaimInfo: timeUntilNextClaim.canClaimNow ? null : {
                    hoursRemaining: timeUntilNextClaim.hoursRemaining,
                    minutesRemaining: timeUntilNextClaim.minutesRemaining,
                    nextClaimTime: timeUntilNextClaim.nextClaimTime
                }
            }
        });
    } catch (error) {
        console.error('Error getting daily rewards:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error retrieving daily rewards'
        });
    }
};

// Claim daily reward
exports.claimDailyReward = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { dayCompleted, rewardType, rewardAmount } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        if (!dayCompleted || !rewardType || !rewardAmount) {
            return res.status(400).json({
                success: false,
                message: 'Day completed, reward type, and reward amount are required'
            });
        }
        
        // Validate reward types
        if (!['gold', 'diamond'].includes(rewardType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reward type. Must be "gold" or "diamond".'
            });
        }
        
        // Check if streak was broken (this also resets streak if needed)
        const streakWasReset = await DailyRewards.checkAndResetStreak(userId);
        
        // Get current user data to verify day
        const userData = await DailyRewards.getUserDailyRewards(userId);
        
        // Validate the day being claimed matches the expected day
        if (userData.current_day !== dayCompleted) {
            return res.status(400).json({
                success: false,
                message: 'Invalid day being claimed. Please refresh and try again.'
            });
        }
        
        // Calculate next day (1-7 cycle)
        const newDay = dayCompleted >= 7 ? 1 : dayCompleted + 1;
        
        // Claim the reward
        const result = await DailyRewards.claimDailyReward(userId, dayCompleted, newDay, rewardType, rewardAmount);
        
        // Update user stats based on the reward type
        if (rewardType === 'gold') {
            await User.updateStats(userId, 0, rewardAmount);
        } else if (rewardType === 'diamond') {
            await User.updateDiamonds(userId, rewardAmount);
        }
        
        // Add streak reset information if applicable
        if (streakWasReset) {
            result.streakWasReset = true;
            result.message = 'Your streak was reset because you missed a day. Starting a new streak!';
        }

        // Get the updated user data to calculate next claim info and provide current state
        const updatedUserData = await DailyRewards.getUserDailyRewards(userId); // Re-fetch to get the new last_claimed_date and other data
        const timeUntilNextClaim = calculateTimeUntilNextClaim(updatedUserData.last_claimed_date);

        result.nextClaimInfo = { 
            hoursRemaining: timeUntilNextClaim.hoursRemaining,
            minutesRemaining: timeUntilNextClaim.minutesRemaining,
            nextClaimTime: timeUntilNextClaim.nextClaimTime
        };
        result.streak_count = updatedUserData.streak_count;
        result.total_claimed = updatedUserData.total_claimed;
        // The model already includes nextDay (which is the new current_day) in 'result'
        
        res.json({
            success: true,
            message: `Daily reward for day ${dayCompleted} claimed successfully!`,
            data: result // 'result' now contains model's response + streakWasReset info + nextClaimInfo + updated counts
        });
    } catch (error) {
        console.error('Error claiming daily reward:', error);
        
        // Handle specific error cases
        if (error.message === 'Daily reward already claimed today') {
            // Calculate time until next claim
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const timeRemaining = tomorrow - now;
            const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            
            return res.status(400).json({
                success: false,
                message: `You've already claimed today's reward. Come back in ${hours}h ${minutes}m.`,
                nextClaimInfo: {
                    hoursRemaining: hours,
                    minutesRemaining: minutes,
                    nextClaimTime: tomorrow.toISOString()
                }
            });
        }
        
        res.status(error.message === 'Daily reward already claimed today' ? 400 : 500).json({
            success: false,
            message: error.message || 'Error claiming daily reward'
        });
    }
};

// Initialize the DailyRewards table
exports.initDailyRewardsTable = async (req, res) => {
    try {
        await DailyRewards.createTable();
        
        res.json({
            success: true,
            message: 'Daily rewards table initialized successfully'
        });
    } catch (error) {
        console.error('Error initializing daily rewards table:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error initializing daily rewards table'
        });
    }
};
