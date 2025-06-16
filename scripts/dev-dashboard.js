#!/usr/bin/env node
/**
 * Enhanced Terminal Dashboard for Pixmon MMO Development
 * 
 * This script provides an improved developer experience with:
 * - Clear separation between backend and frontend logs
 * - Better error visibility with color-coding
 * - Process monitoring via PM2
 * - Clean terminal UI
 */

const pm2 = require('pm2');
const chalk = require('chalk');
const boxen = require('boxen');
const logUpdate = require('log-update');
const path = require('path');

// Dashboard configuration
const DASHBOARD_UPDATE_INTERVAL = 1000; // 1 second update interval
const ERROR_HISTORY_SIZE = 5; // How many recent errors to keep
let backendLogs = [];
let frontendLogs = [];
let errorLogs = [];
let backendReady = false;
let frontendReady = false;

// Initialize the terminal
console.clear();
console.log(boxen(chalk.bold.cyan('PIXMON MMO DEV DASHBOARD'), {
  padding: 1,
  margin: 1,
  borderStyle: 'double',
  borderColor: 'cyan'
}));

console.log(chalk.yellow('➡️ Initializing development environment...\n'));

// Dashboard state
const state = {
  backend: {
    status: 'initializing',
    memory: 'N/A',
    cpu: 'N/A',
    url: 'http://localhost:5000',
    logs: []
  },
  frontend: {
    status: 'initializing',
    memory: 'N/A',
    cpu: 'N/A',
    url: 'http://localhost:5173',
    logs: []
  },
  errors: []
};

// Start PM2 processes
pm2.connect((err) => {
  if (err) {
    console.error(chalk.red.bold('Error connecting to PM2:'), err);
    process.exit(1);
  }

  // Start Backend
  pm2.start({
    name: 'backend',
    script: path.join(process.cwd(), 'backend', 'server.js'),
    watch: ['backend/**/*.js'],
    ignore_watch: ['node_modules', 'frontend'],
    autorestart: true,
    max_memory_restart: '500M'
  }, (err) => {
    if (err) {
      console.error(chalk.red.bold('Failed to start backend:'), err);
      return;
    }
    
    // Start Frontend
    pm2.start({
      name: 'frontend',
      script: 'npm',
      args: 'run dev',
      cwd: path.join(process.cwd(), 'frontend'),
      watch: false, // Vite already has hot reloading
      autorestart: true,
      max_memory_restart: '500M'
    }, (err) => {
      if (err) {
        console.error(chalk.red.bold('Failed to start frontend:'), err);
        return;
      }
      
      // Start monitoring logs and status
      startMonitoring();
    });
  });
});

function startMonitoring() {
  // Stream logs
  pm2.launchBus((err, bus) => {
    if (err) {
      console.error(chalk.red.bold('Failed to get PM2 log bus:'), err);
      return;
    }

    bus.on('log:out', (packet) => {
      const { process, data } = packet;
      const logEntry = `${data.trim()}`;
      
      if (process.name === 'backend') {
        // Parse backend logs
        if (logEntry.includes('🎉 BACKEND API READY')) {
          backendReady = true;
          state.backend.status = 'online';
        }
        
        state.backend.logs.unshift(logEntry);
        if (state.backend.logs.length > 10) state.backend.logs.pop();
      } 
      else if (process.name === 'frontend') {
        // Parse frontend logs
        if (logEntry.includes('Local:') && logEntry.includes('http://localhost:')) {
          frontendReady = true;
          state.frontend.status = 'online';
          
          // Extract the actual URL if it's different from the default
          const match = logEntry.match(/http:\/\/localhost:[0-9]+/);
          if (match) {
            state.frontend.url = match[0];
          }
        }
        
        state.frontend.logs.unshift(logEntry);
        if (state.frontend.logs.length > 10) state.frontend.logs.pop();
      }
      
      updateDashboard();
    });

    bus.on('log:err', (packet) => {
      const { process, data } = packet;
      const logEntry = `${data.trim()}`;
      
      // Add to process-specific logs
      if (process.name === 'backend') {
        state.backend.logs.unshift(chalk.red(logEntry));
        if (state.backend.logs.length > 10) state.backend.logs.pop();
      } else if (process.name === 'frontend') {
        state.frontend.logs.unshift(chalk.red(logEntry));
        if (state.frontend.logs.length > 10) state.frontend.logs.pop();
      }
      
      // Add to error log
      state.errors.unshift(`[${process.name}] ${logEntry}`);
      if (state.errors.length > ERROR_HISTORY_SIZE) state.errors.pop();
      
      updateDashboard();
    });
  });

  // Get process metrics periodically
  setInterval(() => {
    pm2.list((err, list) => {
      if (err) return;
      
      list.forEach((proc) => {
        if (proc.name === 'backend') {
          state.backend.memory = formatMemory(proc.monit?.memory || 0);
          state.backend.cpu = `${proc.monit?.cpu || 0}%`;
          state.backend.status = proc.pm2_env?.status || 'unknown';
        } 
        else if (proc.name === 'frontend') {
          state.frontend.memory = formatMemory(proc.monit?.memory || 0);
          state.frontend.cpu = `${proc.monit?.cpu || 0}%`;
          state.frontend.status = proc.pm2_env?.status || 'unknown';
        }
      });
      
      updateDashboard();
    });
  }, DASHBOARD_UPDATE_INTERVAL);
}

