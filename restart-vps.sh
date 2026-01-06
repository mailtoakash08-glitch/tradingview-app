#!/bin/bash

# VPS-Side Restart Script
# Run this directly on the VPS to restart IB Gateway and Trading App
# Usage: ssh root@165.227.104.40 'bash /root/trading-app/restart-vps.sh'

set -e

APP_DIR="/root/trading-app"
IB_DIR="/root/Jts"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 VPS RESTART (IB Gateway + Trading App)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ===========================
# STEP 1: Stop Trading App
# ===========================
echo -e "${BLUE}[1/4]${NC} Stopping Trading App..."
pm2 stop trading-app 2>/dev/null || true
pm2 delete trading-app 2>/dev/null || true
echo -e "   ${GREEN}✅ Trading app stopped${NC}"

sleep 2

# ===========================
# STEP 2: Kill IB Gateway
# ===========================
echo -e "${BLUE}[2/4]${NC} Killing IB Gateway processes..."

# Find all IB Gateway / TWS Java processes
GATEWAY_PIDS=$(ps aux | grep -i "[j]ava.*ibgateway\|[j]ava.*tws" | awk '{print $2}')

if [ -n "$GATEWAY_PIDS" ]; then
  echo "   → Found IB Gateway PIDs: $GATEWAY_PIDS"
  echo "$GATEWAY_PIDS" | xargs kill -9 2>/dev/null || true
  echo -e "   ${GREEN}✅ IB Gateway processes killed${NC}"
else
  echo "   → No IB Gateway processes found"
fi

# Kill processes on IB ports
for PORT in 4001 4002 7496 7497; do
  PIDS=$(lsof -ti:$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "   → Killing processes on port $PORT: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
  fi
done

# Clean lock files
rm -f $IB_DIR/ibgateway/.lock 2>/dev/null || true
rm -f $IB_DIR/tws/.lock 2>/dev/null || true

echo -e "   ${GREEN}✅ IB Gateway fully stopped${NC}"

sleep 3

# ===========================
# STEP 3: Configure IB Gateway
# ===========================
echo -e "${BLUE}[3/4]${NC} Configuring IB Gateway..."

# Ensure jts.ini has correct settings
JTS_INI="$IB_DIR/ibgateway/jts.ini"

if [ -f "$JTS_INI" ]; then
  # Update settings using sed
  sed -i 's/^LocalServerPort=.*/LocalServerPort=4002/' "$JTS_INI"
  sed -i 's/^TrustedIPs=.*/TrustedIPs=127.0.0.1/' "$JTS_INI"
  sed -i 's/^ApiOnly=.*/ApiOnly=true/' "$JTS_INI"
  sed -i 's/^ReadOnlyApi=.*/ReadOnlyApi=false/' "$JTS_INI"
  sed -i 's/^s3store=.*/s3store=true/' "$JTS_INI"
  
  echo -e "   ${GREEN}✅ IB Gateway configured (port 4002, API enabled)${NC}"
else
  echo -e "   ${YELLOW}⚠️  jts.ini not found at $JTS_INI${NC}"
fi

# ===========================
# STEP 4: Instructions
# ===========================
echo ""
echo -e "${YELLOW}⚠️  MANUAL ACTION REQUIRED:${NC}"
echo ""
echo "   IB Gateway must be started via VNC with GUI login."
echo ""
echo "   From your Mac terminal:"
echo -e "   ${GREEN}ssh -L 5901:localhost:5901 root@165.227.104.40${NC}"
echo ""
echo "   Then in VNC Viewer (localhost:5901):"
echo "   1. Double-click 'IB Gateway' icon"
echo "   2. Login with your IBKR credentials"
echo "   3. Wait for 'Connected' status"
echo ""
echo "   After IB Gateway is running, the script will continue..."
echo ""

# Wait for IB Gateway to start (check port 4002)
echo -e "${BLUE}[4/4]${NC} Waiting for IB Gateway to start..."
RETRY_COUNT=0
MAX_RETRIES=60  # Wait up to 3 minutes

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if lsof -ti:4002 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ IB Gateway detected on port 4002${NC}"
    sleep 5  # Wait a bit more for full initialization
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $((RETRY_COUNT % 10)) -eq 0 ]; then
    echo "   ⏳ Still waiting for IB Gateway... ($RETRY_COUNT seconds elapsed)"
  fi
  sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo -e "   ${RED}❌ IB Gateway did not start within 60 seconds${NC}"
  echo ""
  echo "   Please start IB Gateway manually via VNC, then run:"
  echo "   pm2 start $APP_DIR/dist/index.js --name trading-app"
  exit 1
fi

# ===========================
# STEP 5: Start Trading App
# ===========================
echo ""
echo -e "${BLUE}[5/5]${NC} Starting Trading App..."

cd $APP_DIR

pm2 start dist/index.js --name trading-app
pm2 save

echo "   → Waiting for app to initialize..."
sleep 5

# ===========================
# Verification
# ===========================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

pm2 list

echo ""
echo "Recent logs:"
pm2 logs trading-app --lines 10 --nostream

echo ""

# Check if connected
if pm2 logs trading-app --lines 50 --nostream 2>/dev/null | grep -qi "connected to ibkr"; then
  echo -e "${GREEN}✅ SUCCESS! System fully restarted and connected.${NC}"
  echo ""
  echo "📊 Desktop: http://165.227.104.40:3000/desktop"
else
  echo -e "${YELLOW}⚠️  App started but IBKR connection not confirmed yet.${NC}"
  echo "   Wait 10-20 seconds, then check: pm2 logs trading-app"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

