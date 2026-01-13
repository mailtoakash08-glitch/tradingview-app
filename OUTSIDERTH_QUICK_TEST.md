# 🌙 Quick outsideRth Test Guide (After Hours Trading)

**Current Time:** 6:10 PM EST (Market Closed)  
**Market Hours:** 9:30 AM - 4:00 PM EST  
**After Hours:** 4:00 PM - 8:00 PM EST

---

## ✅ What WORKS with outsideRth

### **1. Order Placement** ✅

- Orders can be submitted to TWS
- You'll see success notification
- Orders appear in "Pending Orders" tab
- TWS shows the orders

### **2. Limit Orders** ✅ (Best for after-hours)

- Can be placed and will fill if price is reached
- Use aggressive limit prices for immediate fills
- Example: If stock is $100, use limit $101 for buy

### **3. Manual Sync** ✅

- Click "🔄 Sync" button to check for fills
- Refreshes order status from TWS

---

## ⚠️ What DOESN'T Work with outsideRth

### **1. Stop Orders** ❌❌❌

**IMPORTANT: Stop orders DO NOT work during after-hours!**

- **Stop Market** - Queued until market open (9:30 AM EST)
- **Stop Limit** - Queued until market open
- **Trailing Stop** - Queued until market open

**TWS Message:** _"Order will be activated after market hours"_

**Why?** Stop orders need liquidity to trigger safely. After-hours has low volume and wide spreads.

**Solution:** Use Limit Orders instead during outsideRth!

### **2. Market Orders** ❌

- TWS queues them but won't fill until market open
- No error, but no fill either
- **Use Limit Orders instead!**

### **3. Real-Time Event Notifications** ⚠️

- TWS doesn't send fill events during after-hours
- You must manually click "🔄 Sync" to see fills
- After sync, orders update to FILLED

---

## 🧪 Quick Test Procedure (5 minutes)

### **Step 1: Place a Limit Order**

```
Symbol: SPY
Quantity: 1
Order Type: Limit Order
Limit Price: [Current Price + $0.50]  ← Above market for quick fill
Extended Hours: ✅ CHECKED (outsideRth)
Broker: Interactive Brokers
```

**Expected:**

- ✅ Success notification
- ✅ Order appears in TWS
- ✅ Order shows in "Pending Orders" tab

---

### **Step 2: Check TWS**

Open TWS and look for:

- Order in pending orders list
- Status: "Submitted" or "Filled"
- Fill price if executed

---

### **Step 3: Manual Sync**

In the web app:

1. Click the green **"🔄 Sync"** button
2. Wait 2-3 seconds
3. Check "Pending Orders" tab

**Expected:**

- If filled in TWS → Order disappears from Pending
- If filled in TWS → Position appears in "Open Positions"
- P&L updates with current price

---

### **Step 4: Verify Position**

If order filled:

- ✅ Check "Open Positions" tab
- ✅ See entry price
- ✅ See current price (live)
- ✅ See unrealized P&L

---

## 🎯 Recommended Test Orders

### **Test 1: Quick Fill Limit Order (Aggressive)**

```bash
Symbol: SPY
Type: Limit Order
Price: Current + $0.50 (aggressive, above market)
Extended Hours: ✅ YES
Expected: Fills immediately
```

### **Test 2: Limit Order at Market Price**

```bash
Symbol: AAPL
Type: Limit Order
Price: Exact current price
Extended Hours: ✅ YES
Expected: May fill if there's after-hours volume
```

### **Test 3: Conservative Limit Order**

```bash
Symbol: TSLA
Type: Limit Order
Price: Current - $0.20 (below market, waiting for dip)
Extended Hours: ✅ YES
Expected: Waits for price to drop, then fills
```

### **❌ DON'T TEST: Stop Orders**

```bash
⚠️ Stop Market, Stop Limit, Trailing Stop
Extended Hours: ✅ YES
Result: TWS queues until 9:30 AM EST
Message: "Order will be activated after market hours"
```

