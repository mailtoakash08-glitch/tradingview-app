#!/bin/bash
echo "🔧 FINAL FIX: Removing duplicate HTML code"
echo ""
cd /Users/dev/Documents/tradingview

echo "✅ Building locally..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed locally!"
  exit 1
fi
echo "✅ Local build successful"
echo ""

echo "📤 Committing and pushing..."
git add src/routes/desktop.ts
git commit -m "Fix: Remove duplicate HTML in updatePositionsTable + Use Lightweight Charts 4.1.3"
git push origin main
echo ""

echo "🚀 Deploying to VPS..."
ssh root@165.227.104.40 << 'EOF'
cd /root/trading-app
echo "📥 Pulling latest code..."
git pull origin main

echo "🔨 Building..."
npm run build

echo "🔄 Restarting app..."
pm2 restart trading-app

echo "✅ Deployment complete!"
pm2 logs trading-app --lines 10 --nostream | tail -5
EOF

echo ""
echo "=========================================="
echo "✅ VISUAL ORDER LINES DEPLOYED!"
echo "=========================================="
echo ""
echo "Open: http://165.227.104.40:3000/desktop"
echo ""
echo "The chart should now load with:"
echo "  ✅ Lightweight Charts"
echo "  ✅ Visual price lines for orders"
echo "  ✅ Visual entry lines for positions"

