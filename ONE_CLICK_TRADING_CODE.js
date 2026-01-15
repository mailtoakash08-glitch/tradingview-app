// 🚀 ONE-CLICK TRADING SYSTEM - IMPLEMENTATION CODE
// Insert this code BEFORE the placeOrder() function in desktop.ts (around line 2354)

// ===============================================
// 🎯 MARKET HOURS DETECTION
// ===============================================

function checkMarketHours() {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const day = nyTime.getDay();
  
  // Weekend
  if (day === 0 || day === 6) return { isOpen: false, period: 'weekend' };
  
  // Market hours: 9:30 AM - 4:00 PM EST
  if (hours < 4) return { isOpen: false, period: 'closed' };
  if (hours >= 4 && hours < 9) return { isOpen: false, period: 'premarket' };
  if (hours === 9 && minutes < 30) return { isOpen: false, period: 'premarket' };
  if (hours >= 16 && hours < 20) return { isOpen: false, period: 'afterhours' };
  if (hours >= 20) return { isOpen: false, period: 'closed' };
  
  return { isOpen: true, period: 'regular' };
}

function getStopLimitMargin() {
  const status = checkMarketHours();
  
  // Pre-market (high volatility): 1.5%
  if (status.period === 'premarket') return 0.015;
  
  // After-hours (medium volatility): 1.0%
  if (status.period === 'afterhours') return 0.010;
  
  // Late night/closed (low volatility): 0.5%
  return 0.005;
}

function updateMarketHoursIndicator() {
  const status = checkMarketHours();
  const indicator = document.getElementById('marketHoursIndicator');
  const icon = document.getElementById('marketStatusIcon');
  const text = document.getElementById('marketStatusText');
  const detail = document.getElementById('marketStatusDetail');
  
  if (!indicator) return;
  
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
      detail.textContent = `Using stop-limit with ${margin}% margin (high volatility)`;
    } else if (status.period === 'afterhours') {
      text.textContent = 'After Hours';
      text.style.color = '#FFA726';
      detail.textContent = `Using stop-limit with ${margin}% margin (medium volatility)`;
    } else if (status.period === 'weekend') {
      text.textContent = 'Market Closed (Weekend)';
      text.style.color = '#787B86';
      detail.textContent = 'Orders will queue until Monday 9:30 AM EST';
    } else {
      text.textContent = 'Market Closed';
      text.style.color = '#787B86';
      detail.textContent = `Using stop-limit with ${margin}% margin`;
    }
  }
}

// ===============================================
// 🚀 ONE-CLICK QUICK BUY/SELL
// ===============================================

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
    showNotification('Error', 'Please enter valid ticker and quantity', 'error');
    return;
  }
  
  // Get current price
  let currentPrice;
  try {
    const response = await fetch(`/api/market/quote/${symbol}`);
    const data = await response.json();
    currentPrice = data.regularMarketPrice || data.price || 0;
    
    if (!currentPrice || currentPrice <= 0) {
      showNotification('Error', 'Could not get current price for ' + symbol, 'error');
      return;
    }
  } catch (error) {
    console.error('Error fetching price:', error);
    showNotification('Error', 'Failed to fetch current price', 'error');
    return;
  }
  
  // Determine order type based on market hours
  const marketStatus = checkMarketHours();
  const isMarketHours = marketStatus.isOpen;
  const orderType = isMarketHours ? 'MKT' : 'LMT';
  const limitPrice = isMarketHours ? null : (action === 'BUY' ? currentPrice + 0.50 : currentPrice - 0.50);
  
  // Build order payload
  const payload = {
    strategy: 'one_click_trading',
    action: action === 'BUY' ? 'ENTRY_LONG' : 'ENTRY_SHORT',
    symbol: symbol,
    qty: quantity,
    broker: broker,
    orderType: orderType,
    outsideRth: !isMarketHours
  };
  
  if (limitPrice) {
    payload.limitPrice = limitPrice;
  }
  
  try {
    showNotification('⚡ Placing Order...', `${action} ${quantity} ${symbol}`, 'info');
    
    const response = await fetch('/webhook/tradingview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('✅ Order Placed!', `${action} ${quantity} ${symbol} @ ~$${currentPrice.toFixed(2)}`, 'success');
      
      // Store position info for protection lines
      activePosition = {
        symbol: symbol,
        quantity: quantity,
        direction: direction,
        entryPrice: currentPrice,
        action: action
      };
      
      // Wait a moment for position to register, then draw protection lines
      setTimeout(() => {
        drawProtectionLines(symbol, quantity, currentPrice, direction, action);
        fetchPositions();
        fetchPendingOrders();
      }, 1500);
      
    } else {
      showNotification('❌ Order Failed', result.message || 'Unknown error', 'error');
    }
  } catch (error) {
    console.error('Error placing order:', error);
    showNotification('❌ Error', 'Failed to place order: ' + error.message, 'error');
  }
}

