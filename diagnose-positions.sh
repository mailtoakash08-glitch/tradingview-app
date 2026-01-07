#!/bin/bash

echo "🔍 POSITION DIAGNOSTIC & FORCE SYNC"
echo "===================================="
echo ""

# First, let's see what IB Gateway knows
echo "1️⃣ Checking IB Gateway order status..."
echo ""
echo "From your IB Gateway log, I see:"
echo "✅ Order 11 placed: BUY 100 AAPL"
echo "✅ Account updates received"
echo "❌ NO orderStatus callbacks (this is the problem!)"
echo ""

# The issue: Paper trading during after-hours doesn't reliably send orderStatus events
echo "🐛 ROOT CAUSE:"
echo "Paper trading outside market hours often doesn't send orderStatus callbacks."
echo "Your order might be filled, but the app never knows about it."
echo ""

echo "🔧 SOLUTION: We need to manually request positions from IBKR"
echo ""

# Create a test script to manually request positions
cat > /tmp/test-ibkr-positions.js << 'EOF'
const { IBApi, EventName, SecType } = require('@stoqey/ib');

const ib = new IBApi({
  host: '127.0.0.1',
  port: 4002,
  clientId: 0
});

console.log('Connecting to IBKR...');

ib.on(EventName.connected, () => {
  console.log('✅ Connected!');
  
  // Request positions
  console.log('Requesting positions...');
  ib.reqPositions();
});

ib.on(EventName.position, (account, contract, pos, avgCost) => {
  console.log('📊 POSITION FOUND:');
  console.log('  Symbol:', contract.symbol);
  console.log('  Quantity:', pos);
  console.log('  Avg Cost:', avgCost);
  console.log('  Account:', account);
});

ib.on(EventName.positionEnd, () => {
  console.log('✅ Position request complete');
  ib.disconnect();
  process.exit(0);
});

ib.on(EventName.error, (err, code, reqId) => {
  if (code !== 2104 && code !== 2106 && code !== 2158) {
    console.error('❌ Error:', err.message, 'Code:', code);
  }
});

ib.connect();

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏱️  Timeout - disconnecting');
  ib.disconnect();
  process.exit(1);
}, 10000);
EOF

echo "📤 Uploading test script to VPS..."
scp /tmp/test-ibkr-positions.js root@165.227.104.40:/tmp/

echo ""
echo "🚀 Running position test on VPS..."
ssh root@165.227.104.40 << 'ENDSSH'
cd /root/trading-app
echo "Testing direct IBKR position request..."
node /tmp/test-ibkr-positions.js
ENDSSH

echo ""
echo "============================================"
echo ""
echo "📋 ANALYSIS:"
echo ""
echo "If you saw positions above:"
echo "  ✅ Order IS filled, but app isn't detecting it"
echo "  → Solution: Add reqPositions() to our app"
echo ""
echo "If you saw NO positions:"
echo "  ⏰ Order NOT filled yet (paper trading is slow)"
echo "  → Solution: Wait 5-10 more minutes"
echo ""
echo "If you saw an error:"
echo "  🔧 IB Gateway connection issue"
echo "  → Solution: Restart IB Gateway"
echo ""

