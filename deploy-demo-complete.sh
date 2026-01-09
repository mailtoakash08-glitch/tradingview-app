#!/bin/bash
# Deploy ALL demo files

cd /Users/dev/Documents/tradingview

echo "🔍 Checking what needs to be committed..."
git status --short

echo ""
echo "📝 Adding ALL files..."
git add -A

echo ""
echo "📋 Files to be committed:"
git status --short

echo ""
echo "💾 Committing..."
git commit -m "feat: Add complete Demo Mode implementation

- Add demoClient.ts for simulated trading
- Update brokerRouter.ts to support demo
- Update admin.ts for demo status
- Update desktop.ts with demo selector
- Update order types to include demo
- All files for risk-free testing
"

echo ""
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "🚀 Deploying to VPS..."
ssh root@165.227.104.40 << 'EOF'
cd /root/trading-app

echo "📥 Pulling ALL code..."
git pull origin main

echo ""
echo "📦 Installing..."
npm install

echo ""
echo "🛠️  Building..."
npm run build

echo ""
echo "🔄 Restarting..."
pm2 restart trading-app

echo ""
echo "⏳ Waiting for startup..."
sleep 5

echo ""
echo "✅ Checking if demo is available..."
pm2 logs trading-app --lines 30 --nostream | grep -i "demo\|broker initialization"

echo ""
echo "📊 Broker status:"
curl -s http://localhost:3000/admin/broker-status | head -20

EOF

echo ""
echo "✅ COMPLETE! Demo mode should work now!"
echo "🌐 Try: http://165.227.104.40:3000/desktop"

