# Draggable TP/SL Lines Feature

## ✅ What You Want

**Visual draggable Take Profit and Stop Loss lines on the chart** that you can:
1. See as green (TP) and red (SL) horizontal lines
2. Drag up and down to adjust prices
3. Automatically update the input field values when dragged
4. Auto-place TP/SL orders when the main order fills

---

## 📊 Current Status

### ✅ Already Implemented:
- TP/SL input fields in the order form (lines 1043-1050)
- Lightweight Charts with price line drawing capability
- Order line drawing for stop orders
- Position line drawing for entries

### ❌ Missing:
- Draggable price lines
- TP/SL line visualization
- Two-way binding (drag line → update input field)
- Auto-submit TP/SL orders after fill

---

## 🎯 Implementation Plan

### Step 1: Add TP/SL Line Drawing
When user enters TP or SL price in input fields:
- Draw GREEN horizontal line for Take Profit
- Draw RED horizontal line for Stop Loss
- Make lines draggable

### Step 2: Enable Drag Functionality
Using Lightweight Charts API:
```javascript
// Create draggable price line
const tpLine = lwCandleSeries.createPriceLine({
  price: tpPrice,
  color: '#26A69A', // Green for TP
  lineWidth: 2,
  lineStyle: LightweightCharts.LineStyle.Solid,
  axisLabelVisible: true,
  title: 'TP',
  draggable: true // KEY FEATURE
});

// Listen for drag events
tpLine.applyOptions({
  onDrag: (newPrice) => {
    document.getElementById('takeProfit').value = newPrice.toFixed(2);
  }
});
```

### Step 3: Two-Way Binding
- **Input → Line:** When user types price, update line position
- **Line → Input:** When user drags line, update input value

### Step 4: Auto-Submit TP/SL After Fill
When main order fills:
1. Check if TP/SL prices were set
2. Automatically place limit order (for TP) and stop order (for SL)
3. Draw lines for these orders

---

## ⚠️ Technical Challenge

**Lightweight Charts v4.1.0 does NOT support draggable price lines out of the box.**

### Solutions:

#### Option A: Upgrade to Lightweight Charts v4.2+ (if available)
Newer versions may have drag support.

#### Option B: Custom Drag Implementation
Implement mouse event handling:
```javascript
let isDragging = false;
let dragLine = null;

chart.subscribeCrosshairMove((param) => {
  if (isDragging && param.point) {
    const price = lwCandleSeries.coordinateToPrice(param.point.y);
    updateLinePrice(dragLine, price);
  }
});

// Mouse down on line → start drag
// Mouse move → update line
// Mouse up → end drag
```

#### Option C: Use TradingView Advanced Charts
TradingView's paid API has built-in draggable lines via:
```javascript
tvWidget.activeChart().createOrderLine()
  .setText("Take Profit")
  .setQuantity("100")
  .setPrice(150.00)
  .setEditable(true); // Makes it draggable
```

**BUT** the free widget we're using doesn't support this.

---

## 🚀 Recommended Approach

### Quick Win (Simpler):
1. **Add TP/SL static lines** (not draggable yet)
2. User adjusts via input fields only
3. Lines update visually as they type
4. Auto-submit TP/SL when main order fills

### Full Feature (Complex):
1. Implement custom drag handling with mouse events
2. Detect when mouse is over a line
3. Allow dragging with visual feedback
4. Update input fields in real-time

---

## 💡 Alternative: Quick TP/SL Buttons

Instead of dragging, add quick buttons:
```
[TP: +$1] [+$5] [+$10]  [Take Profit: 150.00]
[SL: -$1] [-$5] [-$10]  [Stop Loss: 140.00]
```

User clicks "+$5" to quickly adjust TP/SL by $5 increments.

---

## 📝 Next Steps

**Option 1 (Recommended):** I implement static TP/SL lines that update as you type
**Option 2:** I implement full draggable lines with custom mouse handling
**Option 3:** I add quick adjustment buttons for faster workflow

**Which would you prefer?**

---

## 🎨 Visual Example

What it will look like:

```
Chart:
─────────────────────────────────
               TP: $155.00 ← Green line
─────────────────────────────────
         Current Price: $150
─────────────────────────────────
               SL: $145.00 ← Red line
─────────────────────────────────
```

When you drag the green line up to $160, the "Take Profit" input field automatically updates to 160.00.

---

**Let me know which option you'd like and I'll implement it!** 🚀
