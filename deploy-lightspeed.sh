#!/bin/bash

# 🚀 LIGHTSPEED INTEGRATION DEPLOYMENT
# This script deploys Lightspeed multi-broker support

set -e

VPS_HOST="165.227.104.40"
VPS_USER="root"
APP_DIR="/root/trading-app"
PM2_APP_NAME="trading-app"

echo "🚀 DEPLOYING LIGHTSPEED INTEGRATION"
echo "===================================="

# Step 1: Commit changes
echo ""
echo "📝 Step 1: Committing changes..."
git add .
git commit -m "feat: Add Lightspeed broker integration

- Multi-broker support (IBKR + Lightspeed)
- Broker selector in desktop UI
- Broker router for order routing
- Lightspeed API client
- Admin endpoint for broker status
- Config updates for Lightspeed credentials
" || echo "⚠️  No changes to commit (already committed)"

# Step 2: Push to GitHub
echo ""
echo "📤 Step 2: Pushing to GitHub..."
git push origin main
echo "✅ Pushed to GitHub"

# Step 3: Deploy to VPS
echo ""
echo "📥 Step 3: Deploying to VPS..."
ssh "$VPS_USER@$VPS_HOST" << 'EOF'
cd /root/trading-app

echo "📥 Pulling latest code..."
rm -f package-lock.json
git reset --hard HEAD
git pull origin main
echo "✅ Code pulled"

echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"

echo "🛠️  Building application..."
npm run build
echo "✅ Application built"

echo "🔄 Restarting PM2 process..."
pm2 restart trading-app
pm2 save
echo "✅ Application restarted"

echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "📄 Recent logs:"
pm2 logs trading-app --lines 30 --nostream
EOF

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🔧 NEXT STEPS:"
echo "============="
echo ""
echo "1️⃣  GET LIGHTSPEED API CREDENTIALS"
echo "   Contact Lightspeed support to get:"
echo "   - API Key"
echo "   - API Secret"
echo "   - Account ID"
echo "   - API URL (if different from default)"
echo ""
echo "2️⃣  UPDATE .ENV FILE ON VPS"
echo "   ssh root@$VPS_HOST"
echo "   cd $APP_DIR"
echo "   nano .env"
echo ""
echo "   Add these lines:"
echo "   ----------------"
echo "   LIGHTSPEED_ENABLED=true"
echo "   LIGHTSPEED_API_URL=https://api.lightspeed.com"
echo "   LIGHTSPEED_API_KEY=your_api_key_here"
echo "   LIGHTSPEED_API_SECRET=your_api_secret_here"
echo "   LIGHTSPEED_ACCOUNT_ID=your_account_id_here"
echo "   DEFAULT_BROKER=lightspeed"
echo ""
echo "3️⃣  RESTART THE APP"
echo "   pm2 restart trading-app"
echo ""
echo "4️⃣  TEST THE INTEGRATION"
echo "   - Open: http://$VPS_HOST:3000/desktop"
echo "   - Select 'Lightspeed' in broker dropdown"
echo "   - Place a test order"
echo "   - Check: http://$VPS_HOST:3000/admin/broker-status"
echo ""
echo "📚 FEATURES:"
echo "   ✅ IBKR + Lightspeed dual broker support"
echo "   ✅ Broker selector in UI"
echo "   ✅ Automatic fallback to IBKR if Lightspeed unavailable"
echo "   ✅ Admin endpoint to check broker status"
echo "   ✅ Configurable default broker"
echo ""
echo "🎯 BENEFITS OF LIGHTSPEED:"
echo "   ⚡ Faster execution (0.05-0.2 seconds)"
echo "   💰 Lower commissions (~\$0.005/share vs IBKR \$0.0035/share)"
echo "   🎯 Better for day trading and scalping"
echo "   ✅ More reliable API callbacks"
echo ""


