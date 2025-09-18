#!/bin/bash

# Production startup script with crash recovery
# This script ensures the backend can handle high loads and auto-recover from crashes

echo "🚀 Starting Shardeum Quest Backend (Production Mode)"

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# Stop any existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start with PM2 in production mode
echo "🚀 Starting backend with PM2..."
NODE_ENV=production pm2 start ecosystem.config.js --env production

# Show status
pm2 status

# Save PM2 configuration for auto-restart on system reboot
pm2 save
pm2 startup

echo "✅ Production backend started successfully!"
echo "📊 Monitor with: pm2 monit"
echo "📝 View logs with: pm2 logs"
echo "🔄 Restart with: pm2 restart ecosystem.config.js"
echo "🛑 Stop with: pm2 stop ecosystem.config.js"

# Optional: Setup log rotation
pm2 install pm2-logrotate

echo "🎯 Backend is now running in production mode with auto-restart enabled!"