# 🧪 Demo Mode Stop Orders - Testing Guide

## ✅ **What Was Fixed:**

### **BEFORE (Broken):**
- ❌ Stop orders filled after 2 seconds **regardless of price**
- ❌ No price monitoring
- ❌ No realistic trigger behavior
- ❌ Lines appeared but orders still filled immediately

### **AFTER (Fixed):**
- ✅ Stop orders **only fill when price reaches trigger**
- ✅ Real-time price monitoring (every 5 seconds via Yahoo Finance)
- ✅ Realistic trigger logic for BUY/SELL stops
- ✅ Pending orders show in UI until triggered
- ✅ Can cancel pending orders before trigger

---

## 📊 **How Stop Orders Work Now:**

### **BUY STOP Order:**
```
1. Set Stop Price: $260
2. Current Price: $255
3. Order Status: PENDING (waiting)
4. Line appears at $260 on Lightweight Chart
5. Price rises to $260 → Order TRIGGERS
6. Order fills at current market price (~$260)
7. Line disappears
8. Position shows in "Open Positions"
```

**Use Case:** Enter a LONG position when price breaks above resistance.

---

### **SELL STOP Order:**
```
1. Set Stop Price: $250
2. Current Price: $255
3. Order Status: PENDING (waiting)
4. Line appears at $250 on Lightweight Chart
5. Price drops to $250 → Order TRIGGERS
6. Order fills at current market price (~$250)
7. Line disappears
8. Position shows in "Open Positions"
```

**Use Case:** Exit a LONG position when price breaks below support (stop-loss).

---

## 🧪 **Test Scenarios:**

### **Test 1: BUY STOP Above Current Price**

**Goal:** Verify order only triggers when price rises to stop level.

1. **Open:** http://165.227.104.40:3000/desktop
2. **Broker:** Demo
3. **Symbol:** AAPL
4. **Current Price:** Check watchlist (e.g., $260)
5. **Order Type:** Stop Market
6. **Stop Price:** $265 (above current)
7. **Quantity:** 1
8. **Action:** Click BUY
9. **Expected:**
   - ✅ Order shows in "Pending Stop Orders"
   - ✅ Red line appears at $265 on Lightweight Chart
   - ✅ Order does NOT fill immediately
   - ✅ Status remains "PENDING"
10. **Monitor:** Wait 5-10 seconds, check if order is still pending
11. **Result:** Order will only fill if AAPL price rises to $265

---

### **Test 2: SELL STOP Below Current Price (Stop-Loss)**

**Goal:** Verify stop-loss triggers when price drops.

1. **First:** Place a LONG position
   - Symbol: MSFT
   - Order Type: Market Order
   - Quantity: 1
   - Click BUY
   - Wait 2 seconds for fill
2. **Then:** Set stop-loss
   - Order Type: Stop Market
   - Stop Price: $470 (below current ~$477)
   - Quantity: 1
   - Action: Click SELL
3. **Expected:**
   - ✅ Order shows in "Pending Stop Orders"
   - ✅ Red line appears at $470 on Lightweight Chart
   - ✅ Order does NOT fill immediately
4. **Result:** Order will only fill if MSFT drops to $470

---

### **Test 3: BUY STOP Below Current Price (Should NOT Trigger)**

**Goal:** Verify incorrect stop placement behavior.

1. **Symbol:** TSLA
2. **Current Price:** ~$450
3. **Order Type:** Stop Market
4. **Stop Price:** $440 (below current)
5. **Action:** Click BUY
6. **Expected:**
   - ⚠️ Order will **trigger immediately** because current price ($450) is already above stop ($440)
   - This is correct behavior!
   - BUY STOP should always be **above** current price

---

### **Test 4: Cancel Pending Order**

**Goal:** Verify you can cancel before trigger.

1. **Place a BUY STOP:**
   - Symbol: NVDA
   - Stop Price: $200 (above current ~$185)
   - Quantity: 1
2. **Verify:**
   - Order shows in "Pending Stop Orders"
3. **Cancel:**
   - Click "X Cancel" button in Pending Orders table
4. **Expected:**
   - ✅ Order disappears from pending
   - ✅ Line disappears from chart
   - ✅ Order status in DB: CANCELLED

---

## 📋 **Trigger Logic Reference:**

| Order Type | Action | Trigger Condition | When It Fills |
|------------|--------|-------------------|---------------|
| **STOP** | BUY | `Current Price >= Stop Price` | Price rises to or above stop |
| **STOP** | SELL | `Current Price <= Stop Price` | Price drops to or below stop |
| **LIMIT** | BUY | `Current Price <= Limit Price` | Price drops to or below limit |
| **LIMIT** | SELL | `Current Price >= Limit Price` | Price rises to or above limit |

---

## 🔍 **Monitoring & Debugging:**

### **Check PM2 Logs:**
```bash
ssh root@165.227.104.40
pm2 logs trading-app --lines 50
```

**Look for:**
- `🎮 DEMO: Monitoring X pending orders...`
- `🎮 DEMO: Order DEMO-XXXX still pending (AAPL current: $260.25, trigger: $265.00)`
- `🎮 DEMO: BUY STOP triggered! Price 265.50 >= 265.00`
- `🎮 DEMO: Order DEMO-XXXX triggered, filling now...`

---

### **Check Database:**
```sql
-- On VPS
psql trading_automation
SELECT * FROM "Order" WHERE broker = 'demo' ORDER BY "submittedAt" DESC LIMIT 10;
```

**Look for:**
- Status: `PENDING` → `FILLED` (when triggered)
- Status: `PENDING` → `CANCELLED` (if you cancelled)

---

## ⏱️ **Important Timing Details:**

1. **Price Check Interval:** Every 5 seconds
2. **Market Order Fill Delay:** 2 seconds
3. **Stop Order Fill Delay:** 0 seconds (instant once triggered)
4. **Yahoo Finance API:** Real-time market data
5. **After-Hours:** Works with `outsideRth: true`

---

## 🎯 **Expected Behavior Summary:**

### **Market Orders (MKT):**
- ✅ Fill in 2 seconds
- ✅ Use real market price
- ❌ No line on chart
- ❌ No pending state

### **Stop Orders (STP):**
- ✅ Stay PENDING until price reaches trigger
- ✅ Show line on Lightweight Chart
- ✅ Monitor price every 5 seconds
- ✅ Fill at current market price when triggered
- ✅ Can be cancelled before trigger

### **Limit Orders (LMT):**
- ✅ Same as stop orders
- ✅ Different trigger logic (opposite direction)

---

## 🚀 **Real Trading Workflow:**

```
1. Analyze chart on TradingView tab (technical analysis)
2. Identify entry point (e.g., breakout at $265)
3. Switch to Lightweight Chart tab
4. Place BUY STOP at $265
5. See line appear on chart
6. Wait for price to reach $265
7. Order triggers automatically
8. Position opens
9. Set SELL STOP below entry for stop-loss
10. Set SELL LIMIT above entry for take-profit
```

---

## ✅ **Success Criteria:**

Test is successful if:
1. ✅ Stop orders appear in "Pending Stop Orders" table
2. ✅ Lines appear on Lightweight Chart at trigger price
3. ✅ Orders do NOT fill immediately (unless already triggered)
4. ✅ Orders fill when price reaches trigger (check logs)
5. ✅ Can cancel pending orders
6. ✅ Real prices used ($260 for AAPL, not $107)

---

**Ready to test!** 🎯

Try **Test 1** first and report back what you see!
