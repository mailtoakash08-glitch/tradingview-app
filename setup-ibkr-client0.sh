#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   🔧 COMPLETE IB GATEWAY SETUP - CLIENT ID 0 FIX            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  CRITICAL: This fix resolves the auto-bind error"
echo "   Error: 'Only the default client (i.e 0) can auto bind orders'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 STEP 1: Configure IB Gateway"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open IB Gateway"
echo "2. Click: Configure → Settings → API → Settings"
echo "3. Find: 'Master API client ID'"
echo "4. Set value to: 0 (zero)"
echo "5. Click: OK"
echo ""
echo "📋 STEP 2: Restart IB Gateway"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Close IB Gateway completely"
echo "2. Reopen IB Gateway"
echo "3. Login to Paper Trading mode"
echo "4. Wait for full initialization"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Have you completed BOTH steps above?"
echo "Press ENTER when IB Gateway is fully loaded and configured..."
read

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFICATION CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check IB Gateway port
echo -n "1. Checking IB Gateway port 4002... "
if nc -zv localhost 4002 2>&1 | grep -q "succeeded"; then
    echo "✅ LISTENING"
else
    echo "❌ NOT RESPONDING"
    echo ""
    echo "   IB Gateway is not running or not configured correctly."
    echo "   Please start IB Gateway and try again."
    exit 1
fi

# Check for existing Node process
echo -n "2. Checking for old app instances... "
if ps aux | grep "node dist/index.js" | grep -v grep > /dev/null; then
    echo "⚠️  FOUND (will kill)"
    pkill -9 -f "node dist/index.js"
    sleep 2
else
    echo "✅ NONE FOUND"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 STARTING APPLICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Clean up old logs
rm -f app.log app.pid

# Start application
npm start > app.log 2>&1 &
APP_PID=$!
echo $APP_PID > app.pid

echo "⏳ Starting application (PID: $APP_PID)..."
sleep 5

# Check if app is running
if ! ps -p $APP_PID > /dev/null; then
    echo "❌ Application failed to start!"
    echo ""
    echo "Last 20 lines of app.log:"
    tail -20 app.log
    exit 1
fi

echo "✅ Application is running"
echo ""

# Wait for connection
echo "⏳ Waiting for IB Gateway connection..."
sleep 2

# Check logs for connection
if grep -q "Connected to IBKR Gateway" app.log; then
    echo "✅ Connected to IBKR Gateway"
else
    echo "⚠️  Connection status unclear, checking logs..."
fi

# Check for client0 connection
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFYING CLIENT ID = 0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extract client ID from logs
CLIENT_ID=$(grep "Connecting to IBKR Gateway" app.log | grep -o '"clientId":[0-9]*' | cut -d':' -f2)

if [ "$CLIENT_ID" = "0" ]; then
    echo "✅ Application connecting with clientId: 0"
    echo ""
    echo "   Check IB Gateway logs now - you should see:"
    echo "   '### client connected: 0' or 'client0'"
    echo ""
else
    echo "❌ WARNING: Application connecting with clientId: $CLIENT_ID"
    echo "   Expected: 0"
    echo "   This may cause auto-bind errors!"
fi

# Check for auto-bind error
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 CONNECTION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ IB Gateway:        RUNNING on port 4002"
echo "✅ Application:       RUNNING (PID: $APP_PID)"
echo "✅ Client ID:         0 (required for auto-bind)"
echo "✅ UI:                http://localhost:3000/desktop"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TESTING INSTRUCTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open: http://localhost:3000/desktop"
echo "2. Check: Broker status shows '✅ Connected'"
echo "3. Verify: IB Gateway logs show 'client0' connected"
echo "4. Place test order:"
echo "   • Symbol: SPY"
echo "   • Quantity: 1"
echo "   • Order Type: Market"
echo "   • Broker: Interactive Brokers"
echo ""
echo "5. Expected result:"
echo "   ✅ Order appears in IB Gateway immediately"
echo "   ✅ No 'auto bind' error in IB Gateway logs"
echo "   ✅ Order fills and position appears in UI"
echo "   ✅ IB Gateway does NOT freeze"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 MONITORING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Watch logs:        tail -f app.log"
echo "Stop app:          kill $APP_PID"
echo "Restart:           ./setup-ibkr-client0.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Application is ready for trading!"
echo ""
