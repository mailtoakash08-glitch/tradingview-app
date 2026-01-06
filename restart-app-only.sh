#!/bin/bash

# Quick Emergency Restart
# Fast script to restart just the trading app (when IB Gateway is already running)

VPS_HOST="165.227.104.40"
VPS_USER="root"
APP_DIR="/root/trading-app"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🔄 Quick Restart - Trading App Only${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh $VPS_USER@$VPS_HOST << EOF
echo "→ Restarting PM2 process..."
pm2 restart trading-app 2>/dev/null || pm2 start $APP_DIR/dist/index.js --name trading-app

echo "→ Saving PM2 state..."
pm2 save

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Status:"
pm2 list

echo ""
echo "Recent logs:"
pm2 logs trading-app --lines 15 --nostream
EOF

echo ""
echo -e "${GREEN}✅ Trading app restarted${NC}"
echo ""
echo "📊 Desktop: http://$VPS_HOST:3000/desktop"
echo "📜 Logs: ssh $VPS_USER@$VPS_HOST 'pm2 logs trading-app'"
echo ""

