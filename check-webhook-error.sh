#!/bin/bash
# Check error logs for 500 error

echo "🔍 CHECKING WEBHOOK ERROR LOGS"
echo "==============================="
echo ""

ssh root@165.227.104.40 << 'ENDSSH'

echo "📄 Last 50 error logs:"
pm2 logs trading-app --err --lines 50 --nostream

echo ""
echo "📄 Last 30 regular logs (looking for webhook errors):"
pm2 logs trading-app --lines 30 --nostream | grep -A 10 -B 5 "webhook\|error\|Error\|500" || pm2 logs trading-app --lines 30 --nostream

ENDSSH

echo ""
echo "✅ Check complete!"

