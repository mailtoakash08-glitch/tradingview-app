#!/bin/bash
# 🎮 DEPLOY DEMO MODE

echo "🎮 DEPLOYING DEMO MODE (Risk-Free Testing)"
echo "=========================================="
echo ""

cd /Users/dev/Documents/tradingview

echo "📝 Committing changes..."
git add -A
git commit -m "feat: Add Demo Mode for risk-free testing

- Demo broker client with simulated fills
- 2-second fill delay for realism
- Perfect for testing UI and order flow
- Zero financial risk
- No market hours restrictions
"

echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "🚀 Deploying to VPS..."
ssh root@165.227.104.40 << 'ENDSSH'

cd /root/trading-app

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🛠️  Building..."
rm -rf dist/
npm run build

if [ ! -f "dist/index.js" ]; then
    echo "❌ BUILD FAILED!"
    exit 1
fi

echo "✅ Build successful!"

echo "🚀 Restarting app..."
pm2 restart trading-app
pm2 save

sleep 5

echo ""
echo "📊 Status:"
pm2 list

echo ""
echo "📄 Logs:"
pm2 logs trading-app --lines 20 --nostream

echo ""
echo "🧪 Testing brokers:"
curl -s http://localhost:3000/admin/broker-status | head -30

ENDSSH

echo ""
echo "✅ DEMO MODE DEPLOYED!"
echo ""
echo "🎮 HOW TO USE:"
echo "============="
echo ""
echo "1. Open: http://165.227.104.40:3000/desktop"
echo ""
echo "2. Select broker: 🎮 DEMO MODE (No Real Money)"
echo ""
echo "3. Place orders:"
echo "   - Orders fill in 2 seconds"
echo "   - Positions update instantly"
echo "   - Visual lines appear"
echo "   - No real money used!"
echo ""
echo "4. Test everything:"
echo "   ✅ Order placement"
echo "   ✅ Position tracking"
echo "   ✅ Visual order lines"
echo "   ✅ Flip/Close buttons"
echo "   ✅ Stop orders"
echo "   ✅ Limit orders"
echo "   ✅ All UI features"
echo ""
echo "5. When ready for real trading:"
echo "   - Switch to 🏦 Interactive Brokers"
echo "   - Test with 1-2 shares first"
echo "   - Then scale up!"
echo ""
echo "🎯 BENEFITS:"
echo "   ⚡ Instant results"
echo "   💰 Zero risk"
echo "   🎮 Unlimited testing"
echo "   📊 Perfect for workflow testing"
echo ""

