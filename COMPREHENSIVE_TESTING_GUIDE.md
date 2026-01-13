# 📋 Comprehensive Testing Guide

## ✅ Bug Fixed: Duplicate Position Issue Resolved

**Problem:** Orders were creating 3x positions due to duplicate event processing
**Solution:** Removed position updates from `orderStatus` handler; only `execDetails` processes fills
**Result:** 1 order = 1 position ✅

---

## 🧪 Testing All Order Types

### Prerequisites

- TWS connected (Paper Trading mode)
- App running: http://localhost:3000
- Market hours: 9:30 AM - 4:00 PM EST (or use `outsideRth` for after-hours)
- Small quantities (1-2 shares) to minimize risk

---

## 1️⃣ **Market Order Test**

**What it does:** Executes immediately at current market price

**Test Steps:**

1. **Symbol:** SPY
2. **Quantity:** 1
3. **Order Type:** Market
4. **Extended Hours:** ✅ (if after hours)
5. **Click:** BUY

**Expected Results:**

- ✅ Order fills within seconds
- ✅ Position shows **exactly 1 share**
- ✅ Entry price = market price at execution
- ✅ Unrealized P&L starts at $0.00
- ✅ TWS shows matching position

**Verification Commands:**

```bash
cd /Users/dev/Documents/tradingview

# Check position
psql -d tradingdb -c "SELECT symbol, quantity, \"avgEntryPrice\", \"unrealizedPnL\" FROM \"Position\" WHERE symbol = 'SPY' AND \"isOpen\" = true;"

# Check trade
psql -d tradingdb -c "SELECT symbol, action, quantity, price FROM \"Trade\" WHERE symbol = 'SPY' ORDER BY \"executedAt\" DESC LIMIT 1;"

# Check logs
tail -50 app.log | grep -E "(SPY|Execution received|Position)"
```

---

## 2️⃣ **Limit Order Test**

**What it does:** Executes only at specified price or better

**Test Steps:**

1. **Symbol:** AAPL
2. **Quantity:** 1
3. **Order Type:** Limit
4. **Limit Price:** Current price - $1.00 (e.g., if AAPL is $260, use $259)
5. **Extended Hours:** ✅
6. **Click:** BUY

**Expected Results:**

- ⏳ Order shows in "Pending Orders" tab
- ⏳ Status: PENDING (waiting for price to drop)
- ✅ When price drops to limit price, order fills automatically
- ✅ Position created with 1 share at limit price or better

**To Force Fill (if waiting too long):**

- Adjust limit price to current price + $0.50 (above market)
- Order should fill immediately

**Verification:**

```bash
# Check pending order
psql -d tradingdb -c "SELECT \"orderId\", symbol, \"orderType\", \"limitPrice\", status FROM \"Order\" WHERE symbol = 'AAPL' AND status = 'PENDING';"

# After fill
psql -d tradingdb -c "SELECT symbol, quantity, \"avgEntryPrice\" FROM \"Position\" WHERE symbol = 'AAPL';"
```

---

## 3️⃣ **Stop Market Order Test**

**What it does:** Becomes market order when price reaches stop price

**Test Steps:**

1. **Symbol:** MSFT
2. **Quantity:** 1
3. **Order Type:** Stop Market
4. **Stop Price:** Current price + $2.00 (e.g., if MSFT is $450, use $452)
5. **Extended Hours:** ✅
6. **Click:** BUY

**Expected Results:**

- ⏳ Order shows as PENDING
- ⏳ Waiting for price to rise to stop price
- ✅ When price hits stop price, converts to market order and fills

**Note:** Stop orders trigger on price movement, so may take time during slow market

**Demo Mode:** Fully supports stop orders with real-time price monitoring!

**Verification:**

```bash
# Check stop order
psql -d tradingdb -c "SELECT symbol, \"orderType\", \"stopPrice\", status FROM \"Order\" WHERE symbol = 'MSFT';"

# Monitor in logs
tail -f app.log | grep -E "(MSFT|Stop.*triggered|Execution)"
```

---

## 4️⃣ **Trailing Stop Order Test**

**What it does:** Stop price trails the market by a specified amount

**Test Steps:**

1. **Symbol:** TSLA
2. **Quantity:** 1
3. **Order Type:** Trailing Stop
4. **Trailing Amount:** $5.00
5. **Extended Hours:** ✅
6. **Click:** BUY

**Expected Results:**

- ⏳ Order shows as PENDING
- 📈 As price moves, stop price adjusts automatically
- ✅ If price reverses by trailing amount, order triggers

**Note:** Best tested during market hours with volatile stocks

---

## 💰 **Testing Balance & P&L**

### A. **Initial Balance Check**

