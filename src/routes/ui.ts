/**
 * Simple web UI routes for configuration
 */

import { Router, Request, Response } from 'express';
import { riskManager } from '../services/riskManager';
import { stateStore } from '../services/stateStore';
import config from '../config';

const router = Router();

/**
 * GET /ui
 * Serve the configuration UI
 */
router.get('/', (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trading Automation - Control Panel</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .header h1 {
      color: #2d3748;
      margin-bottom: 10px;
    }
    
    .header p {
      color: #718096;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .card h2 {
      color: #2d3748;
      margin-bottom: 15px;
      font-size: 20px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    
    .status-online {
      background: #c6f6d5;
      color: #22543d;
    }
    
    .status-offline {
      background: #fed7d7;
      color: #742a2a;
    }
    
    .status-warning {
      background: #feebc8;
      color: #7c2d12;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #4a5568;
      font-weight: 500;
    }
    
    .form-group input {
      width: 100%;
      padding: 10px;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      font-size: 16px;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .btn-primary {
      background: #667eea;
      color: white;
    }
    
    .btn-danger {
      background: #f56565;
      color: white;
    }
    
    .btn-success {
      background: #48bb78;
      color: white;
    }
    
    .btn-warning {
      background: #ed8936;
      color: white;
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .btn-group {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }
    
    .stat {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .stat:last-child {
      border-bottom: none;
    }
    
    .stat-label {
      color: #718096;
    }
    
    .stat-value {
      color: #2d3748;
      font-weight: 600;
    }
    
    .alert {
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
      display: none;
    }
    
    .alert.show {
      display: block;
    }
    
    .alert-success {
      background: #c6f6d5;
      color: #22543d;
    }
    
    .alert-error {
      background: #fed7d7;
      color: #742a2a;
    }
    
    .kill-switch-container {
      text-align: center;
      padding: 20px;
    }
    
    .kill-switch {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: none;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .kill-switch.active {
      background: #f56565;
      color: white;
      animation: pulse 2s infinite;
    }
    
    .kill-switch.inactive {
      background: #48bb78;
      color: white;
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Trading Automation Control Panel</h1>
      <p>Manage your automated trading strategies</p>
    </div>
    
    <div class="grid">
      <!-- Kill Switch -->
      <div class="card">
        <h2>Emergency Kill Switch</h2>
        <div class="kill-switch-container">
          <button id="killSwitch" class="kill-switch" onclick="toggleKillSwitch()">
            <span id="killSwitchText">Loading...</span>
          </button>
          <p id="killSwitchStatus" style="margin-top: 15px; color: #718096;"></p>
        </div>
      </div>
      
      <!-- Momentum Strategy -->
      <div class="card">
        <h2>📈 Momentum Strategy</h2>
        <span id="momentumStatus" class="status-badge">Loading...</span>
        
        <div class="form-group">
          <label for="momentumTicker">Daily Ticker Symbol</label>
          <input type="text" id="momentumTicker" placeholder="e.g., AAPL" style="text-transform: uppercase;">
        </div>
        
        <div class="btn-group">
          <button class="btn btn-primary" onclick="setMomentumTicker()">Set Ticker</button>
          <button class="btn btn-warning" onclick="clearMomentumTicker()">Clear</button>
        </div>
        
        <div id="momentumAlert" class="alert"></div>
      </div>
      
      <!-- System Status -->
      <div class="card">
        <h2>📊 System Status</h2>
        <div id="systemStats">
          <div class="stat">
            <span class="stat-label">Status</span>
            <span class="stat-value" id="systemStatus">Loading...</span>
          </div>
          <div class="stat">
            <span class="stat-label">Auto-Stop</span>
            <span class="stat-value" id="autoStopStatus">Loading...</span>
          </div>
          <div class="stat">
            <span class="stat-label">Consecutive Errors</span>
            <span class="stat-value" id="errorCount">0</span>
          </div>
        </div>
        
        <div class="btn-group">
          <button class="btn btn-success" onclick="resetAutoStop()">Reset Auto-Stop</button>
          <button class="btn btn-primary" onclick="refreshStatus()">Refresh</button>
        </div>
      </div>
      
      <!-- Bread & Butter Strategy -->
      <div class="card">
        <h2>🍞 Bread & Butter Strategy</h2>
        <span class="status-badge status-online">Enabled</span>
        
        <div class="stat">
          <span class="stat-label">Symbols</span>
          <span class="stat-value" id="bbSymbols">Loading...</span>
        </div>
        <div class="stat">
          <span class="stat-label">Max Trades/Day</span>
          <span class="stat-value" id="bbMaxTrades">Loading...</span>
        </div>
        <div class="stat">
          <span class="stat-label">Today's Trades</span>
          <span class="stat-value" id="bbCurrentTrades">0</span>
        </div>
      </div>
      
      <!-- Trade Statistics -->
      <div class="card">
        <h2>📈 Trade Statistics</h2>
        <div id="tradeStats">
          <div class="stat">
            <span class="stat-label">Loading...</span>
            <span class="stat-value">0</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // API calls
    async function fetchState() {
      const response = await fetch('/admin/state');
      return response.json();
    }
    
    async function fetchStrategies() {
      const response = await fetch('/admin/strategies');
      return response.json();
    }
    
    async function fetchKillSwitch() {
      const response = await fetch('/admin/kill-switch');
      return response.json();
    }
    
    async function toggleKillSwitch() {
      const state = await fetchState();
      const newState = !state.state.killSwitch;
      
      const response = await fetch('/admin/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState })
      });
      
      if (response.ok) {
        await refreshStatus();
      }
    }
    
    async function setMomentumTicker() {
      const ticker = document.getElementById('momentumTicker').value.trim().toUpperCase();
      
      if (!ticker) {
        showAlert('momentumAlert', 'Please enter a ticker symbol', 'error');
        return;
      }
      
      const response = await fetch('/admin/momentum/set-ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: ticker })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showAlert('momentumAlert', \`Momentum ticker set to: \${ticker}\`, 'success');
        await refreshStatus();
      } else {
        showAlert('momentumAlert', data.reason || 'Failed to set ticker', 'error');
      }
    }
    
    async function clearMomentumTicker() {
      const response = await fetch('/admin/momentum/clear-ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        document.getElementById('momentumTicker').value = '';
        showAlert('momentumAlert', 'Momentum ticker cleared', 'success');
        await refreshStatus();
      }
    }
    
    async function resetAutoStop() {
      const response = await fetch('/admin/reset-auto-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      alert(data.message);
      
      if (response.ok) {
        await refreshStatus();
      }
    }
    
    function showAlert(elementId, message, type) {
      const alert = document.getElementById(elementId);
      alert.className = \`alert alert-\${type} show\`;
      alert.textContent = message;
      
      setTimeout(() => {
        alert.classList.remove('show');
      }, 5000);
    }
    
    async function refreshStatus() {
      const state = await fetchState();
      const strategies = await fetchStrategies();
      
      // Kill switch
      const killSwitch = document.getElementById('killSwitch');
      const killSwitchText = document.getElementById('killSwitchText');
      const killSwitchStatus = document.getElementById('killSwitchStatus');
      
      if (state.state.killSwitch) {
        killSwitch.className = 'kill-switch active';
        killSwitchText.textContent = 'ACTIVE';
        killSwitchStatus.textContent = 'All trading disabled';
      } else {
        killSwitch.className = 'kill-switch inactive';
        killSwitchText.textContent = 'OFF';
        killSwitchStatus.textContent = 'Trading enabled';
      }
      
      // System status
      document.getElementById('systemStatus').textContent = state.state.killSwitch ? 'Stopped' : 'Running';
      document.getElementById('autoStopStatus').textContent = state.state.autoStopTriggered ? 'TRIGGERED' : 'Normal';
      document.getElementById('errorCount').textContent = state.state.consecutiveErrors || 0;
      
      // Momentum strategy
      const momentumTicker = state.state.momentumDailyTicker;
      const momentumStatus = document.getElementById('momentumStatus');
      
      if (momentumTicker) {
        momentumStatus.className = 'status-badge status-online';
        momentumStatus.textContent = \`Active: \${momentumTicker}\`;
        document.getElementById('momentumTicker').value = momentumTicker;
      } else {
        momentumStatus.className = 'status-badge status-warning';
        momentumStatus.textContent = 'No ticker set';
      }
      
      // Bread & Butter strategy
      if (strategies.strategies && strategies.strategies.bread_and_butter) {
        const bb = strategies.strategies.bread_and_butter;
        document.getElementById('bbSymbols').textContent = bb.symbols.join(', ');
        document.getElementById('bbMaxTrades').textContent = bb.tradesPerDay;
        document.getElementById('bbCurrentTrades').textContent = bb.currentTrades;
      }
      
      // Trade statistics
      const tradeStatsDiv = document.getElementById('tradeStats');
      tradeStatsDiv.innerHTML = '';
      
      if (state.state.tradesPerSymbol) {
        for (const [symbol, count] of Object.entries(state.state.tradesPerSymbol)) {
          const stat = document.createElement('div');
          stat.className = 'stat';
          stat.innerHTML = \`
            <span class="stat-label">\${symbol}</span>
            <span class="stat-value">\${count} trades</span>
          \`;
          tradeStatsDiv.appendChild(stat);
        }
      }
      
      if (tradeStatsDiv.innerHTML === '') {
        tradeStatsDiv.innerHTML = '<p style="color: #718096;">No trades today</p>';
      }
    }
    
    // Initial load
    refreshStatus();
    
    // Auto-refresh every 5 seconds
    setInterval(refreshStatus, 5000);
  </script>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;

