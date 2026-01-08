#!/bin/bash
echo "🚀 DEPLOYING VISUAL ORDER LINES..."
cd /Users/dev/Documents/tradingview
git add -A
git commit -m "Add visual order lines on chart" 
git push origin main
ssh root@165.227.104.40 "cd /root/trading-app && git pull && npm run build && pm2 restart trading-app"
echo "✅ Done! Visit: http://165.227.104.40:3000/desktop"

