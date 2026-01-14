#!/bin/bash
# Deploy to VPS from GitHub

echo "🚀 Deploying to VPS from GitHub..."

# VPS connection details
VPS_IP="165.227.104.40"
VPS_USER="root"

# SSH and deploy
ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
cd /root/tradingview

echo "📥 Pulling latest code from GitHub..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building TypeScript..."
npm run build

echo "🔄 Restarting app..."
pm2 restart trading-app || pm2 start npm --name "trading-app" -- start

echo "✅ Deployment complete!"
pm2 status
ENDSSH

echo "🎉 VPS deployment finished!"
