// Vercel Development Preview Server
// This script uses Vercel CLI to run a local preview of your production deployment

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

console.log(`${colors.bright}${colors.magenta}
╔════════════════════════════════════════════════╗
║  VERCEL DEVELOPMENT PREVIEW SERVER             ║
║  Test your production build locally            ║
╚════════════════════════════════════════════════╝${colors.reset}
`);

// Check if user is logged in to Vercel
try {
  console.log(`${colors.yellow}→ Checking Vercel authentication...${colors.reset}`);
  execSync('vercel whoami', { stdio: 'pipe' });
} catch (error) {
  console.error(`${colors.bright}Not logged in to Vercel. Please run 'vercel login' first.${colors.reset}`);
  process.exit(1);
}

// Check if project is linked to Vercel
if (!fs.existsSync(path.join(__dirname, '.vercel', 'project.json'))) {
  console.error(`${colors.bright}Project not linked to Vercel. Please run 'vercel link' first.${colors.reset}`);
  process.exit(1);
}

// Build the project locally
console.log(`\n${colors.yellow}→ Building frontend for production...${colors.reset}`);
try {
  if (fs.existsSync(path.join(__dirname, 'frontend'))) {
    // Check if package.json exists in frontend directory
    if (fs.existsSync(path.join(__dirname, 'frontend', 'package.json'))) {
      console.log('Building frontend...');
      execSync('cd frontend && npm run build', { stdio: 'inherit' });
    }
  }
  console.log(`${colors.green}✓ Build completed successfully${colors.reset}`);
} catch (error) {
  console.error(`${colors.bright}Build failed:${colors.reset}`, error.message);
  console.log('Continuing with dev server...');
}

// Start Vercel dev server (simulates production environment)
console.log(`\n${colors.yellow}→ Starting Vercel development server...${colors.reset}`);
console.log(`${colors.bright}${colors.blue}This will simulate the Vercel production environment locally.${colors.reset}`);
console.log(`${colors.bright}Press Ctrl+C to stop the server.${colors.reset}\n`);

// Execute the Vercel dev command
try {
  // Vercel will use the devCommand from vercel.json
  console.log(`${colors.yellow}→ Using development command from vercel.json${colors.reset}`);
  execSync('vercel dev', { stdio: 'inherit' });
} catch (error) {
  console.error(`${colors.bright}Failed to start development server:${colors.reset}`, error.message);
  process.exit(1);
}