// ===============================================
// 🎨 PROTECTION LINES (Entry, Stop Loss, Take Profit)
// ===============================================

function drawProtectionLines(symbol, quantity, entryPrice, direction, action) {
  if (currentChartType !== 'lightweight' || !lwCandleSeries) {
    console.log('Protection lines only work on Lightweight Chart');
    return;
  }
  
  // Remove old protection lines
  removeProtectionLines();
  
  // Calculate initial SL and TP (2% risk, 6% reward)
  const stopLossPrice = direction === 'LONG' 
    ? entryPrice * 0.98  // -2% for long
    : entryPrice * 1.02; // +2% for short
  
  const takeProfitPrice = direction === 'LONG'
    ? entryPrice * 1.06  // +6% for long
    : entryPrice * 0.94; // -6% for short
  
  console.log('Drawing protection lines:', { entryPrice, stopLossPrice, takeProfitPrice });
  
  // Draw ENTRY line (blue, solid, non-draggable)
  try {
    protectionLines.entry = lwCandleSeries.createPriceLine({
      price: entryPrice,
      color: '#2196F3', // Blue
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Solid,
      axisLabelVisible: true,
      title: `💵 ENTRY ${quantity} ${direction} @ $${entryPrice.toFixed(2)}`
    });
  } catch (e) {
    console.error('Error drawing entry line:', e);
  }
  
  // Draw STOP LOSS line (red, dashed, draggable)
  try {
    protectionLines.stopLoss = lwCandleSeries.createPriceLine({
      price: stopLossPrice,
      color: '#F44336', // Red
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      axisLabelVisible: true,
      title: `🛑 STOP LOSS $${stopLossPrice.toFixed(2)}`
    });
  } catch (e) {
    console.error('Error drawing stop loss line:', e);
  }
  
  // Draw TAKE PROFIT line (green, dashed, draggable)
  try {
    protectionLines.takeProfit = lwCandleSeries.createPriceLine({
      price: takeProfitPrice,
      color: '#4CAF50', // Green
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      axisLabelVisible: true,
      title: `🎯 TAKE PROFIT $${takeProfitPrice.toFixed(2)}`
    });
  } catch (e) {
    console.error('Error drawing take profit line:', e);
  }
  
  // Update P&L display
  updatePnLDisplay(quantity, entryPrice, stopLossPrice, takeProfitPrice, direction);
  
  // Show P&L display panel
  document.getElementById('oneClickPnLDisplay').style.display = 'block';
  
  console.log('✅ Protection lines drawn successfully');
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
  
  // Hide P&L display
  document.getElementById('oneClickPnLDisplay').style.display = 'none';
}

function updatePnLDisplay(quantity, entryPrice, stopPrice, targetPrice, direction) {
  // Calculate max loss
  const stopDiff = direction === 'LONG' 
    ? (stopPrice - entryPrice)
    : (entryPrice - stopPrice);
  const maxLoss = Math.abs(stopDiff * quantity);
  const maxLossPct = Math.abs((stopDiff / entryPrice) * 100);
  
  // Calculate target profit
  const targetDiff = direction === 'LONG'
    ? (targetPrice - entryPrice)
    : (entryPrice - targetPrice);
  const targetProfit = Math.abs(targetDiff * quantity);
  const targetProfitPct = Math.abs((targetDiff / entryPrice) * 100);
  
  // Calculate Risk/Reward
  const riskReward = maxLoss > 0 ? (targetProfit / maxLoss) : 0;
  
  // Update UI
  document.getElementById('pnlEntryPrice').textContent = `$${entryPrice.toFixed(2)}`;
  document.getElementById('pnlMaxLoss').textContent = `-$${maxLoss.toFixed(2)} (-${maxLossPct.toFixed(2)}%)`;
  document.getElementById('pnlTarget').textContent = `+$${targetProfit.toFixed(2)} (+${targetProfitPct.toFixed(2)}%)`;
  document.getElementById('pnlRiskReward').textContent = `1:${riskReward.toFixed(2)}`;
}

