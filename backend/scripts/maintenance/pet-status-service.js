/**
 * Pet status background service
 * 
 * This service runs in the background and periodically updates pet statuses.
 * It can be started with the server or as a standalone process.
 */

const { updatePetStatuses } = require('./pet-status-update');

// Configuration
const UPDATE_INTERVAL_MS = 60000; // 1 minute interval (60,000 ms)

// Start the background service
function startPetStatusService() {
    console.log(`Starting pet status background service (interval: ${UPDATE_INTERVAL_MS}ms)...`);
    
    // Initial run
    updatePetStatuses()
        .then(() => console.log('Initial pet status update completed'))
        .catch(err => console.error('Error in initial pet status update:', err));
    
    // Set up interval for future updates
    const intervalId = setInterval(async () => {
        try {
            await updatePetStatuses();
            console.log(`Pet status update completed at ${new Date().toISOString()}`);
        } catch (error) {
            console.error('Error in pet status update interval:', error);
        }
    }, UPDATE_INTERVAL_MS);
    
    // Handle service shutdown
    process.on('SIGINT', () => {
        console.log('Stopping pet status background service...');
        clearInterval(intervalId);
        process.exit(0);
    });
    
    return intervalId;
}

// If this script is run directly
if (require.main === module) {
    startPetStatusService();
    console.log('Pet status background service started in standalone mode');
} else {
    // Export for use in other modules
    module.exports = { startPetStatusService };
}
