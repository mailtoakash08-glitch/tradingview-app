#!/bin/bash
# 🚀 COMPLETE DEPLOYMENT SCRIPT
# Commits all changes, pushes to GitHub, and deploys to VPS

set -e

VPS_HOST="165.227.104.40"
VPS_USER="root"
APP_DIR="/root/trading-app"

echo "╔════════════════════════════════════════╗"
echo "║   🚀 DEPLOY & COMMIT SCRIPT           ║"
echo "╚════════════════════════════════════════╝"
echo ""

# STEP 1: Commit and Push
echo "📝 Step 1: Committing changes..."
echo "================================"

# Check if there are changes
if [[ -z $(git status -s) ]]; then
    echo "✅ No changes to commit"
else
    # Show what's changed
    echo "Changed files:"
    git status -s
    echo ""
    
    # Add all changes
    git add -A
    
    # Commit with timestamp
    COMMIT_MSG="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    echo "✅ Committed: $COMMIT_MSG"
fi

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push origin main
echo "✅ Pushed to GitHub"

# STEP 2: Deploy to VPS
echo ""
echo "🌐 Step 2: Deploying to VPS..."
echo "================================"

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

cd /root/trading-app

echo "📥 Pulling latest code..."
rm -f package-lock.json
git reset --hard HEAD
git pull origin main
echo "✅ Code updated"

echo ""
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"

echo ""
echo "🔨 Building application..."
npm run build
echo "✅ Build complete"

echo ""
echo "⚙️  Checking configuration..."

# Create/update .env if needed
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'ENVEOF'
PORT=3000
NODE_ENV=production
IBKR_HOST=127.0.0.1
IBKR_PORT=4002
IBKR_CLIENT_ID=1
IBKR_ACCOUNT_ID=
ALLOWED_SYMBOLS=AAPL,MSFT,NVDA,TSLA,GOOGL,AMZN,META,SPY,QQQ,DVLT
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
    echo "✅ .env created"
else
    echo "✅ .env exists (using existing config)"
fi

echo ""
echo "🔄 Restarting application..."
pm2 restart trading-app
echo "✅ Application restarted"

echo ""
echo "⏳ Waiting 3 seconds for startup..."
sleep 3

echo ""
echo "📊 Application Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━"
pm2 list

echo ""
echo "📋 Recent Logs:"
echo "━━━━━━━━━━━━━━━━━━━━━━"
pm2 logs trading-app --lines 15 --nostream

echo ""
echo "🔍 Connection Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━"
pm2 logs trading-app --lines 50 --nostream | grep -i "ibkr\|gateway\|connect" | tail -5 || echo "No connection info yet"

ENDSSH

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✅ DEPLOYMENT COMPLETE!             ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌐 Desktop Interface:"
echo "   http://165.227.104.40:3000/desktop"
echo ""
echo "📊 Check logs:"
echo "   ssh root@165.227.104.40"
echo "   pm2 logs trading-app"
echo ""
echo "⚙️  Check .env configuration:"
echo "   ssh root@165.227.104.40"
echo "   cat /root/trading-app/.env"
echo ""

