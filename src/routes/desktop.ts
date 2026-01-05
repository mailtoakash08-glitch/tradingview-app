import { Router, Request, Response } from 'express';

const router = Router();

/**
 * TradingView Desktop-Style Trading Interface
 * 
 * Features:
 * - Real-time TradingView charts
 * - Manual order entry (Market, Limit, Stop Market)
 * - Extended hours trading
 * - Live positions & P&L tracking
 * - IBKR integration
 * - Windows-style dark UI
 */

router.get('/', (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trading Desktop - IBKR</title>
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
      background: #0B0E11;
      color: #D1D4DC;
      overflow: hidden;
      height: 100vh;
    }

    /* Main Container */
    .trading-container {
      display: grid;
      grid-template-columns: 1fr 380px;
      grid-template-rows: 1fr 280px;
      height: 100vh;
      gap: 1px;
      background: #000;
    }

    /* Chart Area (Top Left) */
    .chart-section {
      background: #131722;
      position: relative;
      grid-row: 1 / 2;
      grid-column: 1 / 2;
    }

    #tradingview_chart {
      width: 100%;
      height: 100%;
    }

    /* Trading Panel (Top Right) */
    .trading-panel {
      background: #1E222D;
      padding: 20px;
      overflow-y: auto;
      grid-row: 1 / 2;
      grid-column: 2 / 3;
      border-radius: 8px 0 0 0;
    }

    .panel-header {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #fff;
      border-bottom: 1px solid #2A2E39;
      padding-bottom: 12px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 12px;
      color: #787B86;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 10px 12px;
      background: #131722;
      border: 1px solid #2A2E39;
      border-radius: 6px;
      color: #D1D4DC;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #2962FF;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      margin: 16px 0;
    }

    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin-right: 8px;
      cursor: pointer;
    }

    .checkbox-group label {
      margin: 0;
      cursor: pointer;
      color: #D1D4DC;
      font-size: 13px;
      text-transform: none;
    }

    /* Buy/Sell Buttons */
    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 20px;
    }

    .btn {
      padding: 14px;
      border: none;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-buy {
      background: #089981;
      color: #fff;
    }

    .btn-buy:hover {
      background: #0AAA91;
    }

    .btn-sell {
      background: #F23645;
      color: #fff;
    }

    .btn-sell:hover {
      background: #FF4757;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Positions Table (Bottom) */
    .positions-section {
      background: #1E222D;
      padding: 20px;
      overflow-y: auto;
      grid-row: 2 / 3;
      grid-column: 1 / 3;
      border-radius: 0 0 8px 8px;
    }

    .positions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #2A2E39;
    }

    .positions-title {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }

    .account-summary {
      display: flex;
      gap: 24px;
      font-size: 13px;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
    }

    .summary-label {
      color: #787B86;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-value {
      color: #fff;
      font-weight: 600;
      margin-top: 2px;
    }

    .summary-value.positive {
      color: #089981;
    }

    .summary-value.negative {
      color: #F23645;
    }

    /* Positions Table */
    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead th {
      text-align: left;
      padding: 10px;
      font-size: 11px;
      color: #787B86;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #2A2E39;
    }

    tbody td {
      padding: 12px 10px;
      font-size: 13px;
      border-bottom: 1px solid #2A2E39;
    }

    tbody tr:hover {
      background: #131722;
    }

    .symbol-cell {
      font-weight: 600;
      color: #fff;
    }

    .positive {
      color: #089981;
    }

    .negative {
      color: #F23645;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-open {
      background: rgba(41, 98, 255, 0.15);
      color: #2962FF;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #787B86;
    }

    /* Notifications */
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1E222D;
      border: 1px solid #2A2E39;
      border-radius: 6px;
      padding: 16px 20px;
      min-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      display: none;
    }

    .notification.show {
      display: block;
      animation: slideIn 0.3s ease;
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
      border-left: 3px solid #089981;
    }

    .notification.error {
      border-left: 3px solid #F23645;
    }

    .notification-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: #fff;
    }

    .notification-message {
      font-size: 13px;
      color: #D1D4DC;
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: #131722;
    }

    ::-webkit-scrollbar-thumb {
      background: #2A2E39;
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #363A45;
    }

    /* Refresh Button */
    .refresh-btn {
      background: #2962FF;
      color: #fff;
      padding: 6px 12px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    }

    .refresh-btn:hover {
      background: #1E53E5;
    }
  </style>
