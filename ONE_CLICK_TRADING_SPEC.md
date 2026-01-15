# One-Click Trading System - Complete Specification

## 🎯 **Objective:**

Build a professional trading system where orders are placed via draggable chart lines, NOT manual price entry. This matches TradingView Paper Trading workflow and enables 5-second trade execution.

---

## 📋 **User Workflow:**

### **Step 1: Set Quantity**
```
Input: [10] shares
```

### **Step 2: Click Buy/Sell**
```
Action: Click "BUY" button
Result: 
  - Instant market order placed (or aggressive limit if outside RTH)
  - Position opens immediately
  - Entry line drawn on chart (BLUE, SOLID)
  - 2 draggable lines appear:
    * Stop Loss line (RED, DASHED) at -2% from entry
    * Take Profit line (GREEN, DASHED) at +6% from entry
```

### **Step 3: Adjust Stop Loss**
```
Action: Drag RED line to desired stop price
Real-time display:
  - "Stop Loss: $147.50"
  - "Max Loss: -$50.00 (-2.5%)"
  - Updates as line moves
```

### **Step 4: Adjust Take Profit**
```
Action: Drag GREEN line to desired profit target
Real-time display:
  - "Take Profit: $159.00"
  - "Target Profit: +$150.00 (+7.5%)"
  - "Risk/Reward: 1:3.0"
```

### **Step 5: Done!**
```
Result:
  - Position open with quantity
  - Stop Loss order placed at dragged price
  - Take Profit order placed at dragged price
  - Live P&L tracking
```

---

## 🔧 **Technical Implementation:**

### **1. Frontend Changes (src/routes/desktop.ts)**

#### **A. Simplified Order Form**

```html
<!-- REMOVE all price inputs -->
<!-- KEEP only: -->
<div class="order-panel">
  <div class="form-group">
    <label>Quantity</label>
    <input type="number" id="quantity" value="10" min="1" />
  </div>
  
  <div class="button-group">
    <button class="buy-btn" onclick="quickBuy()">
      🟢 BUY
    </button>
    <button class="sell-btn" onclick="quickSell()">
      🔴 SELL
    </button>
  </div>
</div>
```

#### **B. Quick Order Functions**

```javascript
async function quickBuy() {
  const quantity = document.getElementById('quantity').value;
  const symbol = currentSymbol;
  
  // Get current market price
  const currentPrice = await getCurrentPrice(symbol);
  
  // Determine order type based on market hours
  const isMarketHours = checkMarketHours();
  const orderType = isMarketHours ? 'MKT' : 'LMT';
  const limitPrice = isMarketHours ? null : currentPrice + 0.50; // Aggressive limit
  
  // Place order
  const order = {
    symbol: symbol,
    action: 'BUY',
    quantity: parseInt(quantity),
    orderType: orderType,
    limitPrice: limitPrice,
    broker: selectedBroker,
    strategy: 'one_click_trading'
  };
  
  const response = await fetch('/webhook/tradingview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  
  if (response.ok) {
    showNotification('✅ Position opened!');
    
    // Wait for position to appear
    setTimeout(() => {
      // Draw protection lines
      drawProtectionLines(symbol, quantity, currentPrice, 'LONG');
    }, 1000);
  }
}

async function quickSell() {
  // Same as quickBuy but with action: 'SELL' and 'SHORT' direction
}
```

#### **C. Protection Lines System**

