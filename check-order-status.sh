#!/bin/bash

echo "==========================================="
echo "📊 CHECK ORDER STATUS"
echo "==========================================="
echo ""

ssh root@165.227.104.40 << 'EOF'
echo "📋 Orders in App Database:"
echo ""
curl -s http://localhost:3000/api/dashboard/orders | jq -r '.data.orders[] | "Order: \(.orderId) | Symbol: \(.symbol) | Status: \(.status) | Qty: \(.quantity) | Submitted: \(.submittedAt)"'

echo ""
echo "==========================================="
echo "📊 Last 10 lines of logs (order status):"
echo "==========================================="
pm2 logs trading-app --lines 20 --nostream | grep -i "order\|status\|fill\|exec\|position" | tail -10

echo ""
echo "==========================================="
echo "✅ Check complete"
echo "==========================================="
EOF

