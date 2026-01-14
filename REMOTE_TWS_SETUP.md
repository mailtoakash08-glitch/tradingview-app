# 🌐 Remote TWS Connection Guide

Connect your VPS app to TWS running on your local machine

---

## 📋 **Setup Overview**

```
┌─────────────────┐         Internet          ┌─────────────────┐
│  Local Machine  │ ◄──────────────────────► │      VPS        │
│                 │                           │                 │
│  TWS Running    │   API Connection          │  App Running    │
│  Port 7497      │ ◄─────────────────────── │  Connects to    │
│  (with GUI)     │                           │  Local TWS      │
└─────────────────┘                           └─────────────────┘
```

**Benefits:**

- ✅ See TWS GUI on your local machine
- ✅ App runs 24/7 on VPS (receives webhooks)
- ✅ Fast execution from VPS
- ✅ Monitor everything locally

---

## 🔧 **Step 1: Configure TWS on Local Machine**

### **1.1 Get Your Local IP Address**

**On Mac:**

```bash
ipconfig getifaddr en0
# Example output: 192.168.1.100
```

**On Windows:**

```cmd
ipconfig
# Look for "IPv4 Address"
```

**Save this IP!** You'll need it for VPS configuration.

---

### **1.2 Configure TWS API Settings**

Open TWS → **Configure** → **Settings** → **API** → **Settings**

**Required Settings:**

```
☑️ Enable ActiveX and Socket Clients
☑️ Read-Only API: UNCHECKED
☐ Allow connections from localhost only: UNCHECKED ← IMPORTANT!
☑️ Create API message log file
☑️ Include market data in API log

Socket Port: 7497 (or 4002 for Gateway)
Master API client ID: 0

Trusted IP Addresses:
→ Add your VPS IP: 165.227.104.40
```

---

### **1.3 Configure Firewall (Local Machine)**

**Allow incoming connections on port 7497:**

**Mac:**

```bash
# Check if firewall is enabled
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# If enabled, allow TWS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /Applications/Trader\ Workstation.app
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /Applications/Trader\ Workstation.app
```

**Windows:**

```
1. Open Windows Defender Firewall
2. Advanced Settings → Inbound Rules
3. New Rule → Port → TCP → 7497
4. Allow the connection
5. Apply to all profiles
```

---

### **1.4 Configure Router Port Forwarding**

**This is CRITICAL for remote access!**