```javascript
let protectionLines = {
  entry: null,
  stopLoss: null,
  takeProfit: null
};

let isDraggingStop = false;
let isDraggingTarget = false;

function drawProtectionLines(symbol, quantity, entryPrice, direction) {
  // Remove old lines
  removeProtectionLines();
  
  // Calculate initial SL and TP
  const stopLossPrice = direction === 'LONG' 
    ? entryPrice * 0.98  // -2% for long
    : entryPrice * 1.02; // +2% for short
  
  const takeProfitPrice = direction === 'LONG'
    ? entryPrice * 1.06  // +6% for long
    : entryPrice * 0.94; // -6% for short
  
  // Draw ENTRY line (blue, solid, non-draggable)
  protectionLines.entry = lwCandleSeries.createPriceLine({
    price: entryPrice,
    color: '#2196F3', // Blue
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Solid,
    axisLabelVisible: true,
    title: `ENTRY ${quantity} ${direction} @ $${entryPrice.toFixed(2)}`
  });
  
  // Draw STOP LOSS line (red, dashed, draggable)
  protectionLines.stopLoss = lwCandleSeries.createPriceLine({
    price: stopLossPrice,
    color: '#F44336', // Red
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    axisLabelVisible: true,
    title: `🛑 STOP LOSS $${stopLossPrice.toFixed(2)}`
  });
  
  // Draw TAKE PROFIT line (green, dashed, draggable)
  protectionLines.takeProfit = lwCandleSeries.createPriceLine({
    price: takeProfitPrice,
    color: '#4CAF50', // Green
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    axisLabelVisible: true,
    title: `🎯 TAKE PROFIT $${takeProfitPrice.toFixed(2)}`
  });
  
  // Make lines draggable
  setupProtectionLineDragging(symbol, quantity, entryPrice, direction);
  
  // Place initial SL and TP orders
  placeProtectionOrders(symbol, quantity, stopLossPrice, takeProfitPrice, direction);
}

function setupProtectionLineDragging(symbol, quantity, entryPrice, direction) {
  const chartElement = document.getElementById('lightweightChart');
  
  chartElement.addEventListener('mousedown', (e) => {
    const price = getPriceAtMouseY(e.clientY);
    
    // Check if clicking near SL line
    if (Math.abs(price - getLinePrice(protectionLines.stopLoss)) < 0.50) {
      isDraggingStop = true;
      chartElement.style.cursor = 'ns-resize';
    }
    
    // Check if clicking near TP line
    if (Math.abs(price - getLinePrice(protectionLines.takeProfit)) < 0.50) {
      isDraggingTarget = true;
      chartElement.style.cursor = 'ns-resize';
    }
  });
  
  chartElement.addEventListener('mousemove', (e) => {
    if (isDraggingStop) {
      const newPrice = getPriceAtMouseY(e.clientY);
      updateStopLossLine(newPrice);
      updatePnLDisplay(symbol, quantity, entryPrice, newPrice, getLinePrice(protectionLines.takeProfit), direction);
    }
    
    if (isDraggingTarget) {
      const newPrice = getPriceAtMouseY(e.clientY);
      updateTakeProfitLine(newPrice);
      updatePnLDisplay(symbol, quantity, entryPrice, getLinePrice(protectionLines.stopLoss), newPrice, direction);
    }
  });
  
  chartElement.addEventListener('mouseup', async () => {
    if (isDraggingStop || isDraggingTarget) {
      // Place/update orders with new prices
      const slPrice = getLinePrice(protectionLines.stopLoss);
      const tpPrice = getLinePrice(protectionLines.takeProfit);
      
      await updateProtectionOrders(symbol, quantity, slPrice, tpPrice, direction);
      
      isDraggingStop = false;
      isDraggingTarget = false;
      chartElement.style.cursor = 'default';
    }
  });
}

function updatePnLDisplay(symbol, quantity, entryPrice, stopPrice, targetPrice, direction) {
  // Calculate max loss
  const stopDiff = direction === 'LONG' 
    ? (stopPrice - entryPrice)
    : (entryPrice - stopPrice);
  const maxLoss = stopDiff * quantity;
  const maxLossPct = (stopDiff / entryPrice) * 100;
  
  // Calculate target profit
  const targetDiff = direction === 'LONG'
    ? (targetPrice - entryPrice)
    : (entryPrice - targetPrice);
  const targetProfit = targetDiff * quantity;
  const targetProfitPct = (targetDiff / entryPrice) * 100;
  
  // Calculate Risk/Reward
  const riskReward = Math.abs(targetProfit / maxLoss);
  
  // Update UI display
  document.getElementById('pnl-display').innerHTML = `
    <div class="pnl-info">
      <div class="loss-info" style="color: #F44336;">
        ⚠️ Max Loss: $${maxLoss.toFixed(2)} (${maxLossPct.toFixed(2)}%)
      </div>
      <div class="profit-info" style="color: #4CAF50;">
        ✅ Target Profit: $${targetProfit.toFixed(2)} (${targetProfitPct.toFixed(2)}%)
      </div>
      <div class="rr-info" style="color: #2196F3;">
        📊 Risk/Reward: 1:${riskReward.toFixed(2)}
      </div>
    </div>
  `;
}
```

#### **D. Auto OutsideRth Conversion**

