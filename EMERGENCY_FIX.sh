#!/bin/bash
set -e

echo "🚨 EMERGENCY FIX: Re-copying and rebuilding everything"
echo ""

# Copy the source file directly
echo "📤 Copying brokerRouter.ts to VPS..."
scp /Users/dev/Documents/tradingview/src/services/brokerRouter.ts root@165.227.104.40:/root/trading-app/src/services/

echo "📤 Copying demoClient.ts to VPS..."
scp /Users/dev/Documents/tradingview/src/services/demoClient.ts root@165.227.104.40:/root/trading-app/src/services/

echo ""
echo "🔧 Rebuilding on VPS..."

ssh root@165.227.104.40 << 'ENDSSH'
cd /root/trading-app

echo "Verifying source file has demo code:"
grep -A 5 "Always initialize Demo mode" src/services/brokerRouter.ts

echo ""
echo "Removing old compiled files:"
rm -f dist/services/brokerRouter.js dist/services/demoClient.js

echo ""
echo "Rebuilding TypeScript:"
npm run build

echo ""
echo "Verifying compiled file has demo code:"
grep -A 10 "Always initialize Demo mode" dist/services/brokerRouter.js

echo ""
echo "Restarting app:"
pm2 restart trading-app

echo "Waiting for startup..."
sleep 5

echo ""
echo "=== CHECKING FOR DEMO LOGS ==="
pm2 logs trading-app --lines 20 --nostream | grep -E "Starting|Initializing|Connecting|DEMO|🎮"

ENDSSH

echo ""
echo "✅ Done! Test at: http://165.227.104.40:3000/desktop"

