const colors = require('colors');

// Configure colors theme
colors.setTheme({
  success: 'green',
  info: 'cyan', 
  warning: 'yellow',
  error: 'red',
  debug: 'grey',
  server: 'magenta',
  database: 'blue',
  auth: 'green',
  route: 'cyan'
});

class Logger {
  constructor() {
    this.startTime = Date.now();
    this.initSteps = [];
    this.currentStep = 0;
    this.totalSteps = 0;
    
    // Set logging levels based on environment
    this.logLevel = this.getLogLevel();
    this.LOG_LEVELS = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      VERBOSE: 4
    };
  }

  // Determine log level based on environment
  getLogLevel() {
    const env = process.env.NODE_ENV || 'development';
    const customLevel = process.env.LOG_LEVEL;
    
    if (customLevel) {
      return customLevel.toUpperCase();
    }
    
    switch (env) {
      case 'production':
        return 'INFO';
      case 'development':
        return 'INFO'; // Changed from DEBUG to INFO for cleaner output
      case 'test':
        return 'WARN';
      default:
        return 'INFO';
    }
  }

  // Check if message should be logged based on level
  shouldLog(messageLevel) {
    return this.LOG_LEVELS[messageLevel] <= this.LOG_LEVELS[this.logLevel];
  }

  // Get timestamp
  getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Get elapsed time since server start
  getElapsedTime() {
    const elapsed = Date.now() - this.startTime;
    const seconds = (elapsed / 1000).toFixed(1);
    return `${seconds}s`;
  }
  // Server startup banner
  serverStart(port) {
    console.log('\n' + '='.repeat(60).server);
    console.log('🚀 PIXMON MMO BACKEND API STARTING'.server.bold);
    console.log('='.repeat(60).server);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`.info);
    console.log(`🔧 Backend API Port: ${port}`.info);
    console.log(`🎮 Frontend Dev Server: http://localhost:5173 (when running)`.info);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`.info);
    console.log('='.repeat(60).server + '\n');
  }

  // Database initialization start
  dbInitStart(steps) {
    this.totalSteps = steps.length;
    this.initSteps = steps;
    this.currentStep = 0;
    
    console.log('📊 DATABASE INITIALIZATION'.database.bold);
    console.log('─'.repeat(40).database);
    console.log(`Total steps: ${this.totalSteps}`.info);
    console.log('');
  }

  // Database step progress
  dbStep(stepName, status = 'running') {
    const stepIndex = this.initSteps.indexOf(stepName);
    if (stepIndex !== -1) {
      this.currentStep = stepIndex + 1;
    }

    const progress = `[${this.currentStep}/${this.totalSteps}]`;
    const progressBar = this.getProgressBar(this.currentStep, this.totalSteps);
    
    if (status === 'running') {
      process.stdout.write(`${progress.info} ${progressBar} ${stepName}... `.database);
    } else if (status === 'success') {
      console.log('✅'.success);
    } else if (status === 'error') {
      console.log('❌'.error);
    }
  }

  // Database initialization complete
  dbInitComplete() {
    const elapsed = this.getElapsedTime();
    console.log('');
    console.log('✅ DATABASE INITIALIZATION COMPLETE'.success.bold);
    console.log(`⏱️  Total time: ${elapsed}`.info);
    console.log('─'.repeat(40).database + '\n');
  }

  // Progress bar
  getProgressBar(current, total, length = 20) {
    const filled = Math.round((current / total) * length);
    const empty = length - filled;
    return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
  }
  // Standard log levels
  info(message, category = 'INFO') {
    if (this.shouldLog('INFO')) {
      console.log(`[${this.getTimestamp()}] [${category.toUpperCase()}] ${message}`.info);
    }
  }

  success(message, category = 'SUCCESS') {
    if (this.shouldLog('INFO')) {
      console.log(`[${this.getTimestamp()}] [${category.toUpperCase()}] ${message}`.success);
    }
  }

  warning(message, category = 'WARNING') {
    if (this.shouldLog('WARN')) {
      console.log(`[${this.getTimestamp()}] [${category.toUpperCase()}] ${message}`.warning);
    }
  }

  error(message, category = 'ERROR', error = null) {
    if (this.shouldLog('ERROR')) {
      console.log(`[${this.getTimestamp()}] [${category.toUpperCase()}] ${message}`.error);
      if (error && this.shouldLog('DEBUG')) {
        console.log(`[${this.getTimestamp()}] [DEBUG] ${error.stack}`.debug);
      }
    }
  }

  debug(message, category = 'DEBUG') {
    if (this.shouldLog('DEBUG')) {
      console.log(`[${this.getTimestamp()}] [${category.toUpperCase()}] ${message}`.debug);
    }
  }

  // New verbose level for very detailed logging
  verbose(message, category = 'VERBOSE') {
    if (this.shouldLog('VERBOSE')) {
      console.log(`[${this.getTimestamp()}] [${category.toUpperCase()}] ${message}`.debug);
    }
  }

  // Game action logging (always shown but clean)
  gameAction(action, userId, details = '') {
    if (this.shouldLog('INFO')) {
      const user = userId ? `User ${userId}` : 'Unknown User';
      console.log(`🎮 ${action}: ${user} ${details}`.info);
    }
  }

  // API endpoint logging (minimal, clean format)
  api(method, endpoint, userId = null, status = 'success') {
    if (this.shouldLog('DEBUG')) {
      const userInfo = userId ? ` [User: ${userId}]` : '';
      const statusIcon = status === 'success' ? '✅' : '❌';
      console.log(`${statusIcon} ${method} ${endpoint}${userInfo}`.debug);
    }
  }
  // Server ready message
  serverReady(port) {
    console.log('🎉 BACKEND API READY'.success.bold);
    console.log('─'.repeat(30).success);
    console.log(`🔧 Backend API: http://localhost:${port}`.success);
    console.log(`🌍 Network:     http://0.0.0.0:${port}`.success);
    console.log(`🎮 Frontend:    http://localhost:5173 (run 'npm run dev' in frontend/)`.info);
    console.log(`⏱️  Startup time: ${this.getElapsedTime()}`.info);
    console.log('─'.repeat(30).success + '\n');
  }

  // Route registration
  routeRegistered(method, path, description = '') {
    const methodColor = {
      'GET': 'green',
      'POST': 'blue', 
      'PUT': 'yellow',
      'PATCH': 'cyan',
      'DELETE': 'red'
    };
    
    const coloredMethod = method[methodColor[method] || 'white'];
    console.log(`[${this.getTimestamp()}] [ROUTE] ${coloredMethod} ${path} ${description ? '- ' + description : ''}`.route);
  }

  // Authentication events
  authEvent(event, details = '') {
    console.log(`[${this.getTimestamp()}] [AUTH] ${event} ${details}`.auth);
  }
  // Request logging (for development)
  request(req) {
    if (this.shouldLog('VERBOSE')) {
      const method = req.method;
      const url = req.originalUrl;
      const ip = req.ip || req.connection.remoteAddress;
      console.log(`[${this.getTimestamp()}] [REQUEST] ${method} ${url} from ${ip}`.debug);
    }
  }

  // Separator for clarity
  separator(title = '') {
    if (title) {
      console.log(`\n${'─'.repeat(20)} ${title.toUpperCase()} ${'─'.repeat(20)}`.info);
    } else {
      console.log('─'.repeat(60).grey);
    }
  }
}

module.exports = new Logger();
