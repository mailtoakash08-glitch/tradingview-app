#!/bin/bash

# Restart VNC and Desktop Services on VPS

echo "🔄 Restarting VNC Server..."

# Kill existing VNC servers
echo "→ Stopping existing VNC processes..."
killall Xvfb 2>/dev/null || true
killall x11vnc 2>/dev/null || true
killall vncserver 2>/dev/null || true
sleep 2

# Start Xvfb (virtual display)
echo "→ Starting virtual display (Xvfb)..."
Xvfb :1 -screen 0 1024x768x24 &
export DISPLAY=:1
sleep 2

# Start x11vnc server
echo "→ Starting VNC server on port 5901..."
x11vnc -display :1 -rfbport 5901 -forever -shared -bg -nopw

# Check if running
sleep 2
if ps aux | grep -q "[x]11vnc"; then
  echo "✅ VNC Server started successfully"
  echo ""
  echo "Connect from your Mac:"
  echo "  ssh -L 5901:localhost:5901 root@165.227.104.40"
  echo "  Then VNC Viewer → localhost:5901"
else
  echo "❌ Failed to start VNC server"
  exit 1
fi

# Check IB Gateway
echo ""
echo "Checking IB Gateway..."
if ps aux | grep -q "[j]ava.*ibgateway"; then
  echo "✅ IB Gateway is running"
else
  echo "❌ IB Gateway not running"
  echo ""
  echo "Start it with:"
  echo "  bash /opt/trading-app/start-gateway.sh"
fi

