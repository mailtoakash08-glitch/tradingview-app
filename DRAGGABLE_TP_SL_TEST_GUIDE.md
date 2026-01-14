# 🎯 Draggable TP/SL Lines - Testing Guide

## ✅ Feature Successfully Deployed!

Your **draggable Take Profit and Stop Loss lines** are now live on VPS!

---

## 🧪 How to Test

### Step 1: Open the Trading App
```
http://165.227.104.40:3000/desktop
```

### Step 2: Make Sure You're on Lightweight Chart
- Click the **"📊 Lightweight (With Lines)"** tab at the top of the chart
- The TradingView chart doesn't support custom draggable lines

### Step 3: Enter TP/SL Prices

1. **Type a Take Profit price** in the "Take Profit ($)" input field
   - Example: `260.00`
   - A **GREEN line** will appear on the chart with the label `🎯 TP $260.00`

2. **Type a Stop Loss price** in the "Stop Loss ($)" input field
   - Example: `240.00`
   - A **RED line** will appear on the chart with the label `🛑 SL $240.00`

### Step 4: Drag the Lines!

1. **Hover near a TP or SL line** 
   - Your cursor will change to a **resize cursor** (↕️)
   - Lines have a 2% price threshold for detection

2. **Click and hold** on the line

3. **Drag up or down** to change the price
   - The line moves in real-time
   - The input field updates automatically!

4. **Release the mouse** to finish

### Step 5: Clear Lines

- Delete the value in the TP or SL input field
- The corresponding line will automatically disappear

---

## 🎨 Visual Guide

```
Chart View:
─────────────────────────────────────────
     🎯 TP $260.00  ← GREEN solid line (draggable)
─────────────────────────────────────────
         Current: $250.00
─────────────────────────────────────────
     🛑 SL $240.00  ← RED solid line (draggable)
─────────────────────────────────────────
```

---

## 🔥 Features Implemented

✅ **Green TP Line** - Shows Take Profit target  
✅ **Red SL Line** - Shows Stop Loss protection  
✅ **Drag Up/Down** - Move lines to adjust prices  
✅ **Two-Way Binding** - Typing updates line, dragging updates input  
✅ **Visual Feedback** - Cursor changes to resize icon when hovering  
✅ **Auto-Remove** - Clear input field to remove line  
✅ **Price Labels** - Shows exact price on chart axis  

---

## 📝 Usage Workflow

### Scenario 1: Quick Stop Order with TP/SL
1. Select **SPY** from watchlist
2. Chart switches to Lightweight Chart (with lines)
3. Type **Stop Price**: `595.00`
4. Type **Take Profit**: `600.00` → GREEN line appears
5. Type **Stop Loss**: `590.00` → RED line appears
6. **Drag the RED line down** to `588.00` → Input field updates
7. Click **BUY** to place order

### Scenario 2: Adjust TP/SL on the Fly
1. Position is open at $250
2. Type **TP**: `260` and **SL**: `245`
3. Market moves up, you want to lock in more profit
4. **Drag GREEN TP line** from $260 → $265
5. **Drag RED SL line** from $245 → $252 (trailing stop)
6. Input fields auto-update to new prices

---

## ⚠️ Important Notes

### ✅ Works on:
- **Lightweight Chart** tab only
- Desktop interface (`/desktop`)
- All order types (Market, Limit, Stop, Trailing)

### ❌ Doesn't work on:
- **TradingView Chart** tab (free widget limitation)
- Mobile devices (drag requires mouse)

---

## 🐛 Troubleshooting

### "Lines don't appear"
- ✅ Make sure you're on **Lightweight Chart** tab
- ✅ Enter a valid price (greater than 0)
- ✅ Refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

### "Can't drag the line"
- ✅ Hover **very close** to the line (within 2% of price)
- ✅ Cursor should change to ↕️ resize icon
- ✅ Click and hold, then drag

### "Input field doesn't update when dragging"
- ✅ Check browser console for errors (F12)
- ✅ Make sure JavaScript is enabled
- ✅ Try a hard refresh

---

## 🚀 Next Steps (Future Enhancements)

### Possible Improvements:
1. **Auto-Submit TP/SL Orders** - When main order fills, automatically place TP/SL orders
2. **Bracket Order Templates** - Quick 1:2, 1:3 risk/reward presets
3. **OCO Orders** - One-Cancels-Other (TP and SL linked)
4. **Multi-Tier TP/SL** - Scale out at multiple levels
5. **Visual Risk/Reward** - Show RR ratio on chart

---

## 📊 Technical Details

### Implementation:
- **Library**: Lightweight Charts v4.1.0
- **Mouse Events**: `mousedown`, `mousemove`, `mouseup`, `mouseleave`
- **Price Conversion**: `lwCandleSeries.coordinateToPrice(y)`
- **Line Creation**: `lwCandleSeries.createPriceLine()`
- **Two-Way Binding**: `input` event listener + drag callback

### Line Styles:
- **TP Line**: `#26A69A` (green), 2px solid
- **SL Line**: `#EF5350` (red), 2px solid
- **Detection Threshold**: 2% of current price

---

## 🎉 Enjoy Your Draggable Lines!

You can now visually set and adjust your Take Profit and Stop Loss levels by simply dragging lines on the chart!

**Happy Trading! 🚀📈**
