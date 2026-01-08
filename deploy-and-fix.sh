#!/bin/bash
# COMPLETE FIX - Commit, Push, Deploy, Start

echo "🚀 FIXING AND DEPLOYING APP..."
echo ""

# Step 1: Commit changes locally
echo "📝 Step 1: Committing local changes..."
cd /Users/dev/Documents/tradingview
git add -A
git commit -m "feat: Add Lightspeed integration - FULL DEPLOYMENT" || echo "Already committed"
echo "✅ Changes committed"
echo ""

# Step 2: Push to GitHub  
echo "📤 Step 2: Pushing to GitHub..."
git push origin main
echo "✅ Pushed to GitHub"
echo ""

# Step 3: Deploy and fix on VPS
echo "🔧 Step 3: Deploying to VPS..."
echo ""

ssh root@165.227.104.40 << 'ENDSSH'

echo "🔄 Stopping existing app..."
pm2 delete trading-app 2>/dev/null || echo "App was not running"

echo ""
echo "📥 Pulling latest code from GitHub..."
cd /root/trading-app
git reset --hard HEAD
git pull origin main
echo "✅ Code pulled"

echo ""
echo "📦 Installing dependencies..."
npm install 2>&1 | tail -5
echo "✅ Dependencies installed"

echo ""
echo "🧹 Cleaning old build..."
rm -rf dist/

echo ""
echo "🛠️  Building application..."
npm run build

# Check if build succeeded
if [ ! -f "dist/index.js" ]; then
    echo "❌ BUILD FAILED!"
    echo "Showing errors:"
    npm run build 2>&1 | grep -A 5 "error"
    exit 1
fi

echo "✅ Build successful!"

echo ""
echo "🚀 Starting application..."
pm2 start dist/index.js --name trading-app
pm2 save

echo ""
echo "⏳ Waiting for app to start..."
sleep 5

echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "📄 Application Logs:"
pm2 logs trading-app --lines 40 --nostream

echo ""
echo "🧪 Testing Endpoints:"
echo "--------------------"

sleep 2

echo "Health Check:"
curl -s http://localhost:3000/health | head -20

echo ""
echo ""
echo "Broker Status:"
curl -s http://localhost:3000/admin/broker-status | head -20

ENDSSH

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 Access your app at:"
echo "   http://165.227.104.40:3000/desktop"
echo ""
echo "📊 Check broker status:"
echo "   http://165.227.104.40:3000/admin/broker-status"
echo ""
