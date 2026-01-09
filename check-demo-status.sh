#!/bin/bash

echo "🔍 DEMO BROKER STATUS CHECK"
echo "========================================"
echo ""

echo "1️⃣ Checking recent app logs for Demo initialization:"
ssh root@165.227.104.40 "pm2 logs trading-app --lines 100 --nostream" | grep -i "demo\|🎮" | tail -10

echo ""
echo "2️⃣ Checking recent app logs for broker initialization:"
ssh root@165.227.104.40 "pm2 logs trading-app --lines 100 --nostream" | grep -i "initializing\|connecting" | tail -15

echo ""
echo "3️⃣ Checking if brokerRouter.js has demo initialization code:"
ssh root@165.227.104.40 "grep -A 8 'Always initialize Demo mode' /root/trading-app/dist/services/brokerRouter.js"

echo ""
echo "4️⃣ Checking if demoClient.js exists and has connect method:"
ssh root@165.227.104.40 "grep -c 'connect()' /root/trading-app/dist/services/demoClient.js 2>&1"

echo ""
echo "5️⃣ Current app status:"
ssh root@165.227.104.40 "pm2 list"

echo ""
echo "6️⃣ Testing broker status endpoint:"
curl -s http://165.227.104.40:3000/admin/broker-status | python3 -m json.tool 2>/dev/null || curl -s http://165.227.104.40:3000/admin/broker-status

echo ""
echo "========================================"
echo "📋 DIAGNOSIS:"
echo ""
echo "✅ If you see '🎮 DEMO MODE connected' → Demo is working!"
echo "❌ If you only see 'Connecting to IBKR Gateway' → Demo is NOT initializing"
echo ""
echo "To fix: Run the EMERGENCY_FIX.sh script"

