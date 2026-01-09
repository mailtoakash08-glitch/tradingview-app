#!/bin/bash

# Test IBKR Paper Trading
# This script tests order placement with Interactive Brokers

set -e

VPS_HOST="165.227.104.40"
VPS_PORT="3000"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏦 TESTING IBKR PAPER TRADING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check IB Gateway is connected
echo -e "${BLUE}[1/5]${NC} Checking IB Gateway connection..."
BROKER_STATUS=$(curl -s http://$VPS_HOST:$VPS_PORT/admin/broker-status)
echo "$BROKER_STATUS" | jq '.'

IBKR_CONNECTED=$(echo "$BROKER_STATUS" | jq -r '.brokers.ibkr.connected')
if [ "$IBKR_CONNECTED" = "true" ]; then
  echo -e "   ${GREEN}✅ IB Gateway connected!${NC}"
else
  echo -e "   ${RED}❌ IB Gateway not connected${NC}"
  echo ""
  echo "Please make sure:"
  echo "  1. IB Gateway is running on VPS"
  echo "  2. You're logged in"
  echo "  3. Port 4002 is open"
  echo ""
  exit 1
fi

echo ""

# Step 2: Check current positions
echo -e "${BLUE}[2/5]${NC} Checking current positions..."
POSITIONS=$(curl -s http://$VPS_HOST:$VPS_PORT/api/dashboard/positions)
POSITION_COUNT=$(echo "$POSITIONS" | jq '.data.positions | length')
echo "   Current positions: $POSITION_COUNT"

echo ""

# Step 3: Check account status
echo -e "${BLUE}[3/5]${NC} Checking account status..."
ACCOUNT=$(curl -s http://$VPS_HOST:$VPS_PORT/api/dashboard/account)
echo "$ACCOUNT" | jq '.data'

BALANCE=$(echo "$ACCOUNT" | jq -r '.data.balance')
echo -e "   ${GREEN}Account balance: \$$BALANCE${NC}"

echo ""

# Step 4: Place a small test order
echo -e "${BLUE}[4/5]${NC} Placing IBKR test order..."
echo "   Symbol: AAPL"
echo "   Quantity: 1 share (small test)"
echo "   Type: Market Order"
echo "   Broker: IBKR Paper Trading"
echo ""

read -p "Press Enter to place test order (or Ctrl+C to cancel)..."

PAYLOAD='{
  "strategy": "manual_bmnr",
  "action": "ENTRY_LONG",
  "symbol": "AAPL",
  "qty": 1,
  "broker": "ibkr",
  "orderType": "MKT",
  "outsideRth": false
}'

echo ""
echo "Placing order..."
ORDER_RESPONSE=$(curl -s -X POST http://$VPS_HOST:$VPS_PORT/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "$ORDER_RESPONSE" | jq '.'

ORDER_STATUS=$(echo "$ORDER_RESPONSE" | jq -r '.status')
if [ "$ORDER_STATUS" = "ok" ]; then
  ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.orderId')
  echo -e "   ${GREEN}✅ Order placed successfully!${NC}"
  echo -e "   ${GREEN}Order ID: $ORDER_ID${NC}"
else
  echo -e "   ${RED}❌ Order failed${NC}"
  REASON=$(echo "$ORDER_RESPONSE" | jq -r '.reason // .message // "Unknown error"')
  echo "   Reason: $REASON"
  exit 1
fi

echo ""

# Step 5: Wait and check for fill
echo -e "${BLUE}[5/5]${NC} Waiting for order to fill..."
echo "   ⏳ IBKR Paper Trading can take 5-60 seconds to fill..."
echo "   (Sometimes paper trading is slow or doesn't fill)"
echo ""

for i in {1..12}; do
  sleep 5
  POSITIONS_NOW=$(curl -s http://$VPS_HOST:$VPS_PORT/api/dashboard/positions)
  AAPL_POSITION=$(echo "$POSITIONS_NOW" | jq '.data.positions[] | select(.symbol == "AAPL")')
  
  if [ -n "$AAPL_POSITION" ]; then
    echo -e "   ${GREEN}✅ Order FILLED! Position created!${NC}"
    echo ""
    echo "$AAPL_POSITION" | jq '.'
    break
  else
    echo "   ⏳ Still waiting... (${i}x5s = ${i}0 seconds)"
  fi
  
  if [ $i -eq 12 ]; then
    echo ""
    echo -e "   ${YELLOW}⚠️  Order hasn't filled after 60 seconds${NC}"
    echo ""
    echo "This is normal for IBKR Paper Trading - it can be very slow."
    echo ""
    echo "Options:"
    echo "  1. Wait longer (check positions table in UI)"
    echo "  2. Check order status in UI"
    echo "  3. Try again with a more liquid symbol (SPY, QQQ)"
    echo "  4. Use Demo Mode instead (fills in 2 seconds)"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ IBKR TEST COMPLETE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Next steps:"
echo ""
echo "1. Open Desktop UI:"
echo "   http://$VPS_HOST:$VPS_PORT/desktop"
echo ""
echo "2. Select broker: 🏦 Interactive Brokers"
echo ""
echo "3. Place orders through UI"
echo ""
echo "4. Monitor positions in real-time"
echo ""
echo "💡 Tips:"
echo "  • Paper trading can be slow (30-60 seconds)"
echo "  • Use liquid symbols (AAPL, SPY, QQQ)"
echo "  • Start with 1-2 shares to test"
echo "  • Demo mode is faster for testing UI"
echo ""

