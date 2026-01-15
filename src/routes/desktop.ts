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
  <!-- TradingView Advanced Charts Widget -->
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  <!-- Lightweight Charts Library v4.1.0 -->
  <script src="https://unpkg.com/lightweight-charts@4.1.0/dist/lightweight-charts.standalone.production.js"></script>
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

    /* Chart Area (Top Middle) */
    .chart-section {
      background: #131722;
      position: relative;
      grid-row: 1 / 2;
      grid-column: 2 / 3;
      display: flex;
      flex-direction: column;
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

    /* Combined Panel - Now positioned at bottom, full width */
    .combined-panel {
      grid-column: 2 / 4;
      grid-row: 2 / 3;
      background: #1E222D;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
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

    .watchlist-detail {
      font-size: 10px;
      color: #787B86;
      margin-top: 4px;
      display: flex;
      justify-content: space-between;
    }

    .watchlist-bid-ask {
      display: flex;
      gap: 8px;
    }

    .bid-price {
      color: #26A69A;
    }

    .ask-price {
      color: #EF5350;
    }

    .price-value {
      color: #fff;
      font-weight: 500;
    }

    .watchlist-empty {
      text-align: center;
      color: #787B86;
      font-size: 13px;
      padding: 20px;
    }

    /* Chart Area (Top Middle) - removed, now defined in main container */
    
    /* Chart Tabs */
    .chart-tabs {
      display: flex;
      background: #1E222D;
      border-bottom: 1px solid #2A2E39;
      padding: 0 10px;
      gap: 5px;
      flex-shrink: 0;
    }
    
    .chart-tab {
      padding: 10px 20px;
      background: transparent;
      border: none;
      color: #787B86;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    
    .chart-tab:hover {
      color: #D1D4DC;
      background: rgba(41, 98, 255, 0.1);
    }
    
    .chart-tab.active {
      color: #2962FF;
      border-bottom-color: #2962FF;
    }
    
    /* Order Filter Tabs */
    .order-filter-tabs {
      display: flex;
      background: #1E222D;
      border-bottom: 1px solid #2A2E39;
      padding: 5px 10px;
      gap: 5px;
      flex-wrap: wrap;
    }
    
    /* Combined Panel Tabs (Positions / Pending Orders) */
    .combined-panel-tabs {
      display: flex;
      background: #1E222D;
      border-bottom: 2px solid #2A2E39;
      padding: 0;
      flex-shrink: 0;
    }
    
    .combined-tab {
      flex: 1;
      padding: 14px 20px;
      background: transparent;
      border: none;
      color: #787B86;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
      text-align: center;
    }
    
    .combined-tab:hover {
      color: #D1D4DC;
      background: rgba(41, 98, 255, 0.05);
    }
    
    .combined-tab.active {
      color: #2962FF;
      border-bottom-color: #2962FF;
      background: rgba(41, 98, 255, 0.08);
    }
    
    .combined-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .combined-content-item {
      display: none;
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
    
    .combined-content-item.active {
      display: flex;
      flex-direction: column;
    }
    
    .order-tab {
      padding: 8px 16px;
      background: transparent;
      border: none;
      color: #787B86;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
    }
    
    .order-tab:hover {
      color: #D1D4DC;
      background: rgba(41, 98, 255, 0.1);
    }
    
    .order-tab.active {
      color: #2962FF;
      background: rgba(41, 98, 255, 0.15);
    }
    
    /* Chart Containers */
    .chart-container {
      flex: 1;
      position: relative;
      display: none;
    }
    
    .chart-container.active {
      display: block;
    }

    #tradingview_chart {
      width: 100%;
      height: 100%;
    }
    
    #lightweight_chart {
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

    /* Pending Orders Section */
    .pending-orders-section {
      grid-column: 1 / 4;
      background: #1E222D;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }

    .pending-orders-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .pending-orders-title {
      font-size: 16px;
      font-weight: 600;
      color: #D1D4DC;
    }

    #pendingOrdersContainer {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    }

    #positionsTableContainer {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    }

    /* Scrollbar styling for pending orders */
    #pendingOrdersContainer::-webkit-scrollbar {
      width: 8px;
    }

    #pendingOrdersContainer::-webkit-scrollbar-track {
      background: #131722;
      border-radius: 4px;
    }

    #pendingOrdersContainer::-webkit-scrollbar-thumb {
      background: #2A2E39;
      border-radius: 4px;
    }

    #pendingOrdersContainer::-webkit-scrollbar-thumb:hover {
      background: #363A45;
    }

    #pendingOrdersTable {
      width: 100%;
      border-collapse: collapse;
    }

    #pendingOrdersTable th {
      background: #131722;
      padding: 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: #787B86;
      border-bottom: 1px solid #2A2E39;
    }

    #pendingOrdersTable td {
      padding: 12px;
      border-bottom: 1px solid #2A2E39;
      font-size: 13px;
      color: #D1D4DC;
    }

    #pendingOrdersTable tr:hover {
      background: rgba(42, 46, 57, 0.3);
    }

    .order-trigger {
      color: #FF9800;
      font-weight: 600;
    }

    .order-side-buy {
      color: #089981;
      font-weight: 600;
    }

    .order-side-sell {
      color: #F23645;
      font-weight: 600;
    }

    .order-status-pending {
      color: #FF9800;
      font-size: 11px;
      text-transform: uppercase;
    }

    /* Position Markers on Chart */
    .position-marker {
      position: absolute;
      left: 20px;
      top: 80px;
      background: rgba(26, 26, 26, 0.95);
      border: 1px solid #2A2E39;
      border-radius: 6px;
      padding: 12px;
      font-size: 12px;
      color: #D1D4DC;
      z-index: 1000;
      min-width: 200px;
      backdrop-filter: blur(10px);
      cursor: move;
      user-select: none;
    }
    
    .position-marker:active {
      cursor: grabbing;
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
      <!-- Chart Tabs -->
      <div class="chart-tabs">
        <button class="chart-tab active" id="lwcTab" onclick="switchChart('lightweight')">
          📊 Lightweight (With Lines)
        </button>
        <button class="chart-tab" id="tvTab" onclick="switchChart('tradingview')">
          📈 TradingView (Full Features)
        </button>
      </div>
      
      <!-- Lightweight Chart Container -->
      <div id="lightweight_chart_container" class="chart-container active">
        <div id="lightweight_chart"></div>
      </div>
      
      <!-- TradingView Chart Container -->
      <div id="tradingview_chart_container" class="chart-container">
      <div id="tradingview_chart"></div>
      </div>
      
      <!-- Position Marker Overlay -->
      <div id="positionMarker" class="position-marker" style="display:none;">
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
          <label>
            Broker 
            <span id="brokerStatus" style="font-size: 0.85em; opacity: 0.7;">⏳ Checking...</span>
            <button type="button" id="syncOrdersBtn" style="font-size: 0.75em; margin-left: 8px; padding: 2px 8px; background: #4CAF50; border: none; border-radius: 3px; color: white; cursor: pointer; display: none;" title="Sync orders from TWS">🔄 Sync</button>
          </label>
          <select id="broker">
            <option value="demo">🎮 DEMO MODE (No Real Money)</option>
            <option value="ibkr">🏦 Interactive Brokers</option>
            <option value="lightspeed">⚡ Lightspeed (Faster, Lower Fees)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Ticker Symbol</label>
          <input type="text" id="symbol" placeholder="AAPL" required />
        </div>

        <!-- 🚀 ONE-CLICK TRADING MODE -->
        <div class="trading-mode-toggle" style="margin-bottom: 16px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" id="oneClickMode" />
            <span style="font-size: 13px; font-weight: 600;">⚡ One-Click Trading (Draggable Lines)</span>
          </label>
          <small style="color: #787B86; font-size: 11px; display: block; margin-top: 4px;">
            Enable to trade with draggable Stop Loss & Take Profit lines
          </small>
        </div>

        <!-- Market Hours Indicator -->
        <div id="marketHoursIndicator" style="padding: 8px; background: rgba(76, 175, 80, 0.1); border-left: 3px solid #4CAF50; border-radius: 4px; margin-bottom: 12px; display: none;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span id="marketStatusIcon">🟢</span>
            <span id="marketStatusText" style="font-size: 12px; color: #4CAF50; font-weight: 500;">Market Open</span>
          </div>
          <small id="marketStatusDetail" style="color: #787B86; font-size: 10px; display: block; margin-top: 4px;">
            Regular trading hours - Using market/stop orders
          </small>
        </div>

        <div class="form-group">
          <label>Quantity (Shares)</label>
          <input type="number" id="quantity" placeholder="10" min="1" value="10" required />
        </div>

        <!-- Advanced Order Panel (Hidden in One-Click Mode) -->
        <div id="advancedOrderPanel">
        <div class="form-group">
          <label>Order Type</label>
          <select id="orderType">
            <option value="MKT">Market Order</option>
            <option value="LMT">Limit Order</option>
            <option value="STP">Stop Market</option>
              <option value="STP_LMT">Stop-Limit Order</option>
            <option value="TRAIL">Trailing Stop</option>
          </select>
        </div>

        <div class="form-group" id="limitPriceGroup" style="display:none;">
          <label>Limit Price</label>
          <input type="number" id="limitPrice" step="0.01" placeholder="150.00" />
            
            <!-- 🎯 Auto-Margin for Stop-Limit Orders -->
            <div id="autoMarginContainer" style="display:none; margin-top: 8px; padding: 8px; background: rgba(41, 98, 255, 0.05); border-radius: 4px;">
              <div class="checkbox-group" style="margin: 0 0 8px 0;">
                <input type="checkbox" id="autoMargin" checked />
                <label for="autoMargin" style="font-size: 12px;">🎯 Auto-calculate with margin</label>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 11px; color: #787B86; margin: 0;">Margin:</label>
                <input type="number" id="marginPercent" value="0.3" step="0.1" min="0.1" max="5" style="width: 60px; padding: 4px 8px; font-size: 12px;" />
                <span style="font-size: 11px; color: #787B86;">%</span>
                <small style="color: #787B86; font-size: 10px; flex: 1;">
                  (Adds buffer to stop price)
                </small>
              </div>
            </div>
        </div>

        <div class="form-group" id="stopPriceGroup" style="display:none;">
          <label>🎯 Stop Price (Trigger)</label>
          <input type="number" id="stopPrice" step="0.01" placeholder="150.00" />
          <small style="color: #787B86; font-size: 11px; display: block; margin-top: 4px;">
            Order triggers when price reaches this level
          </small>
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
        </div>

        <!-- P&L Display for One-Click Trading -->
        <div id="oneClickPnLDisplay" style="display: none; padding: 12px; background: #1E222D; border-radius: 6px; margin-bottom: 12px;">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #2196F3; font-size: 11px; font-weight: 500;">💵 ENTRY</span>
              <span id="pnlEntryPrice" style="color: #2196F3; font-size: 13px; font-weight: 600;">$0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #F44336; font-size: 11px; font-weight: 500;">🛑 MAX LOSS</span>
              <span id="pnlMaxLoss" style="color: #F44336; font-size: 13px; font-weight: 600;">$0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #4CAF50; font-size: 11px; font-weight: 500;">🎯 TARGET</span>
              <span id="pnlTarget" style="color: #4CAF50; font-size: 13px; font-weight: 600;">$0.00</span>
            </div>
            <div style="height: 1px; background: #2A2E39; margin: 4px 0;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #787B86; font-size: 11px; font-weight: 500;">📊 RISK/REWARD</span>
              <span id="pnlRiskReward" style="color: #FFA726; font-size: 13px; font-weight: 600;">1:0.0</span>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button type="button" class="btn btn-buy" id="buyBtn">🟢 Buy</button>
          <button type="button" class="btn btn-sell" id="sellBtn">🔴 Sell</button>
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

    <!-- Combined Panel (Positions + Pending Orders) -->
    <div class="combined-panel">
      <!-- Tab Buttons -->
      <div class="combined-panel-tabs">
        <button class="combined-tab active" onclick="switchCombinedTab('positions')">
          💼 Open Positions
        </button>
        <button class="combined-tab" onclick="switchCombinedTab('orders')">
          ⏱️ Pending Orders
        </button>
      </div>
      
      <!-- Combined Content -->
      <div class="combined-content">
        <!-- Positions Tab Content -->
        <div class="combined-content-item active" id="positions-content">
      <div class="positions-header">
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

          <div id="positionsTableContainer" style="flex: 1; overflow-y: auto;">
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

        <!-- Pending Orders Tab Content -->
        <div class="combined-content-item" id="orders-content">
          <div class="pending-orders-header" style="margin-bottom: 0;">
        <button class="refresh-btn" id="refreshOrdersBtn" title="Refresh Orders">↻</button>
      </div>
          
          <!-- Order Type Filter Tabs -->
          <div class="order-filter-tabs">
            <button class="order-tab active" data-filter="ALL" onclick="filterOrdersByType('ALL')">
              📋 All
            </button>
            <button class="order-tab" data-filter="MKT" onclick="filterOrdersByType('MKT')">
              🎯 Market
            </button>
            <button class="order-tab" data-filter="LMT" onclick="filterOrdersByType('LMT')">
              📊 Limit
            </button>
            <button class="order-tab" data-filter="STP" onclick="filterOrdersByType('STP')">
              🛑 Stop
            </button>
            <button class="order-tab" data-filter="STP_LMT" onclick="filterOrdersByType('STP_LMT')">
              🎯📊 Stop-Limit
            </button>
            <button class="order-tab" data-filter="TRAIL" onclick="filterOrdersByType('TRAIL')">
              📉 Trailing
            </button>
      </div>
      
      <div id="pendingOrdersContainer">
        <table id="pendingOrdersTable">
          <thead>
            <tr>
              <th>SYMBOL</th>
              <th>TYPE</th>
              <th>TRIGGER PRICE</th>
              <th>QUANTITY</th>
              <th>SIDE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="pendingOrdersBody">
            <tr>
              <td colspan="7" class="empty-state">No pending stop orders</td>
            </tr>
          </tbody>
        </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Global State
    let currentSymbol = 'AAPL';
    let currentChartType = 'lightweight'; // 'lightweight' or 'tradingview'
    let currentOrderFilter = 'ALL'; // Filter for pending orders: 'ALL', 'MKT', 'LMT', 'STP', 'TRAIL'
    let currentCombinedTab = 'positions'; // 'positions' or 'orders'
    let tvWidget = null; // TradingView widget instance
    let lwChart = null; // Lightweight Charts instance
    let lwCandleSeries = null; // Lightweight Charts candlestick series
    let orderLines = {}; // Track drawn order lines {orderId: priceLine}
    let positionLines = {}; // Track position entry lines {symbol: priceLine}
    let tpLine = null; // Take Profit line
    let slLine = null; // Stop Loss line
    let isDraggingLine = false; // Track if user is dragging a line
    let draggedLine = null; // Which line is being dragged ('tp' or 'sl')
    let positions = [];
    let pendingOrders = []; // Track pending stop orders
    let accountData = {
      balance: 0,
      unrealizedPnL: 0,
      realizedPnL: 0,
      totalPnL: 0
    };

    // 🚀 ONE-CLICK TRADING STATE
    let oneClickMode = false;
    let protectionLines = {
      entry: null,
      stopLoss: null,
      takeProfit: null
    };
    let activePosition = null; // Track active position for protection lines
    let isDraggingStop = false;
    let isDraggingTarget = false;
    let dragStartY = 0;
    let dragStartPrice = 0;

    // Switch Combined Panel Tab (Positions / Pending Orders)
    function switchCombinedTab(tab) {
      currentCombinedTab = tab;
      
      // Update tab buttons
      document.querySelectorAll('.combined-tab').forEach(btn => {
        btn.classList.remove('active');
      });
      event.target.classList.add('active');
      
      // Update content panels
      document.querySelectorAll('.combined-content-item').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tab + '-content').classList.add('active');
    }
    let currentSymbolData = {
      symbol: 'AAPL',
      lastPrice: 0
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
      
      // Auto-select Stop Market for watchlist picks (your workflow)
      const orderTypeSelect = document.getElementById('orderType');
      if (orderTypeSelect.value === 'MKT') {
        // Only change to stop if currently on market order
        orderTypeSelect.value = 'STP';
        // Trigger change event to show stop price field
        const event = new Event('change');
        orderTypeSelect.dispatchEvent(event);
      }
      
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
      
      // Show notification hint
      showNotification('Info', 'Symbol selected: ' + symbol + ' - Ready for stop order', 'success');
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
        html += '<div class="watchlist-detail">';
        html += '<span class="watchlist-bid-ask">';
        html += '<span title="Day Low">L: <span class="bid-price" id="low-' + symbol + '">--</span></span>';
        html += '<span title="Day High">H: <span class="ask-price" id="high-' + symbol + '">--</span></span>';
        html += '</span>';
        html += '<span id="volume-' + symbol + '" title="Volume">--</span>';
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
      
      // Fetch real prices for all symbols
      updateWatchlistPrices();
    }
    
    // Update watchlist with real prices
    async function updateWatchlistPrices() {
      for (const symbol of watchlist) {
        try {
          // Use Yahoo Finance only (no TWS to avoid 404 errors)
          const cleanSymbol = symbol.split(':')[0]; // Remove any :1 suffix
          const response = await fetch(\`/api/market/quote/\${cleanSymbol}\`);
          const result = await response.json();
          
          if (result.success && result.data) {
            const priceEl = document.getElementById('price-' + symbol);
            const changeEl = document.getElementById('change-' + symbol);
            const lowEl = document.getElementById('low-' + symbol);
            const highEl = document.getElementById('high-' + symbol);
            const volumeEl = document.getElementById('volume-' + symbol);
            
            if (priceEl) {
              priceEl.textContent = '$' + result.data.price.toFixed(2);
            }
            
            if (changeEl) {
              const changePercent = result.data.changePercent.toFixed(2);
              const changeClass = result.data.change >= 0 ? 'positive' : 'negative';
              changeEl.textContent = (result.data.change >= 0 ? '+' : '') + changePercent + '%';
              changeEl.className = 'watchlist-change ' + changeClass;
            }
            
            if (lowEl && result.data.low) {
              lowEl.textContent = '$' + result.data.low.toFixed(2);
            }
            
            if (highEl && result.data.high) {
              highEl.textContent = '$' + result.data.high.toFixed(2);
            }
            
            if (volumeEl && result.data.volume) {
              const vol = result.data.volume;
              const volStr = vol >= 1000000 ? (vol / 1000000).toFixed(1) + 'M' : 
                           vol >= 1000 ? (vol / 1000).toFixed(1) + 'K' : 
                           vol.toString();
              volumeEl.textContent = volStr;
            }
          }
        } catch (error) {
          console.error('Error fetching price for', symbol, error);
        }
      }
    }

    // Switch between Lightweight and TradingView charts
    function switchChart(chartType) {
      console.log('Switching to', chartType, 'chart');
      currentChartType = chartType;
      
      // Update tab styles
      if (chartType === 'lightweight') {
        document.getElementById('lwcTab').classList.add('active');
        document.getElementById('tvTab').classList.remove('active');
        document.getElementById('lightweight_chart_container').classList.add('active');
        document.getElementById('tradingview_chart_container').classList.remove('active');
        
        // Initialize lightweight chart if not already
        if (!lwChart) {
          initLightweightChart(currentSymbol);
        } else {
          // Redraw lines on existing chart
          redrawLightweightLines();
        }
      } else {
        document.getElementById('lwcTab').classList.remove('active');
        document.getElementById('tvTab').classList.add('active');
        document.getElementById('lightweight_chart_container').classList.remove('active');
        document.getElementById('tradingview_chart_container').classList.add('active');
        
        // Initialize TradingView chart if not already
        if (!tvWidget) {
          initTradingViewChart(currentSymbol);
      }
      }
    }

    // Initialize Lightweight Chart (with lines support)
    function initLightweightChart(symbol) {
      console.log('Initializing Lightweight Chart for:', symbol);
      currentSymbolData.symbol = symbol;
      
      // Remove existing chart if any
      if (lwChart) {
        try {
          lwChart.remove();
        } catch (e) {
          console.warn('Error removing LW chart:', e);
        }
        lwChart = null;
        lwCandleSeries = null;
      }
      
      // Clear old line references
        orderLines = {};
        positionLines = {};
      
      // Create new chart
      const container = document.getElementById('lightweight_chart');
      container.innerHTML = ''; // Clear container
      
      // Check if LightweightCharts is available
      if (typeof LightweightCharts === 'undefined') {
        console.error('LightweightCharts library not loaded!');
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#D1D4DC;">LightweightCharts library failed to load. Please refresh the page.</div>';
        return;
      }
      
      try {
        lwChart = LightweightCharts.createChart(container, {
          width: container.clientWidth,
          height: container.clientHeight,
          layout: {
            background: { color: '#131722' },
            textColor: '#D1D4DC',
          },
          grid: {
            vertLines: { color: '#1E222D' },
            horzLines: { color: '#1E222D' },
          },
          crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            // Format the time to show in local timezone
            rightOffset: 12,
            barSpacing: 3,
            fixLeftEdge: false,
            fixRightEdge: false,
            lockVisibleTimeRangeOnResize: true,
            borderColor: '#2B2B43',
          },
          localization: {
            // Use browser's local timezone
            timeFormatter: (timestamp) => {
              const date = new Date(timestamp * 1000);
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              return \`\${hours}:\${minutes}\`;
            },
          },
        });

        console.log('Lightweight chart created:', lwChart);
        console.log('Chart type:', typeof lwChart);
        console.log('Has addCandlestickSeries?', typeof lwChart.addCandlestickSeries);
        
        // Check if method exists before calling
        if (typeof lwChart.addCandlestickSeries !== 'function') {
          throw new Error('LightweightCharts API mismatch - addCandlestickSeries not found. Chart object: ' + Object.keys(lwChart).join(', '));
        }
        
        // Add candlestick series
        lwCandleSeries = lwChart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderUpColor: '#26a69a',
          borderDownColor: '#ef5350',
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });

        console.log('Candlestick series created:', lwCandleSeries);
      } catch (error) {
        console.error('Error creating Lightweight Chart:', error);
        console.error('Error details:', error.message);
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#D1D4DC;flex-direction:column;"><div>Error creating chart</div><div style="font-size:12px;color:#787B86;margin-top:8px;">' + error.message + '</div></div>';
        return;
      }
      
      // Auto-resize chart
      const resizeObserver = new ResizeObserver(entries => {
        if (lwChart) {
          const { width, height } = entries[0].contentRect;
          lwChart.applyOptions({ width, height });
        }
      });
      resizeObserver.observe(container);
      
      // Load real market data
      loadMarketDataForLightweightChart(symbol);
      
      // Fetch current price and draw lines
      fetchCurrentPrice(symbol);
      
      // Redraw order/position lines after chart is ready
      setTimeout(() => {
        redrawLightweightLines();
        setupDraggableLines(); // 🖱️ Enable draggable TP/SL lines
      }, 500);

      console.log('Lightweight Chart initialized successfully');
    }
    
    // Load real market data for Lightweight Chart
    async function loadMarketDataForLightweightChart(symbol) {
      if (!lwCandleSeries) {
        console.warn('Cannot load market data - candlestick series not initialized');
        return;
      }
      
      try {
        console.log('Fetching real market data for:', symbol);
        // Fetch 5 days of data with 5-minute intervals to match TradingView
        const response = await fetch(\`/api/market/chart/\${symbol}?interval=5m&range=5d\`);
        const result = await response.json();
        
        if (!result.success || !result.data || !result.data.chartData) {
          console.error('Failed to fetch market data:', result.error);
          // Fallback to sample data
          const sampleData = generateSampleData();
          lwCandleSeries.setData(sampleData);
          return;
        }
        
        const chartData = result.data.chartData;
        console.log('Loaded', chartData.length, 'candles from', result.data.dataSource || 'market data');
        console.log('Current price:', result.data.currentPrice, '| Last update:', result.data.lastUpdate);
        console.log('Date range:', new Date(chartData[0]?.time * 1000).toLocaleString(), 'to', new Date(chartData[chartData.length - 1]?.time * 1000).toLocaleString());
        
        // Update the chart with real data
        lwCandleSeries.setData(chartData);
        
        // Update current price in the UI
        if (result.data.currentPrice) {
          currentSymbolData.currentPrice = result.data.currentPrice;
          updatePositionMarker();
        }
      } catch (error) {
        console.error('Error loading market data:', error);
        // Fallback to sample data on error
        const sampleData = generateSampleData();
        lwCandleSeries.setData(sampleData);
      }
    }

    // Initialize TradingView Advanced Chart
    function initTradingViewChart(symbol) {
      console.log('Initializing TradingView Chart for:', symbol);
      
      currentSymbolData.symbol = symbol;
      
      // Remove existing widget first
      if (tvWidget) {
        try {
          tvWidget.remove();
          console.log('Existing TradingView widget removed');
        } catch (e) {
          console.warn('Error removing TV widget:', e);
        }
        tvWidget = null;
      }

      console.log('Creating TradingView Advanced Chart for:', symbol);

      try {
        // Create TradingView Advanced Charts widget
        tvWidget = new TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: '5',
          timezone: 'America/New_York',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#131722',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: 'tradingview_chart',
          
          // Enable all features
          enabled_features: [
            'header_widget',
            'left_toolbar',
            'control_bar',
            'timeframes_toolbar',
            'drawing_templates',
            'use_localstorage_for_settings',
            'save_chart_properties_to_local_storage'
          ],
          
          disabled_features: [
            'use_localstorage_for_settings',
            'header_symbol_search',
            'header_compare'
          ],
          
          // Customize appearance
          overrides: {
            'paneProperties.background': '#131722',
            'paneProperties.backgroundType': 'solid',
            'scalesProperties.textColor': '#D1D4DC',
            'scalesProperties.backgroundColor': '#131722',
            'mainSeriesProperties.candleStyle.upColor': '#26a69a',
            'mainSeriesProperties.candleStyle.downColor': '#ef5350',
            'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
            'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350',
          },
          
          studies_overrides: {},
          
          loading_screen: {
            backgroundColor: '#131722',
            foregroundColor: '#2962FF'
          },
          
          favorites: {
            intervals: ['1', '5', '15', '60', '240', 'D', 'W'],
            chartTypes: ['Area', 'Candles', 'Line']
          },
          
          // Add onChartReady callback during initialization
          onChartReady: () => {
            console.log('TradingView widget ready');
            fetchCurrentPrice(symbol);
          }
        });

        console.log('TradingView widget created successfully');
      } catch (error) {
        console.error('Error creating TradingView chart:', error);
        alert('Error loading TradingView chart. Please refresh the page.');
      }
    }

    // Main initChart function - delegates to appropriate chart type
    function initChart(symbol) {
      console.log('initChart called with symbol:', symbol, '| Chart type:', currentChartType);
      currentSymbolData.symbol = symbol;
      
      if (currentChartType === 'lightweight') {
        initLightweightChart(symbol);
      } else {
        initTradingViewChart(symbol);
      }
    }
    
    // Redraw all lines on Lightweight Chart
    function redrawLightweightLines() {
      if (!lwChart || !lwCandleSeries) {
        console.log('No Lightweight Chart to draw lines on');
        return;
      }
      
      console.log('Redrawing lines on Lightweight Chart...');
      console.log('Total orders:', pendingOrders.length);
      console.log('Total positions:', positions.length);

      // Clear old price lines
      for (let orderId in orderLines) {
        try {
          lwCandleSeries.removePriceLine(orderLines[orderId]);
        } catch (e) {
          console.warn('Error removing order line:', e);
        }
      }
      for (let symbol in positionLines) {
        try {
          lwCandleSeries.removePriceLine(positionLines[symbol]);
        } catch (e) {
          console.warn('Error removing position line:', e);
        }
      }
      orderLines = {};
      positionLines = {};

      // Draw position lines
      for (const position of positions) {
        if (position.symbol === currentSymbolData.symbol) {
          const color = position.quantity > 0 ? '#26a69a' : '#ef5350';
          const side = position.quantity > 0 ? 'LONG' : 'SHORT';
          const entryPrice = position.avgEntryPrice || position.avgPrice || 0;
          
          if (entryPrice > 0) {
            const line = lwCandleSeries.createPriceLine({
              price: entryPrice,
              color: color,
              lineWidth: 2,
              lineStyle: LightweightCharts.LineStyle.Solid,
              axisLabelVisible: true,
              title: Math.abs(position.quantity) + ' ' + side + ' @ $' + entryPrice.toFixed(2),
            });
            positionLines[position.symbol] = line;
            console.log('✅ Drew position line at $' + entryPrice.toFixed(2));
          }
        }
      }

      // Draw pending order lines (ONLY for current symbol on chart)
      for (const order of pendingOrders) {
        // ✅ Fixed: Only draw lines for the symbol currently displayed on chart
        if (order.symbol === currentSymbolData.symbol && order.status !== 'Filled' && order.status !== 'Cancelled') {
          const price = order.stopPrice || order.limitPrice || 0;
          if (!price || price <= 0) continue;
          
          const color = order.action === 'BUY' ? '#26a69a' : '#ef5350';
          let orderTypeLabel = 'ORDER';
          
          // Determine label based on order type
      if (order.orderType === 'STP') {
            orderTypeLabel = 'STOP';
      } else if (order.orderType === 'LMT') {
            orderTypeLabel = 'LIMIT';
          } else if (order.orderType === 'STP_LMT') {
            // 🎯 Stop-Limit: Show both prices
            orderTypeLabel = 'STP-LMT ' + order.stopPrice + '→' + order.limitPrice;
          } else if (order.orderType === 'TRAIL') {
            orderTypeLabel = 'TRAIL';
          }
          
          const line = lwCandleSeries.createPriceLine({
        price: price,
        color: color,
            lineWidth: 1,
            lineStyle: LightweightCharts.LineStyle.Dashed,
            axisLabelVisible: true,
            title: order.action + ' ' + orderTypeLabel + ' @ $' + price.toFixed(2),
          });
          orderLines[order.orderId] = line;
          console.log(\`✅ Drew \${orderTypeLabel} order line for \${order.symbol} at $\${price.toFixed(2)}\`);
        } else if (order.symbol !== currentSymbolData.symbol) {
          console.log(\`ℹ️  Skipping \${order.symbol} order line (not on current chart: \${currentSymbolData.symbol})\`);
        }
      }
    }
    
    // 🎯 Create/Update Take Profit Line
    function updateTPLine(price) {
      if (!lwChart || !lwCandleSeries || !price || price <= 0) {
        return;
      }
      
      // Remove old TP line
      if (tpLine) {
        try {
          lwCandleSeries.removePriceLine(tpLine);
        } catch (e) {
          console.warn('Error removing TP line:', e);
        }
      }
      
      // Create new TP line (GREEN)
      tpLine = lwCandleSeries.createPriceLine({
        price: price,
        color: '#26A69A', // Green
        lineWidth: 2,
        lineStyle: LightweightCharts.LineStyle.Solid,
        axisLabelVisible: true,
        title: '🎯 TP $' + price.toFixed(2),
      });
      
      console.log('✅ Drew Take Profit line at $' + price.toFixed(2));
    }
    
    // 🛑 Create/Update Stop Loss Line
    function updateSLLine(price) {
      if (!lwChart || !lwCandleSeries || !price || price <= 0) {
        return;
      }

      // Remove old SL line
      if (slLine) {
        try {
          lwCandleSeries.removePriceLine(slLine);
        } catch (e) {
          console.warn('Error removing SL line:', e);
        }
      }
      
      // Create new SL line (RED)
      slLine = lwCandleSeries.createPriceLine({
        price: price,
        color: '#EF5350', // Red
        lineWidth: 2,
        lineStyle: LightweightCharts.LineStyle.Solid,
        axisLabelVisible: true,
        title: '🛑 SL $' + price.toFixed(2),
      });
      
      console.log('✅ Drew Stop Loss line at $' + price.toFixed(2));
    }
    
    // 🖱️ Setup draggable TP/SL lines
    function setupDraggableLines() {
      if (!lwChart) return;
      
      const chartDiv = document.getElementById('lightweight_chart');
      if (!chartDiv) return;
      
      let isMouseDown = false;
      let startY = 0;
      let startPrice = 0;
      
      // Mouse down - check if near TP or SL line
      chartDiv.addEventListener('mousedown', function(e) {
        if (!lwCandleSeries || currentChartType !== 'lightweight') return;
        
        const rect = chartDiv.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        // Convert Y coordinate to price
        const price = lwCandleSeries.coordinateToPrice(y);
        if (!price) return;
        
        const tpPrice = parseFloat(document.getElementById('takeProfit').value);
        const slPrice = parseFloat(document.getElementById('stopLoss').value);
        
        const threshold = Math.abs(currentSymbolData.lastPrice) * 0.02; // 2% threshold
        
        // Check if near TP line
        if (tpPrice && Math.abs(price - tpPrice) < threshold) {
          isMouseDown = true;
          isDraggingLine = true;
          draggedLine = 'tp';
          startY = y;
          startPrice = tpPrice;
          chartDiv.style.cursor = 'ns-resize';
          e.preventDefault();
          return;
        }
        
        // Check if near SL line
        if (slPrice && Math.abs(price - slPrice) < threshold) {
          isMouseDown = true;
          isDraggingLine = true;
          draggedLine = 'sl';
          startY = y;
          startPrice = slPrice;
          chartDiv.style.cursor = 'ns-resize';
          e.preventDefault();
          return;
        }
      });
      
      // Mouse move - drag the line
      chartDiv.addEventListener('mousemove', function(e) {
        if (!isMouseDown || !isDraggingLine || !lwCandleSeries) return;
        
        const rect = chartDiv.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        // Convert Y coordinate to price
        const newPrice = lwCandleSeries.coordinateToPrice(y);
        if (!newPrice || newPrice <= 0) return;
        
        // Update the line and input field
        if (draggedLine === 'tp') {
          document.getElementById('takeProfit').value = newPrice.toFixed(2);
          updateTPLine(newPrice);
        } else if (draggedLine === 'sl') {
          document.getElementById('stopLoss').value = newPrice.toFixed(2);
          updateSLLine(newPrice);
        }
        
        e.preventDefault();
      });
      
      // Mouse up - stop dragging
      chartDiv.addEventListener('mouseup', function(e) {
        if (isMouseDown && isDraggingLine) {
          isMouseDown = false;
          isDraggingLine = false;
          draggedLine = null;
          chartDiv.style.cursor = 'default';
          console.log('✅ Line drag completed');
        }
      });
      
      // Mouse leave - stop dragging if mouse leaves chart
      chartDiv.addEventListener('mouseleave', function(e) {
        if (isMouseDown && isDraggingLine) {
          isMouseDown = false;
          isDraggingLine = false;
          draggedLine = null;
          chartDiv.style.cursor = 'default';
        }
      });
      
      // Show cursor change when hovering near lines
      chartDiv.addEventListener('mousemove', function(e) {
        if (isDraggingLine || !lwCandleSeries || currentChartType !== 'lightweight') return;
        
        const rect = chartDiv.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const price = lwCandleSeries.coordinateToPrice(y);
        if (!price) return;
        
        const tpPrice = parseFloat(document.getElementById('takeProfit').value);
        const slPrice = parseFloat(document.getElementById('stopLoss').value);
        const threshold = Math.abs(currentSymbolData.lastPrice) * 0.02;
        
        const nearTP = tpPrice && Math.abs(price - tpPrice) < threshold;
        const nearSL = slPrice && Math.abs(price - slPrice) < threshold;
        
        if (nearTP || nearSL) {
          chartDiv.style.cursor = 'ns-resize';
        } else {
          chartDiv.style.cursor = 'default';
        }
      });
      
      console.log('✅ Draggable TP/SL lines enabled');
    }
    
    // Fetch current price from API
    async function fetchCurrentPrice(symbol) {
      try {
        const response = await fetch('/api/market/quote/' + symbol);
        const result = await response.json();
        
        if (result.success && result.data) {
          currentSymbolData.lastPrice = result.data.price;
          
          // Update watchlist price
          const priceElement = document.getElementById('price-' + symbol);
          const changeElement = document.getElementById('change-' + symbol);
          
          if (priceElement) {
            priceElement.textContent = '$' + result.data.price.toFixed(2);
          }
          
          if (changeElement) {
            const changeClass = result.data.change >= 0 ? 'positive' : 'negative';
            changeElement.className = 'watchlist-change ' + changeClass;
            changeElement.textContent = (result.data.change >= 0 ? '+' : '') + result.data.changePercent.toFixed(2) + '%';
          }
        }
      } catch (error) {
        console.error('Error fetching current price:', error);
      }
    }
    
    // Redraw all order lines for current symbol
    function redrawOrderLines() {
      if (currentChartType === 'lightweight') {
        redrawLightweightLines();
      } else {
        console.log('⚠️ TradingView chart does not support programmatic line drawing');
        console.log('Total orders:', pendingOrders.length);
        console.log('Pending stop orders:', pendingOrders.filter(o => o.status !== 'Filled' && o.status !== 'Cancelled').length);
        }
      }

    // Generate sample candlestick data (for Lightweight Charts)
    function generateSampleData() {
      const data = [];
      
      // Create deterministic seed from symbol name
      // Same symbol = same chart every time
      let seed = 0;
      for (let i = 0; i < currentSymbolData.symbol.length; i++) {
        seed += currentSymbolData.symbol.charCodeAt(i);
      }
      
      // Simple seeded random number generator
      function seededRandom() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      }
      
      // Generate base price from symbol (deterministic)
      const basePrice = 50 + (seededRandom() * 150); // $50-$200
      let currentPrice = basePrice;
      const now = Math.floor(Date.now() / 1000);
      
      for (let i = 100; i >= 0; i--) {
        const time = now - (i * 300); // 5-minute bars
        const change = (seededRandom() - 0.5) * 3; // Price volatility
        const open = currentPrice;
        const close = open + change;
        const high = Math.max(open, close) + seededRandom();
        const low = Math.min(open, close) - seededRandom();
        
        data.push({
          time: time,
          open: open,
          high: high,
          low: low,
          close: close,
        });
        
        currentPrice = close;
      }
      
      return data;
    }

    // Order Type Change Handler
    document.getElementById('orderType').addEventListener('change', function() {
      const orderType = this.value;
      const limitPriceGroup = document.getElementById('limitPriceGroup');
      const stopPriceGroup = document.getElementById('stopPriceGroup');
      const trailingAmountGroup = document.getElementById('trailingAmountGroup');
      const autoMarginContainer = document.getElementById('autoMarginContainer');

      // Hide all conditional fields
      limitPriceGroup.style.display = 'none';
      stopPriceGroup.style.display = 'none';
      trailingAmountGroup.style.display = 'none';
      if (autoMarginContainer) autoMarginContainer.style.display = 'none';

      // Show relevant fields based on order type
      if (orderType === 'LMT') {
        limitPriceGroup.style.display = 'block';
      } else if (orderType === 'STP') {
        stopPriceGroup.style.display = 'block';
      } else if (orderType === 'STP_LMT') {
        // 🎯 Stop-Limit: Show BOTH stop and limit price fields + auto-margin
        stopPriceGroup.style.display = 'block';
        limitPriceGroup.style.display = 'block';
        if (autoMarginContainer) autoMarginContainer.style.display = 'block';
      } else if (orderType === 'TRAIL') {
        trailingAmountGroup.style.display = 'block';
      }
    });

    // 🎯 Auto-calculate limit price with margin for Stop-Limit orders
    function autoCalculateLimitPrice(action = null) {
      const orderType = document.getElementById('orderType').value;
      const autoMargin = document.getElementById('autoMargin').checked;
      
      // Only auto-calculate for Stop-Limit orders with auto-margin enabled
      if (orderType !== 'STP_LMT' || !autoMargin) return;
      
      const stopPriceInput = document.getElementById('stopPrice');
      const limitPriceInput = document.getElementById('limitPrice');
      const marginPercentInput = document.getElementById('marginPercent');
      
      const stopPrice = parseFloat(stopPriceInput.value);
      const marginPercent = parseFloat(marginPercentInput.value) || 0.3;
      
      if (!stopPrice || stopPrice <= 0) return;
      
      // Calculate margin amount
      const marginAmount = stopPrice * (marginPercent / 100);
      let limitPrice;
      
      // Determine direction
      if (action === 'BUY') {
        // BUY: limit = stop + margin (willing to pay slightly more)
        limitPrice = stopPrice + marginAmount;
      } else if (action === 'SELL') {
        // SELL: limit = stop - margin (willing to sell slightly lower)
        limitPrice = stopPrice - marginAmount;
      } else {
        // No action specified, assume BUY (most common for stop-limit entries)
        limitPrice = stopPrice + marginAmount;
      }
      
      limitPriceInput.value = limitPrice.toFixed(2);
      
      const direction = action || 'BUY (default)';
      const sign = action === 'SELL' ? '-' : '+';
      console.log('🎯 Auto-calculated limit price for ' + direction + ': $' + limitPrice.toFixed(2) + ' (stop: $' + stopPrice.toFixed(2) + ' ' + sign + ' ' + marginPercent + '%)');    }
    
    // Attach auto-calculation listeners
    document.getElementById('stopPrice').addEventListener('input', () => autoCalculateLimitPrice());
    document.getElementById('marginPercent').addEventListener('input', () => autoCalculateLimitPrice());
    document.getElementById('autoMargin').addEventListener('change', function() {
      if (this.checked) {
        autoCalculateLimitPrice();
      }
    });
    
    // Update limit price when hovering over BUY/SELL buttons (for Stop-Limit orders)
    document.getElementById('buyBtn').addEventListener('mouseenter', function() {
      const orderType = document.getElementById('orderType').value;
      if (orderType === 'STP_LMT') {
        autoCalculateLimitPrice('BUY');
      }
    });
    
    document.getElementById('sellBtn').addEventListener('mouseenter', function() {
      const orderType = document.getElementById('orderType').value;
      if (orderType === 'STP_LMT') {
        autoCalculateLimitPrice('SELL');
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

    // ===============================================
    // 🚀 ONE-CLICK TRADING SYSTEM
    // ===============================================

    // 🎯 MARKET HOURS DETECTION
    function checkMarketHours() {
      const now = new Date();
      const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      const hours = nyTime.getHours();
      const minutes = nyTime.getMinutes();
      const day = nyTime.getDay();
      
      if (day === 0 || day === 6) return { isOpen: false, period: 'weekend' };
      if (hours < 4) return { isOpen: false, period: 'closed' };
      if (hours >= 4 && hours < 9) return { isOpen: false, period: 'premarket' };
      if (hours === 9 && minutes < 30) return { isOpen: false, period: 'premarket' };
      if (hours >= 16 && hours < 20) return { isOpen: false, period: 'afterhours' };
      if (hours >= 20) return { isOpen: false, period: 'closed' };
      
      return { isOpen: true, period: 'regular' };
    }

    function getStopLimitMargin() {
      const status = checkMarketHours();
      if (status.period === 'premarket') return 0.015;
      if (status.period === 'afterhours') return 0.010;
      return 0.005;
    }

    function updateMarketHoursIndicator() {
      const status = checkMarketHours();
      const indicator = document.getElementById('marketHoursIndicator');
      if (!indicator) return;
      
      const icon = document.getElementById('marketStatusIcon');
      const text = document.getElementById('marketStatusText');
      const detail = document.getElementById('marketStatusDetail');
      
      indicator.style.display = 'block';
      
      if (status.isOpen) {
        indicator.style.background = 'rgba(76, 175, 80, 0.1)';
        indicator.style.borderLeftColor = '#4CAF50';
        icon.textContent = '🟢';
        text.textContent = 'Market Open';
        text.style.color = '#4CAF50';
        detail.textContent = 'Regular trading hours - Using market/stop orders';
      } else {
        indicator.style.background = 'rgba(255, 167, 38, 0.1)';
        indicator.style.borderLeftColor = '#FFA726';
        icon.textContent = '🟡';
        
        const margin = (getStopLimitMargin() * 100).toFixed(1);
        
        if (status.period === 'premarket') {
          text.textContent = 'Pre-Market';
          text.style.color = '#FFA726';
          detail.textContent = \`Using stop-limit with \${margin}% margin (high volatility)\`;
        } else if (status.period === 'afterhours') {
          text.textContent = 'After Hours';
          text.style.color = '#FFA726';
          detail.textContent = \`Using stop-limit with \${margin}% margin (medium volatility)\`;
        } else if (status.period === 'weekend') {
          text.textContent = 'Market Closed (Weekend)';
          text.style.color = '#787B86';
          detail.textContent = 'Orders will queue until Monday 9:30 AM EST';
        } else {
          text.textContent = 'Market Closed';
          text.style.color = '#787B86';
          detail.textContent = \`Using stop-limit with \${margin}% margin\`;
        }
      }
    }

    //🚀 ONE-CLICK QUICK BUY/SELL
    async function quickBuy() {
      await executeOneClickTrade('BUY', 'LONG');
    }

    async function quickSell() {
      await executeOneClickTrade('SELL', 'SHORT');
    }

    async function executeOneClickTrade(action, direction) {
      const broker = document.getElementById('broker').value;
      const symbol = document.getElementById('symbol').value.toUpperCase().trim();
      const quantity = parseInt(document.getElementById('quantity').value);
      
      if (!symbol || !quantity || quantity <= 0) {
        showNotification('❌ Error', 'Please enter valid ticker and quantity', 'error');
        return;
      }
      
      let currentPrice;
      try {
        const response = await fetch(\`/api/market/quote/\${symbol}\`);
        const result = await response.json();
        
        // Handle different response formats
        if (result.success && result.data) {
          currentPrice = result.data.regularMarketPrice || result.data.price || 0;
        } else {
          currentPrice = result.regularMarketPrice || result.price || 0;
        }
        
        console.log('Fetched price for', symbol, ':', currentPrice, 'Response:', result);
        
        if (!currentPrice || currentPrice <= 0) {
          showNotification('❌ Error', 'Could not get current price for ' + symbol, 'error');
          return;
        }
      } catch (error) {
        console.error('Error fetching price:', error);
        showNotification('❌ Error', 'Failed to fetch current price', 'error');
        return;
      }
      
      const marketStatus = checkMarketHours();
      const isMarketHours = marketStatus.isOpen;
      const orderType = isMarketHours ? 'MKT' : 'LMT';
      const limitPrice = isMarketHours ? null : (action === 'BUY' ? currentPrice + 0.50 : currentPrice - 0.50);
      
      const payload = {
        strategy: 'one_click_trading',
        action: action === 'BUY' ? 'ENTRY_LONG' : 'ENTRY_SHORT',
        symbol: symbol,
        qty: quantity,
        broker: broker,
        orderType: orderType,
        outsideRth: !isMarketHours
      };
      
      if (limitPrice) payload.limitPrice = limitPrice;
      
      try {
        showNotification('⚡ Placing Order...', \`\${action} \${quantity} \${symbol}\`, 'info');
        
        const response = await fetch('/webhook/tradingview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        console.log('🎯 Order response:', result);
        
        if (result.success) {
          showNotification('✅ Order Placed!', \`\${action} \${quantity} \${symbol} @ ~$\${currentPrice.toFixed(2)}\`, 'success');
          
          activePosition = {
            symbol: symbol,
            quantity: quantity,
            direction: direction,
            entryPrice: currentPrice,
            action: action
          };
          
          setTimeout(() => {
            drawProtectionLines(symbol, quantity, currentPrice, direction, action);
            fetchPositions();
            fetchPendingOrders();
          }, 1500);
          
        } else {
          console.error('❌ Order failed:', result);
          showNotification('❌ Order Failed', result.message || result.error || JSON.stringify(result), 'error');
        }
      } catch (error) {
        console.error('Error placing order:', error);
        showNotification('❌ Error', 'Failed to place order: ' + error.message, 'error');
      }
    }

    // 🎨 PROTECTION LINES
    function drawProtectionLines(symbol, quantity, entryPrice, direction, action) {
      if (currentChartType !== 'lightweight' || !lwCandleSeries) {
        console.log('Protection lines only work on Lightweight Chart');
        return;
      }
      
      removeProtectionLines();
      
      const stopLossPrice = direction === 'LONG' ? entryPrice * 0.98 : entryPrice * 1.02;
      const takeProfitPrice = direction === 'LONG' ? entryPrice * 1.06 : entryPrice * 0.94;
      
      console.log('Drawing protection lines:', { entryPrice, stopLossPrice, takeProfitPrice });
      
      try {
        protectionLines.entry = lwCandleSeries.createPriceLine({
          price: entryPrice,
          color: '#2196F3',
          lineWidth: 2,
          lineStyle: LightweightCharts.LineStyle.Solid,
          axisLabelVisible: true,
          title: \`💵 ENTRY \${quantity} \${direction} @ $\${entryPrice.toFixed(2)}\`
        });
        
        protectionLines.stopLoss = lwCandleSeries.createPriceLine({
          price: stopLossPrice,
          color: '#F44336',
          lineWidth: 2,
          lineStyle: LightweightCharts.LineStyle.Dashed,
          axisLabelVisible: true,
          title: \`🛑 STOP LOSS $\${stopLossPrice.toFixed(2)}\`
        });
        
        protectionLines.takeProfit = lwCandleSeries.createPriceLine({
          price: takeProfitPrice,
          color: '#4CAF50',
          lineWidth: 2,
          lineStyle: LightweightCharts.LineStyle.Dashed,
          axisLabelVisible: true,
          title: \`🎯 TAKE PROFIT $\${takeProfitPrice.toFixed(2)}\`
        });
        
        updatePnLDisplay(quantity, entryPrice, stopLossPrice, takeProfitPrice, direction);
        document.getElementById('oneClickPnLDisplay').style.display = 'block';
        
        // Store prices for dragging
        activePosition.stopLossPrice = stopLossPrice;
        activePosition.takeProfitPrice = takeProfitPrice;
        
        console.log('✅ Protection lines drawn successfully');
      } catch (e) {
        console.error('Error drawing protection lines:', e);
      }
    }

    function removeProtectionLines() {
      if (!lwCandleSeries) return;
      
      try {
        if (protectionLines.entry) {
          lwCandleSeries.removePriceLine(protectionLines.entry);
          protectionLines.entry = null;
        }
        if (protectionLines.stopLoss) {
          lwCandleSeries.removePriceLine(protectionLines.stopLoss);
          protectionLines.stopLoss = null;
        }
        if (protectionLines.takeProfit) {
          lwCandleSeries.removePriceLine(protectionLines.takeProfit);
          protectionLines.takeProfit = null;
        }
      } catch (e) {
        console.error('Error removing protection lines:', e);
      }
      
      document.getElementById('oneClickPnLDisplay').style.display = 'none';
    }

    function updatePnLDisplay(quantity, entryPrice, stopPrice, targetPrice, direction) {
      const stopDiff = direction === 'LONG' ? (stopPrice - entryPrice) : (entryPrice - stopPrice);
      const maxLoss = Math.abs(stopDiff * quantity);
      const maxLossPct = Math.abs((stopDiff / entryPrice) * 100);
      
      const targetDiff = direction === 'LONG' ? (targetPrice - entryPrice) : (entryPrice - targetPrice);
      const targetProfit = Math.abs(targetDiff * quantity);
      const targetProfitPct = Math.abs((targetDiff / entryPrice) * 100);
      
      const riskReward = maxLoss > 0 ? (targetProfit / maxLoss) : 0;
      
      document.getElementById('pnlEntryPrice').textContent = \`$\${entryPrice.toFixed(2)}\`;
      document.getElementById('pnlMaxLoss').textContent = \`-$\${maxLoss.toFixed(2)} (-\${maxLossPct.toFixed(2)}%)\`;
      document.getElementById('pnlTarget').textContent = \`+$\${targetProfit.toFixed(2)} (+\${targetProfitPct.toFixed(2)}%)\`;
      document.getElementById('pnlRiskReward').textContent = \`1:\${riskReward.toFixed(2)}\`;
    }

    // 🎛️ ONE-CLICK MODE TOGGLE
    function toggleOneClickMode() {
      oneClickMode = document.getElementById('oneClickMode').checked;
      const advancedPanel = document.getElementById('advancedOrderPanel');
      const buyBtn = document.getElementById('buyBtn');
      const sellBtn = document.getElementById('sellBtn');
      
      if (oneClickMode) {
        advancedPanel.style.display = 'none';
        buyBtn.textContent = '🟢 BUY (Quick)';
        sellBtn.textContent = '🔴 SELL (Quick)';
        
        updateMarketHoursIndicator();
        setInterval(updateMarketHoursIndicator, 60000);
        
        showNotification('⚡ One-Click Mode Enabled', 'Click Buy/Sell to instantly open position with draggable TP/SL', 'info');
      } else {
        advancedPanel.style.display = 'block';
        buyBtn.textContent = '🟢 Buy';
        sellBtn.textContent = '🔴 Sell';
        document.getElementById('marketHoursIndicator').style.display = 'none';
        document.getElementById('oneClickPnLDisplay').style.display = 'none';
        
        removeProtectionLines();
        activePosition = null;
      }
    }

    // Place Order
    async function placeOrder(action) {
      // 🚀 ONE-CLICK MODE: Use quick trading
      if (oneClickMode) {
        if (action === 'BUY') {
          await quickBuy();
        } else {
          await quickSell();
        }
        return;
      }
      
      // REGULAR MODE: Original logic
      const broker = document.getElementById('broker').value;
      const symbol = document.getElementById('symbol').value.toUpperCase().trim();
      const quantity = parseInt(document.getElementById('quantity').value);
      const orderType = document.getElementById('orderType').value;
      const extendedHours = document.getElementById('extendedHours').checked;

      if (!symbol || !quantity || quantity <= 0) {
        showNotification('Error', 'Please enter valid ticker and quantity', 'error');
        return;
      }

      // Show demo mode notification
      if (broker === 'demo') {
        showNotification('🎮 DEMO MODE', 'Order will fill in 2 seconds (simulated)', 'info');
      }

      // Build order payload
      const payload = {
        strategy: 'manual_bmnr',
        action: action === 'BUY' ? 'ENTRY_LONG' : 'EXIT',
        symbol: symbol,
        qty: quantity,
        broker: broker,
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
      } else if (orderType === 'STP_LMT') {
        // 🎯 Stop-Limit: Requires BOTH stop and limit prices
        const stopPrice = parseFloat(document.getElementById('stopPrice').value);
        const limitPrice = parseFloat(document.getElementById('limitPrice').value);
        if (!stopPrice || !limitPrice) {
          showNotification('Error', 'Please enter both stop price and limit price', 'error');
          return;
        }
        payload.stopPrice = stopPrice;
        payload.limitPrice = limitPrice;
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
    document.getElementById('buyBtn').addEventListener('click', () => {
      if (oneClickMode) {
        quickBuy();
      } else {
        placeOrder('BUY');
      }
    });
    document.getElementById('sellBtn').addEventListener('click', () => {
      if (oneClickMode) {
        quickSell();
      } else {
        placeOrder('SELL');
      }
    });
    
    // 🚀 ONE-CLICK MODE TOGGLE
    document.getElementById('oneClickMode').addEventListener('change', toggleOneClickMode);
    
    // Initialize market hours indicator (hidden by default)
    updateMarketHoursIndicator();

    // Fetch Positions
    async function fetchPositions() {
      try {
        const selectedBroker = document.getElementById('broker').value;
        const response = await fetch('/api/dashboard/positions?broker=' + selectedBroker);
        const data = await response.json();
        
        if (response.ok) {
          // Handle nested data structure: data.data.positions
          positions = data.data?.positions || data.positions || [];
          updatePositionsTable();
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
      }
    }

    // Fetch Account Summary
    async function fetchAccountSummary() {
      try {
        // Get the selected broker from the UI
        const selectedBroker = document.getElementById('broker').value;
        const response = await fetch(\`/api/dashboard/account?broker=\${selectedBroker}\`);
        const result = await response.json();
        
        if (response.ok) {
          // Handle nested data structure: result.data
          const data = result.data || result;
          accountData = {
            balance: data.balance || 0,
            cashBalance: data.cashBalance || 0,
            equity: data.equity || 0,
            unrealizedPnL: data.unrealizedPnL || 0,
            realizedPnL: data.realizedPnL || 0,
            totalPnL: data.totalPnL || 0,
            source: data.source || 'Unknown'
          };
          updateAccountSummary();
        }
      } catch (error) {
        console.error('Error fetching account:', error);
      }
    }

    // Check Broker Status
    async function checkBrokerStatus() {
      try {
        const response = await fetch('/admin/broker-status');
        const data = await response.json();
        
        if (response.ok && data.success) {
          const selectedBroker = document.getElementById('broker').value;
          const statusEl = document.getElementById('brokerStatus');
          const syncBtn = document.getElementById('syncOrdersBtn');
          
          if (data.brokers[selectedBroker]) {
            const broker = data.brokers[selectedBroker];
            if (broker.connected) {
              statusEl.textContent = '✅ Connected';
              statusEl.style.color = '#4caf50';
              // Show sync button only for IBKR when connected
              if (selectedBroker === 'ibkr') {
                syncBtn.style.display = 'inline-block';
              } else {
                syncBtn.style.display = 'none';
              }
            } else {
              statusEl.textContent = '❌ Disconnected';
              statusEl.style.color = '#f44336';
              syncBtn.style.display = 'none';
            }
          } else {
            syncBtn.style.display = 'none';
          }
        }
      } catch (error) {
        console.error('Error checking broker status:', error);
        document.getElementById('brokerStatus').textContent = '⚠️ Unknown';
      }
    }

    // Fetch Pending Orders
    async function fetchPendingOrders() {
      try {
        const selectedBroker = document.getElementById('broker').value;
        const response = await fetch('/api/dashboard/orders/pending?broker=' + selectedBroker);
        const data = await response.json();
        
        console.log('Orders API response:', data); // Debug logging
        
        if (response.ok && data.data && data.data.orders) {
          console.log('Total orders:', data.data.orders.length); // Debug
          
          // Show ALL pending orders (not just stop orders)
          pendingOrders = data.data.orders.filter(order => 
            order.status === 'PENDING' || 
            order.status === 'PreSubmitted' || 
            order.status === 'Submitted'
          );
          
          console.log('All pending orders:', pendingOrders.length); // Debug
          updatePendingOrdersTable();
        }
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    }

    // Filter Orders by Type
    function filterOrdersByType(orderType) {
      currentOrderFilter = orderType;
      
      // Update tab active state
      document.querySelectorAll('.order-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-filter') === orderType) {
          tab.classList.add('active');
        }
      });
      
      // Redraw table with filter applied
      updatePendingOrdersTable();
    }

    // Update Pending Orders Table
    function updatePendingOrdersTable() {
      const tbody = document.getElementById('pendingOrdersBody');
      
      // Apply filter
      let filteredOrders = pendingOrders;
      if (currentOrderFilter !== 'ALL') {
        filteredOrders = pendingOrders.filter(order => order.orderType === currentOrderFilter);
      }
      
      if (filteredOrders.length === 0) {
        const filterText = currentOrderFilter === 'ALL' ? 'pending orders' : currentOrderFilter + ' orders';
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No ' + filterText + '</td></tr>';
        // Redraw lines (will clear order lines if empty)
        if (tvWidget) redrawOrderLines();
        return;
      }

      tbody.innerHTML = filteredOrders.map(order => {
        const sideClass = order.action === 'BUY' ? 'order-side-buy' : 'order-side-sell';
        
        // Determine trigger price based on order type
        let triggerPrice = '-';
        if (order.orderType === 'LMT' && order.limitPrice) {
          triggerPrice = order.limitPrice;
        } else if (order.orderType === 'STP' && order.stopPrice) {
          triggerPrice = order.stopPrice;
        } else if (order.orderType === 'STP_LMT' && order.stopPrice && order.limitPrice) {
          // 🎯 Stop-Limit: Show both prices
          triggerPrice = order.stopPrice + ' → ' + order.limitPrice;
        } else if (order.orderType === 'TRAIL' && order.trailingAmount) {
          triggerPrice = order.trailingAmount;
        }
        
        // Determine order type display
        let orderTypeDisplay = order.orderType;
        if (order.orderType === 'TRAIL') orderTypeDisplay = 'TRAILING';
        if (order.orderType === 'LMT') orderTypeDisplay = 'LIMIT';
        if (order.orderType === 'STP') orderTypeDisplay = 'STOP';
        if (order.orderType === 'STP_LMT') orderTypeDisplay = 'STOP-LIMIT';
        if (order.orderType === 'MKT') orderTypeDisplay = 'MARKET';
        
        return \`
          <tr>
            <td class="symbol-cell">\${order.symbol}</td>
            <td>\${orderTypeDisplay}</td>
            <td class="order-trigger">\${typeof triggerPrice === 'number' ? '$' + triggerPrice.toFixed(2) : triggerPrice}</td>
            <td>\${order.quantity}</td>
            <td class="\${sideClass}">\${order.action}</td>
            <td class="order-status-pending">\${order.status || 'PENDING'}</td>
            <td>
              <button class="action-btn close-btn" onclick="cancelOrder('\${order.orderId}')" title="Cancel Order">
                ❌
              </button>
            </td>
          </tr>
        \`;
      }).join('');

      // Redraw order lines on chart
      if (tvWidget) redrawOrderLines();
    }

    // Cancel Order
    async function cancelOrder(orderId) {
      if (!confirm('Cancel this stop order?')) {
        return;
      }

      try {
        const response = await fetch(\`/api/dashboard/orders/\${orderId}/cancel\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
          showNotification('Cancelled', 'Order cancelled successfully', 'success');
          setTimeout(() => fetchPendingOrders(), 1000);
        } else {
          showNotification('Error', result.error || 'Failed to cancel order', 'error');
        }
      } catch (error) {
        showNotification('Error', 'Network error: ' + error.message, 'error');
      }
    }

    // Update Positions Table
    function updatePositionsTable() {
      const tbody = document.getElementById('positionsBody');
      
      if (positions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No open positions</td></tr>';
        updatePositionMarker(null); // Hide marker
        // Redraw lines (will clear position lines if empty)
        if (tvWidget) redrawOrderLines();
        return;
      }

      // Update position marker with current symbol's position
      const currentSymbolPosition = positions.find(p => p.symbol === currentSymbol);
      updatePositionMarker(currentSymbolPosition);

      tbody.innerHTML = positions.map(pos => {
        // Handle both avgPrice and avgEntryPrice for compatibility
        const avgPrice = pos.avgEntryPrice || pos.avgPrice || 0;
        const currentPrice = pos.currentPrice || 0;
        const pnl = pos.unrealizedPnL || 0;
        const pnlPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice * 100) : 0;
        const pnlClass = pnl >= 0 ? 'positive' : 'negative';
        const marketValue = currentPrice * pos.quantity;
        const positionType = pos.quantity > 0 ? 'LONG' : 'SHORT';
        const absQuantity = Math.abs(pos.quantity);

        return \`
          <tr>
            <td class="symbol-cell">\${pos.symbol}</td>
            <td>\${absQuantity} \${positionType}</td>
            <td>$\${avgPrice.toFixed(2)}</td>
            <td>$\${currentPrice.toFixed(2)}</td>
            <td>$\${Math.abs(marketValue).toFixed(2)}</td>
            <td class="\${pnlClass}">\${pnl >= 0 ? '+' : ''}$\${pnl.toFixed(2)}</td>
            <td class="\${pnlClass}">\${pnl >= 0 ? '+' : ''}\${pnlPercent.toFixed(2)}%</td>
            <td><span class="status-badge status-open">OPEN</span></td>
            <td>
              <button class="action-btn close-btn" onclick="closePosition('\${pos.symbol}')" title="Close Position">
                ✕ Close
              </button>
              <button class="action-btn flip-btn" onclick="flipPosition('\${pos.symbol}', \${pos.quantity})" title="Flip Position">
                🔄 Flip
              </button>
            </td>
          </tr>
        \`;
      }).join('');

      // Redraw position lines on chart
      if (tvWidget) redrawOrderLines();
    }

    // Update Position Marker Overlay
    function updatePositionMarker(position) {
      const marker = document.getElementById('positionMarker');
      
      if (!position) {
        marker.style.display = 'none';
        return;
      }

      const pnl = position.unrealizedPnL || 0;
      const avgPrice = position.avgEntryPrice || position.avgPrice || 0;
      const currentPrice = position.currentPrice || 0;
      const pnlPercent = avgPrice > 0 ? 
        ((currentPrice - avgPrice) / avgPrice * 100) : 0;
      const positionType = position.quantity > 0 ? 'LONG' : 'SHORT';
      const absQuantity = Math.abs(position.quantity);

      // Update marker content
      document.getElementById('markerSymbol').textContent = position.symbol;
      document.getElementById('markerType').textContent = positionType;
      document.getElementById('markerQty').textContent = absQuantity;
      document.getElementById('markerEntry').textContent = '$' + avgPrice.toFixed(2);
      document.getElementById('markerCurrent').textContent = '$' + currentPrice.toFixed(2);
      
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
    // Close Position Function
    async function closePosition(symbol) {
      if (!confirm('Close position for ' + symbol + '?')) {
        return;
      }

      try {
        // Find the position to get broker info
        const position = positions.find(p => p.symbol === symbol);
        if (!position) {
          showNotification('Error', 'Position not found', 'error');
          return;
        }

        const broker = position.broker || 'demo';

        // Use the database close endpoint instead of webhook
        const response = await fetch(\`/api/dashboard/positions/\${symbol}/close?broker=\${broker}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok && result.success) {
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
          // Use the database close endpoint instead of webhook
          const broker = pos.broker || 'demo';
          const response = await fetch(\`/api/dashboard/positions/\${pos.symbol}/close?broker=\${broker}\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          const result = await response.json();

          if (response.ok && result.success) {
            successCount++;
          } else {
            failCount++;
            console.error('Failed to close', pos.symbol, result.error);
          }

          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          failCount++;
          console.error('Error closing position:', error);
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
      fetchPendingOrders();
    });

    // Refresh Orders Button
    document.getElementById('refreshOrdersBtn').addEventListener('click', () => {
      fetchPendingOrders();
      showNotification('Refreshed', 'Pending orders updated', 'success');
    });

    // Flip Button
    document.getElementById('flipBtn').addEventListener('click', flipCurrentSymbol);

    // Close All Button
    document.getElementById('closeAllBtn').addEventListener('click', closeAllPositions);

    // Auto-refresh every 10 seconds
    setInterval(() => {
      fetchPositions();
      fetchAccountSummary();
      fetchPendingOrders();
      updateWatchlistPrices(); // Update watchlist with real prices
    }, 10000);
    
    // Make position marker draggable
    const positionMarker = document.getElementById('positionMarker');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    positionMarker.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      if (e.target === positionMarker || positionMarker.contains(e.target)) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        isDragging = true;
      }
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        setTranslate(currentX, currentY, positionMarker);
      }
    }

    function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
      el.style.transform = 'translate3d(' + xPos + 'px, ' + yPos + 'px, 0)';
    }

    // Initialize on page load - wait for TradingView library
    console.log('Page loaded, checking for TradingView library...');
    
    // Attach watchlist button and search handlers
    document.getElementById('addWatchlistBtn').addEventListener('click', addToWatchlist);
    document.getElementById('watchlistSearch').addEventListener('keyup', filterWatchlist);
    
    // Wait for all libraries to load
    console.log('Page loaded, checking for TradingView library...');
    console.log('TradingView loaded:', typeof TradingView !== 'undefined');
    console.log('LightweightCharts loaded:', typeof LightweightCharts !== 'undefined');
    
    if (typeof LightweightCharts !== 'undefined') {
      console.log('LightweightCharts library found immediately');
      renderWatchlist();
    initChart(currentSymbol);
    } else {
      console.log('Waiting for LightweightCharts library to load...');
      // Wait for Lightweight Charts library to load
      const checkLibraries = setInterval(() => {
        if (typeof LightweightCharts !== 'undefined') {
          console.log('LightweightCharts library loaded!');
          clearInterval(checkLibraries);
          renderWatchlist();
          initChart(currentSymbol);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLibraries);
        if (typeof LightweightCharts === 'undefined') {
          console.error('LightweightCharts failed to load after 10 seconds!');
          alert('Error loading chart library. Please refresh the page.');
        }
      }, 10000);
    }
    
    fetchPositions();
    fetchAccountSummary();
    fetchPendingOrders();
    checkBrokerStatus();
    
    // Sync orders button handler
    document.getElementById('syncOrdersBtn').addEventListener('click', async () => {
      const syncBtn = document.getElementById('syncOrdersBtn');
      const selectedBroker = document.getElementById('broker').value;
      
      if (selectedBroker !== 'ibkr') {
        showNotification('Sync Orders', 'Only available for IBKR', 'info');
        return;
      }
      
      syncBtn.textContent = '⏳ Syncing...';
      syncBtn.disabled = true;
      
      try {
        const response = await fetch('/api/dashboard/orders/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ broker: selectedBroker })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          showNotification('Orders Synced', 'Refreshing order status from TWS...', 'success');
          // Refresh positions and orders after a short delay
          setTimeout(() => {
            fetchPositions();
            fetchPendingOrders();
            fetchAccountSummary();
          }, 1000);
        } else {
          showNotification('Sync Failed', result.error || 'Could not sync orders', 'error');
        }
      } catch (error) {
        showNotification('Sync Error', 'Failed to sync orders', 'error');
      } finally {
        syncBtn.textContent = '🔄 Sync';
        syncBtn.disabled = false;
      }
    });
    
    // Check broker status and refresh account data when broker selection changes
    document.getElementById('broker').addEventListener('change', () => {
      checkBrokerStatus();
      fetchAccountSummary(); // Refresh balance for the selected broker
      fetchPositions(); // Refresh positions for the selected broker
      fetchPendingOrders(); // Refresh pending orders for the selected broker
    });
    
    // 🎯 TP/SL Input Field Listeners - Update lines when user types
    document.getElementById('takeProfit').addEventListener('input', function() {
      const tpPrice = parseFloat(this.value);
      if (tpPrice && tpPrice > 0 && currentChartType === 'lightweight') {
        updateTPLine(tpPrice);
      } else if (!tpPrice && tpLine) {
        // Remove TP line if input is cleared
        try {
          if (lwCandleSeries && tpLine) {
            lwCandleSeries.removePriceLine(tpLine);
            tpLine = null;
          }
        } catch (e) {
          console.warn('Error removing TP line:', e);
        }
      }
    });
    
    document.getElementById('stopLoss').addEventListener('input', function() {
      const slPrice = parseFloat(this.value);
      if (slPrice && slPrice > 0 && currentChartType === 'lightweight') {
        updateSLLine(slPrice);
      } else if (!slPrice && slLine) {
        // Remove SL line if input is cleared
        try {
          if (lwCandleSeries && slLine) {
            lwCandleSeries.removePriceLine(slLine);
            slLine = null;
          }
        } catch (e) {
          console.warn('Error removing SL line:', e);
        }
      }
    });
    
    // Update broker status every 10 seconds
    setInterval(checkBrokerStatus, 10000);
  </script>
</body>
</html>
  `);
});

export default router;
