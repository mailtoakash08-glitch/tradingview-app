#!/bin/bash

# Diagnostic script to check order fill status

echo "🔍 Checking Order Fill Status..."
echo ""

ssh root@165.227.104.40 << 'EOF'

echo "=== Recent Order Submissions ==="
pm2 logs trading-app --lines 500 --nostream | grep "Order submitted to IBKR" | tail -5

echo ""
echo "=== Order Status Updates ==="
pm2 logs trading-app --lines 500 --nostream | grep "Order status update" | tail -10

echo ""
echo "=== Position Updates ==="
pm2 logs trading-app --lines 500 --nostream | grep -i "position" | tail -10

echo ""
echo "=== IBKR Errors ==="
pm2 logs trading-app --lines 200 --nostream --err | grep -i "error\|warn" | tail -10

echo ""
echo "=== Environment Check ==="
cat /root/trading-app/.env | grep IBKR

EOF

