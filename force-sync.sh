#!/bin/bash

echo "==========================================="
echo "🔄 FORCE EXECUTION SYNC FROM IBKR"
echo "==========================================="
echo ""

echo "This will manually request all executions from IBKR"
echo "and create positions if any orders filled..."
echo ""

ssh root@165.227.104.40 << 'EOF'
echo "📋 Restarting trading app to force execution sync..."
pm2 restart trading-app

echo ""
echo "⏳ Waiting 5 seconds for connection..."
sleep 5

echo ""
echo "📊 Checking connection status..."
pm2 logs trading-app --lines 30 --nostream | grep -i "connected\|execution\|position" | tail -10

echo ""
echo "📋 Current orders status:"
curl -s http://localhost:3000/api/dashboard/orders | jq -r '.data.orders[] | "Order: \(.orderId) | Symbol: \(.symbol) | Status: \(.status) | Filled: \(.filledQuantity)/\(.quantity)"'

echo ""
echo "📊 Current positions:"
curl -s http://localhost:3000/api/dashboard/positions | jq -r '.data.positions[] | "Position: \(.symbol) | Qty: \(.quantity) | Entry: \(.entryPrice) | P&L: \(.unrealizedPnL)"'

if [ -z "$(curl -s http://localhost:3000/api/dashboard/positions | jq -r '.data.positions[]')" ]; then
  echo "❌ No positions found"
else
  echo "✅ Positions loaded!"
fi

EOF

echo ""
echo "==========================================="
echo "✅ Sync complete"
echo "==========================================="
echo ""
echo "Check http://165.227.104.40:3000/desktop to see positions"

