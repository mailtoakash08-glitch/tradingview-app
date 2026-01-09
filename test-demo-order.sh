#!/bin/bash

# Test Demo Mode Order Placement

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
echo "🎮 TESTING DEMO MODE ORDER PLACEMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Check broker status
echo -e "${BLUE}[1/3]${NC} Checking broker status..."
BROKER_STATUS=$(curl -s http://$VPS_HOST:$VPS_PORT/admin/broker-status)
echo "$BROKER_STATUS" | jq '.'

DEMO_CONNECTED=$(echo "$BROKER_STATUS" | jq -r '.brokers.demo.connected')
if [ "$DEMO_CONNECTED" = "true" ]; then
  echo -e "   ${GREEN}✅ Demo broker connected${NC}"
else
  echo -e "   ${RED}❌ Demo broker not connected${NC}"
  exit 1
fi

echo ""

# Test 2: Place a demo market order
echo -e "${BLUE}[2/3]${NC} Placing demo market order (AAPL, 10 shares, BUY)..."

PAYLOAD='{
  "strategy": "manual_bmnr",
  "action": "ENTRY_LONG",
  "symbol": "AAPL",
  "qty": 10,
  "broker": "demo",
  "orderType": "MKT",
  "outsideRth": true
}'

echo "Payload: $PAYLOAD"
echo ""

RESPONSE=$(curl -s -X POST http://$VPS_HOST:$VPS_PORT/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "Response:"
echo "$RESPONSE" | jq '.'

ORDER_STATUS=$(echo "$RESPONSE" | jq -r '.status')
if [ "$ORDER_STATUS" = "ok" ]; then
  ORDER_ID=$(echo "$RESPONSE" | jq -r '.orderId')
  echo -e "   ${GREEN}✅ Order placed successfully! Order ID: $ORDER_ID${NC}"
else
  echo -e "   ${RED}❌ Order failed${NC}"
  echo "   Reason: $(echo "$RESPONSE" | jq -r '.reason // .message // "Unknown"')"
  exit 1
fi

echo ""

# Test 3: Wait and check positions
echo -e "${BLUE}[3/3]${NC} Waiting 3 seconds for demo fill..."
sleep 3

echo "Checking positions..."
POSITIONS=$(curl -s http://$VPS_HOST:$VPS_PORT/api/dashboard/positions)
echo "$POSITIONS" | jq '.'

POSITION_COUNT=$(echo "$POSITIONS" | jq '.positions | length')
echo -e "   ${GREEN}✅ Found $POSITION_COUNT position(s)${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ DEMO MODE TEST COMPLETE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Test with UI: http://$VPS_HOST:$VPS_PORT/desktop"
echo "   1. Select broker: 🎮 DEMO MODE"
echo "   2. Enter symbol: AAPL"
echo "   3. Enter quantity: 10"
echo "   4. Click BUY"
echo "   5. Wait 2 seconds - position should appear!"
echo ""

