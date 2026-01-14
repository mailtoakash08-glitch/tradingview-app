# 🎯 TWS on VPS - Fresh Start Test Guide

## ✅ **Current Status**

- ✅ VPS running at `165.227.104.40`
- ✅ TWS installed and running on VPS (via VNC)
- ✅ TWS API enabled (port 7497, client ID 0)
- ✅ App connected to TWS
- ✅ PostgreSQL database connected
- ✅ **Database cleared - Fresh environment ready!**

---

## 🧪 **Quick Test: Place Your First Limit Order**

### **Step 1: Place Order via API**

**From your Mac terminal:**

```bash
curl -X POST http://165.227.104.40:3000/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "manual_bmnr",
    "symbol": "SPY",
    "action": "ENTRY_LONG",
    "quantity": 1,
    "broker": "ibkr",
    "orderType": "LMT",
    "limitPrice": 590
  }'
```

**Note:** Current SPY price is ~$595. This limit order at $590 will stay pending until the price drops.

---

### **Step 2: Check Web UI**

**Open in browser:**
```
http://165.227.104.40:3000/desktop
```

**You should see:**
- ✅ Broker: **Interactive Brokers - Connected**
- ✅ Pending Orders: **1 SPY LMT @ $590**
- ✅ Open Positions: **(empty)**

---

### **Step 3: Check TWS (via VNC)**

**In your VNC window:**
1. TWS → **Activity** → **Orders**
2. You should see: **BUY 100 SPY LMT @ 590.00**

**Why 100 shares?**
- The `manual_bmnr` strategy has a 100x multiplier
- You sent quantity: 1 → TWS receives 100 shares

---

## 📊 **Test Different Order Types**

### **Market Order (Fills Immediately)**

```bash
curl -X POST http://165.227.104.40:3000/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "manual_bmnr",
    "symbol": "AAPL",
    "action": "ENTRY_LONG",
    "quantity": 1,
    "broker": "ibkr",
    "orderType": "MKT"
  }'
```

**Expected:**
- Order fills immediately
- Appears in **Open Positions** (not Pending Orders)
- Shows in TWS **Portfolio**

---

### **Limit Order (Waits for Price)**

```bash
curl -X POST http://165.227.104.40:3000/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "manual_bmnr",
    "symbol": "NVDA",
    "action": "ENTRY_LONG",
    "quantity": 1,
    "broker": "ibkr",
    "orderType": "LMT",
    "limitPrice": 140
  }'
```

**Note:** Adjust `limitPrice` based on current market price

---

### **Stop Order (Triggers Above Price)**

```bash
curl -X POST http://165.227.104.40:3000/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "manual_bmnr",
    "symbol": "TSLA",
    "action": "ENTRY_LONG",
    "quantity": 1,
    "broker": "ibkr",
    "orderType": "STP",
    "stopPrice": 420
  }'
```

---

## 🔍 **Verify Everything is Working**

### **1. Check Broker Status**

```bash
curl http://165.227.104.40:3000/admin/broker-status | python3 -m json.tool
```

**Expected:**
```json
{
  "ibkr": {
    "connected": true,
    "status": "Connected"
  }
}
```

---

### **2. Check Pending Orders**

```bash
curl http://165.227.104.40:3000/api/dashboard/orders/pending?broker=ibkr | python3 -m json.tool
```

---

### **3. Check Open Positions**

```bash
curl http://165.227.104.40:3000/api/dashboard/positions?broker=ibkr | python3 -m json.tool
```

---

### **4. Check Account Balance**

```bash
curl http://165.227.104.40:3000/api/dashboard/account?broker=ibkr | python3 -m json.tool
```

---

## 🎨 **Access Points**

| Service | URL | Purpose |
|---------|-----|---------|
| **Web UI** | http://165.227.104.40:3000/desktop | Main trading interface |
| **API Docs** | http://165.227.104.40:3000/admin/docs | API documentation |
| **Health Check** | http://165.227.104.40:3000/health | Server health status |
| **Broker Status** | http://165.227.104.40:3000/admin/broker-status | Connection status |

---

## 🔐 **VNC Access (for TWS GUI)**

**From Mac:**

```bash
# 1. Create SSH tunnel (if not already running)
ssh -L 5901:localhost:5901 -N -f root@165.227.104.40

# 2. Connect via Finder
# Press ⌘K and enter: vnc://localhost:5901
```

**In VNC:**
- See TWS GUI
- View orders in Activity tab
- Monitor positions in Portfolio
- Check account balance

---

## 🐛 **Troubleshooting**

### **Issue: Orders not appearing in TWS**

```bash
# Check app logs
ssh root@165.227.104.40 "pm2 logs trading-app --lines 50"

# Check TWS connection
ssh root@165.227.104.40 "ss -tuln | grep 7497"
```

---

### **Issue: Database errors**

```bash
# Restart app
ssh root@165.227.104.40 "pm2 restart trading-app"

# Check database connection
ssh root@165.227.104.40 "sudo -u postgres psql -d tradingdb -c 'SELECT COUNT(*) FROM \"Order\";'"
```

---

### **Issue: TWS disconnected**

```bash
# Check if TWS is running
ssh root@165.227.104.40 "ps aux | grep -i tws | grep -v grep"

# Restart TWS via VNC
# In VNC: Run /root/Jts/tws/tws/tws
```

---

## 📝 **Important Notes**

### **Quantity Multiplier**
- Strategy `manual_bmnr` has 100x multiplier
- `quantity: 1` → **100 shares** in TWS
- To place 1 share, send `quantity: 0.01`

### **Paper Trading Mode**
- TWS is currently in **Paper Trading** mode
- No real money at risk
- Perfect for testing

### **Market Hours**
- Use `"orderType": "MKT"` during market hours (9:30 AM - 4:00 PM ET)
- Use `"orderType": "LMT"` for after-hours
- Stop orders queue outside market hours

### **Database Persistence**
- All orders save to PostgreSQL
- All positions save to database
- Data persists across app restarts

---

## 🎯 **Next Steps**

1. ✅ Place a test limit order
2. ✅ Verify it appears in Web UI
3. ✅ Verify it appears in TWS (via VNC)
4. ✅ Test closing the position
5. ✅ Monitor P&L updates

---

## 🚀 **Production Checklist**

Before using with real money:

- [ ] Switch TWS from Paper Trading to Live Trading
- [ ] Test with small quantities first
- [ ] Verify P&L calculation accuracy
- [ ] Set up risk limits
- [ ] Configure TradingView alerts
- [ ] Enable SSL/HTTPS (optional)
- [ ] Set up monitoring/alerts

---

**Ready to test! Start with the limit order command above.** 🎉
