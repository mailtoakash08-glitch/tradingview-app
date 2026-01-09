#!/bin/bash
set -e

echo "🎮 Deploying DEMO MODE to VPS..."

# Step 1: Copy files to VPS
echo "📁 Copying demoClient.ts..."
scp /Users/dev/Documents/tradingview/src/services/demoClient.ts root@165.227.104.40:/root/trading-app/src/services/

echo "📁 Copying brokerRouter.ts..."
scp /Users/dev/Documents/tradingview/src/services/brokerRouter.ts root@165.227.104.40:/root/trading-app/src/services/

# Step 2: Deploy on VPS
echo "🚀 Building and restarting on VPS..."
ssh root@165.227.104.40 << 'ENDSSH'
cd /root/trading-app

echo "Building..."
npm run build

echo "Restarting app..."
pm2 restart trading-app

echo "Waiting for startup..."
sleep 5

echo ""
echo "=== 🎮 DEMO MODE LOGS ==="
pm2 logs trading-app --lines 30 --nostream | grep -i 'demo\|initializing\|broker' | head -15

echo ""
echo "=== ✅ Latest Logs ==="
pm2 logs trading-app --lines 10 --nostream
ENDSSH

echo ""
echo "✅ Deployment complete!"
echo "🎮 Demo mode should now be available at:"
echo "   http://165.227.104.40:3000/desktop"
echo ""
echo "Select '🎮 DEMO MODE' from the broker dropdown to test!"

