# Custom build script for Vercel deployment

Write-Host "Starting build process..."

# Install root dependencies
Write-Host "Installing root dependencies..."
npm install

# Navigate to frontend directory
Write-Host "Navigating to frontend directory..."
cd frontend

# Install frontend dependencies
Write-Host "Installing frontend dependencies..."
npm install

# Build frontend
Write-Host "Building frontend..."
npx vite build

# Build completed successfully
Write-Host "Build process completed!"
