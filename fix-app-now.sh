#!/bin/bash

# 🔧 FIX APP - Diagnose and restart the trading app

set -e

VPS_HOST="165.227.104.40"
VPS_USER="root"

echo "🔍 DIAGNOSING APP STATUS ON VPS..."
echo "=================================="

ssh "$VPS_USER@$VPS_HOST" << 'EOF'

echo ""
echo "📊 Step 1: Check PM2 Status"
echo "----------------------------"
pm2 list

echo ""
echo "📋 Step 2: Check Recent Logs (Last 50 lines)"
echo "---------------------------------------------"
pm2 logs trading-app --lines 50 --nostream || echo "⚠️  No logs found"

echo ""
echo "🔍 Step 3: Check for Error Patterns"
echo "-----------------------------------"
echo "Looking for common errors..."
pm2 logs trading-app --lines 100 --nostream 2>&1 | grep -i "error\|failed\|exception\|cannot find\|undefined" | tail -20 || echo "✅ No obvious errors found"

echo ""
echo "📦 Step 4: Check if dist/ directory exists"
echo "------------------------------------------"
ls -la /root/trading-app/dist/ 2>&1 | head -10 || echo "❌ dist/ directory missing or empty"

echo ""
echo "🔄 Step 5: Attempting to Fix..."
echo "--------------------------------"

cd /root/trading-app

# Kill any existing process
echo "Stopping app..."
pm2 delete trading-app 2>/dev/null || echo "App was not running"

# Check if source files exist
if [ ! -f "src/index.ts" ]; then
  echo "❌ ERROR: Source files missing!"
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install 2>&1 | tail -10

# Build
echo "Building app..."
rm -rf dist/
npm run build 2>&1 | tail -20

# Check if build succeeded
if [ ! -f "dist/index.js" ]; then
  echo "❌ BUILD FAILED! Showing last errors:"
  npm run build 2>&1 | tail -50
  exit 1
fi

echo "✅ Build successful!"

# Start app
echo "Starting app..."
pm2 start dist/index.js --name trading-app
pm2 save

echo ""
echo "✅ App restarted! Checking status..."
sleep 3
pm2 list

echo ""
echo "📄 Fresh logs:"
pm2 logs trading-app --lines 30 --nostream

echo ""
echo "🎯 TESTING ENDPOINTS:"
echo "--------------------"
sleep 2

echo "1. Health check:"
curl -s http://localhost:3000/health | jq '.' || curl -s http://localhost:3000/health

echo ""
echo "2. Broker status:"
curl -s http://localhost:3000/admin/broker-status | jq '.' || curl -s http://localhost:3000/admin/broker-status

EOF

echo ""
echo "✅ DIAGNOSTICS COMPLETE!"
echo ""
echo "🌐 Try accessing:"
echo "   http://165.227.104.40:3000/desktop"
echo "   http://165.227.104.40:3000/admin/broker-status"
echo ""

