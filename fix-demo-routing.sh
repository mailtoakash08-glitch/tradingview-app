#!/bin/bash
set -e

echo "🔧 FIXING DEMO ORDER ROUTING"
echo ""

# The issue: placeOrder function is not routing demo orders correctly
# Solution: Force rebuild of brokerRouter.js

ssh root@165.227.104.40 << 'ENDSSH'
cd /root/trading-app

echo "1️⃣ Checking current placeOrder function:"
grep -A 30 "async placeOrder" dist/services/brokerRouter.js | head -35

echo ""
echo "2️⃣ Removing old compiled brokerRouter.js:"
rm -f dist/services/brokerRouter.js

echo ""
echo "3️⃣ Rebuilding:"
npm run build

echo ""
echo "4️⃣ Verifying new placeOrder has demo case:"
grep -A 30 "async placeOrder" dist/services/brokerRouter.js | grep -E "case \"demo\"" || echo "❌ DEMO CASE NOT FOUND!"

echo ""
echo "5️⃣ Restarting app:"
pm2 restart trading-app
sleep 3

echo ""
echo "6️⃣ Testing broker status:"
curl -s http://localhost:3000/admin/broker-status | grep -o '"demo":{[^}]*}' || echo "No demo status"

ENDSSH

echo ""
echo "✅ Fix applied!"
echo "🎮 Now try placing an order with DEMO MODE selected!"

