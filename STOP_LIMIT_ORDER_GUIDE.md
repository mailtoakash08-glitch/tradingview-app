# 🎯 Stop-Limit Order Type - Testing Guide

## ✅ Feature Successfully Deployed!

**Stop-Limit orders are now available** in your trading app! This order type is perfect for **after-hours trading** (`outsideRth: true`).

---

## 📊 **What is a Stop-Limit Order?**

A **Stop-Limit** order combines:
1. **Stop Price (Trigger)**: Order activates when price reaches this level
2. **Limit Price (Execution)**: Once triggered, order fills at limit price or better

### **Example:**
```
BUY Stop-Limit Order:
- Stop Price: $595.00  (activates when SPY hits $595)
- Limit Price: $596.00 (buy at $596 or better)

Result: Order triggers at $595, then fills at $596 or lower
```

---

## 🔥 **Why Use Stop-Limit?**

### ✅ **Advantages:**

1. **Works with `outsideRth`** ✅
   - Unlike Stop Market orders (which queue)
   - Can trigger and fill during pre-market/after-hours

2. **Price Protection**
   - Won't pay more than limit price (BUY)
   - Won't sell for less than limit price (SELL)

3. **Prevents Slippage**
   - Market orders can slip during low liquidity
   - Stop-Limit ensures you control execution price

### ⚠️ **Important:**
- If price moves too fast past your limit, order **may not fill**
- Set limit price with some buffer for volatile stocks

---

## 🧪 **How to Test**

### **Step 1: Open Trading App**
```
http://165.227.104.40:3000/desktop
```

### **Step 2: Select Order Type**
1. Select **"Stop-Limit Order"** from dropdown
2. **Two fields will appear:**
   - Stop Price (trigger)
   - Limit Price (execution)

### **Step 3: Enter Order Details**

#### Example: BUY Stop-Limit
```
Symbol: SPY
Quantity: 1
Order Type: Stop-Limit Order
Stop Price: 595.00     ← Triggers when price hits $595
Limit Price: 596.00    ← Won't pay more than $596
Extended Hours: ✅ Checked
```

#### Example: SELL Stop-Limit
```
Symbol: SPY
Quantity: 1
Order Type: Stop-Limit Order
Stop Price: 590.00     ← Triggers when price falls to $590
Limit Price: 589.00    ← Won't sell below $589
Extended Hours: ✅ Checked
```

### **Step 4: Submit Order**
- Click **BUY** or **SELL**
- Order appears in **Pending Orders** tab
- Wait for price to reach stop price

### **Step 5: Verify Execution**
- Order triggers when stop price is hit
- Order fills at limit price or better
- Position appears in **Open Positions** tab

---

## 📝 **Order Type Comparison**

| Order Type | Works `outsideRth`? | Risk of Slippage | Best Use Case |
|------------|-------------------|------------------|---------------|
| **Market** | ❌ NO (queued) | High | Quick fills during market hours |
| **Limit** | ✅ YES | None | Get specific price |
| **Stop Market** | ❌ NO (queued) | High | Stop losses during market hours |
| **Stop-Limit** | ✅ YES | Low* | After-hours + price control |
| **Trailing Stop** | ❌ NO (queued) | Medium | Lock in profits (RTH only) |

*Low slippage but may not fill if price gaps past limit

---

## 🎯 **Real-World Scenarios**

### **Scenario 1: After-Hours Breakout**
**Goal:** Buy SPY if it breaks above $595 after-hours

```javascript
Order Type: Stop-Limit
Stop Price: $595.00   // Trigger
Limit Price: $596.00  // Max price
Action: BUY
outsideRth: true ✅
```

**What Happens:**
1. SPY is at $594 → Order is pending
2. SPY rises to $595 → Order triggers
3. Order fills at $595-$596 range

---

### **Scenario 2: After-Hours Stop Loss**
**Goal:** Protect position with stop loss after-hours

