# 🖥️ TWS on VPS Setup Guide

Run TWS (Trader Workstation) directly on your VPS alongside the trading app.

---

## 📋 **Overview**

```
┌─────────────────────────────────┐
│         VPS (165.227.104.40)    │
│                                 │
│  ┌──────────┐    ┌──────────┐  │
│  │   TWS    │◄───┤   App    │  │
│  │ Port 7497│    │ Port 3000│  │
│  └──────────┘    └──────────┘  │
│         ▲              ▲        │
│         │              │        │
└─────────┼──────────────┼────────┘
          │              │
    (You via VNC)   (TradingView)
```

**Benefits:**

- ✅ Everything on one server
- ✅ Fast connection (localhost)
- ✅ No port forwarding needed
- ✅ No public IP exposure
- ✅ Works from anywhere

---

## 🚀 **Method 1: IB Gateway (Recommended - Lightweight)**

IB Gateway is a lightweight version of TWS without the full GUI.

### **Step 1: Install IB Gateway on VPS**

```bash
# SSH to VPS
ssh root@165.227.104.40

# Install Java (required for IB Gateway)
apt update
apt install -y default-jre

# Verify Java
java -version

# Download IB Gateway (Linux version)
cd /root
wget https://download2.interactivebrokers.com/installers/ibgateway/latest-standalone/ibgateway-latest-standalone-linux-x64.sh

# Make executable
chmod +x ibgateway-latest-standalone-linux-x64.sh

# Install (silent mode)
./ibgateway-latest-standalone-linux-x64.sh -q

# IB Gateway will be installed to:
# /root/Jts/ibgateway/[version]
```

---

### **Step 2: Configure IB Gateway**

Create configuration file:

```bash
mkdir -p /root/Jts
nano /root/Jts/jts.ini
```

**Add this content:**

```ini
[IBGateway]
ApiOnly=true
TradingMode=p  # p=paper, l=live
IbDir=/root/Jts
IbLoginId=YOUR_IB_USERNAME
IbPassword=YOUR_IB_PASSWORD
ReadOnlyApi=no
```

**Save:** Ctrl+X, Y, Enter

---

### **Step 3: Create Startup Script**

```bash
nano /root/start-ibgateway.sh
```

**Add this content:**

```bash
#!/bin/bash
# Start IB Gateway in headless mode

export DISPLAY=:99
Xvfb :99 -screen 0 1024x768x16 &

cd /root/Jts/ibgateway/[VERSION]
./ibgateway &

echo "IB Gateway started on port 4002 (paper) / 4001 (live)"
```

**Make executable:**

```bash
chmod +x /root/start-ibgateway.sh
```

---

### **Step 4: Install Xvfb (Virtual Display)**

```bash
apt install -y xvfb

# Start virtual display
Xvfb :99 -screen 0 1024x768x16 &
```

---

### **Step 5: Start IB Gateway**

```bash
/root/start-ibgateway.sh
```

---

## 🖥️ **Method 2: TWS with VNC (Full GUI Access)**

Use VNC to access TWS GUI remotely from your Mac.

### **Step 1: Install Desktop Environment**

```bash
# SSH to VPS
ssh root@165.227.104.40

# Update system
apt update && apt upgrade -y

# Install lightweight desktop (XFCE)
apt install -y xfce4 xfce4-goodies

# Install VNC server
apt install -y tightvncserver

# Install Java
apt install -y default-jre
```

---

### **Step 2: Configure VNC Server**

```bash
# Set VNC password (you'll be prompted)
vncserver

# This will ask for a password - choose a strong one!
# Also asks for view-only password - optional

# Kill the initial VNC session
vncserver -kill :1

# Create VNC startup script
nano ~/.vnc/xstartup
```

**Add this content:**

```bash
#!/bin/bash
xrdb $HOME/.Xresources
startxfce4 &
```

**Make executable:**

```bash
chmod +x ~/.vnc/xstartup
```

---

### **Step 3: Start VNC Server**

```bash
# Start VNC on display :1 (port 5901)
vncserver :1 -geometry 1920x1080 -depth 24

# Check it's running
ps aux | grep vnc
```

---

### **Step 4: Create SSH Tunnel (Secure Connection)**

**On your Mac:**

```bash
# Forward VNC port through SSH tunnel
ssh -L 5901:localhost:5901 -N -f root@165.227.104.40

# This creates a secure tunnel:
# localhost:5901 (Mac) → VPS:5901
```

---

### **Step 5: Connect with VNC Viewer**

**On Mac:**

