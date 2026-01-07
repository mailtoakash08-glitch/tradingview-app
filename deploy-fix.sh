#!/bin/bash
echo "🚀 Deploying position detection fix..."
ssh root@165.227.104.40 "cd /root/trading-app && git pull origin main && npm run build && pm2 restart trading-app && sleep 3 && echo '✅ Deployed!' && pm2 logs trading-app --lines 30 --nostream | grep -E 'Position|Subscribed|Connected'"
echo ""
echo "📊 Check positions at: http://165.227.104.40:3000/desktop"
echo ""
echo "🔄 Or refresh page if already open!"

