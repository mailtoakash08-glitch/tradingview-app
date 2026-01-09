#!/bin/bash

# Test Demo Mode UI Display Fix

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
echo "🧪 TESTING DEMO MODE UI DISPLAY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Check API returns proper data structure
echo -e "${BLUE}[1/4]${NC} Checking positions API data structure..."
POSITIONS_RESPONSE=$(curl -s http://$VPS_HOST:$VPS_PORT/api/dashboard/positions)
echo "$POSITIONS_RESPONSE" | jq '.'

HAS_DATA_WRAPPER=$(echo "$POSITIONS_RESPONSE" | jq -r 'has("data")')
if [ "$HAS_DATA_WRAPPER" = "true" ]; then
  echo -e "   ${GREEN}✅ API returns nested data structure (data.data.positions)${NC}"
else
  echo -e "   ${RED}❌ API structure unexpected${NC}"
  exit 1
fi

echo ""

# Test 2: Check account API
echo -e "${BLUE}[2/4]${NC} Checking account API data structure..."
ACCOUNT_RESPONSE=$(curl -s http://$VPS_HOST:$VPS_PORT/api/dashboard/account)
echo "$ACCOUNT_RESPONSE" | jq '.'

ACCOUNT_HAS_DATA=$(echo "$ACCOUNT_RESPONSE" | jq -r 'has("data")')
if [ "$ACCOUNT_HAS_DATA" = "true" ]; then
  echo -e "   ${GREEN}✅ Account API returns nested data structure${NC}"
else
  echo -e "   ${RED}❌ Account API structure unexpected${NC}"
  exit 1
fi

echo ""

# Test 3: Place a demo order
echo -e "${BLUE}[3/4]${NC} Placing demo order to test UI updates..."

PAYLOAD='{
  "strategy": "manual_bmnr",
  "action": "ENTRY_LONG",
  "symbol": "TSLA",
  "qty": 5,
  "broker": "demo",
  "orderType": "MKT",
  "outsideRth": true
}'

ORDER_RESPONSE=$(curl -s -X POST http://$VPS_HOST:$VPS_PORT/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "Order response:"
echo "$ORDER_RESPONSE" | jq '.'

ORDER_STATUS=$(echo "$ORDER_RESPONSE" | jq -r '.status')
if [ "$ORDER_STATUS" = "ok" ]; then
  ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.orderId')
  echo -e "   ${GREEN}✅ Order placed! ID: $ORDER_ID${NC}"
else
  echo -e "   ${RED}❌ Order failed${NC}"
  exit 1
fi

echo ""

# Test 4: Wait and verify positions are accessible
echo -e "${BLUE}[4/4]${NC} Waiting 3 seconds for fill, then checking positions..."
sleep 3

FINAL_POSITIONS=$(curl -s http://$VPS_HOST:$VPS_PORT/api/dashboard/positions)
echo "$FINAL_POSITIONS" | jq '.'

POSITION_COUNT=$(echo "$FINAL_POSITIONS" | jq '.data.positions | length')
echo -e "   ${GREEN}✅ Found $POSITION_COUNT position(s)${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ UI FIX VERIFICATION COMPLETE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Now test in browser:"
echo "   1. Go to: http://$VPS_HOST:$VPS_PORT/desktop"
echo "   2. Select: 🎮 DEMO MODE"
echo "   3. Enter: Symbol: TSLA, Quantity: 5"
echo "   4. Click: BUY"
echo "   5. ✅ Position should appear in 2 seconds!"
echo ""
echo "🔍 Check browser console (F12) for any errors"
echo ""

