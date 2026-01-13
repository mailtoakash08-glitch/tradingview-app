#!/bin/bash

# 🖥️ Local Testing Setup Script
# Sets up the trading app for local testing with IB Gateway

set -e

echo "🚀 Setting up trading app for local testing..."
echo ""

# Check Node.js
echo "1️⃣ Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js $NODE_VERSION installed"
else
    echo "   ❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check PostgreSQL
echo ""
echo "2️⃣ Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "   ✅ PostgreSQL installed"
    
    # Check if database exists
    if psql -lqt | cut -d \| -f 1 | grep -qw trading_app; then
        echo "   ✅ Database 'trading_app' exists"
    else
        echo "   📝 Creating database 'trading_app'..."
        createdb trading_app || {
            echo "   ⚠️  Could not create database. You may need to create it manually:"
            echo "      createdb trading_app"
        }
    fi
else
    echo "   ❌ PostgreSQL not found. Please install PostgreSQL:"
    echo "      brew install postgresql@16"
    echo "      brew services start postgresql@16"
    exit 1
fi

# Check .env file
echo ""
echo "3️⃣ Checking .env configuration..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
    
    # Check DATABASE_URL
    if grep -q "DATABASE_URL=" .env; then
        DB_URL=$(grep "DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')
        echo "   📝 Database URL: $DB_URL"
    else
        echo "   ⚠️  DATABASE_URL not set in .env"
        echo "      Add this line to .env:"
        echo "      DATABASE_URL=\"postgresql://$(whoami)@localhost:5432/trading_app?schema=public\""
    fi
    
    # Check IBKR_PORT
    if grep -q "IBKR_PORT=" .env; then
        IBKR_PORT=$(grep "IBKR_PORT=" .env | cut -d '=' -f2)
        echo "   📝 IB Gateway Port: $IBKR_PORT"
        if [ "$IBKR_PORT" = "4002" ]; then
            echo "      ✅ Configured for Paper Trading"
        elif [ "$IBKR_PORT" = "4001" ]; then
            echo "      ⚠️  Configured for Live Trading!"
        fi
    fi
else
    echo "   ⚠️  .env file not found. Creating from template..."
    cp env.template .env
    echo "   📝 Please edit .env and set your DATABASE_URL"
    echo "      DATABASE_URL=\"postgresql://$(whoami)@localhost:5432/trading_app?schema=public\""
fi

# Install dependencies
echo ""
echo "4️⃣ Installing dependencies..."
npm install

# Generate Prisma client
echo ""
echo "5️⃣ Generating Prisma client..."
npx prisma generate

# Setup database
echo ""
echo "6️⃣ Setting up database schema..."
npx prisma db push --accept-data-loss

# Build TypeScript
echo ""
echo "7️⃣ Building TypeScript..."
npm run build

# Check IB Gateway
echo ""
echo "8️⃣ Checking IB Gateway connection..."
if nc -zv localhost 4002 2>&1 | grep -q "succeeded"; then
    echo "   ✅ IB Gateway is running on port 4002"
elif nc -zv localhost 4001 2>&1 | grep -q "succeeded"; then
    echo "   ✅ IB Gateway is running on port 4001 (Live Trading)"
else
    echo "   ⚠️  IB Gateway not detected"
    echo "      Please start IB Gateway and configure API settings:"
    echo "      1. Enable 'ActiveX and Socket Clients'"
    echo "      2. Disable 'Read-Only API'"
    echo "      3. Set 'Master API client ID' to 0"
    echo "      4. Restart IB Gateway"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start the server:    npm start"
echo "   2. Open the UI:         open http://localhost:3000/desktop"
echo "   3. Monitor logs:        tail -f *.log"
echo ""
echo "🧪 Quick test:             ./test-local.sh"
echo "📚 Full guide:             cat LOCAL_TESTING_GUIDE.md"
echo ""
