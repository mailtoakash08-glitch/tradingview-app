#!/bin/bash
# 🔧 IB Gateway API Fix Script
# This script enables API access in IB Gateway configuration

echo "🔧 Fixing IB Gateway API Configuration..."
echo "========================================"
echo ""

# Check if IB Gateway is running
if pgrep -f "ibgateway" > /dev/null; then
    echo "✅ IB Gateway is running (PID: $(pgrep -f ibgateway))"
else
    echo "❌ IB Gateway is NOT running!"
    echo "   You need to start it via VNC or manually"
    exit 1
fi

# Backup current config
echo "📋 Backing up current jts.ini..."
cp ~/Jts/jts.ini ~/Jts/jts.ini.backup.$(date +%Y%m%d_%H%M%S)

# Update jts.ini to enable API
echo "✏️  Updating jts.ini with API settings..."

# Check if [IBGateway] section exists
if grep -q "^\[IBGateway\]" ~/Jts/jts.ini; then
    # Update existing section
    sed -i '/^\[IBGateway\]/,/^\[/ {
        /^LocalServerPort=/c\LocalServerPort=4002
        /^TrustedIPs=/c\TrustedIPs=127.0.0.1
        /^ApiOnly=/c\ApiOnly=true
    }' ~/Jts/jts.ini
    
    # Add missing settings if they don't exist
    if ! grep -q "^LocalServerPort=" ~/Jts/jts.ini; then
        sed -i '/^\[IBGateway\]/a LocalServerPort=4002' ~/Jts/jts.ini
    fi
    if ! grep -q "^TrustedIPs=" ~/Jts/jts.ini; then
        sed -i '/^\[IBGateway\]/a TrustedIPs=127.0.0.1' ~/Jts/jts.ini
    fi
    if ! grep -q "^ApiOnly=" ~/Jts/jts.ini; then
        sed -i '/^\[IBGateway\]/a ApiOnly=true' ~/Jts/jts.ini
    fi
else
    # Add [IBGateway] section
    cat >> ~/Jts/jts.ini << 'EOF'

[IBGateway]
LocalServerPort=4002
TrustedIPs=127.0.0.1
ApiOnly=true
WriteDebug=false
EOF
fi

echo "✅ Configuration updated"
echo ""
echo "📄 Current [IBGateway] configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -A 10 "^\[IBGateway\]" ~/Jts/jts.ini
echo ""
echo "⚠️  IMPORTANT: You must RESTART IB Gateway for changes to take effect!"
echo ""
echo "Options to restart:"
echo "  1. Via VNC: Close and reopen IB Gateway"
echo "  2. Via SSH: killall java && ./start-gateway.sh"
echo ""
echo "After restart, check if port 4002 is listening:"
echo "  lsof -i -P | grep java | grep LISTEN"
echo ""