```bash
# Check starting balance
curl http://localhost:3000/api/dashboard/account | python3 -m json.tool
```

**Record:**

- Starting Balance: $**\_\_**
- Starting Cash: $**\_\_**

---

### B. **Unrealized P&L Test**

**What it is:** P&L on open positions (not yet closed)

**Test Steps:**

1. **Buy 1 share of SPY** at market price (e.g., $595)
2. **Wait 1 minute** for price to move
3. **Refresh browser** to see updated P&L

**Expected Calculation:**

```
Unrealized P&L = (Current Price - Entry Price) × Quantity
```

**Example:**

- Entry: $595.00
- Current: $595.50
- Quantity: 1
- **Unrealized P&L:** ($595.50 - $595.00) × 1 = **+$0.50** ✅

**Verification:**

```bash
# Check position with live P&L
psql -d tradingdb -c "SELECT symbol, quantity, \"avgEntryPrice\", \"currentPrice\", \"unrealizedPnL\" FROM \"Position\" WHERE \"isOpen\" = true;"

# Check in UI
# Open Positions table should show:
# - Entry Price
# - Current Price
# - Unrealized P&L (green if profit, red if loss)
```

---

### C. **Realized P&L Test**

**What it is:** Actual profit/loss from closed positions

**Test Steps:**

#### Step 1: Open Position

1. **Buy 1 SPY** at market (e.g., $595.00)
2. **Note entry price:** $**\_\_**

#### Step 2: Wait for Price Movement

3. **Wait 1-2 minutes** for price to change
4. **Check current price:** $**\_\_**

#### Step 3: Close Position

5. **Click "Close" button** on SPY position
6. **Confirm closure**

**Expected Results:**

- ✅ Position disappears from "Open Positions"
- ✅ Balance updates with realized P&L
- ✅ Trade records show ENTRY and EXIT

**Calculation:**

```
Realized P&L = (Exit Price - Entry Price) × Quantity - Commission
```

**Example:**

- Entry: $595.00
- Exit: $595.50
- Quantity: 1
- Commission: $1.00
- **Realized P&L:** ($595.50 - $595.00) × 1 - $1.00 = **-$0.50**

**Verification:**

```bash
# Check closed position
psql -d tradingdb -c "SELECT symbol, quantity, \"avgEntryPrice\", \"isOpen\" FROM \"Position\" WHERE symbol = 'SPY' ORDER BY \"closedAt\" DESC LIMIT 1;"

# Check all trades (ENTRY + EXIT)
psql -d tradingdb -c "SELECT symbol, action, quantity, price, TO_CHAR(\"executedAt\", 'HH24:MI:SS') as time FROM \"Trade\" WHERE symbol = 'SPY' ORDER BY \"executedAt\" DESC LIMIT 2;"

# Check updated balance
curl http://localhost:3000/api/dashboard/account | python3 -m json.tool
```

---

### D. **Balance Reconciliation**

**Formula:**

```
Current Balance = Starting Balance + Realized P&L
Current Cash = Starting Cash - (Position Values + Commission)
```

**Test Scenario:**

1. **Starting Balance:** $1,000,000
2. **Buy 1 SPY @ $595** → Cash: $999,405 (minus $595 position value)
3. **Unrealized P&L:** +$10 → Total: $1,000,010
4. **Sell SPY @ $605** → Realized P&L: +$10 → Balance: $1,000,010 ✅

**Verification:**

```bash
# Get account summary
curl http://localhost:3000/api/dashboard/account | python3 -m json.tool

# Should show:
{
  "balance": 1000010.00,      // Starting + Realized P&L
  "cashBalance": 1000010.00,  // After closing all positions
  "unrealizedPnL": 0.00,      // No open positions
  "realizedPnL": 10.00        // From closed trade
}
```

---

## 🎮 **Demo Mode vs. TWS Comparison**

### Demo Mode Advantages

- ✅ **24/7 availability** (no market hours restriction)
- ✅ **Instant fills** (2-second delay for realism)
- ✅ **Real market prices** (from Yahoo Finance)
- ✅ **Stop order monitoring** (checks prices every 5 seconds)
- ✅ **No commissions**
- ✅ **Zero risk** (simulated money)

### TWS Paper Trading

- ✅ **Real IB API** behavior
- ✅ **Realistic order routing** (can see in TWS UI)
- ✅ **Commission simulation**
- ⚠️ **Slower fills** (especially after hours)
- ⚠️ **Market hours** limitation (unless using extended hours)

### Recommendation

- **Development/Testing:** Use Demo Mode
- **Pre-Production:** Test with TWS Paper Trading
- **Production:** TWS Live Trading (real money!)

---

## 📊 **Testing Checklist**

