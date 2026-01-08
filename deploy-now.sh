#!/bin/bash
echo "🚀 Deploying fixed version..."
ssh root@165.227.104.40 "cd /root/trading-app && git pull origin main && npm run build && pm2 restart trading-app && echo '✅ Deployed successfully!' && sleep 3 && pm2 logs trading-app --lines 20 --nostream"
echo ""
echo "✅ Deployment complete!"
echo "🌐 Open: http://165.227.104.40:3000/desktop"

