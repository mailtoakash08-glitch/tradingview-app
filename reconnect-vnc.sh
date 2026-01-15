#!/bin/bash

# VNC Reconnection Guide for Mac
# VPS: 165.227.104.40
# VNC Port: 5901
# Display: :1

echo "🖥️  VNC Reconnection Guide"
echo "=========================="
echo ""

echo "VPS Details:"
echo "  IP: 165.227.104.40"
echo "  Port: 5901"
echo "  Display: :1"
echo "  Password: (you set this with vncpasswd)"
echo ""

echo "📋 Connection Methods:"
echo ""

echo "Option 1: Built-in macOS Screen Sharing"
echo "  1. Open Finder → Go → Connect to Server (⌘K)"
echo "  2. Enter: vnc://165.227.104.40:5901"
echo "  3. Click 'Connect'"
echo "  4. Enter VNC password when prompted"
echo ""

echo "Option 2: Command Line (macOS)"
echo "  Run this command:"
echo "  open vnc://165.227.104.40:5901"
echo ""

echo "Option 3: RealVNC Viewer (Recommended)"
echo "  Download from: https://www.realvnc.com/en/connect/download/viewer/"
echo "  1. Install RealVNC Viewer"
echo "  2. Add new connection: 165.227.104.40:5901"
echo "  3. Connect"
echo ""

echo "Option 4: TigerVNC Viewer"
echo "  Install via Homebrew:"
echo "  brew install --cask tigervnc-viewer"
echo "  Then run:"
echo "  vncviewer 165.227.104.40:5901"
echo ""

echo "🔧 Troubleshooting:"
echo ""

echo "If connection fails, check:"
echo "  1. VPS VNC server status:"
echo "     ssh root@165.227.104.40 'ps aux | grep vnc | grep -v grep'"
echo ""
echo "  2. Test port connectivity:"
echo "     nc -zv 165.227.104.40 5901"
echo ""
echo "  3. Restart VNC server if needed:"
echo "     ssh root@165.227.104.40 'pkill x11vnc && x11vnc -display :1 -rfbport 5901 -forever -shared -bg -nopw'"
echo ""

echo "📝 If you forgot VNC password:"
echo "  ssh root@165.227.104.40"
echo "  vncpasswd"
echo "  (set new password)"
echo "  pkill x11vnc"
echo "  x11vnc -display :1 -rfbport 5901 -forever -shared -bg"
echo ""

echo "🚀 Quick Connect:"
read -p "Press Enter to open VNC connection now..." 
open vnc://165.227.104.40:5901

