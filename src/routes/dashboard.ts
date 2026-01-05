/**
 * Dashboard API Routes
 * Real-time position tracking, order history, and performance stats
 */

import { Router, Request, Response } from 'express';
import { positionManager } from '../services/positionManager';
import { orderTracker } from '../services/orderTracker';
import { logger } from '../logger';

const router = Router();

/**
 * GET /api/positions - Get all open positions
 */
router.get('/positions', (req: Request, res: Response) => {
  try {
    const update = positionManager.getPositionUpdate();
    
    res.json({
      success: true,
      data: {
        positions: update.positions,
        summary: {
          totalPositions: update.positions.length,
          totalValue: update.totalValue,
          totalPnL: update.totalPnL,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error fetching positions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch positions',
    });
  }
});

/**
 * GET /api/positions/:symbol - Get position for specific symbol
 */
router.get('/positions/:symbol', (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const position = positionManager.getPosition(symbol.toUpperCase());
    
    if (!position) {
      return res.status(404).json({
        success: false,
        error: `No position found for ${symbol}`,
      });
    }
    
    res.json({
      success: true,
      data: position,
    });
  } catch (error: any) {
    logger.error('Error fetching position', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch position',
    });
  }
});

/**
 * GET /api/orders - Get recent orders
 */
router.get('/orders', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const orders = orderTracker.getRecentOrders(limit);
    
    res.json({
      success: true,
      data: {
        orders,
        count: orders.length,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching orders', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
    });
  }
});

/**
 * GET /api/orders/today - Get today's orders
 */
router.get('/orders/today', (req: Request, res: Response) => {
  try {
    const orders = orderTracker.getTodaysOrders();
    
    res.json({
      success: true,
      data: {
        orders,
        count: orders.length,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching today orders', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
    });
  }
});

/**
 * GET /api/performance - Get performance stats
 */
router.get('/performance', (req: Request, res: Response) => {
  try {
    const daily = orderTracker.getDailyPerformance();
    
    res.json({
      success: true,
      data: {
        today: daily,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching performance', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance',
    });
  }
});

/**
 * GET /api/account - Get account summary
 */
router.get('/account', (req: Request, res: Response) => {
  try {
    const positions = positionManager.getAllPositions();
    const totalPnL = positionManager.getTotalPnL();
    const dailyPerf = orderTracker.getDailyPerformance();
    
    // Mock account data (would come from IBKR in production)
    const balance = 1000000; // Paper trading starting balance
    const equity = balance + totalPnL;
    
    res.json({
      success: true,
      data: {
        balance,
        equity,
        totalPnL,
        dayPnL: dailyPerf.netPnL,
        openPositions: positions.length,
        openPositionsValue: positions.reduce((sum, p) => sum + p.value, 0),
        todayTrades: dailyPerf.totalTrades,
        winRate: dailyPerf.winRate,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching account', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account',
    });
  }
});

export default router;

