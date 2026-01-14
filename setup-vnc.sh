#!/bin/bash
# Set VNC password and start server

echo "🔐 Setting up VNC for TWS"
echo "========================"
echo ""
echo "You need to set a VNC password (8+ characters)"
echo ""

# Set password
vncpasswd

echo ""
echo "✅ Password set!"
echo ""

# Kill old VNC if exists
vncserver -kill :1 2>/dev/null
sleep 2

# Start new VNC with desktop
vncserver :1 -geometry 1920x1080 -depth 24

echo ""
echo "✅ VNC Server started!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. On your Mac, create SSH tunnel:"
echo "   ssh -L 5901:localhost:5901 -N -f root@165.227.104.40"
echo ""
echo "2. Connect with VNC:"
echo "   - Press ⌘K in Finder"
echo "   - Enter: vnc://localhost:5901"
echo "   - Use your VNC password"
echo ""
echo "3. In VNC desktop, download TWS:"
echo "   wget https://download2.interactivebrokers.com/installers/tws/latest-standalone/tws-latest-standalone-linux-x64.sh"
echo "   chmod +x tws-latest-standalone-linux-x64.sh"
echo "   ./tws-latest-standalone-linux-x64.sh"
echo ""
echo "See TWS_SETUP_STEPS.md for full guide"