```javascript
function checkMarketHours() {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const day = nyTime.getDay();
  
  // Weekend
  if (day === 0 || day === 6) return false;
  
  // Market hours: 9:30 AM - 4:00 PM EST
  if (hours < 9 || (hours === 9 && minutes < 30)) return false;
  if (hours >= 16) return false;
  
  return true;
}

function getStopLimitMargin() {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hours = nyTime.getHours();
  
  // Pre-market (4 AM - 9:30 AM): Higher margin due to volatility
  if (hours >= 4 && hours < 9) {
    return 0.015; // 1.5%
  }
  
  // After-hours (4 PM - 8 PM): Medium margin
  if (hours >= 16 && hours < 20) {
    return 0.010; // 1.0%
  }
  
  // Late night (8 PM - 4 AM): Lower margin (less volatile)
  return 0.005; // 0.5%
}

async function placeProtectionOrders(symbol, quantity, stopPrice, targetPrice, direction) {
  const isMarketHours = checkMarketHours();
  
  // Stop Loss Order
  let stopOrderType, stopLimitPrice;
  if (isMarketHours) {
    stopOrderType = 'STP'; // Regular stop
    stopLimitPrice = null;
  } else {
    stopOrderType = 'STP_LMT'; // Stop-Limit for outside RTH
    const margin = getStopLimitMargin();
    stopLimitPrice = direction === 'LONG'
      ? stopPrice * (1 - margin) // Sell limit below stop
      : stopPrice * (1 + margin); // Buy limit above stop
  }
  
  const stopOrder = {
    symbol: symbol,
    action: direction === 'LONG' ? 'SELL' : 'BUY',
    quantity: quantity,
    orderType: stopOrderType,
    stopPrice: stopPrice,
    limitPrice: stopLimitPrice,
    broker: selectedBroker,
    strategy: 'protection',
    outsideRth: !isMarketHours
  };
  
  await fetch('/webhook/tradingview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stopOrder)
  });
  
  // Take Profit Order (always limit)
  const targetOrder = {
    symbol: symbol,
    action: direction === 'LONG' ? 'SELL' : 'BUY',
    quantity: quantity,
    orderType: 'LMT',
    limitPrice: targetPrice,
    broker: selectedBroker,
    strategy: 'protection',
    outsideRth: !isMarketHours
  };
  
  await fetch('/webhook/tradingview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(targetOrder)
  });
  
  showNotification('🛡️ Protection orders placed!');
}
```

---

### **2. Backend Changes (if needed)**

- Already supports all order types ✅
- Already supports `outsideRth` ✅
- Already supports Stop-Limit with auto-margin ✅

**No backend changes needed!** 🎉

---

### **3. Scanner Implementation (Phase 2)**

Create `/Users/dev/Documents/tradingview/src/services/marketScanner.ts`:

```typescript
export class MarketScanner {
  private scanInterval: NodeJS.Timeout | null = null;
  
  async scanForSpikes(): Promise<SpikeAlert[]> {
    // Fetch pre-market/after-hours movers
    // Check volume surge, price breakout, gap detection
    // Return array of alerts
  }
  
  startScanning(): void {
    this.scanInterval = setInterval(() => {
      this.scanForSpikes();
    }, 60000); // Every 1 minute
  }
}
```

---

## 📊 **UI Mockup:**

```
┌─────────────────────────────────────┐
│  Symbol: AAPL   |   [10] shares     │
│  ┌────────┐     ┌────────┐          │
│  │🟢 BUY  │     │🔴 SELL │          │
│  └────────┘     └────────┘          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         CHART WITH LINES            │
│                                     │
│  🎯 $162.50 ─ ─ ─ ─ ─ (DRAGGABLE)  │
│  💵 $155.00 ━━━━━━━━ (ENTRY)       │
│  🛑 $151.50 ─ ─ ─ ─ ─ (DRAGGABLE)  │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ⚠️ Max Loss: -$35.00 (-2.26%)      │
│  ✅ Target: +$75.00 (+4.84%)        │
│  📊 Risk/Reward: 1:2.14             │
└─────────────────────────────────────┘
```

---

## ✅ **Testing Checklist:**

- [ ] Click Buy → Position opens instantly
- [ ] Entry line appears (blue, solid)
- [ ] SL line appears (red, dashed, draggable)
- [ ] TP line appears (green, dashed, draggable)
- [ ] Drag SL → P&L updates in real-time
- [ ] Drag TP → R:R updates in real-time
- [ ] Market hours → STP orders placed
- [ ] Outside RTH → STP_LMT orders placed
- [ ] Pre-market → Higher margin (1.5%)
- [ ] After-hours → Medium margin (1.0%)
- [ ] Lines persist on symbol change
- [ ] Lines update on position close

---

## 🚀 **Timeline:**

1. **Phase 1 (One-Click Trading):** 2-3 hours
2. **Phase 2 (Scanner):** 3-4 hours

**Total: 5-7 hours of focused development**

---

**Ready to start building?**
