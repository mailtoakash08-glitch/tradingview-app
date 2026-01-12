/**
 * Dashboard API Routes
 * Real-time position tracking, order history, and performance stats
 * Now loads data from PostgreSQL database for persistence
 */

import { Router, Request, Response } from 'express';
import { positionManager } from '../services/positionManager';
import { orderTracker } from '../services/orderTracker';
import { positionRepository } from '../repositories/positionRepository';
import { orderRepository } from '../repositories/orderRepository';
import { logger } from '../logger';

const router = Router();

/**
 * GET /api/positions - Get all open positions (from database)
 */
router.get('/positions', async (req: Request, res: Response) => {
  try {
    // Load from database instead of in-memory
    const openPositions = await positionRepository.getOpen();
    
    // Calculate summary
    const totalValue = openPositions.reduce((sum, p) => sum + (p.quantity * p.currentPrice), 0);
    const totalPnL = openPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    
    res.json({
      success: true,
      data: {
        positions: openPositions.map(p => ({
          symbol: p.symbol,
          quantity: p.quantity,
          avgEntryPrice: p.avgEntryPrice,
          currentPrice: p.currentPrice,
          unrealizedPnL: p.unrealizedPnL,
          realizedPnL: p.realizedPnL,
          value: p.quantity * p.currentPrice,
          broker: p.broker,
          strategy: p.strategy,
          openedAt: p.openedAt,
        })),
        summary: {
          totalPositions: openPositions.length,
          totalValue,
          totalPnL,
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
router.get('/positions/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const broker = (req.query.broker as string) || 'demo'; // Default to demo if not specified
    const position = await positionRepository.getBySymbol(symbol.toUpperCase(), broker);
    
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
 * GET /api/orders - Get recent orders (from database)
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const orders = await orderRepository.getAll({ limit });
    
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
 * GET /api/orders/pending - Get pending orders (from database)
 */
router.get('/orders/pending', async (req: Request, res: Response) => {
  try {
    const pendingOrders = await orderRepository.getPending();
    
    res.json({
      success: true,
      data: {
        orders: pendingOrders,
        count: pendingOrders.length,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching pending orders', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending orders',
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
 * GET /api/account - Get account summary (from database)
 */
router.get('/account', async (req: Request, res: Response) => {
  try {
    const positions = await positionRepository.getOpen();
    const totalPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL + (p.realizedPnL || 0), 0);
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
        openPositionsValue: positions.reduce((sum, p) => sum + (p.quantity * p.currentPrice), 0),
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

/**
 * POST /api/orders/:orderId/cancel - Cancel a pending order
 */
router.post('/orders/:orderId/cancel', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    
    // Get the order from database
    const order = await orderRepository.getById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }
    
    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel order with status: ${order.status}`,
      });
    }
    
    // Update order status to CANCELLED
    await orderRepository.update(orderId, {
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
    });
    
    logger.info('Order cancelled', { orderId, symbol: order.symbol, broker: order.broker });
    
    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error: any) {
    logger.error('Error cancelling order', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
    });
  }
});

/**
 * POST /api/positions/:symbol/close - Close a position by placing opposite order
 */
router.post('/positions/:symbol/close', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const broker = (req.query.broker as string) || 'demo';
    
    // Get position from database
    const position = await positionRepository.getBySymbol(symbol.toUpperCase(), broker);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        error: `No open position found for ${symbol}`,
      });
    }
    
    // Close the position in database
    await positionRepository.close(symbol.toUpperCase(), broker, position.unrealizedPnL);
    
    logger.info('Position closed', { symbol, broker, pnl: position.unrealizedPnL });
    
    res.json({
      success: true,
      message: 'Position closed successfully',
      data: {
        symbol,
        closedPnL: position.unrealizedPnL,
      },
    });
  } catch (error: any) {
    logger.error('Error closing position', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to close position',
    });
  }
});

export default router;

