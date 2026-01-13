#!/bin/bash

echo "=========================================="
echo "🔍 IB GATEWAY CONNECTION DIAGNOSTICS"
echo "=========================================="
echo ""

echo "1️⃣ Checking if IB Gateway is running on port 4002..."
nc -zv localhost 4002 2>&1 | grep -q "succeeded" && echo "✅ Port 4002 is open" || echo "❌ Port 4002 is NOT accessible"
echo ""

echo "2️⃣ Checking application configuration..."
grep "IBKR_PORT\|IBKR_CLIENT_ID" /Users/dev/Documents/tradingview/.env | head -2
echo ""

echo "3️⃣ Checking current app log for connection..."
grep "Connected to IBKR\|clientId\|reqAutoOpenOrders" /Users/dev/Documents/tradingview/app.log | tail -5
echo ""

echo "4️⃣ Checking for ANY order-related events in last 100 lines..."
tail -100 /Users/dev/Documents/tradingview/app.log | grep -c "OPEN ORDER EVENT\|ORDER STATUS\|IB Gateway Event" || echo "0 events found"
echo ""

echo "5️⃣ Checking database for pending orders..."
psql -d tradingdb -t -c "SELECT COUNT(*) FROM \"Order\" WHERE status = 'PENDING';"
echo ""

echo "=========================================="
echo "📋 NEXT STEPS:"
echo "=========================================="
echo ""
echo "In IB Gateway, verify these settings:"
echo "  1. File → Global Configuration → API → Settings"
echo "  2. ✅ 'Enable ActiveX and Socket Clients' is CHECKED"
echo "  3. ✅ 'Allow connections from localhost only' is CHECKED"
echo "  4. ❌ 'Read-Only API' is UNCHECKED"
echo "  5. 'Socket port' shows: 4002"
echo "  6. 'Master API client ID' is set to: 0"
echo ""
echo "Then restart IB Gateway and run this app again."
echo ""
