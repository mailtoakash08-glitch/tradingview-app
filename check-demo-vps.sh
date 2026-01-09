#!/bin/bash

echo "=== Checking Demo Files on VPS ==="
echo ""

echo "1️⃣ Source files (should exist):"
ssh root@165.227.104.40 "ls -lh /root/trading-app/src/services/demoClient.ts /root/trading-app/src/services/brokerRouter.ts"

echo ""
echo "2️⃣ Compiled files (should exist after build):"
ssh root@165.227.104.40 "ls -lh /root/trading-app/dist/services/demoClient.js /root/trading-app/dist/services/brokerRouter.js 2>&1"

echo ""
echo "3️⃣ Checking if brokerRouter.js has demo code:"
ssh root@165.227.104.40 "grep -c 'demoClient' /root/trading-app/dist/services/brokerRouter.js"

echo ""
echo "4️⃣ Checking current app logs for demo:"
ssh root@165.227.104.40 "pm2 logs trading-app --lines 100 --nostream | grep -i demo | tail -5"

echo ""
echo "✅ Check complete!"

