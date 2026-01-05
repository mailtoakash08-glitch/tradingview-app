# TradingView Desktop - Trading Application

> **Manual trading interface with IBKR integration**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Features

- **TradingView Desktop-Style Interface** - Modern dark UI with real-time charts
- **Manual Order Entry** - Market, Limit, Stop Market, Trailing Stop orders
- **Extended Hours Trading** - Pre-market and after-hours support
- **Real-time P&L Tracking** - Unrealized/Realized per ticker and total
- **IBKR Integration** - Direct connection to Interactive Brokers
- **Take Profit & Stop Loss** - Optional exit strategies
- **Windows-Style Dark UI** - Professional trading interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Interactive Brokers account
- IB Gateway or TWS running

### Installation

```bash
# Clone repository
git clone https://github.com/mailtoakash08-glitch/tradingview-app.git
cd tradingview-app

# Install dependencies
npm install

# Configure environment
./setup-env.sh
# Or manually: cp env.template .env && nano .env

# Build and start
npm run build
npm start
```

### Access

Open browser: `http://localhost:3000/desktop`

## 📦 Project Structure

```
tradingview-app/
├── src/
│   ├── routes/           # API routes
│   │   ├── desktop.ts    # Main trading interface
│   │   ├── dashboard.ts  # Dashboard API
│   │   ├── webhook.ts    # Order webhook
│   │   └── health.ts     # Health check
│   ├── services/         # Business logic
│   │   ├── ibkrClient.ts # IBKR connection
│   │   ├── orderTracker.ts
│   │   └── positionManager.ts
│   ├── types/            # TypeScript types
│   ├── config.ts         # Configuration
│   ├── server.ts         # Express setup
│   └── index.ts          # Entry point
├── .env.example          # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

### Important: IB Gateway Ports

Choose the correct port for your setup:

| Application | Environment | Port |
|-------------|-------------|------|
| **IB Gateway** | Paper Trading | **4002** ⭐ (Recommended for testing) |
| **IB Gateway** | Live Trading | **4001** |
| **TWS** | Paper Trading | **7497** |
| **TWS** | Live Trading | **7496** |

### Setup Environment

```bash
# Run setup script (creates .env with correct port)
./setup-env.sh
```

Or manually create `.env` file:

```env
# Server
PORT=3000
NODE_ENV=production

# Interactive Brokers
IBKR_HOST=localhost
IBKR_PORT=4002        # Use 4002 for IB Gateway Paper, 4001 for Live
IBKR_CLIENT_ID=1
IBKR_ACCOUNT_ID=      # Your IBKR account ID (optional)

# Risk Management
ALLOWED_SYMBOLS=AAPL,MSFT,NVDA,TSLA,GOOGL,AMZN,META,SPY,QQQ
MAX_TRADES_PER_SYMBOL_PER_DAY=20
DEFAULT_QTY=100
```

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/desktop` | GET | Trading interface |
| `/api/dashboard/positions` | GET | Get positions |
| `/api/dashboard/orders` | GET | Get orders |
| `/api/dashboard/account` | GET | Get account data |
| `/api/webhook` | POST | Place order |
| `/health` | GET | Health check |

## 🚢 Deployment

### VPS Deployment (Ubuntu)

```bash
# On VPS
git clone https://github.com/mailtoakash08-glitch/tradingview-app.git
cd tradingview-app
npm install --production
cp .env.example .env
# Edit .env with your settings

# Start with PM2
npm install -g pm2
pm2 start dist/index.js --name trading-app
pm2 save
pm2 startup
```

### Update Deployment

```bash
# On VPS
cd tradingview-app
git pull
npm install
npm run build
pm2 restart trading-app
```

## 📊 Trading Features

### Order Types

- **Market Order** - Execute immediately at current price
- **Limit Order** - Execute at specific price or better
- **Stop Market** - Trigger when price hits stop level
- **Trailing Stop** - Follow price movement with trailing amount

### Extended Hours

- Pre-market: 4:00 AM - 9:30 AM ET
- Regular: 9:30 AM - 4:00 PM ET  
- After-hours: 4:00 PM - 8:00 PM ET

### P&L Tracking

- Real-time unrealized P&L
- Realized P&L from closed trades
- Per-ticker breakdown
- Total account P&L
- Auto-refresh every 10 seconds

## 🛠️ Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## 📝 License

MIT License - See LICENSE file for details

## ⚠️ Disclaimer

This software is for educational purposes. Trading involves risk. Use at your own discretion.

---

**Built with:** TypeScript, Express, TradingView API, Interactive Brokers API

**Repository:** [https://github.com/mailtoakash08-glitch/tradingview-app](https://github.com/mailtoakash08-glitch/tradingview-app)

