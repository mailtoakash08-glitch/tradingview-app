#!/bin/bash
# Quick TWS/IB Gateway Setup on VPS

echo "🚀 TWS/IB Gateway VPS Setup"
echo "==========================="
echo ""
echo "Choose installation method:"
echo "1) IB Gateway (Lightweight, Headless) - Recommended"
echo "2) TWS with VNC (Full GUI)"
echo ""
read -p "Enter choice [1-2]: " choice

case $choice in
  1)
    echo "📦 Installing IB Gateway..."
    
    # Install Java
    echo "Installing Java..."
    apt update
    apt install -y default-jre xvfb
    
    # Download IB Gateway
    echo "Downloading IB Gateway..."
    cd /root
    wget -q https://download2.interactivebrokers.com/installers/ibgateway/latest-standalone/ibgateway-latest-standalone-linux-x64.sh
    chmod +x ibgateway-latest-standalone-linux-x64.sh
    
    # Install
    echo "Installing IB Gateway..."
    ./ibgateway-latest-standalone-linux-x64.sh -q
    
    # Start virtual display
    echo "Starting virtual display..."
    Xvfb :99 -screen 0 1024x768x16 > /dev/null 2>&1 &
    
    echo ""
    echo "✅ IB Gateway installed!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Find IB Gateway in: /root/Jts/ibgateway/[version]"
    echo "2. Start with: DISPLAY=:99 /root/Jts/ibgateway/[version]/ibgateway"
    echo "3. Or use the GUI to configure, then run headless"
    echo ""
    echo "4. Update /root/tradingview/.env:"
    echo "   IBKR_HOST=127.0.0.1"
    echo "   IBKR_PORT=4002"
    echo ""
    echo "5. Restart app: pm2 restart trading-app"
    ;;
    
  2)
    echo "🖥️  Installing TWS with VNC..."
    
    # Install desktop and VNC
    echo "Installing desktop environment..."
    apt update
    apt install -y xfce4 xfce4-goodies tightvncserver default-jre
    
    # Setup VNC
    echo ""
    echo "⚠️  You will be asked to set a VNC password"
    echo "Choose a strong password (8+ characters)"
    echo ""
    read -p "Press Enter to continue..."
    
    vncserver
    vncserver -kill :1
    
    # Create xstartup
    mkdir -p ~/.vnc
    cat > ~/.vnc/xstartup << 'EOF'
#!/bin/bash
xrdb $HOME/.Xresources
startxfce4 &
EOF
    chmod +x ~/.vnc/xstartup
    
    # Start VNC
    vncserver :1 -geometry 1920x1080 -depth 24
    
    echo ""
    echo "✅ VNC Server installed and started!"
    echo ""
    echo "📋 Next steps:"
    echo ""
    echo "1. Create SSH tunnel from your Mac:"
    echo "   ssh -L 5901:localhost:5901 -N -f root@165.227.104.40"
    echo ""
    echo "2. Connect with VNC Viewer:"
    echo "   - Mac: Finder → Go → Connect to Server (⌘K)"
    echo "   - Enter: vnc://localhost:5901"
    echo "   - Use the VNC password you just set"
    echo ""
    echo "3. In VNC, download TWS:"
    echo "   wget https://download2.interactivebrokers.com/installers/tws/latest-standalone/tws-latest-standalone-linux-x64.sh"
    echo "   chmod +x tws-latest-standalone-linux-x64.sh"
    echo "   ./tws-latest-standalone-linux-x64.sh"
    echo ""
    echo "4. Configure TWS API settings"
    echo ""
    echo "5. Update /root/tradingview/.env:"
    echo "   IBKR_HOST=127.0.0.1"
    echo "   IBKR_PORT=7497"
    echo ""
    echo "6. Restart app: pm2 restart trading-app"
    ;;
    
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "🎉 Installation complete!"
