#!/bin/bash

echo "==========================================="
echo "🚀 DEPLOY & FIX IBKR CONNECTION"
echo "==========================================="
echo ""

VPS_HOST="165.227.104.40"
VPS_USER="root"
APP_DIR="/root/trading-app"

echo "Step 1: Pull latest code..."
ssh "$VPS_USER@$VPS_HOST" << 'EOF'
cd /root/trading-app
git pull origin main
echo "✅ Code pulled"

echo ""
echo "Step 2: Install dependencies..."
npm install
echo "✅ Dependencies installed"

echo ""
echo "Step 3: Build application..."
npm run build
echo "✅ Build complete"

echo ""
echo "Step 4: Restart trading app..."
pm2 restart trading-app
echo "✅ App restarted"

sleep 3

echo ""
echo "Step 5: Check connection logs..."
pm2 logs trading-app --lines 50 --nostream | grep -i "connected\|error\|ibkr\|order"

echo ""
echo "Step 6: Check if connected..."
if pm2 logs trading-app --lines 20 --nostream | grep -q "Connected to IBKR"; then
  echo "✅ IBKR CONNECTION ESTABLISHED!"
else
  echo "❌ IBKR NOT CONNECTED - Check IB Gateway login"
fi
EOF

echo ""
echo "==========================================="
echo "✅ Deployment complete"
echo "==========================================="
echo ""
echo "Next: Test order at http://165.227.104.40:3000/desktop"

