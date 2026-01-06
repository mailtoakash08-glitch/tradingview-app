#!/bin/bash

# VPS Status Checker
# Quick health check for trading automation

set -e

VPS_HOST="165.227.104.40"
VPS_USER="root"
APP_PORT="3000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 CHECKING VPS STATUS @ $VPS_HOST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if VPS is reachable
echo -n "📡 VPS Connectivity... "
if ping -c 1 -W 2 $VPS_HOST &> /dev/null; then
  echo -e "${GREEN}✅ Online${NC}"
else
  echo -e "${RED}❌ Offline${NC}"
  exit 1
fi

# Check PM2 status
echo -n "🚀 Trading App (PM2)... "
PM2_STATUS=$(ssh $VPS_USER@$VPS_HOST "pm2 jlist" 2>/dev/null)
if echo "$PM2_STATUS" | grep -q "trading-app"; then
  APP_STATUS=$(echo "$PM2_STATUS" | jq -r '.[0].pm2_env.status' 2>/dev/null || echo "unknown")
  if [ "$APP_STATUS" = "online" ]; then
    echo -e "${GREEN}✅ Running${NC}"
  else
    echo -e "${YELLOW}⚠️  Status: $APP_STATUS${NC}"
  fi
else
  echo -e "${RED}❌ Not Running${NC}"
  exit 1
fi

# Check HTTP endpoint
echo -n "🌐 HTTP Server... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$VPS_HOST:$APP_PORT/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Healthy (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${RED}❌ Unhealthy (HTTP $HTTP_CODE)${NC}"
fi

# Check IBKR Gateway connection
echo -n "🔌 IBKR Gateway... "
IBKR_CONNECTED=$(ssh $VPS_USER@$VPS_HOST "pm2 logs trading-app --lines 100 --nostream 2>/dev/null | grep -i 'connected to ibkr' | tail -1" || echo "")
if [ -n "$IBKR_CONNECTED" ]; then
  echo -e "${GREEN}✅ Connected${NC}"
else
  echo -e "${RED}❌ Disconnected${NC}"
  echo -e "   ${YELLOW}→ You may need to restart IB Gateway${NC}"
fi

# Check for recent errors
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 RECENT ACTIVITY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get positions
echo "💼 Open Positions:"
POSITIONS=$(curl -s http://$VPS_HOST:$APP_PORT/api/dashboard/positions 2>/dev/null || echo '{"success":false}')
if echo "$POSITIONS" | jq -e '.success' > /dev/null 2>&1; then
  POSITION_COUNT=$(echo "$POSITIONS" | jq -r '.data.positions | length' 2>/dev/null || echo "0")
  if [ "$POSITION_COUNT" -gt 0 ]; then
    echo "$POSITIONS" | jq -r '.data.positions[] | "   • \(.symbol): \(.quantity) shares @ $\(.avgEntryPrice) | P&L: $\(.unrealizedPnL)"' 2>/dev/null || echo "   (Error parsing positions)"
  else
    echo "   No open positions"
  fi
else
  echo -e "   ${RED}❌ Failed to fetch positions${NC}"
fi

echo ""

# Get account summary
echo "💰 Account Summary:"
ACCOUNT=$(curl -s http://$VPS_HOST:$APP_PORT/api/dashboard/account 2>/dev/null || echo '{"success":false}')
if echo "$ACCOUNT" | jq -e '.success' > /dev/null 2>&1; then
  BALANCE=$(echo "$ACCOUNT" | jq -r '.data.balance // "N/A"' 2>/dev/null)
  BUYING_POWER=$(echo "$ACCOUNT" | jq -r '.data.buyingPower // "N/A"' 2>/dev/null)
  UNREALIZED_PNL=$(echo "$ACCOUNT" | jq -r '.data.unrealizedPnL // "N/A"' 2>/dev/null)
  
  echo "   • Balance: \$$BALANCE"
  echo "   • Buying Power: \$$BUYING_POWER"
  echo "   • Unrealized P&L: \$$UNREALIZED_PNL"
else
  echo -e "   ${RED}❌ Failed to fetch account data${NC}"
fi

echo ""

# Check last order
echo "📦 Last Order Placed:"
LAST_ORDER=$(ssh $VPS_USER@$VPS_HOST "pm2 logs trading-app --lines 500 --nostream 2>/dev/null | grep 'Order submitted to IBKR' | tail -1" || echo "")
if [ -n "$LAST_ORDER" ]; then
  ORDER_TIME=$(echo "$LAST_ORDER" | jq -r '.timestamp' 2>/dev/null | cut -d'T' -f2 | cut -d'.' -f1 || echo "Unknown")
  ORDER_SYMBOL=$(echo "$LAST_ORDER" | jq -r '.data.symbol' 2>/dev/null || echo "Unknown")
  ORDER_ACTION=$(echo "$LAST_ORDER" | jq -r '.data.action' 2>/dev/null || echo "Unknown")
  ORDER_QTY=$(echo "$LAST_ORDER" | jq -r '.data.quantity' 2>/dev/null || echo "Unknown")
  
  echo "   • Time: $ORDER_TIME"
  echo "   • Symbol: $ORDER_SYMBOL"
  echo "   • Action: $ORDER_ACTION"
  echo "   • Quantity: $ORDER_QTY"
else
  echo "   No orders found today"
fi

echo ""

# Check for recent errors
echo "⚠️  Recent Errors (last 24h):"
ERROR_COUNT=$(ssh $VPS_USER@$VPS_HOST "pm2 logs trading-app --lines 1000 --nostream --err 2>/dev/null | grep -i 'error' | wc -l" || echo "0")
if [ "$ERROR_COUNT" -gt 0 ]; then
  echo -e "   ${YELLOW}⚠️  Found $ERROR_COUNT error(s)${NC}"
  echo "   Last 3 errors:"
  ssh $VPS_USER@$VPS_HOST "pm2 logs trading-app --lines 1000 --nostream --err 2>/dev/null | grep -i 'error' | tail -3" | sed 's/^/      /' || echo "      (Unable to fetch)"
else
  echo -e "   ${GREEN}✅ No errors${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 QUICK ACTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📊 View Desktop:    http://$VPS_HOST:$APP_PORT/desktop"
echo "  📜 View Logs:       ssh $VPS_USER@$VPS_HOST 'pm2 logs trading-app'"
echo "  🔄 Restart App:     ssh $VPS_USER@$VPS_HOST 'pm2 restart trading-app'"
echo "  🖥️  Connect VNC:     ssh -L 5901:localhost:5901 $VPS_USER@$VPS_HOST"
echo "  📦 Deploy Update:   ./deploy-commit.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Status check complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

