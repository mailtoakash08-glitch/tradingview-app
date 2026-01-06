#!/bin/bash

# Quick VPS Health Check (Fast Version)
# Use this for quick daily checks before trading

VPS_HOST="165.227.104.40"
VPS_USER="root"
APP_PORT="3000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "⚡ QUICK STATUS CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. App Running?
echo -n "🚀 Trading App: "
if ssh $VPS_USER@$VPS_HOST "pm2 list | grep -q 'trading-app.*online'" 2>/dev/null; then
  echo -e "${GREEN}✅ Running${NC}"
else
  echo -e "${RED}❌ Not Running${NC}"
  exit 1
fi

# 2. IBKR Connected?
echo -n "🔌 IBKR Gateway: "
if ssh $VPS_USER@$VPS_HOST "pm2 logs trading-app --lines 50 --nostream 2>/dev/null | grep -q 'Connected to IBKR'" ; then
  echo -e "${GREEN}✅ Connected${NC}"
else
  echo -e "${RED}❌ Disconnected${NC}"
  echo ""
  echo "   💡 Fix: Connect via VNC and restart IB Gateway"
  echo "      ssh -L 5901:localhost:5901 $VPS_USER@$VPS_HOST"
  echo ""
  exit 1
fi

# 3. Open Positions
echo -n "💼 Positions: "
POSITIONS=$(curl -s http://$VPS_HOST:$APP_PORT/api/dashboard/positions 2>/dev/null | jq -r '.data.positions | length' 2>/dev/null || echo "0")
echo "$POSITIONS open"

# 4. Account Status
echo -n "💰 Account: "
ACCOUNT=$(curl -s http://$VPS_HOST:$APP_PORT/api/dashboard/account 2>/dev/null)
if echo "$ACCOUNT" | jq -e '.success' > /dev/null 2>&1; then
  BALANCE=$(echo "$ACCOUNT" | jq -r '.data.balance // "0"' 2>/dev/null)
  PNL=$(echo "$ACCOUNT" | jq -r '.data.unrealizedPnL // "0"' 2>/dev/null)
  echo "\$$BALANCE (P&L: \$$PNL)"
else
  echo -e "${YELLOW}⚠️  Unable to fetch${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ System Ready for Trading!${NC}"
echo ""
echo "📊 Desktop: http://$VPS_HOST:$APP_PORT/desktop"
echo ""

