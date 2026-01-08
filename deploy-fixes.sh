#!/bin/bash
# QUICK FIX - Deploy the 3 bug fixes

echo "🔧 DEPLOYING BUG FIXES..."
echo ""

cd /Users/dev/Documents/tradingview

echo "📝 Committing fixes..."
git add -A
git commit -m "fix: Add axios dependency and fix TypeScript errors

- Add axios to package.json for Lightspeed client
- Fix ibkrOrderIdMap -> orderIdMap typo
- Add missing orderId field in error response
"

echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "🚀 Deploying to VPS..."
ssh root@165.227.104.40 << 'ENDSSH'

cd /root/trading-app

echo "📥 Pulling fixes..."
git pull origin main

echo "📦 Installing axios..."
npm install

echo "🛠️  Rebuilding..."
rm -rf dist/
npm run build

if [ ! -f "dist/index.js" ]; then
    echo "❌ BUILD FAILED!"
    exit 1
fi

echo "✅ Build successful!"

echo "🚀 Restarting app..."
pm2 delete trading-app 2>/dev/null
pm2 start dist/index.js --name trading-app
pm2 save

sleep 5

echo ""
echo "📊 Status:"
pm2 list

echo ""
echo "📄 Logs:"
pm2 logs trading-app --lines 30 --nostream

echo ""
echo "🧪 Testing:"
curl -s http://localhost:3000/health
echo ""
curl -s http://localhost:3000/admin/broker-status

ENDSSH

echo ""
echo "✅ FIXES DEPLOYED!"
echo ""
echo "🌐 Check: http://165.227.104.40:3000/desktop"
echo ""

