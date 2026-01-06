#!/bin/bash
# Quick deployment script
ssh root@165.227.104.40 "cd /root/trading-app && git pull origin main && npm run build && pm2 restart trading-app && echo '✅ Deployed!' && pm2 logs trading-app --lines 20 --nostream"
