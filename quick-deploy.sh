#!/bin/bash
# Quick Deploy Script - Update VPS with latest code

set -e

VPS_HOST="165.227.104.40"
VPS_USER="root"
APP_DIR="/root/trading-app"

echo "🚀 Deploying latest code to VPS..."
echo "=================================="
echo ""

# Step 1: Pull latest code on VPS
echo "📥 Pulling latest code from GitHub..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /root/trading-app
git pull origin main
echo "✓ Code updated"
ENDSSH

# Step 2: Rebuild app
echo ""
echo "🔨 Building application..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /root/trading-app
npm run build
echo "✓ Build complete"
ENDSSH

# Step 3: Restart PM2
echo ""
echo "🔄 Restarting application..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /root/trading-app
pm2 restart trading-app
echo "✓ Application restarted"
ENDSSH

# Step 4: Check status
echo ""
echo "📊 Application Status:"
echo "====================="
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
pm2 list
echo ""
echo "Recent logs:"
pm2 logs trading-app --lines 10 --nostream
ENDSSH

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your app at:"
echo "   http://165.227.104.40:3000/desktop"
echo ""

