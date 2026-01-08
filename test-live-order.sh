#!/bin/bash

echo "==========================================="
echo "🧪 LIVE ORDER PLACEMENT TEST"
echo "==========================================="
echo ""

echo "📋 Step 1: Monitor logs in real-time..."
echo ""

ssh root@165.227.104.40 << 'EOF'
echo "Starting live log monitoring..."
echo "Waiting for you to place order through http://165.227.104.40:3000/desktop"
echo ""
echo "Instructions:"
echo "1. Open http://165.227.104.40:3000/desktop in your browser"
echo "2. Click AAPL in the left watchlist"
echo "3. Ensure Order Type is 'Market'"
echo "4. Set Quantity to 1"
echo "5. Click the green BUY button"
echo ""
echo "Watching for order activity..."
echo "============================================"
echo ""

# Follow logs and highlight order-related activity
pm2 logs trading-app --lines 0 | grep --line-buffered -E "webhook|Placing|order placed|Execution|Position|AAPL|error"
EOF

