# 🎯 Quick TWS Setup on VPS - Step by Step

## ✅ Step 1: Set VNC Password

**SSH to VPS and run:**

```bash
ssh root@165.227.104.40
vncserver
```

**You'll be prompted to:**

1. Enter a password (8 characters minimum)
2. Enter the same password again
3. View-only password? → **No** (type 'n')

**Then stop the initial server:**

```bash
vncserver -kill :1
```

---

## ✅ Step 2: Start VNC Server

```bash
vncserver :1 -geometry 1920x1080 -depth 24
```

**Expected output:**

```
New 'X' desktop is your-server:1
Starting applications specified in /root/.vnc/xstartup
```

---

## ✅ Step 3: Create SSH Tunnel (On Your Mac)

**Open a new terminal on your Mac:**

```bash
ssh -L 5901:localhost:5901 -N -f root@165.227.104.40
```

**This command:**

- Creates a secure tunnel
- Runs in background (-f)
- Forwards VNC port 5901

---

## ✅ Step 4: Connect with VNC

### **Option A: Mac Built-in Screen Sharing (Easiest)**

1. Open **Finder**
2. Press **⌘K** (or Go → Connect to Server)
3. Enter: `vnc://localhost:5901`
4. Click **Connect**
5. Enter your VNC password
6. You'll see Ubuntu desktop! 🎉

### **Option B: VNC Viewer App**

1. Download: https://www.realvnc.com/download/viewer/
2. Connect to: `localhost:5901`
3. Enter VNC password

---

## ✅ Step 5: Download TWS in VNC

**Inside the VNC desktop:**

1. **Open Terminal** (click terminal icon in taskbar)
2. **Download TWS:**

   ```bash
   cd ~
   wget https://download2.interactivebrokers.com/installers/tws/latest-standalone/tws-latest-standalone-linux-x64.sh
   chmod +x tws-latest-standalone-linux-x64.sh
   ```

3. **Run Installer:**

   ```bash
   ./tws-latest-standalone-linux-x64.sh
   ```

4. **Follow the GUI installer:**
   - Click through the installation wizard
   - Accept defaults
   - Install to `/root/Jts`

---

## ✅ Step 6: Start TWS

**In VNC desktop:**

1. Find TWS icon or run:

   ```bash
   /root/Jts/tws/tws
   ```

2. **Login to IB:**
   - Username: [Your IB Username]
   - Password: [Your IB Password]
   - Trading Mode: **Paper Trading** (for testing)

---

## ✅ Step 7: Configure TWS API

**In TWS:**

1. Go to **Configure** → **Settings**
2. Click **API** → **Settings**
3. Configure:

   ```
   ☑️ Enable ActiveX and Socket Clients
   ☐ Read-Only API (UNCHECK!)
   ☑️ Allow connections from localhost only
   ☐ Download open orders on connection (optional)

   Socket Port: 7497
   Master API client ID: 0
   ```

4. **Click Apply → OK**
5. **Restart TWS**

---

## ✅ Step 8: Update App Configuration

**Back in SSH terminal (not VNC):**

```bash
cd /root/tradingview
nano .env
```

**Update these lines:**

```bash
IBKR_HOST=127.0.0.1
IBKR_PORT=7497
IBKR_CLIENT_ID=0
```

**Save:** Ctrl+X, Y, Enter

---

## ✅ Step 9: Restart App

```bash
pm2 restart trading-app
pm2 logs trading-app --lines 20
```

**Look for:**

```
✅ Connected to IBKR Gateway successfully
✅ Subscribed to automatic order updates
```

---

## ✅ Step 10: Verify Connection

### **In TWS:**

- Go to **Activity** → **API**
- You should see: **"client0"** connected

### **Check Broker Status:**

```bash
curl localhost:3000/admin/broker-status | python3 -m json.tool
```

**Expected:**

```json
{
  "ibkr": {
    "connected": true
  }
}
```

---

## ✅ Step 11: Test Order

```bash
curl -X POST http://localhost:3000/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "test",
    "ticker": "SPY",
    "action": "buy",
    "qty": 1,
    "broker": "ibkr",
    "orderType": "LMT",
    "limitPrice": 694
  }'
```

**Check TWS:** Order should appear! ✅

---

## 🔧 Troubleshooting

### **Can't connect to VNC?**

```bash
# Check if VNC is running
ps aux | grep vnc

# Restart if needed
vncserver -kill :1
vncserver :1 -geometry 1920x1080 -depth 24

# Check SSH tunnel
ps aux | grep "5901:localhost:5901"
```

### **TWS won't start?**

```bash
# Check Java
java -version

# If not found:
apt install -y default-jre
```

### **App can't connect?**

```bash
# Check TWS is listening
netstat -an | grep 7497

# Check app config
cd /root/tradingview
cat .env | grep IBKR

# Check app logs
pm2 logs trading-app
```

---

## 🎯 Quick Commands Reference

```bash
# Start VNC
vncserver :1 -geometry 1920x1080 -depth 24

# Stop VNC
vncserver -kill :1

# SSH Tunnel (Mac)
ssh -L 5901:localhost:5901 -N -f root@165.227.104.40

# Kill SSH Tunnel (Mac)
ps aux | grep "5901:localhost:5901"
kill [PID]

# Start TWS (in VNC)
/root/Jts/tws/tws

# Restart App
pm2 restart trading-app

# Check Logs
pm2 logs trading-app

# Check Connection
curl localhost:3000/admin/broker-status
```

---

## ✅ Success Checklist

- [ ] VNC password set
- [ ] VNC server running
- [ ] SSH tunnel created
- [ ] Connected to VNC desktop
- [ ] TWS downloaded and installed
- [ ] TWS running and logged in
- [ ] API settings configured (port 7497, client ID 0)
- [ ] App .env updated
- [ ] App restarted
- [ ] Broker status shows connected
- [ ] Test order appears in TWS

---

**You're ready! Start with Step 1 above.** 🚀