1. **Login to your router** (usually http://192.168.1.1)
2. Find **Port Forwarding** or **Virtual Server** section
3. **Add new rule:**
   ```
   Service Name: TWS-API
   External Port: 7497
   Internal Port: 7497
   Internal IP: [Your Local IP from Step 1.1]
   Protocol: TCP
   Status: Enabled
   ```
4. **Save and restart router**

---

### **1.5 Get Your Public IP**

```bash
curl ifconfig.me
# Example output: 73.25.142.89
```

**Save this IP!** This is what the VPS will connect to.

---

## 🌐 **Step 2: Configure VPS to Connect to Local TWS**

### **2.1 Update VPS .env File**

SSH into your VPS:

```bash
ssh root@165.227.104.40
cd /root/tradingview
nano .env
```

**Update these lines:**

```bash
# IBKR Configuration
IBKR_HOST=73.25.142.89  ← Your Public IP from Step 1.5
IBKR_PORT=7497          ← TWS port (or 4002 for Gateway)
IBKR_CLIENT_ID=0        ← Must be 0 for master
```

**Save:** Ctrl+X, Y, Enter

---

### **2.2 Test Connection from VPS**

```bash
# Test if VPS can reach your local TWS
nc -zv 73.25.142.89 7497

# Expected output:
# Connection to 73.25.142.89 7497 port [tcp/*] succeeded!
```

---

## 🚀 **Step 3: Deploy and Start**

### **3.1 Deploy from GitHub**

**On your local machine:**

```bash
cd /Users/dev/Documents/tradingview
./deploy-from-github.sh
```

This will:

1. Pull latest code from GitHub
2. Install dependencies
3. Build TypeScript
4. Restart the app

---

### **3.2 Verify Connection**

**Check VPS logs:**

```bash
ssh root@165.227.104.40
pm2 logs trading-app --lines 50 | grep -i "connected\|ibkr"
```

**Look for:**

```
✅ Connected to IBKR Gateway successfully
✅ Subscribed to automatic order updates
```

---

## 🧪 **Step 4: Test the Connection**

### **4.1 On Local Machine:**

1. Open TWS
2. Login to Paper Trading
3. Go to **Activity** → **API**
4. You should see: **"client0"** connected

### **4.2 On VPS:**

```bash
# Check broker status
curl -s http://localhost:3000/admin/broker-status | python3 -m json.tool
```

**Expected:**

```json
{
  "ibkr": {
    "connected": true
  }
}
```

### **4.3 Test Order:**

```bash
# Place test order via webhook
curl -X POST http://165.227.104.40:3000/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "test",
    "ticker": "SPY",
    "action": "buy",
    "qty": 1,
    "broker": "ibkr",
    "orderType": "LMT",
    "limitPrice": 694,
    "outsideRth": true
  }'
```

**Check TWS:** Order should appear!

---

## 🔒 **Security Considerations**

### **Option 1: Public IP (Simple, Less Secure)**

- ✅ Easy setup
- ⚠️ Exposes TWS API to internet
- ⚠️ Use strong passwords
- ⚠️ Enable TWS trusted IPs

### **Option 2: VPN Tunnel (Recommended, More Secure)**

```bash
# Set up WireGuard VPN between local and VPS
# Then use private VPN IPs instead of public IP
# More complex but much more secure
```

### **Option 3: SSH Tunnel (Most Secure)**

```bash
# On VPS, create SSH tunnel to local machine
ssh -L 7497:localhost:7497 user@your-public-ip -N -f

# Then connect to localhost:7497 on VPS
# All traffic encrypted through SSH
```

---

## ⚠️ **Common Issues**

### **Issue 1: VPS can't connect**

```bash
# Test from VPS
nc -zv YOUR_PUBLIC_IP 7497

# If fails:
1. Check router port forwarding
2. Check local firewall
3. Verify TWS is running
4. Check TWS API settings (Allow remote connections)
```

### **Issue 2: Connection timeout**

- Router may have closed port forwarding
- ISP may block incoming connections
- TWS may have crashed

### **Issue 3: "localhost refused"**

- VPS .env still has localhost
- Need to update IBKR_HOST to your public IP

---

## 📊 **Connection Monitoring**

### **Create Health Check Script**

```bash
#!/bin/bash
# On VPS: /root/tradingview/check-tws-connection.sh

echo "🔍 Checking TWS connection..."

# Test TCP connection
if nc -zv -w 5 $IBKR_HOST $IBKR_PORT 2>&1 | grep -q "succeeded"; then
  echo "✅ TCP connection OK"
else
  echo "❌ TCP connection FAILED"
  exit 1
fi

# Test API connection
STATUS=$(curl -s http://localhost:3000/admin/broker-status | python3 -c "import sys,json; print(json.load(sys.stdin)['brokers']['ibkr']['connected'])")

if [ "$STATUS" = "True" ]; then
  echo "✅ API connection OK"
else
  echo "❌ API connection FAILED"
  exit 1
fi

echo "🎉 All checks passed!"
```

**Add to crontab:**

```bash
# Check every 5 minutes
*/5 * * * * /root/tradingview/check-tws-connection.sh
```

---

## 🎯 **Quick Reference**

### **Local Machine (TWS):**

```
IP: [Your Public IP]
Port: 7497
Settings: Allow remote connections
Firewall: Allow port 7497
Router: Forward port 7497
```

### **VPS (App):**

```
IP: 165.227.104.40
IBKR_HOST: [Your Public IP]
IBKR_PORT: 7497
IBKR_CLIENT_ID: 0
```

### **Test Commands:**

```bash
# Get your public IP (local)
curl ifconfig.me

# Test port (VPS)
nc -zv YOUR_PUBLIC_IP 7497

# Check connection (VPS)
curl localhost:3000/admin/broker-status

# Deploy updates (local)
./deploy-from-github.sh
```

---

## ✅ **Success Checklist**

- [ ] TWS running on local machine
- [ ] TWS API settings configured (remote connections allowed)
- [ ] Local firewall allows port 7497
- [ ] Router port forwarding configured
- [ ] Public IP obtained
- [ ] VPS .env updated with public IP
- [ ] VPS can reach TWS (nc test)
- [ ] App deployed to VPS
- [ ] Broker status shows connected
- [ ] Test order appears in TWS

---

## 🚨 **Troubleshooting**

```bash
# 1. Check TWS is listening
netstat -an | grep 7497

# 2. Test from local network first
telnet localhost 7497

# 3. Test from outside network
telnet YOUR_PUBLIC_IP 7497

# 4. Check VPS logs
pm2 logs trading-app | grep -i error

# 5. Restart everything
# Local: Restart TWS
# VPS: pm2 restart trading-app
```

---

**Your remote TWS setup is ready!** 🚀

**Advantages:**

- ✅ Monitor TWS GUI locally
- ✅ App runs 24/7 on VPS
- ✅ Receives TradingView webhooks
- ✅ Fast execution from VPS
- ✅ Full control over both ends
