#!/bin/bash

# 🚀 GitHub Deployment Script
# Deploy TradingView Desktop app from GitHub repository
# Repository: https://github.com/mailtoakash08-glitch/tradingview-app.git

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 GITHUB DEPLOYMENT - TradingView Desktop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configuration
VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-165.227.104.40}"
VPS_PATH="${VPS_PATH:-/root/trading-app}"
GITHUB_REPO="mailtoakash08-glitch/tradingview-app"
BRANCH="${BRANCH:-main}"

echo "📋 Configuration:"
echo "   VPS: $VPS_USER@$VPS_HOST"
echo "   Path: $VPS_PATH"
echo "   Repo: https://github.com/$GITHUB_REPO"
echo "   Branch: $BRANCH"
echo ""

# Step 1: Check if this is first deployment or update
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 1: Checking deployment status..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh $VPS_USER@$VPS_HOST "test -d $VPS_PATH && echo 'exists' || echo 'new'" > /tmp/deploy_status.txt
DEPLOY_STATUS=$(cat /tmp/deploy_status.txt | tr -d '\r\n')

if [ "$DEPLOY_STATUS" == "exists" ]; then
  echo "✅ Existing deployment found - will update"
  FIRST_DEPLOY=false
else
  echo "✨ New deployment - will clone repository"
  FIRST_DEPLOY=true
fi
echo ""

# Step 2: Deploy based on status
if [ "$FIRST_DEPLOY" = true ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📥 Step 2: First-time deployment"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  ssh $VPS_USER@$VPS_HOST << ENDSSH
    set -e
    
    # Clone repository
    echo "📥 Cloning repository..."
    git clone https://github.com/$GITHUB_REPO.git $VPS_PATH
    cd $VPS_PATH
    git checkout $BRANCH
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install --production
    
    # Build TypeScript
    echo "🔨 Building application..."
    npm run build
    
    # Setup environment
    if [ ! -f .env ]; then
      echo "⚙️  Creating .env file..."
      cp .env.example .env
      echo "⚠️  WARNING: Edit .env file with your IBKR credentials!"
    fi
    
    # Create logs directory
    mkdir -p logs
    
    # Start with PM2
    echo "🚀 Starting application..."
    npm install -g pm2 || true
    pm2 start dist/index.js --name trading-app
    pm2 save
    
    echo "✅ First deployment complete!"
ENDSSH

else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔄 Step 2: Updating existing deployment"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  ssh $VPS_USER@$VPS_HOST << ENDSSH
    set -e
    cd $VPS_PATH
    
    # Pull latest changes
    echo "📥 Pulling latest changes..."
    git pull origin $BRANCH
    
    # Install/update dependencies
    echo "📦 Updating dependencies..."
    npm install --production
    
    # Rebuild
    echo "🔨 Rebuilding application..."
    npm run build
    
    # Restart PM2
    echo "🔄 Restarting application..."
    pm2 restart trading-app
    
    echo "✅ Update complete!"
ENDSSH

fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Step 3: Checking application status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh $VPS_USER@$VPS_HOST "pm2 list | grep trading-app && pm2 logs trading-app --lines 10 --nostream"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Access your application:"
echo "   http://$VPS_HOST:3000/desktop"
echo ""
echo "📝 Useful commands:"
echo "   View logs:    ssh $VPS_USER@$VPS_HOST 'pm2 logs trading-app'"
echo "   Restart app:  ssh $VPS_USER@$VPS_HOST 'pm2 restart trading-app'"
echo "   Stop app:     ssh $VPS_USER@$VPS_HOST 'pm2 stop trading-app'"
echo ""

if [ "$FIRST_DEPLOY" = true ]; then
  echo "⚠️  IMPORTANT: Configure .env file on VPS:"
  echo "   ssh $VPS_USER@$VPS_HOST"
  echo "   cd $VPS_PATH"
  echo "   nano .env"
  echo "   # Add your IBKR_ACCOUNT_ID"
  echo "   pm2 restart trading-app"
  echo ""
fi

