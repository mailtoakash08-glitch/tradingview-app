import { Router, Request, Response } from "express";

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

router.get("/", (req: Request, res: Response) => {
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
      grid-template-columns: 250px 1fr 380px;
      grid-template-rows: 1fr 280px;
      height: 100vh;
      gap: 1px;
      background: #000;
    }

    /* Watchlist Panel (Left Sidebar) */
    .watchlist-panel {
      background: #1E222D;
      padding: 15px;
      overflow-y: auto;
      grid-row: 1 / 3;
      grid-column: 1 / 2;
      border-radius: 0;
    }

    .watchlist-header {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #fff;
      border-bottom: 1px solid #2A2E39;
      padding-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .watchlist-add-btn {
      background: #2962FF;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }

    .watchlist-add-btn:hover {
      background: #1E53E5;
    }

    .watchlist-search {
      width: 100%;
      padding: 8px 10px;
      background: #131722;
      border: 1px solid #2A2E39;
      border-radius: 6px;
      color: #D1D4DC;
      font-size: 13px;
      margin-bottom: 12px;
    }

    .watchlist-search:focus {
      outline: none;
      border-color: #2962FF;
    }

    .watchlist-items {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .watchlist-item {
      padding: 10px 12px;
      background: #131722;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid transparent;
    }

    .watchlist-item:hover {
      background: #1A1E2B;
      border-color: #2962FF;
    }

    .watchlist-item.active {
      background: #1A1E2B;
      border-color: #2962FF;
    }

    .watchlist-symbol {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }

    .watchlist-price {
      font-size: 12px;
      color: #787B86;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .watchlist-change {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .watchlist-change.positive {
      color: #26A69A;
      background: rgba(38, 166, 154, 0.1);
    }

    .watchlist-change.negative {
      color: #EF5350;
      background: rgba(239, 83, 80, 0.1);
    }

    .watchlist-empty {
      text-align: center;
      color: #787B86;
      font-size: 13px;
      padding: 20px;
    }

    /* Chart Area (Top Middle) */
    .chart-section {
      background: #131722;
      position: relative;
      grid-row: 1 / 2;
      grid-column: 2 / 3;
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
      grid-column: 3 / 4;
      border-radius: 0;
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
      grid-column: 2 / 4;
      border-radius: 0;
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

    /* Quick Actions Panel */
    .quick-actions {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #2A2E39;
    }

    .quick-actions .panel-header {
      font-size: 13px;
      font-weight: 600;
      color: #B2B5BE;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-flip {
      background: #FF9800 !important;
      width: 100%;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 14px;
    }

    .btn-flip:hover {
      background: #F57C00 !important;
      transform: scale(1.02);
    }

    .btn-close-all {
      background: #9C27B0 !important;
      width: 100%;
      font-weight: 600;
      font-size: 13px;
    }

    .btn-close-all:hover {
      background: #7B1FA2 !important;
    }

    /* Action Buttons in Table */
    .action-btn {
      background: transparent;
      border: 1px solid #2A2E39;
      color: #B2B5BE;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      margin: 0 2px;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #2A2E39;
      transform: scale(1.1);
    }

    .close-btn {
      border-color: #F23645;
      color: #F23645;
    }

    .close-btn:hover {
      background: #F23645;
      color: #fff;
    }

    .flip-btn {
      border-color: #FF9800;
      color: #FF9800;
    }

    .flip-btn:hover {
      background: #FF9800;
      color: #fff;
    }

    /* Position Markers on Chart */
    .position-marker {
      position: absolute;
      right: 20px;
      background: rgba(26, 26, 26, 0.95);
      border: 1px solid #2A2E39;
      border-radius: 6px;
      padding: 12px;
      font-size: 12px;
      color: #D1D4DC;
      z-index: 1000;
      min-width: 200px;
      backdrop-filter: blur(10px);
    }

    .position-marker-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: #fff;
      font-size: 13px;
    }

    .position-marker-item {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
      font-size: 11px;
    }

    .position-marker-long {
      border-left: 3px solid #089981;
    }

    .position-marker-short {
      border-left: 3px solid #F23645;
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
    <!-- Watchlist Panel -->
    <div class="watchlist-panel">
      <div class="watchlist-header">
        <span>📋 Watchlist</span>
        <button class="watchlist-add-btn" id="addWatchlistBtn" title="Add Symbol">+</button>
      </div>
      
      <input 
        type="text" 
        class="watchlist-search" 
        id="watchlistSearch"
        placeholder="Search symbols..."
      />
      
      <div class="watchlist-items" id="watchlistItems">
        <!-- Watchlist items will be populated here -->
      </div>
    </div>

    <!-- Chart Section -->
    <div class="chart-section">
      <div id="tradingview_chart"></div>
      
      <!-- Position Marker Overlay -->
      <div id="positionMarker" class="position-marker" style="display:none; top: 20px;">
        <div class="position-marker-title">📍 Active Position</div>
        <div class="position-marker-item">
          <span>Symbol:</span>
          <span id="markerSymbol">-</span>
        </div>
        <div class="position-marker-item">
          <span>Type:</span>
          <span id="markerType">-</span>
        </div>
        <div class="position-marker-item">
          <span>Qty:</span>
          <span id="markerQty">-</span>
        </div>
        <div class="position-marker-item">
          <span>Entry:</span>
          <span id="markerEntry">-</span>
        </div>
        <div class="position-marker-item">
          <span>Current:</span>
          <span id="markerCurrent">-</span>
        </div>
        <div class="position-marker-item">
          <span>P&L:</span>
          <span id="markerPnL" style="font-weight: 600;">-</span>
        </div>
      </div>
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
          <input type="checkbox" id="bracketOrder" />
          <label for="bracketOrder">🎯 Bracket Order (Auto TP/SL based on risk %)</label>
        </div>

        <div id="bracketSettings" style="display:none; margin-top: 8px; padding: 12px; background: #1E222D; border-radius: 6px;">
          <div class="form-group" style="margin-bottom: 8px;">
            <label style="font-size: 12px;">Risk/Reward Ratio</label>
            <select id="bracketRatio" style="font-size: 12px;">
              <option value="1:1">1:1 (Conservative)</option>
              <option value="1:2" selected>1:2 (Balanced)</option>
              <option value="1:3">1:3 (Aggressive)</option>
              <option value="2:3">2:3 (Custom)</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px;">Risk Amount ($)</label>
            <input type="number" id="bracketRiskAmount" step="0.01" placeholder="5.00" style="font-size: 12px;" value="5" />
          </div>
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

      <!-- Quick Actions -->
      <div class="quick-actions">
        <div class="panel-header">⚡ Quick Actions</div>
        <button type="button" class="btn btn-flip" id="flipBtn">
          🔄 FLIP Position
        </button>
        <button type="button" class="btn btn-close-all" id="closeAllBtn">
          ❌ Close All
        </button>
      </div>
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
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="positionsBody">
            <tr>
              <td colspan="9" class="empty-state">No open positions</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    // Global State
    let currentSymbol = 'DVLT';
    let tvWidget = null;
    let positions = [];
    let accountData = {
      balance: 0,
      unrealizedPnL: 0,
      realizedPnL: 0,
      totalPnL: 0
    };

    // Watchlist state
    let watchlist = [];
    try {
      const saved = localStorage.getItem('watchlist');
      if (saved) {
        watchlist = JSON.parse(saved);
      } else {
        watchlist = ["AAPL", "MSFT", "NVDA", "TSLA", "GOOGL", "AMZN", "META", "SPY", "QQQ", "DVLT"];
      }
    } catch (e) {
      console.error('Error loading watchlist:', e);
      watchlist = ["AAPL", "MSFT", "NVDA", "TSLA", "GOOGL", "AMZN", "META", "SPY", "QQQ", "DVLT"];
    }
    
    // Save watchlist to localStorage
    function saveWatchlist() {
      try {
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
      } catch (e) {
        console.error('Error saving watchlist:', e);
      }
    }

    // Add symbol to watchlist
    function addToWatchlist() {
      const symbol = prompt('Enter symbol to add:');
      if (symbol && symbol.trim()) {
        const upperSymbol = symbol.trim().toUpperCase();
        if (!watchlist.includes(upperSymbol)) {
          watchlist.push(upperSymbol);
          saveWatchlist();
          renderWatchlist();
        } else {
          alert('Symbol already in watchlist');
        }
      }
    }

    // Remove from watchlist
    function removeFromWatchlist(symbol) {
      if (confirm('Remove ' + symbol + ' from watchlist?')) {
        watchlist = watchlist.filter(function(s) {
          return s !== symbol;
        });
        saveWatchlist();
        renderWatchlist();
      }
    }

    // Filter watchlist based on search
    function filterWatchlist() {
      const search = document.getElementById('watchlistSearch').value.toUpperCase();
      const items = document.querySelectorAll('.watchlist-item');
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const symbol = item.dataset.symbol;
        if (symbol.includes(search)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      }
    }

    // Select symbol from watchlist
    function selectSymbol(symbol) {
      currentSymbol = symbol;
      document.getElementById('symbol').value = symbol;
      initChart(symbol);
      
      // Update active state
      const items = document.querySelectorAll('.watchlist-item');
      for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('active');
      }
      const activeItem = document.querySelector('[data-symbol="' + symbol + '"]');
      if (activeItem) {
        activeItem.classList.add('active');
      }
    }

    // Render watchlist
    function renderWatchlist() {
      const container = document.getElementById('watchlistItems');
      
      if (watchlist.length === 0) {
        container.innerHTML = '<div class="watchlist-empty">No symbols in watchlist.<br>Click + to add.</div>';
        return;
      }
      
      let html = '';
      for (let i = 0; i < watchlist.length; i++) {
        const symbol = watchlist[i];
        const isActive = symbol === currentSymbol ? 'active' : '';
        html += '<div class="watchlist-item ' + isActive + '" data-symbol="' + symbol + '" title="Left-click to select, Right-click to remove">';
        html += '<div class="watchlist-symbol">' + symbol + '</div>';
        html += '<div class="watchlist-price">';
        html += '<span class="price-value" id="price-' + symbol + '">--</span>';
        html += '<span class="watchlist-change" id="change-' + symbol + '">--</span>';
        html += '</div>';
        html += '</div>';
      }
      container.innerHTML = html;
      
      // Attach click handlers after rendering
      const items = container.querySelectorAll('.watchlist-item');
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const symbol = item.getAttribute('data-symbol');
        
        // Left click - select symbol
        item.addEventListener('click', function() {
          selectSymbol(symbol);
        });
        
        // Right click - remove symbol
        item.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          removeFromWatchlist(symbol);
        });
      }
    }

    // Initialize TradingView Chart
    function initChart(symbol) {
      console.log('initChart called with symbol:', symbol);
      
      const container = document.getElementById('tradingview_chart');
      if (!container) {
        console.error('Chart container not found');
        alert('Chart container not found! Please refresh the page.');
        return;
      }
      
      console.log('Container found:', container);
      
      // Remove existing widget first
      if (tvWidget) {
        try {
          tvWidget.remove();
          console.log('Existing widget removed');
        } catch (e) {
          console.warn('Error removing widget:', e);
        }
        tvWidget = null;
      }
      
      // Clear container after removing widget
      container.innerHTML = '';

      // Map common symbols to TradingView format
      let tvSymbol = symbol.toUpperCase();
      
      // Default exchange for most stocks
      if (!tvSymbol.includes(':')) {
        tvSymbol = 'NASDAQ:' + tvSymbol;
      }

      console.log('Creating TradingView widget for:', tvSymbol);

      try {
        tvWidget = new TradingView.widget({
          "width": "100%",
          "height": "100%",
          "symbol": tvSymbol,
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
        
        console.log('TradingView widget created successfully');
      } catch (error) {
        console.error('Error creating TradingView widget:', error);
        alert('Error loading chart. Please refresh the page.');
      }
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

    // Bracket Order Toggle Handler
    document.getElementById('bracketOrder').addEventListener('change', function() {
      const bracketSettings = document.getElementById('bracketSettings');
      const takeProfitInput = document.getElementById('takeProfit');
      const stopLossInput = document.getElementById('stopLoss');
      
      if (this.checked) {
        bracketSettings.style.display = 'block';
        takeProfitInput.disabled = true;
        stopLossInput.disabled = true;
        takeProfitInput.style.opacity = '0.5';
        stopLossInput.style.opacity = '0.5';
      } else {
        bracketSettings.style.display = 'none';
        takeProfitInput.disabled = false;
        stopLossInput.disabled = false;
        takeProfitInput.style.opacity = '1';
        stopLossInput.style.opacity = '1';
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

      // Add Take Profit and Stop Loss (optional or bracket)
      const bracketOrderEnabled = document.getElementById('bracketOrder').checked;
      
      if (bracketOrderEnabled) {
        // Get current market price (rough estimate - in production, fetch real-time quote)
        const bracketRatio = document.getElementById('bracketRatio').value;
        const riskAmount = parseFloat(document.getElementById('bracketRiskAmount').value) || 5;
        
        // Parse risk:reward ratio
        const [risk, reward] = bracketRatio.split(':').map(Number);
        const rewardAmount = (riskAmount / risk) * reward;
        
        // For bracket orders, we need entry price
        // Since this is a market order, we'll estimate based on current positions or last price
        // For now, let's use a placeholder - in production you'd get real-time quote
        showNotification('Info', \`Bracket order: Risk $\${riskAmount}, Reward $\${rewardAmount.toFixed(2)} (ratio \${bracketRatio})\`, 'success');
        
        // Calculate TP/SL based on action
        if (action === 'BUY') {
          // For long: SL below entry, TP above entry
          payload.stopLoss = -riskAmount; // Relative to entry
          payload.takeProfit = rewardAmount; // Relative to entry
        } else {
          // For short: SL above entry, TP below entry
          payload.stopLoss = riskAmount; // Relative to entry
          payload.takeProfit = -rewardAmount; // Relative to entry
        }
        
        payload.bracketOrder = true;
      } else {
        // Manual TP/SL
        const takeProfit = parseFloat(document.getElementById('takeProfit').value);
        const stopLoss = parseFloat(document.getElementById('stopLoss').value);
        
        if (takeProfit && takeProfit > 0) {
          payload.takeProfit = takeProfit;
        }
        
        if (stopLoss && stopLoss > 0) {
          payload.stopLoss = stopLoss;
        }
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
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No open positions</td></tr>';
        updatePositionMarker(null); // Hide marker
        return;
      }

      // Update position marker with current symbol's position
      const currentSymbolPosition = positions.find(p => p.symbol === currentSymbol);
      updatePositionMarker(currentSymbolPosition);

      tbody.innerHTML = positions.map(pos => {
        const pnl = pos.unrealizedPnL || 0;
        const pnlPercent = pos.avgPrice > 0 ? ((pos.currentPrice - pos.avgPrice) / pos.avgPrice * 100) : 0;
        const pnlClass = pnl >= 0 ? 'positive' : 'negative';
        const marketValue = pos.currentPrice * pos.quantity;
        const positionType = pos.quantity > 0 ? 'LONG' : 'SHORT';
        const absQuantity = Math.abs(pos.quantity);

        return \`
          <tr>
            <td class="symbol-cell">\${pos.symbol}</td>
            <td>\${absQuantity} \${positionType}</td>
            <td>$\${pos.avgPrice.toFixed(2)}</td>
            <td>$\${pos.currentPrice.toFixed(2)}</td>
            <td>$\${Math.abs(marketValue).toFixed(2)}</td>
            <td class="\${pnlClass}">\${pnl >= 0 ? '+' : ''}$\${pnl.toFixed(2)}</td>
            <td class="\${pnlClass}">\${pnl >= 0 ? '+' : ''}\${pnlPercent.toFixed(2)}%</td>
            <td><span class="status-badge status-open">OPEN</span></td>
            <td>
              <button class="action-btn close-btn" onclick="closePosition('\${pos.symbol}', \${pos.quantity})" title="Close Position">
                ✕
              </button>
              <button class="action-btn flip-btn" onclick="flipPosition('\${pos.symbol}', \${pos.quantity})" title="Flip Position">
                🔄
              </button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    // Update Position Marker Overlay
    function updatePositionMarker(position) {
      const marker = document.getElementById('positionMarker');
      
      if (!position) {
        marker.style.display = 'none';
        return;
      }

      const pnl = position.unrealizedPnL || 0;
      const pnlPercent = position.avgPrice > 0 ? 
        ((position.currentPrice - position.avgPrice) / position.avgPrice * 100) : 0;
      const positionType = position.quantity > 0 ? 'LONG' : 'SHORT';
      const absQuantity = Math.abs(position.quantity);

      // Update marker content
      document.getElementById('markerSymbol').textContent = position.symbol;
      document.getElementById('markerType').textContent = positionType;
      document.getElementById('markerQty').textContent = absQuantity;
      document.getElementById('markerEntry').textContent = '$' + position.avgPrice.toFixed(2);
      document.getElementById('markerCurrent').textContent = '$' + position.currentPrice.toFixed(2);
      
      const pnlElement = document.getElementById('markerPnL');
      pnlElement.textContent = (pnl >= 0 ? '+' : '') + '$' + pnl.toFixed(2) + 
        ' (' + (pnlPercent >= 0 ? '+' : '') + pnlPercent.toFixed(2) + '%)';
      pnlElement.style.color = pnl >= 0 ? '#089981' : '#F23645';

      // Update marker border color
      marker.className = 'position-marker ' + 
        (positionType === 'LONG' ? 'position-marker-long' : 'position-marker-short');
      marker.style.display = 'block';
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

    // Close Position Function
    async function closePosition(symbol, currentQty) {
      if (!confirm('Close position for ' + symbol + '?')) {
        return;
      }

      try {
        const action = currentQty > 0 ? 'EXIT' : 'ENTRY_LONG';
        const qty = Math.abs(currentQty);

        const response = await fetch('/webhook/tradingview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategy: 'manual_bmnr',
            action: action,
            symbol: symbol,
            qty: qty,
            orderType: 'MKT',
            outsideRth: true
          })
        });

        const result = await response.json();

        if (response.ok && result.status === 'ok') {
          showNotification('Position Closed', symbol + ' position closed', 'success');
          setTimeout(() => { fetchPositions(); fetchAccountSummary(); }, 1000);
        } else {
          showNotification('Error', result.error || 'Failed to close position', 'error');
        }
      } catch (error) {
        showNotification('Error', 'Network error: ' + error.message, 'error');
      }
    }

    // Flip Position Function
    async function flipPosition(symbol, currentQty) {
      if (!confirm('FLIP position for ' + symbol + '? This will close current and open opposite.')) {
        return;
      }

      try {
        const absQty = Math.abs(currentQty);
        const closeAction = currentQty > 0 ? 'EXIT' : 'ENTRY_LONG';
        
        const closeResponse = await fetch('/webhook/tradingview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategy: 'manual_bmnr',
            action: closeAction,
            symbol: symbol,
            qty: absQty,
            orderType: 'MKT',
            outsideRth: true
          })
        });

        const closeResult = await closeResponse.json();

        if (!closeResponse.ok || closeResult.status !== 'ok') {
          showNotification('Error', 'Failed to close: ' + (closeResult.error || 'Unknown'), 'error');
          return;
        }

        setTimeout(async () => {
          const oppositeAction = currentQty > 0 ? 'EXIT' : 'ENTRY_LONG';

          const openResponse = await fetch('/webhook/tradingview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              strategy: 'manual_bmnr',
              action: oppositeAction,
              symbol: symbol,
              qty: absQty,
              orderType: 'MKT',
              outsideRth: true
            })
          });

          const openResult = await openResponse.json();

          if (openResponse.ok && openResult.status === 'ok') {
            showNotification('Flipped!', symbol + ' position flipped successfully!', 'success');
            setTimeout(() => { fetchPositions(); fetchAccountSummary(); }, 1000);
          } else {
            showNotification('Warning', 'Closed but failed to open opposite', 'error');
            setTimeout(() => { fetchPositions(); fetchAccountSummary(); }, 1000);
          }
        }, 500);

      } catch (error) {
        showNotification('Error', 'Network error: ' + error.message, 'error');
      }
    }

    // Close All Positions
    async function closeAllPositions() {
      if (positions.length === 0) {
        showNotification('Info', 'No open positions to close', 'error');
        return;
      }

      if (!confirm('Close ALL ' + positions.length + ' positions? Cannot be undone!')) {
        return;
      }

      showNotification('Processing', 'Closing all positions...', 'success');

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        try {
          const action = pos.quantity > 0 ? 'EXIT' : 'ENTRY_LONG';
          const qty = Math.abs(pos.quantity);

          const response = await fetch('/webhook/tradingview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              strategy: 'manual_bmnr',
              action: action,
              symbol: pos.symbol,
              qty: qty,
              orderType: 'MKT',
              outsideRth: true
            })
          });

          const result = await response.json();

          if (response.ok && result.status === 'ok') {
            successCount++;
          } else {
            failCount++;
          }

          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          failCount++;
        }
      }

      showNotification(
        'Complete',
        'Closed ' + successCount + ' positions. ' + (failCount > 0 ? failCount + ' failed.' : ''),
        failCount > 0 ? 'error' : 'success'
      );

      setTimeout(() => { fetchPositions(); fetchAccountSummary(); }, 1500);
    }

    // Flip Current Symbol (from main panel)
    async function flipCurrentSymbol() {
      const symbol = document.getElementById('symbol').value.toUpperCase().trim();
      
      if (!symbol) {
        showNotification('Error', 'Please enter a symbol', 'error');
        return;
      }

      const position = positions.find(p => p.symbol === symbol);
      
      if (!position) {
        showNotification('Error', 'No open position for ' + symbol, 'error');
        return;
      }

      await flipPosition(symbol, position.quantity);
    }

    // Refresh Button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      fetchPositions();
      fetchAccountSummary();
    });

    // Flip Button
    document.getElementById('flipBtn').addEventListener('click', flipCurrentSymbol);

    // Close All Button
    document.getElementById('closeAllBtn').addEventListener('click', closeAllPositions);

    // Auto-refresh every 10 seconds
    setInterval(() => {
      fetchPositions();
      fetchAccountSummary();
    }, 10000);

    // Initialize on page load - wait for TradingView library
    console.log('Page loaded, checking for TradingView library...');
    
    // Attach watchlist button and search handlers
    document.getElementById('addWatchlistBtn').addEventListener('click', addToWatchlist);
    document.getElementById('watchlistSearch').addEventListener('keyup', filterWatchlist);
    
    if (typeof TradingView !== 'undefined') {
      console.log('TradingView library found immediately');
      renderWatchlist();
      initChart(currentSymbol);
    } else {
      console.log('Waiting for TradingView library to load...');
      // Wait for TradingView library to load
      const checkTradingView = setInterval(() => {
        if (typeof TradingView !== 'undefined') {
          console.log('TradingView library loaded!');
          clearInterval(checkTradingView);
          renderWatchlist();
          initChart(currentSymbol);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (typeof TradingView === 'undefined') {
          console.error('TradingView library failed to load after 10 seconds');
          alert('Chart library failed to load. Please check your internet connection and refresh.');
        }
      }, 10000);
    }
    
    fetchPositions();
    fetchAccountSummary();
  </script>
</body>
</html>
  `);
});

export default router;