1. Download **VNC Viewer** (https://www.realvnc.com/download/viewer/)
2. Or use built-in **Screen Sharing**:
   - Open Finder → Go → Connect to Server (⌘K)
   - Enter: `vnc://localhost:5901`
3. Enter VNC password
4. You'll see Ubuntu desktop!

---

### **Step 6: Install TWS in VNC**

**Inside the VNC session:**

```bash
# Open terminal in VNC desktop
cd ~

# Download TWS
wget https://download2.interactivebrokers.com/installers/tws/latest-standalone/tws-latest-standalone-linux-x64.sh

# Make executable
chmod +x tws-latest-standalone-linux-x64.sh

# Install
./tws-latest-standalone-linux-x64.sh
```

**Follow the GUI installer**

---

### **Step 7: Configure TWS API**

**In TWS (via VNC):**

1. Login to your IB account
2. Go to **Configure** → **Settings** → **API** → **Settings**
3. Configure:
   ```
   ☑️ Enable ActiveX and Socket Clients
   ☐ Read-Only API
   ☑️ Allow connections from localhost only  ← Can stay CHECKED (same server)
   Socket Port: 7497 (or 4002 for Gateway)
   Master API client ID: 0
   ```
4. **Save and restart TWS**

---

### **Step 8: Start TWS Automatically**

Create autostart script:

```bash
mkdir -p ~/.config/autostart
nano ~/.config/autostart/tws.desktop
```

**Add:**

```ini
[Desktop Entry]
Type=Application
Name=TWS
Exec=/root/Jts/tws/tws
```

---

## 🔧 **Step 9: Update App Configuration**

```bash
# On VPS
cd /root/tradingview
nano .env
```

**Update these lines:**

```bash
IBKR_HOST=127.0.0.1    # localhost (same server)
IBKR_PORT=7497          # TWS port (or 4002 for Gateway)
IBKR_CLIENT_ID=0
```

**Save and restart:**

```bash
pm2 restart trading-app
```

---

## ✅ **Step 10: Verify Connection**

```bash
# Test if TWS/Gateway is listening
netstat -an | grep 7497

# Should show:
# tcp  0  0  127.0.0.1:7497  0.0.0.0:*  LISTEN

# Check app connection
curl localhost:3000/admin/broker-status | python3 -m json.tool

# Should show: "connected": true
```

---

## 🚀 **Quick Start Script**

Save this as `/root/setup-tws-vps.sh`:

```bash
#!/bin/bash
# Quick setup TWS on VPS

echo "🚀 Setting up TWS on VPS..."

# Install dependencies
apt update
apt install -y default-jre xvfb

# Download IB Gateway
cd /root
wget -q https://download2.interactivebrokers.com/installers/ibgateway/latest-standalone/ibgateway-latest-standalone-linux-x64.sh
chmod +x ibgateway-latest-standalone-linux-x64.sh

# Install
./ibgateway-latest-standalone-linux-x64.sh -q

# Start virtual display
Xvfb :99 -screen 0 1024x768x16 > /dev/null 2>&1 &

echo "✅ IB Gateway installed!"
echo ""
echo "Next steps:"
echo "1. Configure your IB credentials"
echo "2. Start IB Gateway"
echo "3. Update app .env file"
echo "4. Restart trading app"
```

---

## 📊 **Comparison: IB Gateway vs TWS**

| Feature         | IB Gateway | TWS           |
| --------------- | ---------- | ------------- |
| **Size**        | ~200 MB    | ~1 GB         |
| **RAM**         | ~500 MB    | ~2 GB         |
| **GUI**         | Minimal    | Full featured |
| **Startup**     | Faster     | Slower        |
| **Headless**    | ✅ Easy    | ⚠️ Needs VNC  |
| **Recommended** | ✅ Yes     | For debugging |

---

## 🔐 **Security Best Practices**

### **1. Use Firewall**

```bash
# Only allow your IP and localhost
ufw allow from YOUR_IP to any port 5901
ufw enable
```

### **2. Use Strong VNC Password**

```bash
vncpasswd
# Choose 12+ character password
```

### **3. Keep Updated**

```bash
apt update && apt upgrade -y
```

---

## 🐛 **Troubleshooting**

### **Issue: Java not found**

```bash
apt install -y default-jre
java -version
```

### **Issue: Display error**

```bash
export DISPLAY=:99
Xvfb :99 -screen 0 1024x768x16 &
```

### **Issue: VNC black screen**

```bash
# Restart VNC
vncserver -kill :1
vncserver :1 -geometry 1920x1080
```

### **Issue: Port already in use**

```bash
# Check what's using the port
lsof -i :7497

# Kill if needed
kill [PID]
```

---

## 📋 **Connection Checklist**

- [ ] Java installed (`java -version`)
- [ ] TWS/Gateway installed
- [ ] Virtual display running (for headless)
- [ ] TWS/Gateway running
- [ ] Port 7497 listening (`netstat -an | grep 7497`)
- [ ] App .env updated (`IBKR_HOST=127.0.0.1`)
- [ ] App restarted (`pm2 restart trading-app`)
- [ ] Broker status shows connected
- [ ] Test order appears in TWS

---

## 🎯 **Recommended Setup**

**For Production:**

```
✅ Use IB Gateway (lightweight)
✅ Run headless with Xvfb
✅ Auto-start with systemd
✅ Monitor with PM2
```

**For Development/Testing:**

```
✅ Use TWS with VNC
✅ Access GUI remotely
✅ See all TWS features
✅ Easy debugging
```

---

## 📝 **Next Steps**

1. Choose: IB Gateway (recommended) or TWS with VNC
2. Follow installation steps above
3. Configure TWS API settings
4. Update app .env file
5. Test connection
6. Deploy your trading bot!

**Ready to install? Which method do you prefer?**

- **Method 1:** IB Gateway (lightweight, headless) ← Recommended
- **Method 2:** TWS with VNC (full GUI access)
