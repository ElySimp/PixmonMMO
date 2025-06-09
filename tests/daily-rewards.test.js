const DailyRewards = require('../backend/models/DailyRewards');
const db = require('../backend/config/database');

// Mock the database module
jest.mock('../backend/config/database', () => ({
  query: jest.fn()
}));

describe('DailyRewards Model', () => {
  let mockUserId;
  
  beforeEach(() => {
    mockUserId = 123;
    jest.clearAllMocks();
  });
  
  test('createTable should execute the correct SQL query', async () => {
    // Setup mock implementation
    db.query.mockResolvedValueOnce([]);
    
    // Execute the method
    await DailyRewards.createTable();
    
    // Assert
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS DailyRewards');
  });
  
  test('getUserDailyRewards should return user rewards data', async () => {
    // Setup mock implementations
    const mockRewardsData = {
      current_day: 3,
      streak_count: 5,
      total_claimed: 15,
      last_claimed_date: '2025-06-07'
    };
    
    db.query.mockImplementation((query, params) => {
      if (query.includes('SELECT 1 FROM DailyRewards')) {
        return [[{ 1: 1 }]]; // User exists
      } else if (query.includes('SELECT current_day')) {
        return [[mockRewardsData]]; // Return rewards data
      }
      return [[]];
    });
    
    // Execute the method
    const result = await DailyRewards.getUserDailyRewards(mockUserId);
    
    // Assert
    expect(result).toEqual(mockRewardsData);
    expect(db.query).toHaveBeenCalledTimes(2);
  });
  
  test('claimDailyReward should update user rewards correctly', async () => {
    // Setup test data
    const dayCompleted = 3;
    const newDay = 4;
    const rewardType = 'gold';
    const rewardAmount = 500;
    const mockDate = '2025-06-08';
    
    // Setup mock implementations
    db.query.mockImplementation((query, params) => {
      if (query.includes('SELECT last_claimed_date')) {
        return [[{ last_claimed_date: '2025-06-07' }]]; // Last claimed yesterday
      } else if (query.includes('UPDATE DailyRewards')) {
        return [{ affectedRows: 1 }]; // Update successful
      }
      return [[]];
    });
    
    // Execute the method
    const result = await DailyRewards.claimDailyReward(
      mockUserId, 
      dayCompleted, 
      newDay, 
      rewardType, 
      rewardAmount
    );
    
    // Assert
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('dayCompleted', dayCompleted);
    expect(result.reward).toEqual({ type: rewardType, amount: rewardAmount });
    expect(result).toHaveProperty('nextDay', newDay);
    expect(db.query).toHaveBeenCalledTimes(2);
  });
  
  test('checkAndResetStreak should reset streak if more than one day passed', async () => {
    // Setup test data - last claimed was 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const formattedDate = twoDaysAgo.toISOString().split('T')[0];
    
    // Setup mock implementations
    db.query.mockImplementation((query, params) => {
      if (query.includes('SELECT last_claimed_date')) {
        return [[{ last_claimed_date: formattedDate }]]; // Last claimed 2 days ago
      } else if (query.includes('UPDATE DailyRewards')) {
        return [{ affectedRows: 1 }]; // Update successful
      }
      return [[]];
    });
    
    // Execute the method
    const result = await DailyRewards.checkAndResetStreak(mockUserId);
    
    // Assert
    expect(result).toBe(true); // Streak should be reset
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query.mock.calls[1][0]).toContain('current_day = 1');
    expect(db.query.mock.calls[1][0]).toContain('streak_count = 0');
  });
  
  test('checkAndResetStreak should not reset streak if only one day passed', async () => {
    // Setup test data - last claimed was yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toISOString().split('T')[0];
    
    // Setup mock implementations
    db.query.mockImplementation((query, params) => {
      if (query.includes('SELECT last_claimed_date')) {
        return [[{ last_claimed_date: formattedDate }]]; // Last claimed yesterday
      }
      return [[]];
    });
    
    // Execute the method
    const result = await DailyRewards.checkAndResetStreak(mockUserId);
    
    // Assert
    expect(result).toBe(false); // Streak should not be reset
    expect(db.query).toHaveBeenCalledTimes(1); // Only one query should be executed
  });
});
