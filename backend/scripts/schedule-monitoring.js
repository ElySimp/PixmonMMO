// Schedule UserStats monitoring to run periodically
const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');

// Function to run the monitoring script
function runMonitoringScript() {
  console.log(`Running UserStats monitoring at ${new Date().toISOString()}`);
  
  const monitorScript = path.join(__dirname, 'monitor-userstats.js');
  const child = spawn('node', [monitorScript], { 
    stdio: 'inherit',
    shell: true
  });
  
  child.on('close', (code) => {
    console.log(`UserStats monitoring completed with code ${code}`);
  });
}

// Schedule to run daily at midnight
// Use this when importing the script in server.js
function scheduleMonitoring() {
  // Schedule to run daily at midnight
  cron.schedule('0 0 * * *', runMonitoringScript, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('UserStats monitoring scheduled to run daily at midnight UTC');
}

// If this script is run directly, run the monitoring immediately
if (require.main === module) {
  runMonitoringScript();
} else {
  // Export the scheduling function
  module.exports = scheduleMonitoring;
}