</head>
<body>
  <!-- Notification Toast -->
  <div id="notification" class="notification">
    <div class="notification-title" id="notif-title">Success</div>
    <div class="notification-message" id="notif-message">Order placed successfully</div>
  </div>

  <div class="trading-container">
    <!-- Chart Section -->
    <div class="chart-section">
      <div id="tradingview_chart"></div>
    </div>

    <!-- Trading Panel -->
    <div class="trading-panel">
      <div class="panel-header">📈 Place Order</div>
      
      <form id="trading-form">
        <div class="form-group">
          <label>Ticker Symbol</label>
          <input type="text" id="symbol" placeholder="AAPL" required />
        </div>

        <div class="form-group">
          <label>Quantity (Shares)</label>
          <input type="number" id="quantity" placeholder="100" min="1" required />
        </div>

        <div class="form-group">
          <label>Order Type</label>
          <select id="orderType">
            <option value="MKT">Market Order</option>
            <option value="LMT">Limit Order</option>
            <option value="STP">Stop Market</option>
            <option value="TRAIL">Trailing Stop</option>
          </select>
        </div>

        <div class="form-group" id="limitPriceGroup" style="display:none;">
          <label>Limit Price</label>
          <input type="number" id="limitPrice" step="0.01" placeholder="150.00" />
        </div>

        <div class="form-group" id="stopPriceGroup" style="display:none;">
          <label>Stop Price</label>
          <input type="number" id="stopPrice" step="0.01" placeholder="150.00" />
        </div>

        <div class="form-group" id="trailingAmountGroup" style="display:none;">
          <label>Trailing Amount ($)</label>
          <input type="number" id="trailingAmount" step="0.01" placeholder="2.00" />
        </div>

        <div class="form-group">
          <label>Take Profit ($) <span style="color: #787B86; font-size: 11px;">- Optional</span></label>
          <input type="number" id="takeProfit" step="0.01" placeholder="Leave empty to skip" />
        </div>

        <div class="form-group">
          <label>Stop Loss ($) <span style="color: #787B86; font-size: 11px;">- Optional</span></label>
          <input type="number" id="stopLoss" step="0.01" placeholder="Leave empty to skip" />
        </div>

        <div class="checkbox-group">
          <input type="checkbox" id="extendedHours" checked />
          <label for="extendedHours">Trade Extended Hours (Pre-Market & After-Hours)</label>
        </div>

        <div class="action-buttons">
          <button type="button" class="btn btn-buy" id="buyBtn">Buy</button>
          <button type="button" class="btn btn-sell" id="sellBtn">Sell</button>
        </div>
      </form>
    </div>

    <!-- Positions Section -->
    <div class="positions-section">
      <div class="positions-header">
        <div class="positions-title">💼 Open Positions</div>
        <div class="account-summary">
          <div class="summary-item">
            <span class="summary-label">Balance</span>
            <span class="summary-value" id="balance">$0.00</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Unrealized P&L</span>
            <span class="summary-value" id="unrealizedPnL">$0.00</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Realized P&L</span>
            <span class="summary-value" id="realizedPnL">$0.00</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total P&L</span>
            <span class="summary-value" id="totalPnL">$0.00</span>
          </div>
          <button class="refresh-btn" id="refreshBtn">↻ Refresh</button>
        </div>
      </div>

      <div id="positionsTableContainer">
        <table id="positionsTable">
          <thead>
            <tr>
              <th>SYMBOL</th>
              <th>QUANTITY</th>
              <th>AVG PRICE</th>
              <th>CURRENT PRICE</th>
              <th>MARKET VALUE</th>
              <th>UNREALIZED P&L</th>
              <th>P&L %</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody id="positionsBody">
            <tr>
              <td colspan="8" class="empty-state">No open positions</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    // Global State
    let currentSymbol = 'AAPL';
    let tvWidget = null;
    let positions = [];
    let accountData = {
      balance: 0,
      unrealizedPnL: 0,
      realizedPnL: 0,
      totalPnL: 0
    };

    // Initialize TradingView Chart
    function initChart(symbol) {
      const container = document.getElementById('tradingview_chart');
      
      if (tvWidget) {
        tvWidget.remove();
      }

      tvWidget = new TradingView.widget({
        "width": "100%",
        "height": "100%",
        "symbol": "NASDAQ:" + symbol.toUpperCase(),
        "interval": "5",
        "timezone": "America/New_York",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#131722",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "container_id": "tradingview_chart",
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

    // Order Type Change Handler
    document.getElementById('orderType').addEventListener('change', function() {
      const orderType = this.value;
      const limitPriceGroup = document.getElementById('limitPriceGroup');
      const stopPriceGroup = document.getElementById('stopPriceGroup');
      const trailingAmountGroup = document.getElementById('trailingAmountGroup');

      // Hide all conditional fields
      limitPriceGroup.style.display = 'none';
      stopPriceGroup.style.display = 'none';
      trailingAmountGroup.style.display = 'none';

      // Show relevant fields based on order type
      if (orderType === 'LMT') {
        limitPriceGroup.style.display = 'block';
      } else if (orderType === 'STP') {
        stopPriceGroup.style.display = 'block';
      } else if (orderType === 'TRAIL') {
        trailingAmountGroup.style.display = 'block';
      }
    });

    // Symbol Input Change - Update Chart
    document.getElementById('symbol').addEventListener('change', function() {
      const symbol = this.value.toUpperCase().trim();
      if (symbol) {
        currentSymbol = symbol;
        initChart(symbol);
      }
    });

    // Place Order
    async function placeOrder(action) {
      const symbol = document.getElementById('symbol').value.toUpperCase().trim();
      const quantity = parseInt(document.getElementById('quantity').value);
      const orderType = document.getElementById('orderType').value;
      const extendedHours = document.getElementById('extendedHours').checked;

      if (!symbol || !quantity || quantity <= 0) {
        showNotification('Error', 'Please enter valid ticker and quantity', 'error');
        return;
      }

      // Build order payload
      const payload = {
        strategy: 'manual_bmnr',
        action: action === 'BUY' ? 'ENTRY_LONG' : 'EXIT',
        symbol: symbol,
        qty: quantity,
        orderType: orderType,
        outsideRth: extendedHours
      };

      // Add conditional fields
      if (orderType === 'LMT') {
        const limitPrice = parseFloat(document.getElementById('limitPrice').value);
        if (!limitPrice) {
          showNotification('Error', 'Please enter limit price', 'error');
          return;
        }
        payload.limitPrice = limitPrice;
      } else if (orderType === 'STP') {
        const stopPrice = parseFloat(document.getElementById('stopPrice').value);
        if (!stopPrice) {
          showNotification('Error', 'Please enter stop price', 'error');
          return;
        }
        payload.stopPrice = stopPrice;
      } else if (orderType === 'TRAIL') {
        const trailingAmount = parseFloat(document.getElementById('trailingAmount').value);
        if (!trailingAmount) {
          showNotification('Error', 'Please enter trailing amount', 'error');
          return;
        }
        payload.trailingAmount = trailingAmount;
      }

      // Add Take Profit and Stop Loss (optional)
      const takeProfit = parseFloat(document.getElementById('takeProfit').value);
      const stopLoss = parseFloat(document.getElementById('stopLoss').value);
      
      if (takeProfit && takeProfit > 0) {
        payload.takeProfit = takeProfit;
      }
      
      if (stopLoss && stopLoss > 0) {
        payload.stopLoss = stopLoss;
      }

      try {
        const response = await fetch('/webhook/tradingview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
          showNotification('Success', \`Order placed: \${action} \${quantity} \${symbol}\`, 'success');
          // Refresh positions after 2 seconds
          setTimeout(fetchPositions, 2000);
        } else {
          showNotification('Error', result.error || 'Order failed', 'error');
        }
      } catch (error) {
        showNotification('Error', 'Network error: ' + error.message, 'error');
      }
    }

    // Buy/Sell Button Handlers
    document.getElementById('buyBtn').addEventListener('click', () => placeOrder('BUY'));
    document.getElementById('sellBtn').addEventListener('click', () => placeOrder('SELL'));

    // Fetch Positions
    async function fetchPositions() {
      try {
        const response = await fetch('/api/dashboard/positions');
        const data = await response.json();
        
        if (response.ok) {
          positions = data.positions || [];
          updatePositionsTable();
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
      }
    }

    // Fetch Account Summary
    async function fetchAccountSummary() {
      try {
        const response = await fetch('/api/dashboard/account');
        const data = await response.json();
        
        if (response.ok) {
          accountData = {
            balance: data.balance || 0,
            unrealizedPnL: data.unrealizedPnL || 0,
            realizedPnL: data.realizedPnL || 0,
            totalPnL: (data.unrealizedPnL || 0) + (data.realizedPnL || 0)
          };
          updateAccountSummary();
        }
      } catch (error) {
        console.error('Error fetching account:', error);
      }
    }

    // Update Positions Table
    function updatePositionsTable() {
      const tbody = document.getElementById('positionsBody');
      
      if (positions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No open positions</td></tr>';
        return;
      }

      tbody.innerHTML = positions.map(pos => {
        const pnl = pos.unrealizedPnL || 0;
        const pnlPercent = pos.avgPrice > 0 ? ((pos.currentPrice - pos.avgPrice) / pos.avgPrice * 100) : 0;
        const pnlClass = pnl >= 0 ? 'positive' : 'negative';
        const marketValue = pos.currentPrice * pos.quantity;

        return \`
          <tr>
            <td class="symbol-cell">\${pos.symbol}</td>
            <td>\${pos.quantity}</td>
            <td>$\${pos.avgPrice.toFixed(2)}</td>
            <td>$\${pos.currentPrice.toFixed(2)}</td>
            <td>$\${marketValue.toFixed(2)}</td>
            <td class="\${pnlClass}">\${pnl >= 0 ? '+' : ''}$\${pnl.toFixed(2)}</td>
            <td class="\${pnlClass}">\${pnl >= 0 ? '+' : ''}\${pnlPercent.toFixed(2)}%</td>
            <td><span class="status-badge status-open">OPEN</span></td>
          </tr>
        \`;
      }).join('');
    }

    // Update Account Summary
    function updateAccountSummary() {
      const balanceEl = document.getElementById('balance');
      const unrealizedEl = document.getElementById('unrealizedPnL');
      const realizedEl = document.getElementById('realizedPnL');
      const totalEl = document.getElementById('totalPnL');

      balanceEl.textContent = \`$\${accountData.balance.toLocaleString('en-US', {minimumFractionDigits: 2})}\`;
      
      unrealizedEl.textContent = \`\${accountData.unrealizedPnL >= 0 ? '+' : ''}$\${accountData.unrealizedPnL.toFixed(2)}\`;
      unrealizedEl.className = \`summary-value \${accountData.unrealizedPnL >= 0 ? 'positive' : 'negative'}\`;
      
      realizedEl.textContent = \`\${accountData.realizedPnL >= 0 ? '+' : ''}$\${accountData.realizedPnL.toFixed(2)}\`;
      realizedEl.className = \`summary-value \${accountData.realizedPnL >= 0 ? 'positive' : 'negative'}\`;
      
      totalEl.textContent = \`\${accountData.totalPnL >= 0 ? '+' : ''}$\${accountData.totalPnL.toFixed(2)}\`;
      totalEl.className = \`summary-value \${accountData.totalPnL >= 0 ? 'positive' : 'negative'}\`;
    }

    // Show Notification
    function showNotification(title, message, type = 'success') {
      const notif = document.getElementById('notification');
      const notifTitle = document.getElementById('notif-title');
      const notifMessage = document.getElementById('notif-message');

      notif.className = \`notification show \${type}\`;
      notifTitle.textContent = title;
      notifMessage.textContent = message;

      setTimeout(() => {
        notif.classList.remove('show');
      }, 4000);
    }

    // Refresh Button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      fetchPositions();
      fetchAccountSummary();
    });

    // Auto-refresh every 10 seconds
    setInterval(() => {
      fetchPositions();
      fetchAccountSummary();
    }, 10000);

    // Initialize on page load
    initChart(currentSymbol);
    fetchPositions();
    fetchAccountSummary();
  </script>
</body>
</html>
  `);
});

export default router;

