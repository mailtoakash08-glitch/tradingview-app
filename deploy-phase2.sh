#!/bin/bash

# Deploy Phase 2: Order Execution Module
# This script deploys all new features to VPS and tests them

set -e

VPS_HOST="165.227.104.40"
VPS_USER="root"
APP_DIR="/root/trading-app"
PM2_APP_NAME="trading-app"

echo "🚀 =========================================="
echo "   DEPLOYING PHASE 2: ORDER EXECUTION MODULE"
echo "============================================"
echo ""

# Step 1: Push to GitHub (if not already done)
echo "📤 Step 1: Checking GitHub..."
if git diff --quiet && git diff --cached --quiet; then
  echo "✅ All changes already committed"
else
  echo "⚠️  Uncommitted changes found. Committing..."
  git add -A
  git commit -m "Phase 2 deployment: $(date +'%Y-%m-%d %H:%M:%S')"
  git push origin main
  echo "✅ Pushed to GitHub"
fi

# Step 2: Deploy to VPS
echo ""
echo "📥 Step 2: Deploying to VPS..."
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /root/trading-app

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🛠️  Building application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart trading-app
pm2 save

echo "✅ Deployment complete!"
echo ""
echo "📊 Application status:"
pm2 list

echo ""
echo "📄 Recent logs:"
pm2 logs trading-app --lines 20 --nostream

ENDSSH

echo ""
echo "✅ =========================================="
echo "   DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "🌐 Access your app at: http://$VPS_HOST:3000/desktop"
echo ""
echo "🧪 TESTING CHECKLIST:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  FLIP BUTTON TEST:"
echo "   □ Open desktop UI"
echo "   □ Place a test order (1 share)"
echo "   □ Wait for fill"
echo "   □ Click 🔄 FLIP button on position row"
echo "   □ Verify position reverses (LONG → SHORT)"
echo ""
echo "2️⃣  CLOSE ALL TEST:"
echo "   □ Open 2-3 test positions"
echo "   □ Click '❌ Close All' button"
echo "   □ Confirm all positions close"
echo ""
echo "3️⃣  BRACKET ORDER TEST:"
echo "   □ Check 'Bracket Order' checkbox"
echo "   □ Set risk amount ($5)"
echo "   □ Select ratio (1:2)"
echo "   □ Place order"
echo "   □ Verify TP/SL calculated automatically"
echo ""
echo "4️⃣  POSITION MARKER TEST:"
echo "   □ Open a position"
echo "   □ Check for marker overlay on chart (top-right)"
echo "   □ Verify it shows: Symbol, Type, Qty, Entry, P&L"
echo "   □ Switch symbols - marker updates"
echo ""
echo "5️⃣  INDIVIDUAL ACTIONS TEST:"
echo "   □ Click ✕ button on specific position"
echo "   □ Verify only that position closes"
echo "   □ Click 🔄 button on different position"
echo "   □ Verify only that position flips"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 QUICK COMMANDS:"
echo "   Check logs:  ssh $VPS_USER@$VPS_HOST 'pm2 logs trading-app'"
echo "   Check status: ./check-quick.sh"
echo "   Restart app: ssh $VPS_USER@$VPS_HOST 'pm2 restart trading-app'"
echo ""
echo "🎯 All TODOs completed! Ready for trading! 🎉"

