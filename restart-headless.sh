#!/bin/bash

# Full Automated Restart (Headless IB Gateway)
# No VNC needed - uses start-gateway.sh

set -e

VPS_HOST="165.227.104.40"
VPS_USER="root"
GATEWAY_SCRIPT="/opt/trading-app/start-gateway.sh"
APP_DIR="/root/trading-app"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 FULL AUTOMATED RESTART (Headless)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh $VPS_USER@$VPS_HOST << 'ENDSSH'

# Colors for remote script
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

GATEWAY_SCRIPT="/opt/trading-app/start-gateway.sh"
APP_DIR="/root/trading-app"

# ===========================
# STEP 1: Stop Trading App
# ===========================
echo -e "${BLUE}[1/5]${NC} Stopping Trading App..."
pm2 stop trading-app 2>/dev/null || true
pm2 delete trading-app 2>/dev/null || true
echo -e "   ${GREEN}✅ Trading app stopped${NC}"

sleep 2

# ===========================
# STEP 2: Kill IB Gateway
# ===========================
echo -e "${BLUE}[2/5]${NC} Killing IB Gateway processes..."

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
    echo "   → Killing processes on port $PORT"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
  fi
done

# Clean lock files
rm -f /root/Jts/ibgateway/.lock 2>/dev/null || true
rm -f /root/Jts/tws/.lock 2>/dev/null || true

echo -e "   ${GREEN}✅ IB Gateway fully stopped${NC}"

sleep 3

# ===========================
# STEP 3: Start IB Gateway
# ===========================
echo -e "${BLUE}[3/5]${NC} Starting IB Gateway (headless)..."

# Check if start-gateway.sh exists
if [ ! -f "$GATEWAY_SCRIPT" ]; then
  echo -e "   ${RED}❌ Gateway script not found: $GATEWAY_SCRIPT${NC}"
  echo ""
  echo "   Please provide the correct path to start-gateway.sh"
  echo "   Common locations:"
  echo "     - /opt/trading-app/start-gateway.sh"
  echo "     - /root/trading-app/start-gateway.sh"
  echo "     - /root/Jts/ibgateway/start-gateway.sh"
  exit 1
fi

echo "   → Running: $GATEWAY_SCRIPT"
bash "$GATEWAY_SCRIPT" &
GATEWAY_PID=$!

echo "   → Gateway starting in background (PID: $GATEWAY_PID)"
echo -e "   ${GREEN}✅ IB Gateway start command executed${NC}"

# ===========================
# STEP 4: Wait for Gateway
# ===========================
echo ""
echo -e "${BLUE}[4/5]${NC} Waiting for IB Gateway to connect..."

RETRY_COUNT=0
MAX_RETRIES=60  # Wait up to 3 minutes

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  # Check if gateway process is running
  if ps aux | grep -i "[j]ava.*ibgateway" > /dev/null 2>&1; then
    # Check if port is open
    if lsof -ti:4002 > /dev/null 2>&1; then
      echo -e "   ${GREEN}✅ IB Gateway is running on port 4002${NC}"
      
      # Wait a bit more for full connection
      echo "   → Waiting for full initialization..."
      sleep 10
      break
    fi
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  # Show progress every 5 seconds
  if [ $((RETRY_COUNT % 5)) -eq 0 ]; then
    echo "   ⏳ Waiting for IB Gateway... ($RETRY_COUNT seconds elapsed)"
  fi
  
  sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo -e "   ${RED}❌ IB Gateway did not start within 60 seconds${NC}"
  echo ""
  echo "   Check gateway logs:"
  echo "     tail -50 /root/Jts/ibgateway/logs/*.log"
  exit 1
fi

# ===========================
# STEP 5: Start Trading App
# ===========================
echo ""
echo -e "${BLUE}[5/5]${NC} Starting Trading App..."

cd "$APP_DIR"

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
pm2 logs trading-app --lines 15 --nostream

echo ""

# Check if connected
if pm2 logs trading-app --lines 50 --nostream 2>/dev/null | grep -qi "connected to ibkr"; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ SUCCESS! System fully restarted and connected.${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "📊 Desktop: http://165.227.104.40:3000/desktop"
  echo ""
  echo "🧪 Test by placing a 1-share order to verify."
else
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}⚠️  App started but IBKR connection not confirmed yet.${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "   Wait 10-20 seconds, then check:"
  echo "     pm2 logs trading-app"
  echo ""
  echo "   If still not connected, check gateway logs:"
  echo "     tail -50 /root/Jts/ibgateway/logs/*.log"
fi

echo ""

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Restart complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

