#!/bin/bash

echo "========================================="
echo "🔍 EMERGENCY DIAGNOSTIC - $(date)"
echo "========================================="
echo ""

VPS_HOST="165.227.104.40"
VPS_USER="root"

echo "📋 Step 1: Check if trading app is running..."
ssh "$VPS_USER@$VPS_HOST" "pm2 list"
echo ""

echo "📋 Step 2: Check IBKR connection status..."
ssh "$VPS_USER@$VPS_HOST" "tail -50 /root/.pm2/logs/trading-app-out.log | grep -i 'connected\|error\|order\|fill'"
echo ""

echo "📋 Step 3: Check recent errors..."
ssh "$VPS_USER@$VPS_HOST" "tail -50 /root/.pm2/logs/trading-app-error.log"
echo ""

echo "📋 Step 4: Check IB Gateway process..."
ssh "$VPS_USER@$VPS_HOST" "ps aux | grep -i gateway | grep -v grep"
echo ""

echo "📋 Step 5: Test API endpoints..."
echo "Testing /api/dashboard/positions..."
ssh "$VPS_USER@$VPS_HOST" "curl -s http://localhost:3000/api/dashboard/positions | jq '.'"
echo ""

echo "Testing /api/dashboard/orders..."
ssh "$VPS_USER@$VPS_HOST" "curl -s http://localhost:3000/api/dashboard/orders | jq '.data.orders | .[:3]'"
echo ""

echo "📋 Step 6: Check IB Gateway API settings..."
ssh "$VPS_USER@$VPS_HOST" "cat /root/Jts/jts.ini | grep -E 'LocalServerPort|TrustedIPs|ApiOnly'"
echo ""

echo "========================================="
echo "✅ Diagnostic complete"
echo "========================================="

