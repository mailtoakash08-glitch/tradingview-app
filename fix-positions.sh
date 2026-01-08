#!/bin/bash

echo "🔧 =========================================="
echo "   COMPREHENSIVE POSITION FIX"
echo "============================================"
echo ""

VPS_HOST="165.227.104.40"
VPS_USER="root"

# Step 1: Deploy latest code
echo "📥 Step 1: Deploying latest code to VPS..."
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /root/trading-app

echo "Pulling latest code..."
git pull origin main

echo "Building..."
npm run build

echo "✅ Code deployed"
ENDSSH

# Step 2: Fix IBKR_ACCOUNT_ID if needed
echo ""
echo "🔧 Step 2: Checking IBKR account ID..."
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
cd /root/trading-app

# Check current account ID
CURRENT_ID=$(grep IBKR_ACCOUNT_ID .env | cut -d= -f2)

if [ -z "$CURRENT_ID" ] || [ "$CURRENT_ID" = "" ]; then
  echo "⚠️  Account ID is empty! Fixing..."
  sed -i '/^IBKR_ACCOUNT_ID=/d' .env
  echo "IBKR_ACCOUNT_ID=DUK156054" >> .env
  echo "✅ Account ID set to DUK156054"
else
  echo "✅ Account ID is set: $CURRENT_ID"
fi

# Verify all IBKR settings
echo ""
echo "Current IBKR configuration:"
grep IBKR .env
ENDSSH

# Step 3: Restart application
echo ""
echo "🔄 Step 3: Restarting application..."
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
pm2 restart trading-app
sleep 5
echo "✅ Application restarted"
ENDSSH

# Step 4: Check connection status
echo ""
echo "📊 Step 4: Checking IBKR connection..."
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
echo "Recent connection logs:"
pm2 logs trading-app --lines 30 --nostream | grep -E "Connected to IBKR|Subscribed|connection" | tail -5
ENDSSH

# Step 5: Check current positions
echo ""
echo "📊 Step 5: Checking current positions..."
POSITIONS=$(curl -s http://165.227.104.40:3000/api/dashboard/positions)
echo "$POSITIONS"

if echo "$POSITIONS" | grep -q "\"positions\""; then
  POS_COUNT=$(echo "$POSITIONS" | grep -o "\"symbol\"" | wc -l)
  echo ""
  echo "✅ Positions API working - Found $POS_COUNT position(s)"
else
  echo ""
  echo "⚠️  Positions API not responding correctly"
fi

# Step 6: Check recent orders
echo ""
echo "📊 Step 6: Checking recent orders..."
ssh "$VPS_USER@$VPS_HOST" << 'ENDSSH'
echo "Recent order logs:"
pm2 logs trading-app --lines 100 --nostream | grep -E "Order submitted|order status|orderStatus" | tail -10
ENDSSH

echo ""
echo "============================================"
echo "✅ FIX COMPLETE!"
echo "============================================"
echo ""
echo "🎯 NEXT STEPS:"
echo ""
echo "1. Refresh your browser: http://165.227.104.40:3000/desktop"
echo "2. Check positions table at bottom"
echo "3. If still no position, place a NEW test order:"
echo "   - Symbol: AAPL"
echo "   - Quantity: 1"
echo "   - Click BUY"
echo "   - Wait 60 seconds"
echo "   - Refresh page"
echo ""
echo "4. Check IB Gateway (VNC) to confirm order is FILLED"
echo ""
echo "📋 To check logs manually:"
echo "   ssh root@165.227.104.40 'pm2 logs trading-app'"
echo ""

