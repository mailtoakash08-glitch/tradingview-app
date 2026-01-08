#!/bin/bash
cd /Users/dev/Documents/tradingview
echo "🔧 Fixing and deploying..."
git add src/routes/desktop.ts
git commit -m "Fix template literal syntax in visual order lines"
git push origin main
ssh root@165.227.104.40 "cd /root/trading-app && git pull && npm run build && pm2 restart trading-app"
echo "✅ Fixed and deployed!"
echo "Visit: http://165.227.104.40:3000/desktop"

