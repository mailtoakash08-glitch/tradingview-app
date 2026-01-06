# 📋 Daily Trading Routine

This guide walks you through the daily workflow for using your trading application.

---

## ☀️ **MORNING ROUTINE (Before Market Open)**

### **Step 1: Quick Health Check (1 minute)**

Open Terminal and run:

```bash
cd /Users/dev/Documents/tradingview
./check-quick.sh
```

**Expected Output:**
```
⚡ QUICK STATUS CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Trading App: ✅ Running
🔌 IBKR Gateway: ✅ Connected
💼 Positions: 0 open
💰 Account: $50000.00 (P&L: $0.00)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ System Ready for Trading!
```

✅ **If all green:** You're ready to trade! Skip to Step 3.

❌ **If "IBKR Gateway: ❌ Disconnected":** Continue to Step 2.

---

### **Step 2: Restart IB Gateway (If Needed)**

**2A. Connect to VPS Desktop:**

```bash
ssh -L 5901:localhost:5901 root@165.227.104.40
```

Leave this terminal open.

**2B. Open VNC Viewer:**

- Open **VNC Viewer** app on your Mac
- Connect to: `localhost:5901`
- Password: *(your VNC password)*

**2C. Start IB Gateway:**

1. Double-click **IB Gateway** icon on desktop
2. Username: `chantbou1966`
3. Password: *(your IB password)*
4. Click **Login**
5. Wait for "Connected" status

**2D. Verify Connection:**

```bash
./check-quick.sh
```

Should now show: `🔌 IBKR Gateway: ✅ Connected`

---

### **Step 3: Open Trading Interface**

Open your browser:

```
http://165.227.104.40:3000/desktop
```

You should see:
- TradingView chart
- Order entry panel
- Positions table
- Account summary

---

### **Step 4: Test with Small Order (Optional)**

**Recommended first trade of the day:**

1. Symbol: `AAPL`
2. Quantity: `1`
3. Click **BUY**

**Verify:**
- Order appears in logs
- Position shows in table after fill
- P&L updates

---

## 📊 **DURING TRADING HOURS**

### **Place Orders:**

1. Enter symbol (e.g., `AAPL`, `DVLT`)
2. Enter quantity
3. (Optional) Set Take Profit / Stop Loss prices
4. Click **BUY** or **SELL**

### **Monitor Positions:**

- Desktop interface auto-refreshes every 10 seconds
- Or click **↻ Refresh** button manually

### **View Logs (If Issues):**

```bash
ssh root@165.227.104.40
pm2 logs trading-app
```

Press `Ctrl+C` to exit logs.

---

## 🌙 **END OF DAY ROUTINE**

### **Review Performance:**

```bash
./check-vps-status.sh
```

This shows:
- All open positions
- Unrealized P&L
- Account balance
- Today's order history
- Any errors encountered

### **Close All Positions (If Desired):**

For each open position, place a **SELL** order for the full quantity.

### **Leave App Running:**

✅ **Keep the app running overnight** - it will handle IBKR maintenance automatically.

---

## 🔧 **TROUBLESHOOTING**

### **Problem: Can't Place Orders**

**Check 1: Is IBKR Gateway Connected?**
```bash
./check-quick.sh
```

If disconnected, restart IB Gateway (see Step 2 above).

**Check 2: Are there errors in logs?**
```bash
ssh root@165.227.104.40 "pm2 logs trading-app --lines 20 --nostream --err"
```

Common errors:
- "Symbol not allowed" → Add symbol to `ALLOWED_SYMBOLS` in `.env`
- "Kill-switch enabled" → Disable via admin API
- "Daily trade limit exceeded" → Reset counters or adjust limits

---

### **Problem: Position Doesn't Appear After Fill**

**Wait 5-30 seconds** - Paper trading can be slow.

**Check order status:**
```bash
ssh root@165.227.104.40 "pm2 logs trading-app --lines 100 --nostream | grep -i 'filled'"
```

If order shows "Filled" but no position:
1. Hard refresh browser: `Cmd+Shift+R`
2. Check positions API directly:
   ```bash
   curl http://165.227.104.40:3000/api/dashboard/positions
   ```

---

### **Problem: App Not Running**

**Restart the app:**
```bash
ssh root@165.227.104.40
pm2 restart trading-app
pm2 logs trading-app --lines 20
```

Should see: `"Connected to IBKR Gateway"`

---

### **Problem: Need to Update Code**

**Deploy latest version:**
```bash
cd /Users/dev/Documents/tradingview
./deploy-commit.sh
```

This will:
1. Commit local changes
2. Push to GitHub
3. Pull on VPS
4. Build and restart

---

## 📞 **QUICK REFERENCE COMMANDS**

| Action | Command |
|--------|---------|
| **Quick health check** | `./check-quick.sh` |
| **Detailed status** | `./check-vps-status.sh` |
| **View live logs** | `ssh root@165.227.104.40 "pm2 logs trading-app"` |
| **Restart app** | `ssh root@165.227.104.40 "pm2 restart trading-app"` |
| **Connect VNC** | `ssh -L 5901:localhost:5901 root@165.227.104.40` |
| **Deploy update** | `./deploy-commit.sh` |
| **Open desktop** | `http://165.227.104.40:3000/desktop` |

---

## ⚠️ **IMPORTANT NOTES**

### **IBKR Maintenance Windows:**

- **Weekdays:** 11:45 PM - 12:00 AM ET
- **Weekends:** Saturday evening - Sunday morning

**During maintenance:**
- Orders cannot be placed
- Positions may not update
- Gateway will disconnect

**After maintenance:**
- Gateway should auto-reconnect
- If not, restart manually via VNC

---

### **Paper Trading Delays:**

Paper trading orders may take **5-30 seconds** to fill. Be patient!

---

### **Allowed Symbols:**

By default, only these symbols are whitelisted:
- AAPL, MSFT, NVDA, TSLA, GOOGL, AMZN, META, SPY, QQQ, DVLT

To add more symbols, edit `.env` on VPS:
```bash
ALLOWED_SYMBOLS=AAPL,MSFT,NVDA,TSLA,GOOGL,AMZN,META,SPY,QQQ,DVLT,YOUR_SYMBOL
```

Then restart: `pm2 restart trading-app`

---

## 🎯 **BEST PRACTICES**

1. ✅ **Check status every morning** before trading
2. ✅ **Start with a 1-share test order** to verify connectivity
3. ✅ **Monitor positions regularly** (auto-refreshes every 10s)
4. ✅ **Review logs if any orders fail**
5. ✅ **Keep VNC connection** open during trading hours for quick access
6. ✅ **Close positions before weekends** if day-trading only

---

## 📚 **Additional Resources**

- **Full Documentation:** `DEPLOYMENT_GUIDE.md`
- **IB Gateway Setup:** `fix-ibgateway.sh`
- **Environment Setup:** `env.template`

---

**Need help?** Check the logs first:
```bash
pm2 logs trading-app --lines 50 --nostream
```

Most issues are visible in the logs! 🔍

