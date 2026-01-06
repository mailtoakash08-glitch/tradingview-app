# 🚀 QUICK DEPLOYMENT GUIDE

## ✅ Your New Workflow (Every Time You Make Changes)

**Just run ONE command:**

```bash
cd /Users/dev/Documents/tradingview
./deploy-commit.sh
```

This automatically:

- ✅ Commits all your changes
- ✅ Pushes to GitHub
- ✅ Deploys to VPS
- ✅ Restarts the app
- ✅ Shows you the status and logs

---

## 🔧 FIX: IB Gateway Not Listening on Port 4002

**Problem:** IB Gateway is running but NOT accepting API connections.

**Solution:** Run this on your VPS:

```bash
ssh root@165.227.104.40

# Upload and run the fix script
cd /root/trading-app
bash fix-ibgateway.sh

# Restart IB Gateway
pkill -9 java
sleep 2

# Start IB Gateway (find your start script)
find ~ -name "*gateway*start*" -o -name "ibgateway"

# Or manually via VNC:
# 1. Connect to VNC: vnc://localhost:5901
# 2. Close IB Gateway window
# 3. Reopen IB Gateway
# 4. Login with: akashjaiswal23
```

**Verify it's working:**

```bash
# Port 4002 should now be listening
lsof -i -P | grep java | grep LISTEN

# You should see:
# java    12345 root   123u  IPv4  ...  TCP 127.0.0.1:4002 (LISTEN)
```

---

## 📋 Current Setup

- **Desktop UI:** http://165.227.104.40:3000/desktop
- **IB Gateway Port:** 4002 (Paper Trading)
- **Default Symbol:** AAPL (change to DVLT for testing)
- **Strategy:** manual_bmnr ✅ (FIXED)

---

## 🎯 Test Trading (Once IB Gateway is Connected)

1. Go to: http://165.227.104.40:3000/desktop
2. Enter symbol: `DVLT`
3. Quantity: `10`
4. Order type: `Market Order`
5. Click **BUY**
6. Check positions table for your order

---

## 🛠️ Useful Commands

### Check App Status

```bash
ssh root@165.227.104.40 "pm2 logs trading-app --lines 20"
```

### Check IB Gateway Connection

```bash
ssh root@165.227.104.40 "pm2 logs trading-app | grep -i 'connect\|ibkr'"
```

### Restart App Only

```bash
ssh root@165.227.104.40 "pm2 restart trading-app"
```

---

## 🚨 Troubleshooting

### If Orders Fail:

1. Check IB Gateway is running: `ps aux | grep gateway`
2. Check port 4002 is listening: `lsof -i -P | grep 4002`
3. Check app logs: `pm2 logs trading-app --lines 30`

### If "Invalid Strategy" Error:

- Already fixed! ✅ Now using `manual_bmnr`

### If API Connection Refused:

- Run `fix-ibgateway.sh` on VPS
- Restart IB Gateway
- Verify port 4002 is listening

---

## 📞 Next Steps

1. **Run `./deploy-commit.sh`** to deploy all fixes ✅
2. **SSH into VPS** and run `fix-ibgateway.sh`
3. **Restart IB Gateway**
4. **Verify port 4002** is listening
5. **Test trading** with DVLT

---

**Everything is now set up for easy deployment!** 🎉
