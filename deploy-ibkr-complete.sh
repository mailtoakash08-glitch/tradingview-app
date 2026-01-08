#!/bin/bash

echo "🚀 =========================================="
echo "   DEPLOYING COMPLETE IBKR SETUP"
echo "============================================"
echo ""

VPS_HOST="165.227.104.40"
VPS_USER="root"

echo "📥 Step 1: Deploying to VPS..."
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /root/trading-app

echo "Pulling latest code..."
git pull origin main

echo "Building..."
npm run build

echo "Restarting PM2..."
pm2 restart trading-app
pm2 save

echo "✅ Deployment complete!"
echo ""
echo "📊 Recent logs:"
pm2 logs trading-app --lines 20 --nostream

ENDSSH

echo ""
echo "✅ =========================================="
echo "   DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "🌐 Open: http://$VPS_HOST:3000/desktop"
echo ""
echo "📋 NEW FEATURES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  WATCHLIST → STOP ORDER WORKFLOW:"
echo "   • Click any watchlist symbol"
echo "   • Auto-fills order panel"
echo "   • Auto-selects 'Stop Market' order type"
echo "   • Set trigger price"
echo "   • Click BUY to place stop order"
echo ""
echo "2️⃣  PENDING ORDERS PANEL:"
echo "   • View all pending stop orders"
echo "   • See trigger prices at a glance"
echo "   • Cancel orders with ❌ button"
echo "   • Auto-refreshes every 10 seconds"
echo ""
echo "3️⃣  ENHANCED STOP UI:"
echo "   • Clear labeling: 'Trigger Price'"
echo "   • Helper text explains functionality"
echo "   • Better visual feedback"
echo ""
echo "4️⃣  POSITION MARKER:"
echo "   • Live P&L display on chart (top-right)"
echo "   • Shows entry, current price, P&L"
echo "   • Color-coded (green=profit, red=loss)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 YOUR MORNING WORKFLOW:"
echo ""
echo "1. Login to IB Gateway on VPS"
echo "2. Open: http://165.227.104.40:3000/desktop"
echo "3. Review watchlist (left sidebar)"
echo "4. For each potential ticker:"
echo "   a. Click symbol in watchlist"
echo "   b. Analyze chart"
echo "   c. Decide if it will 'take off'"
echo "   d. Set trigger price"
echo "   e. Click BUY"
echo "5. Orders sit in 'Pending Orders' panel"
echo "6. When stock 'takes off' → Order triggers automatically!"
echo ""
echo "✅ ALL IBKR FEATURES COMPLETE!"
echo "✅ READY FOR PRE-MARKET STOP ORDERS!"
echo ""

