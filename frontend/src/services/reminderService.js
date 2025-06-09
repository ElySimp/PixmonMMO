/**
 * Reminder Service for Daily Rewards
 * This service manages notifications to remind users to claim their daily rewards
 */
import { toast } from 'react-toastify';

class ReminderService {
  constructor() {
    this.reminderActive = false;
    this.lastReminderDate = null;
    this.reminderId = null;
  }

  /**
   * Initialize the reminder service
   * @param {string} userId - The user ID
   * @param {Function} canClaimCallback - Callback function to check if user can claim
   */
  init(userId, canClaimCallback) {
    // Clear any existing reminders
    this.clearReminders();
    
    // Check if we should schedule reminders
    this.shouldScheduleReminder(userId).then(shouldSchedule => {
      if (shouldSchedule) {
        this.scheduleReminder(userId, canClaimCallback);
      }
    });
    
    // Listen for page visibility changes to show reminders when user returns
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.reminderActive) {
        canClaimCallback().then(canClaim => {
          if (canClaim) {
            this.showReminder();
          } else {
            this.clearReminders();
          }
        });
      }
    });
  }
  
  /**
   * Check if we should schedule a reminder
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>} Whether to schedule a reminder
   */
  async shouldScheduleReminder(userId) {
    // Get user preference for reminders
    let reminderPref = localStorage.getItem(`reminder_pref_${userId}`);
    
    if (reminderPref === null) {
      // Default to true if not set
      reminderPref = 'true';
      localStorage.setItem(`reminder_pref_${userId}`, reminderPref);
    }
    
    return reminderPref === 'true';
  }
  
  /**
   * Schedule a reminder based on user's activity patterns
   * @param {string} userId - The user ID
   * @param {Function} canClaimCallback - Callback function to check if user can claim
   */
  scheduleReminder(userId, canClaimCallback) {
    // Cancel any existing reminder
    this.clearReminders();
    
    // Check login patterns to set optimal reminder time
    const loginTimes = JSON.parse(localStorage.getItem(`login_times_${userId}`) || '[]');
    
    // Get the current time
    const now = new Date();
    const currentHour = now.getHours();
    
    // Default reminder delay (4 hours)
    let reminderDelay = 4 * 60 * 60 * 1000;
    
    if (loginTimes.length > 0) {
      // Calculate average login time
      const avgLoginHour = this.calculateAverageLoginTime(loginTimes);
      
      if (currentHour < avgLoginHour) {
        // If current time is before average login time, schedule for average time
        const msUntilAvgTime = (avgLoginHour - currentHour) * 60 * 60 * 1000;
        reminderDelay = Math.min(msUntilAvgTime, reminderDelay);
      }
    }
    
    // Set a reminder
    this.reminderId = setTimeout(() => {
      // Check if the user can still claim
      canClaimCallback().then(canClaim => {
        if (canClaim) {
          this.showReminder();
          this.reminderActive = true;
          this.lastReminderDate = new Date();
        }
      });
    }, reminderDelay);
    
    // Set another reminder for end of day (if haven't claimed)
    const endOfDay = new Date();
    endOfDay.setHours(22, 0, 0, 0);
    const msUntilEndOfDay = endOfDay - now;
    
    if (msUntilEndOfDay > 0) {
      setTimeout(() => {
        // Only show if haven't reminded in last 3 hours
        const threeHoursAgo = new Date();
        threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
        
        if (!this.lastReminderDate || this.lastReminderDate < threeHoursAgo) {
          canClaimCallback().then(canClaim => {
            if (canClaim) {
              this.showReminder('Don\'t forget to claim your daily reward before the day ends!');
              this.reminderActive = true;
              this.lastReminderDate = new Date();
            }
          });
        }
      }, msUntilEndOfDay);
    }
  }
  
  /**
   * Calculate average login time from history
   * @param {Array} loginTimes - Array of login timestamps
   * @returns {number} Average login hour (0-23)
   */
  calculateAverageLoginTime(loginTimes) {
    // Take most recent 7 days
    const recentLogins = loginTimes.slice(-7);
    
    // Extract hours
    const loginHours = recentLogins.map(time => new Date(time).getHours());
    
    // Calculate average
    const sum = loginHours.reduce((a, b) => a + b, 0);
    return Math.round(sum / loginHours.length) || 12; // Default to noon if no data
  }
  
  /**
   * Show a reminder notification
   * @param {string} message - Custom message to show
   */
  showReminder(message = 'Your daily reward is waiting for you! Claim it now to continue your streak!') {
    toast.info(message, {
      position: "top-right",
      autoClose: 10000, // 10 seconds
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      onClick: () => {
        // Navigate to daily rewards page if user clicks on toast
        window.location.href = '/daily';
      },
      icon: "🎁"
    });
  }
  
  /**
   * Clear all scheduled reminders
   */
  clearReminders() {
    if (this.reminderId) {
      clearTimeout(this.reminderId);
      this.reminderId = null;
    }
    this.reminderActive = false;
  }
  
  /**
   * Update user login time for pattern analysis
   * @param {string} userId - The user ID
   */
  recordLoginTime(userId) {
    const loginTimes = JSON.parse(localStorage.getItem(`login_times_${userId}`) || '[]');
    loginTimes.push(new Date().toISOString());
    
    // Keep only last 30 login times
    while (loginTimes.length > 30) {
      loginTimes.shift();
    }
    
    localStorage.setItem(`login_times_${userId}`, JSON.stringify(loginTimes));
  }
  
  /**
   * Toggle reminder preferences
   * @param {string} userId - The user ID
   * @returns {boolean} New preference state
   */
  toggleReminderPreference(userId) {
    const currentPref = localStorage.getItem(`reminder_pref_${userId}`) === 'true';
    const newPref = !currentPref;
    
    localStorage.setItem(`reminder_pref_${userId}`, newPref.toString());
    
    if (!newPref) {
      this.clearReminders();
    }
    
    return newPref;
  }
}

export default new ReminderService();