```javascript
Current Position: Long SPY @ $595
Order Type: Stop-Limit
Stop Price: $590.00   // Exit if drops to $590
Limit Price: $589.00  // Minimum sell price
Action: SELL
outsideRth: true ✅
```

**What Happens:**
1. SPY drops to $590 → Order triggers
2. Order fills at $589-$590 range
3. Position closed with controlled loss

---

### **Scenario 3: Volatile Stock Entry**
**Goal:** Enter NVDA but avoid overpaying

```javascript
Order Type: Stop-Limit
Stop Price: $140.00   // Entry signal
Limit Price: $141.00  // Max price willing to pay
Action: BUY
outsideRth: true ✅
```

**What Happens:**
- If NVDA gaps from $139 → $142, **order won't fill** ✅
- Protects you from buying at inflated price
- Better than market order which would fill at $142

---

## 🔧 **Demo Mode Testing**

Stop-Limit orders work in **Demo Mode** too!

### **Test Workflow:**
1. Select **Demo Mode** broker
2. Place Stop-Limit order on SPY
3. Demo mode monitors Yahoo Finance prices every 5 seconds
4. When stop price triggers AND limit price is met → fills
5. Check **Pending Orders** → should show order
6. Wait for fill → appears in **Open Positions**

---

## ⚙️ **Technical Details**

### **Frontend (UI):**
- Dropdown shows "Stop-Limit Order" option
- Shows BOTH stop price and limit price fields
- Validates both fields are filled before submission

### **Backend (Order Processing):**
```typescript
// Internal type: "STP_LMT"
// TWS API format: "STP LMT"

Order object:
{
  orderType: "STP LMT",
  auxPrice: stopPrice,    // Trigger
  lmtPrice: limitPrice,   // Execution
  outsideRth: true        // ✅ Works!
}
```

### **Database:**
- Order stored with both `stopPrice` and `limitPrice`
- Order type: `STP_LMT`
- Status tracked: PENDING → FILLED

---

## 🐛 **Troubleshooting**

### **"Order not filling"**
✅ Check if:
- Stop price has been reached
- Current price is within limit price range
- Market is open (or `outsideRth: true`)

### **"Can't see both price fields"**
✅ Make sure:
- "Stop-Limit Order" is selected (not "Stop Market")
- Browser cache is cleared (Ctrl+Shift+R)

### **"Order queued in TWS"**
✅ This means:
- `outsideRth` might be false
- Or limit price is too far from current price
- Check TWS order panel for details

---

## 📊 **Order Flow Diagram**

```
User Submits Stop-Limit Order
        ↓
Order saved to database (PENDING)
        ↓
Price monitoring starts
        ↓
Stop Price Reached? → NO → Keep monitoring
        ↓ YES
Limit Price Met? → NO → Order stays active
        ↓ YES
Order FILLS at limit price
        ↓
Position created
        ↓
Order status: FILLED
```

---

## 🚀 **Next Steps**

### **Try These Tests:**

1. **Basic Stop-Limit (Demo)**
   - Buy SPY with stop $595, limit $596
   - Verify it shows in Pending Orders
   - Wait for fill

2. **After-Hours Stop-Limit (IBKR Paper)**
   - Place order after 4pm ET
   - Enable Extended Hours
   - Verify it triggers outside RTH

3. **Stop-Limit vs Stop Market**
   - Place both order types at same time
   - See which one fills first after-hours
   - Stop-Limit should work, Stop Market queues

---

## 📚 **Resources**

- [IBKR: Stop-Limit Orders](https://www.interactivebrokers.com/en/trading/orders/stopLimit.php)
- [Order Types Comparison](https://www.investopedia.com/terms/s/stop-limitorder.asp)

---

## ✅ **Summary**

**Stop-Limit orders are now fully functional!**

✅ Available in UI dropdown  
✅ Shows both stop and limit price fields  
✅ Works with `outsideRth: true`  
✅ Supported in Demo, Paper, and Live trading  
✅ Prevents slippage and price gaps  
✅ Best for after-hours trading  

**Go test it out!** 🎉📈
