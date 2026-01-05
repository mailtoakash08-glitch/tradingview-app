/**
 * Admin endpoints for kill-switch and configuration
 */

import { Router, Request, Response } from 'express';
import { riskManager } from '../services/riskManager';
import { stateStore } from '../services/stateStore';
import { logger } from '../logger';

const router = Router();

/**
 * GET /admin/kill-switch
 * Get current kill-switch status
 */
router.get('/kill-switch', (req: Request, res: Response) => {
  const enabled = riskManager.isKillSwitchOn();

  res.status(200).json({
    killSwitch: enabled,
    message: enabled
      ? 'Kill-switch is ENABLED - all trading disabled'
      : 'Kill-switch is DISABLED - trading enabled',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /admin/kill-switch
 * Enable or disable kill-switch
 * Body: { "enabled": true/false }
 */
router.post('/kill-switch', (req: Request, res: Response) => {
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({
      status: 'error',
      reason: 'Invalid request body. Expected: { "enabled": true/false }',
    });
  }

  riskManager.setKillSwitch(enabled);

  logger.warn('Kill-switch updated via admin API', {
    enabled,
    ip: req.ip,
  });

  res.status(200).json({
    status: 'ok',
    killSwitch: enabled,
    message: enabled
      ? 'Kill-switch ENABLED - all trading disabled'
      : 'Kill-switch DISABLED - trading enabled',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /admin/state
 * Get current application state
 */
router.get('/state', (req: Request, res: Response) => {
  const state = stateStore.getState();

  res.status(200).json({
    status: 'ok',
    state,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /admin/reset-counters
 * Manually reset daily trade counters
 */
router.post('/reset-counters', (req: Request, res: Response) => {
  logger.warn('Manual counter reset via admin API', { ip: req.ip });

  // Reset by getting state and clearing (stateStore handles this internally)
  // For now, this is a placeholder - in production you'd want more granular control
  
  res.status(200).json({
    status: 'ok',
    message: 'Counter reset is handled automatically at midnight',
    note: 'To implement manual reset, extend stateStore with a reset method',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /admin/momentum/ticker
 * Get current momentum daily ticker
 */
router.get('/momentum/ticker', (req: Request, res: Response) => {
  const ticker = riskManager.getMomentumDailyTicker();

  res.status(200).json({
    status: 'ok',
    momentumDailyTicker: ticker,
    isSet: ticker !== null,
    message: ticker 
      ? `Momentum ticker set to: ${ticker}`
      : 'No momentum ticker set for today',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /admin/momentum/set-ticker
 * Set momentum strategy daily ticker
 * Body: { "symbol": "AAPL" }
 */
router.post('/momentum/set-ticker', (req: Request, res: Response) => {
  const { symbol } = req.body;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      status: 'error',
      reason: 'Invalid request body. Expected: { "symbol": "AAPL" }',
    });
  }

  const normalizedSymbol = symbol.trim().toUpperCase();

  riskManager.setMomentumDailyTicker(normalizedSymbol);

  logger.warn('Momentum daily ticker set via admin API', {
    symbol: normalizedSymbol,
    ip: req.ip,
  });

  res.status(200).json({
    status: 'ok',
    momentumDailyTicker: normalizedSymbol,
    message: `Momentum ticker set to: ${normalizedSymbol}`,
    note: 'This ticker will be cleared automatically at midnight',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /admin/momentum/clear-ticker
 * Clear momentum daily ticker
 */
router.post('/momentum/clear-ticker', (req: Request, res: Response) => {
  riskManager.clearMomentumDailyTicker();

  logger.warn('Momentum daily ticker cleared via admin API', { ip: req.ip });

  res.status(200).json({
    status: 'ok',
    message: 'Momentum daily ticker cleared',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /admin/reset-auto-stop
 * Reset auto-stop after fixing errors
 */
router.post('/reset-auto-stop', (req: Request, res: Response) => {
  const state = stateStore.getState();

  if (!state.autoStopTriggered) {
    return res.status(200).json({
      status: 'ok',
      message: 'Auto-stop is not currently triggered',
      timestamp: new Date().toISOString(),
    });
  }

  riskManager.resetAutoStop();

  logger.warn('Auto-stop reset via admin API', { ip: req.ip });

  res.status(200).json({
    status: 'ok',
    message: 'Auto-stop has been reset. Trading can resume if kill-switch is also disabled.',
    note: 'Make sure to fix underlying issues before resetting auto-stop',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /admin/strategies
 * Get strategy status and configuration
 */
router.get('/strategies', (req: Request, res: Response) => {
  const state = stateStore.getState();
  const momentumTicker = riskManager.getMomentumDailyTicker();

  res.status(200).json({
    status: 'ok',
    strategies: {
      bread_and_butter: {
        enabled: true, // From config
        symbols: ['AAPL', 'MSFT'], // From config
        tradesPerDay: 10, // From config
        currentTrades: state.tradesPerStrategy?.bread_and_butter || 0,
      },
      momentum: {
        enabled: true, // From config
        dailyTicker: momentumTicker,
        tickerIsSet: momentumTicker !== null,
        maxTradesPerDay: 20, // From config
        currentTrades: state.tradesPerStrategy?.momentum || 0,
      },
      manual_bmnr: {
        enabled: false,
        note: 'Manual trading only - automation disabled',
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// TODO: Add authentication/authorization middleware for admin routes
// Example:
// router.use(authMiddleware);
// router.use(adminRoleMiddleware);

export default router;

