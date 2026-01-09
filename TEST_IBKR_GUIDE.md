# 🏦 IBKR Paper Trading - Quick Test Guide

**Status:** ✅ IB Gateway Connected!  
**Last Updated:** January 9, 2026

---

## ✅ **You're Ready to Test!**

Your IB Gateway is **connected and ready** for paper trading!

---

## 🎯 **Option 1: Test via Script (Recommended)**

**Run this command:**
```bash
cd /Users/dev/Documents/tradingview
./test-ibkr-order.sh
```

**What it does:**
1. ✅ Verifies IB Gateway connection
2. ✅ Checks current positions
3. ✅ Places a 1-share AAPL test order
4. ✅ Waits for fill (up to 60 seconds)
5. ✅ Shows you the position

**Safe:** Only places 1 share (~$180 value in paper account)

---

## 🎯 **Option 2: Test via Desktop UI**

### **Step-by-Step:**

1. **Open Desktop:**
   ```
   http://165.227.104.40:3000/desktop
   ```

2. **Select Broker:**
   - Click the **Broker** dropdown
   - Select: **🏦 Interactive Brokers**

3. **Enter Order:**
   - Symbol: `AAPL` (or `SPY`, `QQQ`)
   - Quantity: `1` (start small!)
   - Order Type: `Market Order`
   - Extended Hours: Uncheck (trade during market hours)

4. **Place Order:**
   - Click **BUY** button
   - You'll see: "Order placed successfully"

5. **Wait for Fill:**
   - **Paper trading can take 5-60 seconds**
   - Position will appear in the table when filled
   - Refresh if needed (↻ button)

---

## ⚠️ **Important: IBKR Paper Trading Notes**

### **It's SLOW:**
- Demo mode: 2 seconds ⚡
- IBKR Paper: 5-60 seconds 🐌
- Sometimes doesn't fill at all

### **Why so slow?**
IBKR Paper Trading has:
- Lower priority than live orders
- Simulated matching (not real-time)
- Sometimes buggy fills

### **Best Practices:**
- ✅ Use liquid symbols (AAPL, SPY, QQQ, MSFT)
- ✅ Trade during market hours (9:30am-4pm ET)
- ✅ Start with 1-2 shares
- ✅ Be patient (60+ seconds is normal)
- ❌ Don't use for high-frequency testing
- ❌ Don't rely on exact fills

---

## 🎯 **Quick Test Workflow**

### **Morning Test (Before Trading):**

```bash
# 1. Check status
./check-quick.sh

# 2. Test order
./test-ibkr-order.sh

# 3. If successful, start trading!
```

### **Manual Test:**

1. Go to: http://165.227.104.40:3000/desktop
2. Broker: **🏦 Interactive Brokers**
3. Symbol: `AAPL`
4. Quantity: `1`
5. Click **BUY**
6. Wait 30-60 seconds
7. Check positions table

---

## 📊 **Monitoring Your Test**

### **Check Broker Status:**
```bash
curl http://165.227.104.40:3000/admin/broker-status
```

Should show:
```json
{
  "ibkr": {
    "connected": true,
    "status": "Connected"
  }
}
```

### **Check Positions:**
```bash
curl http://165.227.104.40:3000/api/dashboard/positions | jq '.'
```

### **Check Logs:**
```bash
ssh root@165.227.104.40 "pm2 logs trading-app --lines 20"
```

Look for:
- "Order placed"
- "Order filled"
- "Position updated"

---

## 🎮 **Demo vs IBKR Comparison**

| Feature | Demo Mode | IBKR Paper |
|---------|-----------|------------|
| **Fill Speed** | 2 seconds | 5-60 seconds |
| **Reliability** | 100% | ~70% |
| **Market Data** | Simulated | Real (delayed) |
| **Best For** | UI testing | Pre-live testing |
| **Risk** | Zero | Zero |

**Recommendation:**
- **Testing UI/features** → Use Demo Mode
- **Testing before live** → Use IBKR Paper
- **Live trading** → Use IBKR Live

---

## ✅ **Successful Test Looks Like:**

### **In UI:**
1. Click BUY
2. See: "Order placed: BUY 1 AAPL"
3. Wait 10-60 seconds
4. Position appears in table:
   ```
   AAPL | 1 LONG | $180.00 | $180.00 | $0.00 | OPEN
   ```

### **In Console (F12):**
- No JavaScript errors
- See API calls completing
- Position data loading

### **In Logs:**
```
✅ Order placed with IBKR
✅ Order ID: 12345
✅ Order filled
✅ Position updated
```

---

## 🚨 **Troubleshooting**

### **Order Not Filling:**

**Try these:**
1. Wait longer (up to 2 minutes)
2. Use a more liquid symbol (SPY, QQQ)
3. Trade during market hours
4. Try limit order at current price
5. Check logs for errors

**If still not filling:**
- IBKR Paper is buggy - this is normal
- Use Demo Mode instead for testing
- Try again later

### **"IBKR not connected" Error:**

```bash
# Restart trading app
ssh root@165.227.104.40 "pm2 restart trading-app"

# Wait 5 seconds, then check
curl http://165.227.104.40:3000/admin/broker-status
```

### **IB Gateway Disconnected:**

1. Connect via VNC:
   ```bash
   ssh -L 5901:localhost:5901 root@165.227.104.40
   ```
2. Open VNC Viewer → localhost:5901
3. Check if IB Gateway is still logged in
4. Re-login if needed

---

## 📋 **Test Checklist**

Before going live, test these:

- [ ] Place market order (1 share)
- [ ] Wait for fill (verify it works)
- [ ] Check position displays correctly
- [ ] Check P&L calculates correctly
- [ ] Close position
- [ ] Verify position closes
- [ ] Try limit order
- [ ] Try stop order
- [ ] Test during market hours
- [ ] Test extended hours (if needed)

---

## 🚀 **After Successful Test**

Once your test order works:

1. ✅ **Start with small sizes** (1-10 shares)
2. ✅ **Monitor fills** (they can be slow)
3. ✅ **Check positions regularly**
4. ✅ **Test all order types** you plan to use
5. ✅ **When confident** → Move to live trading

---

## 💡 **Pro Tips**

### **For Testing:**
- Use Demo Mode (faster, more reliable)
- Test during market hours
- Start with 1 share

### **For Paper Trading:**
- Be patient with fills
- Use liquid symbols
- Monitor logs for issues

### **For Live Trading:**
- Test extensively in paper first
- Start very small
- Increase size gradually
- Monitor closely

---

## 📞 **Quick Commands**

```bash
# Test IBKR order
./test-ibkr-order.sh

# Check status
./check-quick.sh

# View logs
ssh root@165.227.104.40 "pm2 logs trading-app"

# Restart app
ssh root@165.227.104.40 "pm2 restart trading-app"

# Check broker status
curl http://165.227.104.40:3000/admin/broker-status
```

---

## ✅ **Current Status**

✅ **IB Gateway:** Connected  
✅ **Trading App:** Connected to IBKR  
✅ **Demo Mode:** Also available  
✅ **Ready to test!**

**Next:** Run `./test-ibkr-order.sh` or test in the UI!

---

**🎉 You're all set! Happy testing!** 🚀

