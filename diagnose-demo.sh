#!/bin/bash
# Diagnose and fix demo deployment

cd /Users/dev/Documents/tradingview

echo "🔍 Step 1: Check if demoClient.ts exists locally"
ls -la src/services/demoClient.ts

echo ""
echo "📋 Step 2: Check git status"
git status src/services/

echo ""
echo "🔎 Step 3: Check if file is in git repo"
git ls-files src/services/ | grep -i demo

echo ""
echo "📦 Step 4: Check what's actually on GitHub"
git log --oneline --all --decorate | head -10

echo ""
echo "🚀 Step 5: Try to add ALL src files"
git add src/
git status

echo ""
echo "💾 Step 6: Commit if there's anything"
git commit -m "Add all src files including demoClient" || echo "Nothing to commit"

echo ""
echo "📤 Step 7: Push"
git push origin main

echo ""
echo "🔧 Step 8: Check what files are on VPS"
ssh root@165.227.104.40 "ls -la /root/trading-app/src/services/ | grep -i demo"

echo ""
echo "✅ DONE!"