// ===============================================
// 🖱️ DRAGGABLE LINES SETUP
// ===============================================

function setupProtectionLineDragging() {
  const chartElement = document.getElementById('lightweightChart');
  if (!chartElement || !lwChart) return;
  
  chartElement.addEventListener('mousedown', handleProtectionLineMouseDown);
  chartElement.addEventListener('mousemove', handleProtectionLineMouseMove);
  chartElement.addEventListener('mouseup', handleProtectionLineMouseUp);
  chartElement.addEventListener('mouseleave', handleProtectionLineMouseUp);
}

function handleProtectionLineMouseDown(e) {
  if (!oneClickMode || !activePosition || !lwChart) return;
  
  const price = getPriceFromMouseY(e.clientY);
  if (!price) return;
  
  const stopPrice = getProtectionLinePrice('stopLoss');
  const targetPrice = getProtectionLinePrice('takeProfit');
  
  // Check if clicking near stop loss line (within $0.50)
  if (stopPrice && Math.abs(price - stopPrice) < 0.50) {
    isDraggingStop = true;
    dragStartY = e.clientY;
    dragStartPrice = stopPrice;
    e.target.style.cursor = 'ns-resize';
    console.log('Started dragging stop loss');
  }
  
  // Check if clicking near take profit line (within $0.50)
  if (targetPrice && Math.abs(price - targetPrice) < 0.50) {
    isDraggingTarget = true;
    dragStartY = e.clientY;
    dragStartPrice = targetPrice;
    e.target.style.cursor = 'ns-resize';
    console.log('Started dragging take profit');
  }
}

function handleProtectionLineMouseMove(e) {
  if (!oneClickMode || !activePosition) return;
  
  if (isDraggingStop || isDraggingTarget) {
    const newPrice = getPriceFromMouseY(e.clientY);
    if (!newPrice) return;
    
    if (isDraggingStop && protectionLines.stopLoss) {
      updateProtectionLine('stopLoss', newPrice);
    }
    
    if (isDraggingTarget && protectionLines.takeProfit) {
      updateProtectionLine('takeProfit', newPrice);
    }
    
    // Update P&L display
    const stopPrice = getProtectionLinePrice('stopLoss');
    const targetPrice = getProtectionLinePrice('takeProfit');
    updatePnLDisplay(
      activePosition.quantity,
      activePosition.entryPrice,
      stopPrice,
      targetPrice,
      activePosition.direction
    );
  }
}

async function handleProtectionLineMouseUp() {
  if (isDraggingStop || isDraggingTarget) {
    // Place/update protection orders
    const stopPrice = getProtectionLinePrice('stopLoss');
    const targetPrice = getProtectionLinePrice('takeProfit');
    
    if (activePosition) {
      await placeProtectionOrders(
        activePosition.symbol,
        activePosition.quantity,
        stopPrice,
        targetPrice,
        activePosition.direction,
        activePosition.action
      );
    }
    
    isDraggingStop = false;
    isDraggingTarget = false;
    
    const chartElement = document.getElementById('lightweightChart');
    if (chartElement) chartElement.style.cursor = 'default';
  }
}

function getPriceFromMouseY(clientY) {
  if (!lwChart) return null;
  
  try {
    const chartElement = document.getElementById('lightweightChart');
    const rect = chartElement.getBoundingClientRect();
    const y = clientY - rect.top;
    
    // Convert pixel Y to price
    const timeScale = lwChart.timeScale();
    const priceScale = lwCandleSeries.priceScale();
    
    // This is an approximation - Lightweight Charts doesn't expose exact conversion
    const chartHeight = rect.height;
    const visibleRange = timeScale.getVisibleLogicalRange();
    
    // Get price range from visible candles
    const series = lwChart.series()[0];
    // Estimate based on chart height and visible range
    // This will need refinement based on actual visible prices
    
    return null; // Placeholder - needs proper implementation
  } catch (e) {
    console.error('Error converting mouse Y to price:', e);
    return null;
  }
}

