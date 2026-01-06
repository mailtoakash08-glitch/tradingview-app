# 🔄 System Restart Scripts

Three scripts for different restart scenarios.

---

## 📜 **Available Scripts**

### 1. **restart-everything.sh** (Full System Restart)

**Use when:**
- IB Gateway is frozen or not responding
- Need to completely reset everything
- Morning startup routine

**What it does:**
1. ✅ Stops trading app
2. ✅ Kills all IB Gateway processes
3. ✅ Clears ports 4001/4002
4. ✅ Removes lock files
5. ⚠️ **Prompts you** to start IB Gateway via VNC
6. ✅ Waits for IB Gateway to connect
7. ✅ Starts trading app
8. ✅ Verifies connection

**Usage:**
```bash
./restart-everything.sh
```

**Time:** ~2-3 minutes (including manual IB Gateway login)

---

### 2. **restart-app-only.sh** (Quick App Restart)

**Use when:**
- IB Gateway is already running and connected
- App crashed or needs quick restart
- Just deployed new code

**What it does:**
1. ✅ Restarts PM2 process
2. ✅ Shows status and logs
3. ✅ Done!

**Usage:**
```bash
./restart-app-only.sh
```

**Time:** ~10 seconds

---

### 3. **restart-vps.sh** (VPS-Side Script)

**Use when:**
- Running commands directly on VPS
- Automating via cron or other scripts

**What it does:**
- Same as `restart-everything.sh` but runs on VPS
- Can be triggered remotely

**Usage (from Mac):**
```bash
ssh root@165.227.104.40 'bash /root/trading-app/restart-vps.sh'
```

**Usage (on VPS):**
```bash
cd /root/trading-app
./restart-vps.sh
```

---

## 🎯 **Which Script to Use?**

| Situation | Script | Time |
|-----------|--------|------|
| **Daily morning startup** | `restart-everything.sh` | 2-3 min |
| **IB Gateway frozen** | `restart-everything.sh` | 2-3 min |
| **App crashed, Gateway OK** | `restart-app-only.sh` | 10 sec |
| **Just deployed new code** | `restart-app-only.sh` | 10 sec |
| **IBKR maintenance recovery** | `restart-everything.sh` | 2-3 min |
| **Remote automation** | `restart-vps.sh` | 2-3 min |

---

## 📋 **Detailed Workflows**

### **Workflow 1: Full Morning Restart**

```bash
# Step 1: Check current status
./check-quick.sh

# Step 2: If disconnected, full restart
./restart-everything.sh

# Step 3: When prompted, open VNC
# (In new terminal)
ssh -L 5901:localhost:5901 root@165.227.104.40

# Step 4: In VNC Viewer (localhost:5901)
# - Start IB Gateway
# - Login with credentials
# - Wait for "Connected"

# Step 5: Press ENTER in restart script

# Step 6: Verify
./check-quick.sh
```

---

### **Workflow 2: Quick Recovery**

```bash
# If app is down but IB Gateway is up
./restart-app-only.sh

# Verify connection
./check-quick.sh
```

---

### **Workflow 3: Emergency from VNC**

If you're already connected to VPS via VNC:

```bash
# In VNC terminal:
cd /root/trading-app

# Kill everything
pkill -9 -f "java.*ibgateway"
pm2 delete trading-app

# Restart IB Gateway (double-click icon, login)

# Wait for Gateway to connect, then:
pm2 start dist/index.js --name trading-app
pm2 logs trading-app
```

---

## ⚠️ **Important Notes**

### **IB Gateway Cannot Be Started Remotely**

IB Gateway **requires GUI login** with username/password. You cannot start it via SSH alone.

**You must:**
1. Connect via VNC (ssh -L 5901:localhost:5901)
2. Use VNC Viewer to access desktop
3. Start IB Gateway manually
4. Enter credentials in GUI

### **Port 4002 vs 4001**

- **4002** = Paper Trading (recommended for testing)
- **4001** = Live Trading

Scripts default to port 4002. To change:
- Edit `IBKR_PORT=4001` in VPS `.env` file
- Restart app: `./restart-app-only.sh`

### **Lock Files**

If IB Gateway won't start, lock files might be stuck:

```bash
ssh root@165.227.104.40
rm -f /root/Jts/ibgateway/.lock
rm -f /root/Jts/tws/.lock
```

Then restart IB Gateway.

---

## 🔧 **Troubleshooting**

### **Problem: "Port already in use"**

```bash
ssh root@165.227.104.40 "lsof -ti:4002 | xargs kill -9"
./restart-everything.sh
```

### **Problem: "IB Gateway won't start"**

1. Kill all Java processes:
   ```bash
   ssh root@165.227.104.40 "pkill -9 java"
   ```

2. Clear lock files (see above)

3. Restart via VNC

### **Problem: "App connects but no orders work"**

Check IB Gateway API settings:
- Via VNC, open IB Gateway
- File → Global Configuration → API → Settings
- ✅ Enable ActiveX and Socket Clients
- ✅ Socket port: 4002
- ✅ Trusted IP: 127.0.0.1
- Click OK and restart Gateway

---

## 📞 **Quick Reference**

```bash
# Full restart (everything)
./restart-everything.sh

# Quick restart (app only)
./restart-app-only.sh

# Check status
./check-quick.sh

# View logs
ssh root@165.227.104.40 "pm2 logs trading-app"

# Kill all processes manually
ssh root@165.227.104.40 "pkill -9 -f 'java.*ibgateway' && pm2 delete all"

# VNC access
ssh -L 5901:localhost:5901 root@165.227.104.40
# Then VNC Viewer → localhost:5901
```

---

## 🎯 **Best Practice: Morning Routine**

```bash
# 1. Check status (5 seconds)
./check-quick.sh

# 2. If ❌ Disconnected: Full restart (2 minutes)
./restart-everything.sh
# → Start IB Gateway via VNC when prompted

# 3. If ✅ Connected: Ready to trade!
open http://165.227.104.40:3000/desktop

# 4. Place 1-share test order to verify
```

---

## 📚 **Related Documentation**

- **DAILY_ROUTINE.md** - Complete daily workflow
- **DEPLOYMENT_GUIDE.md** - Full deployment guide
- **check-quick.sh** - Quick health check
- **check-vps-status.sh** - Detailed status check

---

**Remember:** You can't fully automate IB Gateway restart due to IBKR's security requiring GUI login. But these scripts make the process as fast as possible! 🚀

