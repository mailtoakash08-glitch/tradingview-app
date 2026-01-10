/**
 * Analytics Routes
 * Provides endpoints for trading analytics and reporting
 */

import express from 'express';
import { orderRepository } from '../repositories/orderRepository';
import { positionRepository } from '../repositories/positionRepository';
import { tradeRepository } from '../repositories/tradeRepository';
import prisma from '../services/database';

const router = express.Router();

/**
 * GET /api/analytics/summary
 * Get overall trading summary
 */
router.get('/summary', async (req, res) => {
  try {
    const broker = req.query.broker as string | undefined;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all trades in period
    const trades = await tradeRepository.getAll({ broker });
    const recentTrades = trades.filter(
      t => new Date(t.executedAt!) >= startDate
    );

    // Calculate metrics
    const totalTrades = recentTrades.length;
    const exitTrades = recentTrades.filter(t => t.action === 'EXIT' && t.pnl !== undefined);
    
    const totalPnL = exitTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winners = exitTrades.filter(t => (t.pnl || 0) > 0);
    const losers = exitTrades.filter(t => (t.pnl || 0) < 0);
    
    const winRate = exitTrades.length > 0 ? (winners.length / exitTrades.length) * 100 : 0;
    const avgWin = winners.length > 0 ? winners.reduce((sum, t) => sum + (t.pnl || 0), 0) / winners.length : 0;
    const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((sum, t) => sum + (t.pnl || 0), 0) / losers.length) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Get current positions
    const openPositions = await positionRepository.getOpen(broker);
    const totalUnrealizedPnL = openPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);

    res.json({
      success: true,
      data: {
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        trades: {
          total: totalTrades,
          completed: exitTrades.length,
          winners: winners.length,
          losers: losers.length,
        },
        performance: {
          totalPnL: parseFloat(totalPnL.toFixed(2)),
          unrealizedPnL: parseFloat(totalUnrealizedPnL.toFixed(2)),
          netPnL: parseFloat((totalPnL + totalUnrealizedPnL).toFixed(2)),
          winRate: parseFloat(winRate.toFixed(2)),
          avgWin: parseFloat(avgWin.toFixed(2)),
          avgLoss: parseFloat(avgLoss.toFixed(2)),
          profitFactor: parseFloat(profitFactor.toFixed(2)),
        },
        positions: {
          open: openPositions.length,
          totalValue: openPositions.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics summary',
    });
  }
});

/**
 * GET /api/analytics/daily
 * Get daily P&L breakdown
 */
router.get('/daily', async (req, res) => {
  try {
    const broker = req.query.broker as string | undefined;
    const days = parseInt(req.query.days as string) || 30;

    const result = await prisma.$queryRaw`
      SELECT 
        DATE("executedAt") as date,
        COUNT(*) as trades,
        SUM(CASE WHEN "pnl" > 0 THEN 1 ELSE 0 END) as winners,
        SUM(CASE WHEN "pnl" < 0 THEN 1 ELSE 0 END) as losers,
        SUM("pnl") as total_pnl,
        AVG("pnl") as avg_pnl,
        MAX("pnl") as best_trade,
        MIN("pnl") as worst_trade
      FROM "Trade"
      WHERE "executedAt" >= NOW() - INTERVAL '${days} days'
        AND "action" = 'EXIT'
        AND "pnl" IS NOT NULL
        ${broker ? `AND "broker" = '${broker}'` : ''}
      GROUP BY DATE("executedAt")
      ORDER BY date DESC
    `;

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily analytics',
    });
  }
});

/**
 * GET /api/analytics/by-symbol
 * Get performance breakdown by symbol
 */
router.get('/by-symbol', async (req, res) => {
  try {
    const broker = req.query.broker as string | undefined;
    const days = parseInt(req.query.days as string) || 30;

    const result = await prisma.$queryRaw`
      SELECT 
        symbol,
        COUNT(*) as trades,
        SUM(CASE WHEN "pnl" > 0 THEN 1 ELSE 0 END) as winners,
        SUM(CASE WHEN "pnl" < 0 THEN 1 ELSE 0 END) as losers,
        SUM("pnl") as total_pnl,
        AVG("pnl") as avg_pnl,
        SUM(CASE WHEN "pnl" > 0 THEN "pnl" ELSE 0 END) / NULLIF(SUM(CASE WHEN "pnl" < 0 THEN ABS("pnl") ELSE 0 END), 0) as profit_factor
      FROM "Trade"
      WHERE "executedAt" >= NOW() - INTERVAL '${days} days'
        AND "action" = 'EXIT'
        AND "pnl" IS NOT NULL
        ${broker ? `AND "broker" = '${broker}'` : ''}
      GROUP BY symbol
      ORDER BY total_pnl DESC
    `;

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching symbol analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch symbol analytics',
    });
  }
});

/**
 * GET /api/analytics/history
 * Get complete trade history
 */
router.get('/history', async (req, res) => {
  try {
    const broker = req.query.broker as string | undefined;
    const symbol = req.query.symbol as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;

    const trades = await tradeRepository.getAll({
      broker,
      symbol,
      limit,
    });

    res.json({
      success: true,
      data: {
        trades,
        total: trades.length,
      },
    });
  } catch (error) {
    console.error('Error fetching trade history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trade history',
    });
  }
});

/**
 * GET /api/analytics/orders
 * Get complete order history
 */
router.get('/orders', async (req, res) => {
  try {
    const broker = req.query.broker as string | undefined;
    const symbol = req.query.symbol as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;

    const orders = await orderRepository.getAll({
      broker,
      symbol,
      status,
      limit,
    });

    res.json({
      success: true,
      data: {
        orders,
        total: orders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order history',
    });
  }
});

/**
 * GET /api/analytics/positions
 * Get position history (open and closed)
 */
router.get('/positions', async (req, res) => {
  try {
    const broker = req.query.broker as string | undefined;
    const isOpen = req.query.isOpen === 'true' ? true : req.query.isOpen === 'false' ? false : undefined;
    const limit = parseInt(req.query.limit as string) || 100;

    const positions = await positionRepository.getAll({
      broker,
      isOpen,
      limit,
    });

    res.json({
      success: true,
      data: {
        positions,
        total: positions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching position history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch position history',
    });
  }
});

export default router;