---

## 📋 Test Checklist

- [ ] **1. Place limit order with aggressive price**
- [ ] **2. Check TWS - order appears**
- [ ] **3. Wait 10 seconds**
- [ ] **4. Check TWS - order filled?**
- [ ] **5. Click "🔄 Sync" in web app**
- [ ] **6. Verify position appears**
- [ ] **7. Check P&L updates**
- [ ] **8. Try closing position**

---

## 🔧 If Order Doesn't Fill

### **Check TWS:**

- Order status in TWS?
- Any error messages?
- Is "Allow connections from localhost only" checked?

### **Check App:**

- Broker shows "✅ Connected"?
- Order in "Pending Orders"?
- Any red error notifications?

### **Force Sync:**

```bash
# In terminal (if needed)
cd /Users/dev/Documents/tradingview
curl -X POST http://localhost:3000/api/dashboard/orders/sync \
  -H "Content-Type: application/json" \
  -d '{"broker":"ibkr"}'
```

---

## 🚨 Known Issues & Workarounds

### **Issue 1: Order fills in TWS but not in app**

**Workaround:** Click "🔄 Sync" button

### **Issue 2: Market orders don't fill**

**Workaround:** Use Limit Orders with aggressive prices

### **Issue 3: Position quantity wrong**

**Workaround:** Check TWS, may need manual database fix

### **Issue 4: P&L shows $0**

**Workaround:** Wait 5 seconds for price update, or refresh browser

---

## 💡 Best Practices for outsideRth

1. **Always use Limit Orders** - Market orders won't fill
2. **Use aggressive limit prices** - Ensures fills in low volume
3. **Click Sync after placing orders** - Don't wait for automatic updates
4. **Check TWS first** - Verify order status before syncing
5. **Be patient** - After-hours volume is lower, fills take longer

---

## 📊 What to Expect

### **Timeline:**

```
0:00 - Place order via web UI
0:01 - Order appears in TWS
0:05 - Order fills in TWS (if limit price hit)
0:06 - Click "🔄 Sync" in web app
0:07 - Position appears in web app
0:08 - P&L updates with live price
```

---

## 🎓 Quick Reference

### **Check Connection:**

```bash
# See if connected to TWS
curl -s http://localhost:3000/admin/broker-status | python3 -m json.tool
```

### **Check Pending Orders:**

```bash
# See pending orders in database
psql -d tradingdb -c 'SELECT "orderId", symbol, "orderType", status FROM "Order" WHERE status='"'"'PENDING'"'"' ORDER BY "submittedAt" DESC LIMIT 5;'
```

### **Check Positions:**

```bash
# See open positions
psql -d tradingdb -c 'SELECT symbol, quantity, "avgEntryPrice", "unrealizedPnL" FROM "Position" WHERE "isOpen"=true;'
```

### **Manual Position Refresh:**

```bash
# Force price update
curl -s http://localhost:3000/api/dashboard/positions?broker=ibkr | python3 -m json.tool | grep -A 5 unrealizedPnL
```

---

## ✅ Success Criteria

**Your test is successful if:**

1. ✅ Order appears in TWS within 5 seconds
2. ✅ Order fills in TWS (for limit orders)
3. ✅ After clicking "🔄 Sync", order updates in app
4. ✅ Position appears with correct quantity
5. ✅ P&L shows non-zero value
6. ✅ Can close position successfully

---

## 🚀 Ready to Test?

**Open:** http://localhost:3000

**Steps:**

1. Select "Interactive Brokers"
2. Enter: SPY, 1 share, Limit Order, $694 (or current+$0.50)
3. Check "Extended Hours"
4. Click "Place Order"
5. Wait 10 seconds
6. Check TWS
7. Click "🔄 Sync"
8. Verify position!

---

**Good luck with your after-hours testing!** 🌙📈
