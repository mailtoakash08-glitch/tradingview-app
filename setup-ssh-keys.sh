#!/bin/bash

# Setup SSH Key Authentication
# Run this ONCE to eliminate password prompts

VPS_HOST="165.227.104.40"
VPS_USER="root"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 SSH KEY SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if SSH key exists
if [ -f ~/.ssh/id_rsa.pub ]; then
  echo "✅ SSH key already exists: ~/.ssh/id_rsa.pub"
else
  echo "🔑 Creating new SSH key..."
  ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -C "trading-vps-key"
  echo "✅ SSH key created"
fi

echo ""
echo "📤 Copying SSH key to VPS..."
echo "   (You'll need to enter your VPS password ONE LAST TIME)"
echo ""

ssh-copy-id -i ~/.ssh/id_rsa.pub $VPS_USER@$VPS_HOST

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing SSH connection (no password)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ssh -o BatchMode=yes $VPS_USER@$VPS_HOST "echo '✅ SSH key authentication working!'" 2>/dev/null; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ SUCCESS! No more passwords needed!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Now you can run:"
  echo "  ./restart-everything.sh  (no password prompts!)"
  echo "  ./check-quick.sh         (instant!)"
  echo "  ssh $VPS_USER@$VPS_HOST   (no password!)"
  echo ""
else
  echo "❌ SSH key authentication failed"
  echo ""
  echo "Manual fix:"
  echo "  cat ~/.ssh/id_rsa.pub | ssh $VPS_USER@$VPS_HOST 'cat >> ~/.ssh/authorized_keys'"
  echo ""
fi

