#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🔧 IB GATEWAY FREEZE FIX - RESTART PROCEDURE             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 STEPS TO FIX:"
echo ""
echo "1. ❌ CLOSE IB Gateway application completely"
echo "   • Force quit if necessary (Activity Monitor)"
echo ""
echo "2. ⏳ Wait 5 seconds"
echo ""
echo "3. ✅ RESTART IB Gateway"
echo "   • Login to Paper Trading mode"
echo "   • Wait for it to fully load"
echo ""
echo "4. ⚙️  VERIFY Settings:"
echo "   • Configure → Settings → API → Settings"
echo "   • ❌ Uncheck 'Read-Only API'"
echo "   • ✅ Check 'Allow connections from localhost only'"
echo "   • Set 'Master API client ID' to: 0"
echo "   • Click 'OK' and restart IB Gateway if needed"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After IB Gateway is fully loaded and ready, press ENTER to continue..."
read

echo ""
echo "🔍 Testing IB Gateway connection..."
if nc -zv localhost 4002 2>&1 | grep -q "succeeded"; then
    echo "✅ IB Gateway is listening on port 4002"
else
    echo "❌ IB Gateway is NOT responding on port 4002"
    echo "   Please make sure IB Gateway is running and try again."
    exit 1
fi

echo ""
echo "🚀 Starting application..."
npm start > app.log 2>&1 &
APP_PID=$!
echo $APP_PID > app.pid

echo "⏳ Waiting for application to start..."
sleep 5

echo ""
echo "🔍 Checking application status..."
if ps -p $APP_PID > /dev/null; then
    echo "✅ Application is running (PID: $APP_PID)"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🎯 WHAT WAS FIXED:"
    echo ""
    echo "❌ OLD BEHAVIOR:"
    echo "   • Made 10 API calls per order (overwhelming IB Gateway)"
    echo "   • Called reqAllOpenOrders() + reqOpenOrders() 5 times each"
    echo "   • Caused IB Gateway to freeze and not respond"
    echo ""
    echo "✅ NEW BEHAVIOR:"
    echo "   • NO manual polling - relies on automatic updates"
    echo "   • Uses reqAutoOpenOrders(true) for push notifications"
    echo "   • IB Gateway will NOT freeze anymore"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📊 Access your trading UI:"
    echo "   http://localhost:3000/desktop"
    echo ""
    echo "📝 View logs:"
    echo "   tail -f app.log"
    echo ""
    echo "🛑 Stop application:"
    echo "   kill $(cat app.pid)"
    echo ""
else
    echo "❌ Application failed to start. Check app.log for errors:"
    tail -20 app.log
    exit 1
fi
