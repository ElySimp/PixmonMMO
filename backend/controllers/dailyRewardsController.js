const Player = require('../models/Player');

const calculateTimeUntilNextClaim = (lastClaimedDate) => {
    if (!lastClaimedDate) return { canClaimNow: true };

    const now = new Date();
    const lastClaimed = new Date(lastClaimedDate);

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

    if (today > lastClaimedDay) {
        return { canClaimNow: true };
    }

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

exports.getUserDailyRewards = async (req, res) => {
    try {
        const { userId } = req.params;
        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }, { username: userId }]
        });

        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        const daily = player.dailyRewards || {};
        const timeUntilNextClaim = calculateTimeUntilNextClaim(daily.lastClaimedDate || daily.last_claimed_date);

        res.json({
            success: true,
            data: {
                user_id: player.id || player._id.toString(),
                current_day: daily.currentDay || daily.current_day || 1,
                streak_count: daily.streakCount || daily.streak_count || 0,
                total_claimed: daily.totalClaimed || daily.total_claimed || 0,
                last_claimed_date: daily.lastClaimedDate || daily.last_claimed_date,
                canClaimToday: timeUntilNextClaim.canClaimNow,
                nextClaimInfo: timeUntilNextClaim.canClaimNow ? null : {
                    hoursRemaining: timeUntilNextClaim.hoursRemaining,
                    minutesRemaining: timeUntilNextClaim.minutesRemaining,
                    nextClaimTime: timeUntilNextClaim.nextClaimTime
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.claimDailyReward = async (req, res) => {
    try {
        const { userId } = req.params;
        const { dayCompleted, rewardType, rewardAmount } = req.body;

        const player = await Player.findOne({
            $or: [{ _id: userId }, { id: String(userId) }, { username: userId }]
        });

        if (!player) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        if (!player.dailyRewards) {
            player.dailyRewards = { currentDay: 1, streakCount: 0, totalClaimed: 0 };
        }

        const now = new Date();
        const timeUntilNextClaim = calculateTimeUntilNextClaim(player.dailyRewards.lastClaimedDate);

        if (!timeUntilNextClaim.canClaimNow) {
            return res.status(400).json({
                success: false,
                message: `You've already claimed today's reward. Come back tomorrow.`
            });
        }

        const newDay = (dayCompleted >= 7) ? 1 : dayCompleted + 1;
        player.dailyRewards.currentDay = newDay;
        player.dailyRewards.current_day = newDay;
        player.dailyRewards.streakCount = (player.dailyRewards.streakCount || 0) + 1;
        player.dailyRewards.streak_count = player.dailyRewards.streakCount;
        player.dailyRewards.totalClaimed = (player.dailyRewards.totalClaimed || 0) + 1;
        player.dailyRewards.total_claimed = player.dailyRewards.totalClaimed;
        player.dailyRewards.lastClaimedDate = now;
        player.dailyRewards.last_claimed_date = now.toISOString().split('T')[0];

        if (rewardType === 'gold') {
            player.gold = (player.gold || 0) + (rewardAmount || 0);
        } else if (rewardType === 'diamond') {
            player.diamonds = (player.diamonds || 0) + (rewardAmount || 0);
        }

        await player.save();

        res.json({
            success: true,
            message: `Daily reward for day ${dayCompleted} claimed successfully!`,
            data: {
                current_day: newDay,
                streak_count: player.dailyRewards.streakCount,
                total_claimed: player.dailyRewards.totalClaimed,
                nextDay: newDay
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.initDailyRewardsTable = async (req, res) => {
    res.json({ success: true, message: 'Daily rewards initialized successfully' });
};
