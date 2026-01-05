/**
 * Integrated Trading Workspace
 * Combines TradingView charts, automation dashboard, and trading controls
 */

import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /workspace - Unified trading interface
 */
router.get("/", (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trading Workspace - Charts + Automation</title>
  
  <!-- TradingView Widget Library (FREE) -->
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #131722;
      color: #D1D4DC;
      overflow: hidden;
    }

    /* Layout */
    .workspace-container {
      display: grid;
      grid-template-columns: 1fr 400px;
      grid-template-rows: 50px 1fr;
      height: 100vh;
      width: 100vw;
      gap: 0;
      background: #1E222D;
      overflow: hidden;
    }

    /* Header */
    .workspace-header {
      grid-column: 1 / -1;
      background: #1E222D;
      padding: 0 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #2A2E39;
      min-height: 50px;
      max-height: 50px;
      overflow: hidden;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .header-title {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #26A69A;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .symbol-selector {
      padding: 6px 12px;
      background: #2A2E39;
      border: 1px solid #434651;
      border-radius: 4px;
      color: #D1D4DC;
      font-size: 13px;
      cursor: pointer;
    }

    .header-right {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: nowrap;
    }

    .header-stat {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      min-width: 80px;
    }

    .stat-label {
      font-size: 10px;
      color: #787B86;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .stat-value {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
    }

    .stat-value.positive {
      color: #26A69A;
    }

    .stat-value.negative {
      color: #EF5350;
    }

    /* Chart Panel */
    .chart-panel {
      background: #131722;
      position: relative;
      overflow: hidden;
    }

    #trading-chart {
      width: 100%;
      height: 100%;
      background: #131722;
    }
    
    #tradingview-chart {
      width: 100%;
      height: 100%;
    }

    /* Right Sidebar */
    .sidebar-panel {
      background: #1E222D;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      max-height: calc(100vh - 50px);
      border-left: 1px solid #2A2E39;
    }

    /* Tabs */
    .sidebar-tabs {
      display: flex;
      border-bottom: 1px solid #2A2E39;
      background: #1E222D;
      position: sticky;
      top: 0;
      z-index: 10;
      flex-shrink: 0;
    }

    .tab {
      flex: 1;
      padding: 10px 8px;
      text-align: center;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab:hover {
      background: #2A2E39;
    }

    .tab.active {
      border-bottom-color: #2962FF;
      color: #2962FF;
    }

    /* Tab Content */
    .tab-content {
      display: none;
      padding: 12px;
      flex: 1;
      overflow-y: auto;
      max-height: calc(100vh - 100px);
    }

    .tab-content.active {
      display: block;
    }

    /* Positions */
    .position-item {
      background: #2A2E39;
      padding: 12px;
      margin-bottom: 10px;
      border-radius: 6px;
      border-left: 3px solid #26A69A;
    }

    .position-item.short {
      border-left-color: #EF5350;
    }

    .position-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .position-symbol {
      font-size: 16px;
      font-weight: 600;
    }

    .position-pnl {
      font-size: 14px;
      font-weight: 600;
    }

    .position-pnl.positive {
      color: #26A69A;
    }

    .position-pnl.negative {
      color: #EF5350;
    }

    .position-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 12px;
      color: #787B86;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
    }

    .detail-value {
      color: #D1D4DC;
    }

    /* Quick Trade */
    .quick-trade {
      background: #2A2E39;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
    }

    .quick-trade-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .trade-input {
      width: 100%;
      padding: 10px;
      background: #131722;
      border: 1px solid #434651;
      border-radius: 4px;
      color: #D1D4DC;
      font-size: 14px;
      margin-bottom: 10px;
    }

    .trade-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .trade-btn {
      padding: 12px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .trade-btn.buy {
      background: #26A69A;
      color: white;
    }

    .trade-btn.buy:hover {
      background: #1E8E7E;
    }

    .trade-btn.sell {
      background: #EF5350;
      color: white;
    }

    .trade-btn.sell:hover {
      background: #D32F2F;
    }

    /* Orders List */
    .order-item {
      background: #2A2E39;
      padding: 10px;
      margin-bottom: 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .order-symbol {
      font-weight: 600;
    }

    .order-status {
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
    }

    .order-status.filled {
      background: rgba(38, 166, 154, 0.2);
      color: #26A69A;
    }

    .order-status.pending {
      background: rgba(255, 152, 0, 0.2);
      color: #FF9800;
    }

    .order-details {
      color: #787B86;
    }

    /* Controls */
    .control-section {
      background: #2A2E39;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
    }

    .control-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .control-btn {
      width: 100%;
      padding: 10px;
      margin-bottom: 8px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .control-btn.danger {
      background: #EF5350;
      color: white;
    }

    .control-btn.danger:hover {
      background: #D32F2F;
    }

    .control-btn.warning {
      background: #FF9800;
      color: white;
    }

    .control-btn.primary {
      background: #2962FF;
      color: white;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #787B86;
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
    }

    ::-webkit-scrollbar-track {
      background: #131722;
    }

    ::-webkit-scrollbar-thumb {
      background: #2A2E39;
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #434651;
    }

    /* Notification */
    .notification {
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 15px 20px;
      background: #2A2E39;
      border-left: 3px solid #2962FF;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      animation: slideIn 0.3s;
      max-width: 300px;
    }

    .notification.success {
      border-left-color: #26A69A;
    }

    .notification.error {
      border-left-color: #EF5350;
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
  </style>
</head>
<body>
  <div class="workspace-container">
    <!-- Header -->
    <div class="workspace-header">
      <div class="header-left">
        <div class="header-title">
          <span class="status-indicator"></span>
          Trading Workspace
        </div>
        <select class="symbol-selector" id="symbolSelector" onchange="changeSymbol(this.value)">
          <option value="AAPL">AAPL</option>
          <option value="SPY">SPY</option>
          <option value="MSFT">MSFT</option>
          <option value="NVDA">NVDA</option>
          <option value="TSLA">TSLA</option>
          <option value="GOOGL">GOOGL</option>
        </select>
      </div>
      <div class="header-right">
        <div class="header-stat">
          <div class="stat-label">Balance</div>
          <div class="stat-value" id="headerBalance">$1,000,000</div>
        </div>
        <div class="header-stat">
          <div class="stat-label">Today P&L</div>
          <div class="stat-value" id="headerPnL">$0.00</div>
        </div>
        <div class="header-stat">
          <div class="stat-label">Positions</div>
          <div class="stat-value" id="headerPositions">0</div>
        </div>
      </div>
    </div>

    <!-- Chart Panel -->
    <div class="chart-panel">
      <div id="tradingview-chart"></div>
    </div>

    <!-- Right Sidebar -->
    <div class="sidebar-panel">
      <div class="sidebar-tabs">
        <div class="tab active" onclick="switchTab('positions')">Positions</div>
        <div class="tab" onclick="switchTab('orders')">Orders</div>
        <div class="tab" onclick="switchTab('trade')">Trade</div>
        <div class="tab" onclick="switchTab('controls')">Controls</div>
      </div>

      <!-- Positions Tab -->
      <div id="positions-tab" class="tab-content active">
        <div id="positionsList"></div>
      </div>

      <!-- Orders Tab -->
      <div id="orders-tab" class="tab-content">
        <div id="ordersList"></div>
      </div>

      <!-- Trade Tab -->
      <div id="trade-tab" class="tab-content">
        <div class="quick-trade">
          <div class="quick-trade-title">Quick Trade</div>
          <input type="number" class="trade-input" id="tradeQty" placeholder="Quantity" value="1">
          <select class="trade-input" id="tradeStrategy">
            <option value="momentum">Momentum</option>
            <option value="bread_and_butter">Bread & Butter</option>
          </select>
          <div class="trade-buttons">
            <button class="trade-btn buy" onclick="quickTrade('BUY')">BUY</button>
            <button class="trade-btn sell" onclick="quickTrade('SELL')">SELL</button>
          </div>
        </div>
      </div>

      <!-- Controls Tab -->
      <div id="controls-tab" class="tab-content">
        <div class="control-section">
          <div class="control-title">Emergency Controls</div>
          <button class="control-btn danger" onclick="exitAll()">🛑 EXIT ALL POSITIONS</button>
          <button class="control-btn warning" onclick="toggleKillSwitch()">⏸️ KILL SWITCH</button>
        </div>
        <div class="control-section">
          <div class="control-title">Quick Links</div>
          <button class="control-btn primary" onclick="window.open('/dashboard', '_blank')">📊 Full Dashboard</button>
          <button class="control-btn primary" onclick="window.open('/ui', '_blank')">⚙️ Admin Panel</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Configuration
    let currentSymbol = 'AAPL';
    let tvWidget = null;

    // TradingView Widget (FREE version)
    function initChart(symbol) {
      const container = document.getElementById('tradingview-chart');
      container.innerHTML = '';

      tvWidget = new TradingView.widget({
        "width": "100%",
        "height": "100%",
        "symbol": "NASDAQ:" + symbol,
        "interval": "5",
        "timezone": "America/New_York",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#131722",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "container_id": "tradingview-chart",
        "studies": [
          "Volume@tv-basicstudies"
        ],
        "overrides": {
          "paneProperties.background": "#131722",
          "paneProperties.backgroundType": "solid",
          "paneProperties.vertGridProperties.color": "#1E222D",
          "paneProperties.horzGridProperties.color": "#1E222D"
        }
      });
    }
    
    function changeSymbol(symbol) {
      currentSymbol = symbol;
      initChart(symbol);
    }
    
    // Initialize chart on load
    initChart(currentSymbol);

    // Switch Tabs
    function switchTab(tabName) {
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      event.target.classList.add('active');
      document.getElementById(tabName + '-tab').classList.add('active');
    }

    // Quick Trade
    async function quickTrade(action) {
      const qty = document.getElementById('tradeQty').value;
      const strategy = document.getElementById('tradeStrategy').value;
      
      try {
        const response = await fetch('/webhook/tradingview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategy: strategy,
            action: action === 'BUY' ? 'ENTRY_LONG' : 'ENTRY_SHORT',
            symbol: currentSymbol,
            qty: parseInt(qty),
            outsideRth: true
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          showNotification(\`✅ \${action} \${qty} \${currentSymbol}\`, 'success');
          refreshData();
        } else {
          showNotification(\`❌ \${data.reason || 'Failed'}\`, 'error');
        }
      } catch (error) {
        showNotification(\`❌ Error: \${error.message}\`, 'error');
      }
    }

    // Exit All
    async function exitAll() {
      if (!confirm('Exit ALL positions?')) return;
      
      const positions = await fetch('/api/positions').then(r => r.json());
      
      for (const pos of positions.data.positions) {
        await fetch('/webhook/tradingview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategy: 'momentum',
            action: 'EXIT',
            symbol: pos.symbol,
            outsideRth: true
          })
        });
      }
      
      showNotification('✅ Exit orders sent', 'success');
      setTimeout(refreshData, 1000);
    }

    // Toggle Kill Switch
    async function toggleKillSwitch() {
      const statusRes = await fetch('/admin/state');
      const statusData = await statusRes.json();
      const currentState = statusData.state.killSwitch;

      const response = await fetch('/admin/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentState })
      });

      if (response.ok) {
        showNotification(\`🔒 Kill switch \${!currentState ? 'ENABLED' : 'DISABLED'}\`, 'success');
      }
    }

    // Refresh Data
    async function refreshData() {
      try {
        // Fetch positions
        const posRes = await fetch('/api/positions');
        const posData = await posRes.json();
        updatePositions(posData.data.positions);

        // Fetch orders
        const ordRes = await fetch('/api/orders?limit=10');
        const ordData = await ordRes.json();
        updateOrders(ordData.data.orders);

        // Fetch account
        const accRes = await fetch('/api/account');
        const accData = await accRes.json();
        updateHeader(accData.data);
      } catch (error) {
        console.error('Refresh error:', error);
      }
    }

    // Update Positions
    function updatePositions(positions) {
      const container = document.getElementById('positionsList');
      
      if (positions.length === 0) {
        container.innerHTML = '<div class="empty-state">No open positions</div>';
        return;
      }

      container.innerHTML = positions.map(pos => \`
        <div class="position-item \${pos.side.toLowerCase()}">
          <div class="position-header">
            <div class="position-symbol">\${pos.symbol}</div>
            <div class="position-pnl \${pos.unrealizedPnL >= 0 ? 'positive' : 'negative'}">
              \${pos.unrealizedPnL >= 0 ? '+' : ''}\$\${pos.unrealizedPnL.toFixed(2)}
            </div>
          </div>
          <div class="position-details">
            <div class="detail-item">
              <span>Side:</span>
              <span class="detail-value">\${pos.side}</span>
            </div>
            <div class="detail-item">
              <span>Qty:</span>
              <span class="detail-value">\${pos.quantity}</span>
            </div>
            <div class="detail-item">
              <span>Entry:</span>
              <span class="detail-value">\$\${pos.avgEntryPrice.toFixed(2)}</span>
            </div>
            <div class="detail-item">
              <span>Current:</span>
              <span class="detail-value">\$\${pos.currentPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      \`).join('');
    }

    // Update Orders
    function updateOrders(orders) {
      const container = document.getElementById('ordersList');
      
      if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state">No recent orders</div>';
        return;
      }

      container.innerHTML = orders.map(order => \`
        <div class="order-item">
          <div class="order-header">
            <div class="order-symbol">\${order.symbol} \${order.action}</div>
            <div class="order-status \${order.status.toLowerCase()}">\${order.status}</div>
          </div>
          <div class="order-details">
            \${order.orderType} · \${order.quantity} shares · \${new Date(order.submittedAt).toLocaleTimeString()}
          </div>
        </div>
      \`).join('');
    }

    // Update Header
    function updateHeader(data) {
      document.getElementById('headerBalance').textContent = \`\$\${data.balance.toLocaleString()}\`;
      
      const pnlEl = document.getElementById('headerPnL');
      pnlEl.textContent = \`\$\${data.dayPnL.toFixed(2)}\`;
      pnlEl.className = 'stat-value ' + (data.dayPnL >= 0 ? 'positive' : 'negative');
      
      document.getElementById('headerPositions').textContent = data.openPositions;
    }

    // Show Notification
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = \`notification \${type}\`;
      notification.textContent = message;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 4000);
    }

    // Initialize
    initChart(currentSymbol);
    refreshData();
    setInterval(refreshData, 3000); // Auto-refresh every 3 seconds
  </script>
</body>
</html>
  `;

  res.send(html);
});

export default router;