function formatMemory(bytes) {
  return `${Math.round(bytes / (1024 * 1024) * 10) / 10} MB`;
}

function updateDashboard() {
  // Clear the terminal
  logUpdate.clear();
  
  const backendStatus = state.backend.status === 'online' 
    ? chalk.green('✅ ONLINE')
    : chalk.yellow('⏳ STARTING');
    
  const frontendStatus = state.frontend.status === 'online'
    ? chalk.green('✅ ONLINE') 
    : chalk.yellow('⏳ STARTING');
  
  // Header section
  let output = boxen(chalk.bold.cyan('PIXMON MMO DEV DASHBOARD'), {
    padding: 1,
    margin: {top: 0, bottom: 1, left: 1, right: 1},
    borderStyle: 'double',
    borderColor: 'cyan'
  });

  // Backend & Frontend status section
  output += '\n' + boxen(
    `${chalk.magenta.bold('BACKEND API')} ${backendStatus}\n` +
    `${chalk.cyan('URL:')} ${state.backend.url}\n` +
    `${chalk.cyan('Memory:')} ${state.backend.memory} | ${chalk.cyan('CPU:')} ${state.backend.cpu}\n\n` +
    
    `${chalk.blue.bold('FRONTEND')} ${frontendStatus}\n` +
    `${chalk.cyan('URL:')} ${state.frontend.url}\n` +
    `${chalk.cyan('Memory:')} ${state.frontend.memory} | ${chalk.cyan('CPU:')} ${state.frontend.cpu}`,
    {
      padding: 1,
      margin: {top: 0, bottom: 1, left: 1, right: 1},
      borderStyle: 'round',
      borderColor: 'gray',
      title: 'Services',
      titleAlignment: 'center'
    }
  );

  // Recent Errors section
  if (state.errors.length > 0) {
    const errorContent = state.errors
      .map(err => chalk.red(`• ${err}`))
      .join('\n');
    
    output += '\n' + boxen(errorContent, {
      padding: 1,
      margin: {top: 0, bottom: 1, left: 1, right: 1},
      borderStyle: 'round',
      borderColor: 'red',
      title: '🔥 Recent Errors',
      titleAlignment: 'center'
    });
  }

  // Log outputs section
  const backendLogs = state.backend.logs
    .map((log, i) => `${i === 0 ? chalk.white('➤ ') : chalk.gray('  ')}${log}`)
    .join('\n');
    
  const frontendLogs = state.frontend.logs
    .map((log, i) => `${i === 0 ? chalk.white('➤ ') : chalk.gray('  ')}${log}`)
    .join('\n');
  
  output += '\n' + boxen(
    `${chalk.magenta.bold('Backend Logs:')}\n${backendLogs || chalk.gray('No recent logs')}\n\n` +
    `${chalk.blue.bold('Frontend Logs:')}\n${frontendLogs || chalk.gray('No recent logs')}`,
    {
      padding: 1,
      margin: {top: 0, bottom: 1, left: 1, right: 1},
      borderStyle: 'round',
      borderColor: 'gray',
      title: 'Recent Logs',
      titleAlignment: 'center'
    }
  );
  
  // Show ready message when both are online
  if (backendReady && frontendReady) {
    output += '\n' + boxen(
      chalk.green.bold('🎮 GAME READY! Open your browser at: ') + 
      chalk.cyan.bold(state.frontend.url),
      {
        padding: 1,
        margin: {top: 0, bottom: 1, left: 1, right: 1},
        borderStyle: 'round',
        borderColor: 'green',
        align: 'center'
      }
    );
  }
  
  // Help message at the bottom
  output += '\n' + chalk.gray('Press CTRL+C to stop all services');
  
  logUpdate(output);
}

// Handle shutdown
function cleanup() {
  console.log(chalk.yellow('\n\nShutting down development environment...'));
  pm2.delete('all', (err) => {
    pm2.disconnect();
    process.exit(err ? 1 : 0);
  });
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
