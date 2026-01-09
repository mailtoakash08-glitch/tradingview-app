#!/bin/bash
set -e

echo "🔍 DIAGNOSING DEMO MODE ISSUE..."
echo ""

# Step 1: Check if files exist on VPS
echo "1️⃣ Checking source files on VPS:"
ssh root@165.227.104.40 "ls -lh /root/trading-app/src/services/demoClient.ts /root/trading-app/src/services/brokerRouter.ts 2>&1"

echo ""
echo "2️⃣ Checking if demoClient.js was compiled:"
ssh root@165.227.104.40 "ls -lh /root/trading-app/dist/services/demoClient.js 2>&1"

echo ""
echo "3️⃣ Checking brokerRouter.js imports:"
ssh root@165.227.104.40 "head -15 /root/trading-app/dist/services/brokerRouter.js 2>&1"

echo ""
echo "4️⃣ Checking if initializeBrokers has demo code:"
ssh root@165.227.104.40 "grep -A 20 'initializeBrokers' /root/trading-app/dist/services/brokerRouter.js | head -25"

echo ""
echo "========================================"
echo "🔧 APPLYING FIX..."
echo "========================================"

# Force rebuild on VPS
ssh root@165.227.104.40 << 'ENDSSH'
cd /root/trading-app

echo ""
echo "📁 Current source files:"
ls -lh src/services/demoClient.ts src/services/brokerRouter.ts

echo ""
echo "🗑️ Removing dist folder..."
rm -rf dist/

echo ""
echo "🔨 Rebuilding TypeScript..."
npm run build 2>&1 | tail -10

echo ""
echo "✅ Checking compiled files:"
ls -lh dist/services/demoClient.js dist/services/brokerRouter.js

echo ""
echo "🔄 Restarting PM2..."
pm2 restart trading-app

echo ""
echo "⏳ Waiting 5 seconds for startup..."
sleep 5

echo ""
echo "========================================="
echo "📋 CHECKING LOGS FOR DEMO INITIALIZATION"
echo "========================================="
pm2 logs trading-app --lines 30 --nostream | grep -i "starting\|initializing\|connecting\|demo" | tail -10

ENDSSH

echo ""
echo "✅ Fix applied!"
echo ""
echo "🎮 Go to: http://165.227.104.40:3000/desktop"
echo "   Select '🎮 DEMO MODE' and place a test order!"

