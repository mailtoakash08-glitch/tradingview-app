# 🖥️ Local Testing Guide with IB Gateway

Complete guide to test the trading app on your local machine with IB Gateway.

---

## 📋 **Prerequisites**

1. ✅ IB Gateway installed on your Mac
2. ✅ Paper Trading or Live Trading account with Interactive Brokers
3. ✅ PostgreSQL installed locally
4. ✅ Node.js 18+ installed

---

## 🗄️ **Step 1: Setup Local PostgreSQL Database**

### Option A: Using Homebrew (Recommended)

```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Create database
createdb trading_app

# Create user (optional, or use your default user)
psql -d trading_app -c "CREATE USER trading_user WITH PASSWORD 'your_password';"
psql -d trading_app -c "GRANT ALL PRIVILEGES ON DATABASE trading_app TO trading_user;"
```

### Option B: Using Postgres.app

1. Download from https://postgresapp.com/
2. Open Postgres.app and start the server
3. Create database `trading_app`

---

## 🔧 **Step 2: Configure Environment**

### Create `.env` file:

```bash
cd /Users/dev/Documents/tradingview
cp env.template .env
```

### Edit `.env` with these settings:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# PostgreSQL Database (LOCAL)
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/trading_app?schema=public"
# Example: postgresql://dev@localhost:5432/trading_app?schema=public

# Interactive Brokers Configuration (LOCAL)
IBKR_HOST=localhost
IBKR_PORT=4002          # Paper Trading
# IBKR_PORT=4001        # Live Trading (uncomment if using live)
IBKR_CLIENT_ID=1
IBKR_ACCOUNT_ID=        # Leave empty for auto-detection

# Broker Selection
DEFAULT_BROKER=ibkr

# Risk Management
ALLOWED_SYMBOLS=AAPL,MSFT,NVDA,TSLA,GOOGL,AMZN,META,SPY,QQQ,DVLT
MAX_TRADES_PER_SYMBOL_PER_DAY=20
DEFAULT_QTY=100

# Trading Settings
DEFAULT_TIME_IN_FORCE=DAY
AUTO_STOP_ON_ERRORS=true
MAX_CONSECUTIVE_ERRORS=3
```

**Important:** Replace `YOUR_USERNAME` with your Mac username (run `whoami` in terminal to find it).

---

## 🗃️ **Step 3: Initialize Database**

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push

# Verify database
npx prisma studio  # Opens GUI at http://localhost:5555
```

---

## 🏦 **Step 4: Configure IB Gateway**

### Launch IB Gateway:

1. Open **IB Gateway** application
2. Select **Paper Trading** mode (or Live if you prefer)
3. Log in with your credentials

### Configure API Settings:

1. Click **Configure** → **Settings** → **API** → **Settings**
2. Enable these options:
   - ✅ **Enable ActiveX and Socket Clients**
   - ✅ **Allow connections from localhost only**
   - ❌ **Read-Only API** (UNCHECK this!)
   - ✅ **Download open orders on connection**
3. Set **Socket port**: `4002` (for Paper Trading)
4. Set **Master API client ID**: `0` (IMPORTANT!)
5. Click **OK** and restart IB Gateway

### Verify Connection:

```bash
# Test if IB Gateway is listening
nc -zv localhost 4002
# Should output: Connection to localhost port 4002 [tcp/*] succeeded!
```

---

## 🚀 **Step 5: Start the Application**

### Terminal 1 - Start Server:

```bash
cd /Users/dev/Documents/tradingview

# Build TypeScript
npm run build

# Start server
npm start

# You should see:
# ✅ Server running on port 3000
# ✅ Database connected
# 🏦 Attempting to connect to IBKR...
# ✅ Connected to Interactive Brokers (Paper Trading)
```

### Terminal 2 - Watch Logs (Optional):

```bash
# Monitor real-time logs
tail -f /Users/dev/Documents/tradingview/*.log

# Or use the built-in logging
npm run dev  # Runs with ts-node for live reload
```

---

## 🧪 **Step 6: Test the Application**

### Open Web Interface:

```bash
open http://localhost:3000/desktop
```

### Test Checklist:

#### ✅ **1. Demo Mode (No IB Gateway needed)**

1. Select **"🎮 DEMO MODE"** from broker dropdown
2. Place a **Market Order**: AAPL, Qty: 1
   - Should fill instantly
   - Position should appear in "Open Positions"
   - P&L should update
3. Place a **Stop Market Order**: AAPL, Stop Price: $265
   - Should appear in "Pending Stop Orders"
   - Should show line on Lightweight Chart
   - Backend should log: "Order still pending (current: $260, trigger: $265)"

#### ✅ **2. IB Gateway Paper Trading**

1. Select **"🏦 Interactive Brokers"** from broker dropdown
2. Place a **Market Order**: SPY, Qty: 1
   - Should submit to IB Gateway
   - Check IB Gateway "Orders" tab to verify
   - Wait for fill (may take 5-10 seconds)
   - Position should appear in UI
3. Place a **Stop Order**: SPY, Stop Price: (above/below current)
   - Should appear in IB Gateway
   - Should appear in "Pending Stop Orders" in UI
   - Line should draw on Lightweight Chart

---

## 🐛 **Troubleshooting**

### **Issue: "Cannot connect to database"**

