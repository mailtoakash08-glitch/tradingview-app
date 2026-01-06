#!/bin/bash

# Full System Restart Script
# Kills IB Gateway + Trading App, then restarts everything cleanly

set -e

VPS_HOST="165.227.104.40"
VPS_USER="root"
APP_DIR="/root/trading-app"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 FULL SYSTEM RESTART"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ===========================
# STEP 1: Stop Trading App
# ===========================
echo -e "${BLUE}[1/5]${NC} Stopping Trading App on VPS..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
echo "   → Stopping PM2 process..."
pm2 stop trading-app 2>/dev/null || true
pm2 delete trading-app 2>/dev/null || true
echo "   ✅ Trading app stopped"
EOF

sleep 2

# ===========================
# STEP 2: Kill IB Gateway
# ===========================
echo -e "${BLUE}[2/5]${NC} Killing all IB Gateway processes..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
# Find and kill all IB Gateway / TWS processes
GATEWAY_PIDS=$(ps aux | grep -i "[j]ava.*ibgateway\|[j]ava.*tws" | awk '{print $2}')

if [ -n "$GATEWAY_PIDS" ]; then
  echo "   → Found IB Gateway processes: $GATEWAY_PIDS"
  echo "$GATEWAY_PIDS" | xargs kill -9 2>/dev/null || true
  echo "   ✅ IB Gateway killed"
else
  echo "   → No IB Gateway processes found"
fi

# Also kill any orphaned Java processes on ports 4001/4002
JAVA_PIDS=$(lsof -ti:4001,4002 2>/dev/null || true)
if [ -n "$JAVA_PIDS" ]; then
  echo "   → Killing Java processes on ports 4001/4002..."
  echo "$JAVA_PIDS" | xargs kill -9 2>/dev/null || true
  echo "   ✅ Ports cleared"
fi

# Clean up any lock files
rm -f /root/Jts/ibgateway/.lock 2>/dev/null || true
rm -f /root/Jts/tws/.lock 2>/dev/null || true

echo "   ✅ IB Gateway fully stopped"
EOF

sleep 3

# ===========================
# STEP 3: Start IB Gateway
# ===========================
echo -e "${BLUE}[3/5]${NC} Starting IB Gateway..."
echo ""
echo -e "${YELLOW}⚠️  MANUAL ACTION REQUIRED:${NC}"
echo ""
echo "   You need to start IB Gateway via VNC and login manually."
echo ""
echo "   In a NEW terminal window, run:"
echo -e "   ${GREEN}ssh -L 5901:localhost:5901 $VPS_USER@$VPS_HOST${NC}"
echo ""
echo "   Then open VNC Viewer and connect to: ${GREEN}localhost:5901${NC}"
echo ""
echo "   On the VPS desktop:"
echo "   1. Double-click 'IB Gateway' icon"
echo "   2. Username: chantbou1966"
echo "   3. Enter password"
echo "   4. Click 'Login'"
echo "   5. Wait for 'Connected' status"
echo ""
read -p "   Press ENTER after IB Gateway is running and connected... "

# ===========================
# STEP 4: Verify IB Gateway
# ===========================
echo ""
echo -e "${BLUE}[4/5]${NC} Verifying IB Gateway is running..."

ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
RETRY_COUNT=0
MAX_RETRIES=10

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  GATEWAY_RUNNING=$(ps aux | grep -i '[j]ava.*ibgateway' | wc -l)
  PORT_OPEN=$(lsof -ti:4002 2>/dev/null | wc -l)
  
  if [ "$GATEWAY_RUNNING" -gt 0 ] && [ "$PORT_OPEN" -gt 0 ]; then
    echo "   ✅ IB Gateway is running on port 4002"
    exit 0
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "   ⏳ Waiting for IB Gateway... (attempt $RETRY_COUNT/$MAX_RETRIES)"
  sleep 3
done

echo "   ❌ IB Gateway not detected after $MAX_RETRIES attempts"
echo "   Please verify IB Gateway is running via VNC"
exit 1
ENDSSH

GATEWAY_CHECK=$?

if [ $GATEWAY_CHECK -ne 0 ]; then
  read -p "   Press ENTER to continue anyway, or Ctrl+C to abort... "
fi

# ===========================
# STEP 5: Start Trading App
# ===========================
echo ""
echo -e "${BLUE}[5/5]${NC} Starting Trading App..."
ssh $VPS_USER@$VPS_HOST << EOF
cd $APP_DIR

echo "   → Starting PM2 process..."
pm2 start dist/index.js --name trading-app

echo "   → Saving PM2 state..."
pm2 save

echo "   → Waiting for app to initialize..."
sleep 5

echo ""
echo "   ✅ Trading app started"
echo ""
EOF

# ===========================
# STEP 6: Final Verification
# ===========================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check PM2 status
echo "📊 PM2 Status:"
ssh $VPS_USER@$VPS_HOST "pm2 list"

echo ""
echo "📜 Recent Logs:"
ssh $VPS_USER@$VPS_HOST "pm2 logs trading-app --lines 10 --nostream"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for IBKR connection in logs
CONNECTED=$(ssh $VPS_USER@$VPS_HOST "pm2 logs trading-app --lines 50 --nostream 2>/dev/null | grep -i 'connected to ibkr' | tail -1" || echo "")

if [ -n "$CONNECTED" ]; then
  echo -e "${GREEN}✅ SUCCESS: System fully restarted and connected!${NC}"
  echo ""
  echo "📊 Desktop Interface: http://$VPS_HOST:3000/desktop"
  echo ""
  echo "🧪 Test by placing a small order (1 share) to verify everything works."
else
  echo -e "${YELLOW}⚠️  WARNING: IBKR connection not confirmed in logs${NC}"
  echo ""
  echo "Please check:"
  echo "  1. IB Gateway is running (via VNC)"
  echo "  2. Gateway shows 'Connected' status"
  echo "  3. Run: ssh $VPS_USER@$VPS_HOST 'pm2 logs trading-app'"
  echo ""
  echo "If issues persist, wait 10-20 seconds for connection to establish."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

