#!/bin/bash

echo "==========================================="
echo "🚀 DEPLOY VISUAL ORDER LINES"
echo "==========================================="
echo ""

cd /Users/dev/Documents/tradingview

echo "Step 1: Building locally..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi
echo "✅ Build successful"
echo ""

echo "Step 2: Committing to GitHub..."
git add -A
git commit -m "Add visual order lines on chart with Lightweight Charts

- Replace TradingView widget with Lightweight Charts
- Draw horizontal price lines for positions (entry prices)
- Draw price lines for pending stop/limit orders
- Color-coded lines: green=long, red=short, blue=orders
- Auto-update lines when positions/orders change
- Lines only show for current symbol being viewed"

git push origin main
echo "✅ Pushed to GitHub"
echo ""

echo "Step 3: Deploying to VPS..."
ssh root@165.227.104.40 << 'EOF'
cd /root/trading-app

echo "Pulling latest code..."
git pull origin main

echo "Building..."
npm run build

echo "Restarting app..."
pm2 restart trading-app

echo "Checking status..."
sleep 3
pm2 logs trading-app --lines 10 --nostream | tail -5
EOF

echo ""
echo "==========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "==========================================="
echo ""
echo "🎯 Visual Order Lines Implemented:"
echo "   ✅ Position entry lines (solid, green/red)"
echo "   ✅ Pending stop order lines (dashed)"
echo "   ✅ Pending limit order lines (dotted)"
echo "   ✅ Auto-updates when orders/positions change"
echo ""
echo "Open: http://165.227.104.40:3000/desktop"
echo ""
echo "Test by:"
echo "1. Place a stop order"
echo "2. See dashed line appear on chart at trigger price"
echo "3. When filled, entry line appears"