```bash
# Check if PostgreSQL is running
brew services list

# Restart PostgreSQL
brew services restart postgresql@16

# Verify connection string in .env
echo $DATABASE_URL
```

### **Issue: "Cannot connect to IBKR"**

```bash
# 1. Check if IB Gateway is running
ps aux | grep "IB Gateway"

# 2. Verify port is open
nc -zv localhost 4002

# 3. Check API settings in IB Gateway
#    - Read-Only API should be UNCHECKED
#    - Master API client ID should be 0

# 4. Check logs
cat trading-app-*.log | grep "IBKR"
```

### **Issue: "Orders not filling"**

1. **Market Hours**: Check if market is open (9:30 AM - 4:00 PM EST)
2. **After Hours**: Make sure `outsideRth: true` is enabled in UI
3. **IB Gateway**: Check "Orders" tab to see order status
4. **Logs**: Check backend logs for order status updates

### **Issue: "Pending orders not showing"**

```bash
# Check database directly
npx prisma studio

# Look at "Order" table
# Filter by: status = "PENDING" and orderType = "STP"

# If orders are there but not showing in UI:
# 1. Clear browser cache (Cmd+Shift+R)
# 2. Check browser console for errors (Cmd+Option+I)
```

### **Issue: "Lines not drawing on chart"**

1. Switch to **"Lightweight (With Lines)"** tab
2. Lines only appear for Stop/Limit orders (not Market orders)
3. Refresh the page and check again
4. Check browser console: `redrawOrderLines()` should be called

---

## 📊 **Monitoring & Debugging**

### Check Database:

```bash
# Open Prisma Studio
npx prisma studio

# View Orders table
# View Positions table
# View Trades table
```

### Check Logs:

```bash
# Application logs
tail -f trading-app-*.log

# Filter for specific events
grep "DEMO:" trading-app-*.log
grep "IBKR:" trading-app-*.log
grep "Order placed" trading-app-*.log
```

### Browser DevTools:

```javascript
// Open Console (Cmd+Option+I)

// Check pending orders
fetch('/api/dashboard/orders/pending')
  .then(r => r.json())
  .then(d => console.table(d.data.orders));

// Check positions
fetch('/api/dashboard/positions')
  .then(r => r.json())
  .then(d => console.table(d.data.positions));

// Check account
fetch('/api/dashboard/account')
  .then(r => r.json())
  .then(d => console.log(d));
```

---

## 🎯 **Quick Test Script**

Save this as `test-local.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Trading App Locally..."

# Check PostgreSQL
echo "1. Checking PostgreSQL..."
pg_isready -d trading_app && echo "✅ Database online" || echo "❌ Database offline"

# Check IB Gateway
echo "2. Checking IB Gateway..."
nc -zv localhost 4002 && echo "✅ IB Gateway online" || echo "❌ IB Gateway offline"

# Check Server
echo "3. Checking Server..."
curl -s http://localhost:3000/health | grep -q "ok" && echo "✅ Server online" || echo "❌ Server offline"

# Open UI
echo "4. Opening UI..."
open http://localhost:3000/desktop

echo "✅ Test complete!"
```

Make it executable:

```bash
chmod +x test-local.sh
./test-local.sh
```

---

## 📝 **Key Differences: Local vs VPS**

| Feature | Local | VPS |
|---------|-------|-----|
| Database | Local PostgreSQL | VPS PostgreSQL |
| IB Gateway | Running on your Mac | Would need X11/VNC |
| Port | `localhost:3000` | `165.227.104.40:3000` |
| Logs | Local files + console | PM2 logs |
| Restart | `npm start` | `pm2 restart` |
| Deploy | Direct run | Git push + pull |

---

## 🎉 **Expected Behavior**

### ✅ **Demo Mode:**
- Market orders fill **instantly** (2 seconds)
- Stop orders stay **pending** until price reaches trigger
- Lines appear on **Lightweight Chart**
- Real-time price monitoring every **5 seconds**
- Works **without** IB Gateway

### ✅ **IBKR Mode:**
- Market orders fill in **5-10 seconds** (paper trading)
- Stop orders submit to IB Gateway
- Orders visible in IB Gateway "Orders" tab
- Position updates flow back to app
- Lines appear on **Lightweight Chart**

---

## 🔄 **Restart Everything**

If things get weird:

```bash
# 1. Stop server
Ctrl+C

# 2. Restart IB Gateway
# (Close and reopen the app)

# 3. Restart PostgreSQL
brew services restart postgresql@16

# 4. Clear database (optional)
npx prisma db push --force-reset

# 5. Rebuild and start
npm run build && npm start

# 6. Clear browser cache
# Cmd+Shift+R in browser
```

---

## 💡 **Pro Tips**

1. **Use Demo Mode first** to verify UI and logic work
2. **Then test IBKR** to verify API connection
3. **Monitor IB Gateway** "Orders" tab to see what's happening
4. **Check database** with Prisma Studio to verify persistence
5. **Watch logs** for detailed event information
6. **Use Lightweight Chart** to see order lines
7. **Use TradingView Chart** for analysis and drawing tools

---

## 📞 **Need Help?**

- Check `ORDER_LINES_EXPLANATION.md` for how lines work
- Check `DEMO_STOP_ORDERS_TEST.md` for stop order testing guide
- Check application logs for detailed error messages
- Use Prisma Studio to inspect database state

---

**Happy Testing! 🚀**
