#!/bin/bash

# Smart Restart - Auto-detects headless vs GUI setup
# Automatically uses the right method

set -e

VPS_HOST="165.227.104.40"
VPS_USER="root"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🔍 Detecting IB Gateway setup...${NC}"
echo ""

# Check if headless start script exists on VPS
HEADLESS_SCRIPT=$(ssh $VPS_USER@$VPS_HOST "ls /opt/trading-app/start-gateway.sh 2>/dev/null || ls /root/trading-app/start-gateway.sh 2>/dev/null || echo 'NOT_FOUND'")

if [ "$HEADLESS_SCRIPT" != "NOT_FOUND" ]; then
  echo -e "${GREEN}✅ Headless IB Gateway detected${NC}"
  echo "   Using: $HEADLESS_SCRIPT"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Use headless restart
  ./restart-headless.sh
else
  echo "⚠️  Headless script not found"
  echo "   Falling back to VNC method..."
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  echo "MANUAL RESTART REQUIRED:"
  echo ""
  echo "1. Connect via VNC:"
  echo "   ssh -L 5901:localhost:5901 $VPS_USER@$VPS_HOST"
  echo "   VNC Viewer → localhost:5901"
  echo ""
  echo "2. On VPS, run:"
  echo "   ssh $VPS_USER@$VPS_HOST"
  echo "   bash /root/trading-app/restart-vps.sh"
  echo ""
  echo "Or create headless start script at:"
  echo "   /opt/trading-app/start-gateway.sh"
  echo ""
fi

