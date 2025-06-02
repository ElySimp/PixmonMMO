#!/usr/bin/env node

const { spawn } = require('child_process');
const colors = require('colors');
const path = require('path');

// Configure colors theme
colors.setTheme({
  header: 'magenta',
  info: 'cyan', 
  success: 'green',
  warning: 'yellow',
  error: 'red',
  backend: 'magenta',
  frontend: 'cyan'
});

// Clear console and show clean startup banner
console.clear();
console.log('╔══════════════════════════════════════════════════════════════╗'.header);
console.log('║                    🎮 PIXMON MMO GAME                        ║'.header);
console.log('║                   Development Environment                    ║'.header);
console.log('╚══════════════════════════════════════════════════════════════╝'.header);
console.log('');
console.log('🚀 Starting development servers...'.info);
console.log('');

// Track server status
let backendReady = false;
let frontendReady = false;
let showedFinalMessage = false;

// Start backend directly without npm wrapper
const backendProcess = spawn('node', ['backend/server.js'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: process.cwd()
});

// Start frontend directly without npm wrapper  
const frontendProcess = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: path.join(process.cwd(), 'frontend'),
  shell: true
});

// Process backend output
backendProcess.stdout.on('data', (data) => {
  const output = data.toString();
  const lines = output.split('\n');
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Detect backend ready
    if (line.includes('🎉 BACKEND API READY') && !backendReady) {
      backendReady = true;
      console.log('✅ Backend API ready on http://localhost:5000'.success);
      checkIfAllReady();
      continue;
    }
    
    // Show important backend messages (cleaned up)
    if (line.includes('🚀 PIXMON MMO BACKEND API STARTING') ||
        line.includes('📊 DATABASE INITIALIZATION') ||
        line.includes('✅ DATABASE INITIALIZATION COMPLETE') ||
        line.includes('🎉 BACKEND API READY')) {
      continue; // Skip these - we handle them above
    }
    
    // Show other backend output but clean it up
    console.log(`[BACKEND] ${line}`.backend);
  }
});

// Process frontend output
frontendProcess.stdout.on('data', (data) => {
  const output = data.toString();
  const lines = output.split('\n');
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Skip npm noise
    if (line.includes('> frontend@0.0.0') || 
        line.includes('> vite')) {
      continue;
    }
    
    // Detect frontend ready
    if (line.includes('Local:') && line.includes('localhost:5173') && !frontendReady) {
      frontendReady = true;
      console.log('✅ Frontend ready on http://localhost:5173'.success);
      checkIfAllReady();
      continue;
    }
    
    // Show cleaned up frontend messages
    if (line.includes('ready in') || line.includes('Local:') || line.includes('Network:')) {
      continue; // Skip Vite startup messages
    }
    
    console.log(`[FRONTEND] ${line}`.frontend);
  }
});

// Handle errors
backendProcess.stderr.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Error') || output.includes('error')) {
    console.error(`[BACKEND ERROR] ${output.trim()}`.error);
  }
});

frontendProcess.stderr.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Error') || output.includes('error')) {
    console.error(`[FRONTEND ERROR] ${output.trim()}`.error);
  }
});

function checkIfAllReady() {
  if (backendReady && frontendReady && !showedFinalMessage) {
    showedFinalMessage = true;
    console.log('');
    console.log('🎉 ALL SYSTEMS READY!'.success.bold);
    console.log('═'.repeat(60).success);
    console.log('🔧 Backend API:     http://localhost:5000'.success);
    console.log('🎮 Frontend Game:   http://localhost:5173'.success);
    console.log('⚡ Hot Reload:      Enabled for React & API'.info);
    console.log('═'.repeat(60).success);
    console.log('🚀 Open http://localhost:5173 in your browser to play!'.info.bold);
    console.log('');
  }
}

// Handle process termination
function cleanup() {
  console.log('');
  console.log('🛑 Shutting down development servers...'.warning);
  
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill('SIGTERM');
  }
  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill('SIGTERM');
  }
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Handle process exits
backendProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ Backend exited with code ${code}`.error);
    cleanup();
  }
});

frontendProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ Frontend exited with code ${code}`.error);
    cleanup();
  }
});
