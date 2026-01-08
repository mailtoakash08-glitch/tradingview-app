#!/bin/bash

echo "==========================================="
echo "📊 CHECK REAL-TIME LOGS"
echo "==========================================="
echo ""

ssh root@165.227.104.40 << 'EOF'
echo "📋 Last 50 lines of trading app logs:"
echo ""
pm2 logs trading-app --lines 50 --nostream

echo ""
echo "==========================================="
echo "📊 FILTER: Order & Execution Activity"
echo "==========================================="
pm2 logs trading-app --lines 100 --nostream | grep -i "placing\|order placed\|execution\|position\|filled"

echo ""
echo "==========================================="
echo "✅ Check complete"
echo "==========================================="
EOF

