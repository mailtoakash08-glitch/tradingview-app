#!/bin/bash
echo "🔄 Option: Revert to TradingView Widget (if Lightweight Charts fails)"
echo ""
echo "This will:"
echo "  - Restore TradingView widget"
echo "  - Remove visual order lines"
echo "  - Keep all other functionality"
echo ""
read -p "Do you want to revert? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cd /Users/dev/Documents/tradingview
  git checkout HEAD~2 src/routes/desktop.ts
  git add src/routes/desktop.ts
  git commit -m "Revert to TradingView widget"
  git push origin main
  ssh root@165.227.104.40 "cd /root/trading-app && git pull && npm run build && pm2 restart trading-app"
  echo "✅ Reverted successfully"
else
  echo "❌ Cancelled"
fi

