#!/bin/bash
# Complete Deployment Script - Pushes code and sets up .env on VPS

set -e

VPS_HOST="165.227.104.40"
VPS_USER="root"

echo "🚀 Complete Deployment to VPS"
echo "=============================="
echo ""

# Step 1: Push to GitHub
echo "📤 Step 1: Pushing to GitHub..."
git add .
git status --short
read -p "Commit message (or press Enter for default): " COMMIT_MSG
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update: $(date '+%Y-%m-%d %H:%M:%S')"
fi
git commit -m "$COMMIT_MSG" || echo "Nothing to commit"
git push origin main
echo "✅ Pushed to GitHub"
echo ""

# Step 2: Deploy to VPS
echo "🌐 Step 2: Deploying to VPS..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

cd /root/trading-app

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "⚙️  Checking .env file..."
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'ENVEOF'
PORT=3000
NODE_ENV=production

IBKR_HOST=localhost
IBKR_PORT=4002
IBKR_CLIENT_ID=1
IBKR_ACCOUNT_ID=

ALLOWED_SYMBOLS=AAPL,MSFT,NVDA,TSLA,GOOGL,AMZN,META,SPY,QQQ
MAX_TRADES_PER_SYMBOL_PER_DAY=20
DEFAULT_QTY=100

BREAD_AND_BUTTER_ENABLED=true
BREAD_AND_BUTTER_SYMBOLS=AAPL,MSFT
BREAD_AND_BUTTER_MAX_TRADES=10

MOMENTUM_ENABLED=true
MOMENTUM_MAX_TRADES=20

DEFAULT_TIME_IN_FORCE=DAY
AUTO_STOP_ON_ERRORS=true
MAX_CONSECUTIVE_ERRORS=3
ENVEOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists (keeping existing configuration)"
fi

echo ""
echo "🔄 Restarting application..."
pm2 restart trading-app

echo ""
echo "📊 Application Status:"
pm2 list

echo ""
echo "📋 Recent Logs (checking IBKR connection):"
pm2 logs trading-app --lines 20 --nostream | grep -E "(IBKR|Gateway|Connected|port)" || pm2 logs trading-app --lines 10 --nostream

echo ""
echo "🔍 Checking if connecting to correct port..."
pm2 logs trading-app --lines 50 --nostream | grep -i "port" | tail -5 || echo "No port info in recent logs"

ENDSSH

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Access your app at:"
echo "   http://165.227.104.40:3000/desktop"
echo ""
echo "📊 To check logs:"
echo "   ssh root@165.227.104.40"
echo "   pm2 logs trading-app"
echo ""
echo "⚙️  To change port (paper 4002 → live 4001):"
echo "   ssh root@165.227.104.40"
echo "   nano /root/trading-app/.env"
echo "   Change IBKR_PORT=4002 to IBKR_PORT=4001"
echo "   pm2 restart trading-app"
echo ""

