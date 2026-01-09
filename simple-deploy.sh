#!/bin/bash
# SIMPLE DEPLOY - Just runs the commands

cd /Users/dev/Documents/tradingview

echo "Step 1: Committing..."
git add -A
git commit -m "Add demo mode"

echo "Step 2: Pushing..."
git push origin main

echo "Step 3: Deploying to VPS..."
ssh root@165.227.104.40 << 'EOF'
cd /root/trading-app
git pull origin main
npm install
npm run build
pm2 restart trading-app
sleep 3
pm2 logs trading-app --lines 20 --nostream
EOF

echo "DONE! Try demo mode now!"

