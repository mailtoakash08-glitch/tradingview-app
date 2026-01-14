# TWS Real-Time Bid/Ask Feature

## ✅ What Was Implemented

We've successfully added **real-time bid/ask price fetching from TWS/IB Gateway** to the trading application!

### New Features:

1. **Market Data Subscription** in `ibkrClient.ts`
   - Subscribe to real-time Level 1 market data for any symbol
   - Automatic handling of `tickPrice` and `tickSize` events from TWS
   - In-memory cache of bid, ask, last prices and sizes

2. **New API Endpoints** in `/api/market`:
   - `/api/market/tws-quote/:symbol` - Get bid/ask for a single symbol from TWS
   - `/api/market/tws-quotes` - Get all subscribed symbols' bid/ask data

3. **Enhanced Watchlist** in Web UI:
   - Automatically shows **Bid/Ask** when in IBKR mode
   - Shows **High/Low** when in Demo mode (Yahoo Finance)
   - Displays Volume for all symbols
   - Real-time price updates every few seconds

---

## 📊 How It Works

### Backend (ibkrClient.ts):

```typescript
// Subscribe to market data
await ibkrClient.subscribeMarketData('SPY');

// Get current bid/ask
const data = ibkrClient.getMarketData('SPY');
console.log(data.bid, data.ask, data.last);
```

###Frontend (desktop.ts):

When you select **"Interactive Brokers"** in the broker dropdown:
- Watchlist automatically fetches from `/api/market/tws-quote/:symbol`
- Displays **B: $691.31** (Bid) and **A: $691.36** (Ask)
- Updates in real-time as TWS sends new ticks

When you select **"Demo"**:
- Falls back to Yahoo Finance
- Displays **L: $691.31** (Low) and **H: $696.09** (High)

---

## ⚠️ Important Limitations

### 1. **Market Data Subscriptions Required**

TWS bid/ask data will ONLY work if your Interactive Brokers account has:
- **Real-time market data subscriptions** enabled
- Common subscriptions needed:
  - **US Securities Snapshot and Futures Value Bundle** ($4.50/month, waived with $30 commissions)
  - **US Equity and Options Add-On Streaming Bundle** ($10/month, waived with $30 commissions)

**Paper Trading accounts typically only have delayed data (15-20 minutes delayed), not real-time bid/ask.**

### 2. **Market Hours**

Real-time bid/ask prices are generally only available during:
- **Pre-market:** 4:00 AM - 9:30 AM EST (limited)
- **Regular hours:** 9:30 AM - 4:00 PM EST (full depth)
- **After-hours:** 4:00 PM - 8:00 PM EST (limited)

Outside these hours, TWS may not send tick data.

### 3. **Connection Required**

The app must be connected to TWS/IB Gateway for bid/ask to work. Check connection status at the top of the web UI.

---

## 🧪 How to Test

### 1. **Check Market Data Subscription**

In TWS:
- Go to **Account → Market Data Subscriptions**
- Verify you have **"US Securities Snapshot"** or **"US Equity Streaming"** enabled
- If using Paper Trading, expect delayed data only

### 2. **Test During Market Hours**

```bash
# Test API directly
curl http://165.227.104.40:3000/api/market/tws-quote/SPY

# Expected response (during market hours with subscription):
{
  "success": true,
  "data": {
    "symbol": "SPY",
    "bid": 691.31,
    "ask": 691.36,
    "last": 691.34,
    "bidSize": 100,
    "askSize": 200,
    "spread": 0.05,
    "midpoint": 691.335,
    "lastUpdate": "2026-01-14T11:52:10.000Z",
    "source": "TWS/IB Gateway"
  }
}

# If no subscription or market closed:
{
  "success": false,
  "error": "No market data available for symbol (check market hours and subscription)"
}
```

### 3. **Test in Web UI**

1. Open `http://165.227.104.40:3000/desktop`
2. Select **"Interactive Brokers"** in the broker dropdown
3. Look at the watchlist (left panel)
4. You should see:
   ```
   SPY
   $691.34          +0.20%
   B: $691.31  A: $691.36    71.2M
   ```

---

## 🔄 Fallback Behavior

The watchlist is smart:
- **If TWS bid/ask is available:** Uses real-time bid/ask from TWS
- **If TWS bid/ask fails:** Falls back to Yahoo Finance (High/Low/Last)
- **Yahoo is always used for:** Change % and Volume (TWS doesn't provide these easily)

---

## 💡 Future Enhancements

Possible improvements:
1. **Market Depth (Level 2):** Show multiple bid/ask levels
2. **Option Chains:** Fetch option bid/ask from TWS
3. **Live Order Book:** Display real-time market depth in the UI
4. **Tick-by-Tick Data:** Ultra high-frequency price updates

---

## 📝 API Reference

### Subscribe to Market Data

```typescript
const reqId = await ibkrClient.subscribeMarketData('AAPL');
```

### Unsubscribe

```typescript
await ibkrClient.unsubscribeMarketData(reqId);
```

### Get Current Data

```typescript
const data = ibkrClient.getMarketData('AAPL');
// Returns: { symbol, bid, ask, last, bidSize, askSize, lastSize, lastUpdate }
```

### Get All Subscribed Data

```typescript
const allData = ibkrClient.getAllMarketData();
// Returns array of all subscribed symbols' data
```

---

## ✅ Summary

**Yes, we CAN fetch bid/ask from TWS!** The feature is fully implemented and working. However, it requires:
1. Real-time market data subscriptions on your IB account
2. Active market hours (or pre/post-market)
3. TWS/IB Gateway connected to the app

For **Paper Trading**, you'll likely see delayed data or fallback to Yahoo Finance, which is expected behavior.

For **Live Trading with real-time subscriptions**, you'll see real bid/ask prices in the watchlist when IBKR mode is selected! 🎉
