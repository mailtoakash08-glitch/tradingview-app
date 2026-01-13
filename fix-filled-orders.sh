#!/bin/bash
# Fix Filled Orders - Manually update orders that TWS filled but didn't notify app

echo "🔄 Fixing filled orders from TWS..."

# TSLA TRAIL - Filled at $470.00
psql -d tradingdb -c "UPDATE \"Order\" SET status='FILLED', \"filledQuantity\"=1, \"avgFillPrice\"=470.00 WHERE symbol='TSLA' AND \"orderType\"='TRAIL' AND status='PENDING';"

# NVDA STP - Filled at $470.88
psql -d tradingdb -c "UPDATE \"Order\" SET status='FILLED', \"filledQuantity\"=1, \"avgFillPrice\"=470.88 WHERE symbol='NVDA' AND \"orderType\"='STP' AND status='PENDING';"

# AAPL LMT - Filled at $259.00
psql -d tradingdb -c "UPDATE \"Order\" SET status='FILLED', \"filledQuantity\"=1, \"avgFillPrice\"=259.00 WHERE symbol='AAPL' AND \"orderType\"='LMT' AND status='PENDING';"

echo "✅ Orders updated! Refresh the web UI to see changes."
