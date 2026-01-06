#!/bin/bash
set -e

echo "🚀 DEPLOYING..."

cd /Users/dev/Documents/tradingview

# Commit locally
git add -A
git commit -m "Fix: Order ID mapping - $(date)" || true
git push origin main

# Deploy to VPS
ssh root@165.227.104.40 << 'EOF'
cd /root/trading-app
git pull origin main
npm run build
pm2 restart trading-app
pm2 logs trading-app --lines 10 --nostream
EOF

echo "✅ DEPLOYED!"

