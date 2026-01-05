#!/bin/bash
# Setup Environment Configuration

echo "🔧 Setting up environment configuration..."
echo ""

# Check if .env exists locally
if [ -f ".env" ]; then
    echo "✅ .env file already exists locally"
else
    echo "📝 Creating .env file from template..."
    cp env.template .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and set your IBKR_ACCOUNT_ID"
fi

echo ""
echo "🚀 Setting up .env on VPS..."
echo "================================"

VPS_HOST="165.227.104.40"
VPS_USER="root"
APP_DIR="/root/trading-app"

# Create .env on VPS
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /root/trading-app

cat > .env << 'ENVEOF'
# Server Configuration
PORT=3000
NODE_ENV=production

# Interactive Brokers Configuration
IBKR_HOST=localhost
IBKR_PORT=4002
IBKR_CLIENT_ID=1
IBKR_ACCOUNT_ID=

# Risk Management
ALLOWED_SYMBOLS=AAPL,MSFT,NVDA,TSLA,GOOGL,AMZN,META,SPY,QQQ
MAX_TRADES_PER_SYMBOL_PER_DAY=20
DEFAULT_QTY=100

# Strategy Settings
BREAD_AND_BUTTER_ENABLED=true
BREAD_AND_BUTTER_SYMBOLS=AAPL,MSFT
BREAD_AND_BUTTER_MAX_TRADES=10

MOMENTUM_ENABLED=true
MOMENTUM_MAX_TRADES=20

# Trading Settings
DEFAULT_TIME_IN_FORCE=DAY
AUTO_STOP_ON_ERRORS=true
MAX_CONSECUTIVE_ERRORS=3
ENVEOF

echo "✅ .env file created on VPS"
echo ""
echo "Current configuration:"
cat .env
ENDSSH

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Restart the app: pm2 restart trading-app"
echo "   2. Check connection: pm2 logs trading-app --lines 20"
echo ""
echo "🔍 To change from port 4002 (paper) to 4001 (live):"
echo "   SSH to VPS and edit: nano /root/trading-app/.env"
echo "   Change IBKR_PORT=4002 to IBKR_PORT=4001"
echo "   Then restart: pm2 restart trading-app"
echo ""

