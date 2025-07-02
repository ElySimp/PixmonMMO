#!/bin/bash
# Custom build script for Vercel deployment

echo "Starting build process..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Navigate to frontend directory
echo "Navigating to frontend directory..."
cd frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npx vite build

# Build completed successfully
echo "Build process completed!"