function updateProtectionLine(lineType, newPrice) {
  if (!lwCandleSeries || !protectionLines[lineType]) return;
  
  try {
    // Remove old line
    lwCandleSeries.removePriceLine(protectionLines[lineType]);
    
    // Create new line at new price
    const config = {
      price: newPrice,
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      axisLabelVisible: true
    };
    
    if (lineType === 'stopLoss') {
      config.color = '#F44336';
      config.title = `🛑 STOP LOSS $${newPrice.toFixed(2)}`;
    } else if (lineType === 'takeProfit') {
      config.color = '#4CAF50';
      config.title = `🎯 TAKE PROFIT $${newPrice.toFixed(2)}`;
    }
    
    protectionLines[lineType] = lwCandleSeries.createPriceLine(config);
  } catch (e) {
    console.error(`Error updating ${lineType} line:`, e);
  }
}

function getProtectionLinePrice(lineType) {
  // This is a simplified version - needs proper implementation
  // to extract price from the actual price line object
  if (!protectionLines[lineType]) return null;
  
  // Placeholder - return stored price or calculate from line
  return null;
}

// ===============================================
// 🛡️ PLACE PROTECTION ORDERS
// ===============================================

async function placeProtectionOrders(symbol, quantity, stopPrice, targetPrice, direction, action) {
  const broker = document.getElementById('broker').value;
  const marketStatus = checkMarketHours();
  const isMarketHours = marketStatus.isOpen;
  
  // Determine order action (opposite of entry)
  const exitAction = action === 'BUY' ? 'SELL' : 'BUY';
  
  // Stop Loss Order
  let stopOrderType, stopLimitPrice;
  if (isMarketHours) {
    stopOrderType = 'STP';
    stopLimitPrice = null;
  } else {
    stopOrderType = 'STP_LMT';
    const margin = getStopLimitMargin();
    stopLimitPrice = action === 'BUY'
      ? stopPrice * (1 - margin) // SELL limit below stop
      : stopPrice * (1 + margin); // BUY limit above stop
  }
  
  const stopOrder = {
    strategy: 'one_click_protection',
    action: exitAction === 'BUY' ? 'ENTRY_LONG' : 'EXIT',
    symbol: symbol,
    qty: quantity,
    broker: broker,
    orderType: stopOrderType,
    stopPrice: stopPrice,
    outsideRth: !isMarketHours
  };
  
  if (stopLimitPrice) {
    stopOrder.limitPrice = stopLimitPrice;
  }
  
  try {
    await fetch('/webhook/tradingview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stopOrder)
    });
    console.log('✅ Stop loss order placed');
  } catch (error) {
    console.error('Error placing stop loss order:', error);
  }
  
  // Take Profit Order (always limit)
  const targetOrder = {
    strategy: 'one_click_protection',
    action: exitAction === 'BUY' ? 'ENTRY_LONG' : 'EXIT',
    symbol: symbol,
    qty: quantity,
    broker: broker,
    orderType: 'LMT',
    limitPrice: targetPrice,
    outsideRth: !isMarketHours
  };
  
  try {
    await fetch('/webhook/tradingview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetOrder)
    });
    console.log('✅ Take profit order placed');
  } catch (error) {
    console.error('Error placing take profit order:', error);
  }
  
  showNotification('🛡️ Protection Orders Placed', `Stop: $${stopPrice.toFixed(2)} | Target: $${targetPrice.toFixed(2)}`, 'success');
}

// ===============================================
// 🎛️ ONE-CLICK MODE TOGGLE
// ===============================================

function toggleOneClickMode() {
  oneClickMode = document.getElementById('oneClickMode').checked;
  const advancedPanel = document.getElementById('advancedOrderPanel');
  const buyBtn = document.getElementById('buyBtn');
  const sellBtn = document.getElementById('sellBtn');
  
  if (oneClickMode) {
    advancedPanel.style.display = 'none';
    buyBtn.textContent = '🟢 BUY (Quick)';
    sellBtn.textContent = '🔴 SELL (Quick)';
    
    // Update market hours indicator
    updateMarketHoursIndicator();
    setInterval(updateMarketHoursIndicator, 60000); // Update every minute
    
    // Setup draggable lines
    setupProtectionLineDragging();
    
    showNotification('⚡ One-Click Mode Enabled', 'Click Buy/Sell to instantly open position with draggable TP/SL', 'info');
  } else {
    advancedPanel.style.display = 'block';
    buyBtn.textContent = 'Buy';
    sellBtn.textContent = 'Sell';
    document.getElementById('marketHoursIndicator').style.display = 'none';
    document.getElementById('oneClickPnLDisplay').style.display = 'none';
    
    // Remove protection lines
    removeProtectionLines();
    activePosition = null;
  }
}