### Order Types

- [ ] Market Order (SPY) - 1 share = 1 position ✅
- [ ] Limit Order (AAPL) - Pending → Filled
- [ ] Stop Market (MSFT) - Price trigger → Fill
- [ ] Trailing Stop (TSLA) - Dynamic stop adjustment

### P&L Verification

- [ ] Unrealized P&L updates with price changes
- [ ] Realized P&L calculated on position close
- [ ] Balance reflects realized P&L
- [ ] Cash balance adjusts for open positions
- [ ] Commission deducted correctly

### Data Persistence

- [ ] Positions persist after app restart
- [ ] Pending orders persist after restart
- [ ] Trade history saved to database
- [ ] Balance/P&L survives restart

### UI Verification

- [ ] Open Positions table shows correct data
- [ ] Pending Orders tab shows unfilled orders
- [ ] Close button works correctly
- [ ] Flip button works correctly
- [ ] Balance updates in real-time
- [ ] P&L colors (green/red) display correctly

---

## 🐛 **What to Watch For**

### Known Issues (Now Fixed!)

- ✅ **Duplicate positions** - FIXED (execDetails deduplication)
- ✅ **3x quantity bug** - FIXED (removed orderStatus position updates)

### Remaining Potential Issues

- ⚠️ **Price delays** - Yahoo Finance API may have slight delays
- ⚠️ **After-hours fills** - Market orders won't fill (use Limit orders)
- ⚠️ **Commission tracking** - Currently hardcoded to $1 (TWS provides actual)

---

## 📝 **Test Report Template**

```
Date: ______
Time: ______
Mode: [ ] Demo  [ ] TWS Paper  [ ] TWS Live
Market Status: [ ] Open  [ ] Closed

ORDER TESTS:
-----------
Market Order (SPY):     [ ] Pass  [ ] Fail  Notes: ___________
Limit Order (AAPL):     [ ] Pass  [ ] Fail  Notes: ___________
Stop Order (MSFT):      [ ] Pass  [ ] Fail  Notes: ___________
Trailing Stop (TSLA):   [ ] Pass  [ ] Fail  Notes: ___________

P&L TESTS:
----------
Unrealized P&L:         [ ] Pass  [ ] Fail  Notes: ___________
Realized P&L:           [ ] Pass  [ ] Fail  Notes: ___________
Balance Update:         [ ] Pass  [ ] Fail  Notes: ___________
Position Quantity:      [ ] Pass  [ ] Fail  (1 order = 1 position?)

PERSISTENCE TESTS:
------------------
App Restart:            [ ] Pass  [ ] Fail  Notes: ___________
Data Recovery:          [ ] Pass  [ ] Fail  Notes: ___________

ISSUES FOUND:
-------------
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________
```

---

## 🚀 **Quick Test Script**

Save this as `test-orders.sh` for automated testing:

```bash
#!/bin/bash
echo "🧪 Testing Trading App"
echo "====================="

cd /Users/dev/Documents/tradingview

echo ""
echo "1️⃣ Checking app status..."
curl -s http://localhost:3000/admin/broker-status | python3 -m json.tool

echo ""
echo "2️⃣ Current open positions:"
psql -d tradingdb -c "SELECT symbol, quantity, \"avgEntryPrice\", \"unrealizedPnL\" FROM \"Position\" WHERE \"isOpen\" = true;"

echo ""
echo "3️⃣ Pending orders:"
psql -d tradingdb -c "SELECT symbol, \"orderType\", status FROM \"Order\" WHERE status = 'PENDING';"

echo ""
echo "4️⃣ Recent trades (last 5):"
psql -d tradingdb -c "SELECT symbol, action, quantity, price, TO_CHAR(\"executedAt\", 'HH24:MI:SS') as time FROM \"Trade\" ORDER BY \"executedAt\" DESC LIMIT 5;"

echo ""
echo "5️⃣ Account balance:"
curl -s http://localhost:3000/api/dashboard/account | python3 -m json.tool

echo ""
echo "✅ Test complete!"
```

**Usage:**

```bash
chmod +x test-orders.sh
./test-orders.sh
```

---

## 🎯 **Success Criteria**

Your app is working correctly if:

1. ✅ **1 order = 1 position** (no duplicates)
2. ✅ **All order types can be placed**
3. ✅ **Unrealized P&L updates with price**
4. ✅ **Realized P&L calculated on close**
5. ✅ **Balance updates correctly**
6. ✅ **Data persists after restart**
7. ✅ **TWS and Web UI show matching data**

---

**Last Updated:** 2026-01-13 6:30 PM EST
**Status:** ✅ All Systems Operational
**Next Steps:** Test in production with small quantities
