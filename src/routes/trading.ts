/**
 * Trading Panel UI Route - Simple one-click trading interface
 */

import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /trading - Simple trading panel
 */
router.get("/", (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trading Panel - Quick Trade</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .header h1 {
      color: #333;
      margin-bottom: 10px;
    }

    .status {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #10b981;
    }

    .status-dot.offline {
      background: #ef4444;
    }

    .symbols-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .symbol-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .symbol-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 2px solid #f0f0f0;
    }

    .symbol-name {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }

    .symbol-price {
      font-size: 20px;
      color: #666;
      font-weight: 500;
    }

    .symbol-trades {
      font-size: 14px;
      color: #999;
      margin-top: 5px;
    }

    .quantity-selector {
      margin-bottom: 15px;
    }

    .quantity-selector label {
      display: block;
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .quantity-buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .qty-btn {
      padding: 8px;
      border: 2px solid #e0e0e0;
      background: white;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
    }

    .qty-btn:hover {
      border-color: #667eea;
      background: #f0f4ff;
    }

    .qty-btn.active {
      border-color: #667eea;
      background: #667eea;
      color: white;
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .trade-btn {
      padding: 20px;
      border: none;
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .trade-btn:active {
      transform: scale(0.98);
    }

    .buy-btn {
      background: #10b981;
      color: white;
    }

    .buy-btn:hover {
      background: #059669;
    }

    .sell-btn {
      background: #ef4444;
      color: white;
    }

    .sell-btn:hover {
      background: #dc2626;
    }

    .exit-btn {
      background: #f59e0b;
      color: white;
    }

    .exit-btn:hover {
      background: #d97706;
    }

    .controls {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .controls h2 {
      color: #333;
      margin-bottom: 15px;
    }

    .control-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .ctrl-btn {
      padding: 15px 30px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ctrl-btn.danger {
      background: #dc2626;
      color: white;
    }

    .ctrl-btn.danger:hover {
      background: #b91c1c;
    }

    .ctrl-btn.warning {
      background: #f59e0b;
      color: white;
    }

    .ctrl-btn.warning:hover {
      background: #d97706;
    }

    .ctrl-btn.primary {
      background: #667eea;
      color: white;
    }

    .ctrl-btn.primary:hover {
      background: #5568d3;
    }

    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      animation: slideIn 0.3s;
      z-index: 1000;
      max-width: 400px;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification.success {
      background: #10b981;
    }

    .notification.error {
      background: #ef4444;
    }

    .notification.info {
      background: #3b82f6;
    }

    .strategy-selector {
      margin-bottom: 10px;
    }

    .strategy-selector label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }

    .strategy-selector select {
      width: 100%;
      padding: 8px;
      border: 2px solid #e0e0e0;
      border-radius: 5px;
      font-size: 14px;
    }

    .loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 3px solid rgba(255,255,255,.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Trading Panel</h1>
      <div class="status">
        <div class="status-item">
          <div class="status-dot" id="appStatus"></div>
          <span id="appStatusText">Connecting...</span>
        </div>
        <div class="status-item">
          <span>Kill Switch: <strong id="killSwitchStatus">Loading...</strong></span>
        </div>
        <div class="status-item">
          <span>Total Trades: <strong id="totalTrades">0</strong></span>
        </div>
      </div>
    </div>

    <div class="symbols-grid" id="symbolsGrid">
      <!-- Symbol cards will be inserted here -->
    </div>

    <div class="controls">
      <h2>⚡ Quick Controls</h2>
      <div class="control-group">
        <button class="ctrl-btn danger" onclick="exitAll()">🛑 EXIT ALL POSITIONS</button>
        <button class="ctrl-btn warning" onclick="toggleKillSwitch()">⏸️ TOGGLE KILL SWITCH</button>
        <button class="ctrl-btn primary" onclick="refreshAll()">🔄 REFRESH</button>
      </div>
    </div>
  </div>

  <script>
    // Configuration
    const SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL'];
    const QUANTITIES = [10, 50, 100, 200];
    const selectedQuantities = {};
    const selectedStrategies = {};

    // Initialize
    SYMBOLS.forEach(symbol => {
      selectedQuantities[symbol] = 50; // Default
      selectedStrategies[symbol] = 'bread_and_butter'; // Default
    });

    // Initialize UI
    function init() {
      renderSymbolCards();
      refreshStatus();
      setInterval(refreshStatus, 5000); // Auto-refresh every 5 seconds
    }

    // Render symbol cards
    function renderSymbolCards() {
      const grid = document.getElementById('symbolsGrid');
      grid.innerHTML = SYMBOLS.map(symbol => \`
        <div class="symbol-card">
          <div class="symbol-header">
            <div>
              <div class="symbol-name">\${symbol}</div>
              <div class="symbol-trades" id="\${symbol}-trades">0 trades today</div>
            </div>
            <div class="symbol-price" id="\${symbol}-price">--</div>
          </div>

          <div class="strategy-selector">
            <label>Strategy:</label>
            <select id="\${symbol}-strategy" onchange="selectStrategy('\${symbol}', this.value)">
              <option value="bread_and_butter">Bread & Butter</option>
              <option value="momentum">Momentum</option>
            </select>
          </div>

          <div class="quantity-selector">
            <label>Quantity:</label>
            <div class="quantity-buttons">
              \${QUANTITIES.map(qty => \`
                <button class="qty-btn \${qty === 50 ? 'active' : ''}" 
                        id="\${symbol}-qty-\${qty}"
                        onclick="selectQuantity('\${symbol}', \${qty})">
                  \${qty}
                </button>
              \`).join('')}
            </div>
          </div>

          <div class="action-buttons">
            <button class="trade-btn buy-btn" onclick="trade('\${symbol}', 'BUY')">
              📈 BUY
            </button>
            <button class="trade-btn sell-btn" onclick="trade('\${symbol}', 'SELL')">
              📉 SELL
            </button>
          </div>
        </div>
      \`).join('');
    }

    // Select quantity
    function selectQuantity(symbol, qty) {
      selectedQuantities[symbol] = qty;
      
      // Update button states
      QUANTITIES.forEach(q => {
        const btn = document.getElementById(\`\${symbol}-qty-\${q}\`);
        if (q === qty) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // Select strategy
    function selectStrategy(symbol, strategy) {
      selectedStrategies[symbol] = strategy;
    }

    // Execute trade
    async function trade(symbol, action) {
      const qty = selectedQuantities[symbol];
      const strategy = selectedStrategies[symbol];
      const btn = event.target;
      const originalText = btn.innerHTML;
      
      btn.disabled = true;
      btn.innerHTML = '<div class="loading"></div>';

      try {
        const payload = {
          strategy: strategy,
          action: action === 'BUY' ? 'ENTRY_LONG' : 'EXIT',
          symbol: symbol,
          qty: qty  // Changed from 'quantity' to 'qty' to match TradingView type
        };

        const response = await fetch('/webhook/tradingview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          showNotification(\`✅ \${action} \${qty} \${symbol}\`, 'success');
          refreshStatus();
        } else {
          showNotification(\`❌ Failed: \${data.reason || 'Unknown error'}\`, 'error');
        }
      } catch (error) {
        showNotification(\`❌ Error: \${error.message}\`, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }

    // Exit all positions
    async function exitAll() {
      if (!confirm('Exit ALL positions for all symbols?')) return;

      showNotification('🛑 Exiting all positions...', 'info');

      for (const symbol of SYMBOLS) {
        try {
          await fetch('/webhook/tradingview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              strategy: 'bread_and_butter',
              action: 'EXIT',
              symbol: symbol
            })
          });
        } catch (error) {
          console.error(\`Failed to exit \${symbol}:\`, error);
        }
      }

      showNotification('✅ Exit orders sent for all symbols', 'success');
      setTimeout(refreshStatus, 1000);
    }

    // Toggle kill switch
    async function toggleKillSwitch() {
      try {
        const statusRes = await fetch('/admin/state');
        const statusData = await statusRes.json();
        const currentState = statusData.state.killSwitch;

        const response = await fetch('/admin/kill-switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !currentState })
        });

        if (response.ok) {
          showNotification(\`🔒 Kill switch \${!currentState ? 'ENABLED' : 'DISABLED'}\`, 'info');
          refreshStatus();
        }
      } catch (error) {
        showNotification('❌ Failed to toggle kill switch', 'error');
      }
    }

    // Refresh status
    async function refreshStatus() {
      try {
        const response = await fetch('/admin/state');
        const data = await response.json();

        if (data.status === 'ok') {
          document.getElementById('appStatus').classList.remove('offline');
          document.getElementById('appStatusText').textContent = 'Connected';
          
          const state = data.state;
          document.getElementById('killSwitchStatus').textContent = 
            state.killSwitch ? '🔴 ACTIVE' : '🟢 OFF';
          
          let totalTrades = 0;
          Object.keys(state.tradesPerSymbol || {}).forEach(symbol => {
            const count = state.tradesPerSymbol[symbol];
            totalTrades += count;
            const tradeEl = document.getElementById(\`\${symbol}-trades\`);
            if (tradeEl) {
              tradeEl.textContent = \`\${count} trade\${count !== 1 ? 's' : ''} today\`;
            }
          });

          document.getElementById('totalTrades').textContent = totalTrades;
        }
      } catch (error) {
        document.getElementById('appStatus').classList.add('offline');
        document.getElementById('appStatusText').textContent = 'Offline';
      }
    }

    // Refresh all
    function refreshAll() {
      showNotification('🔄 Refreshing...', 'info');
      refreshStatus();
    }

    // Show notification
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = \`notification \${type}\`;
      notification.textContent = message;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 4000);
    }

    // Start
    init();
  </script>
</body>
</html>
  `;

  res.send(html);
});

export default router;

