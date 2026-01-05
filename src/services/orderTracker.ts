/**
 * Order Tracker - Tracks order status and history
 */

import { TrackedOrder, Trade, DailyPerformance } from '../types/dashboard';
import { logger } from '../logger';

class OrderTracker {
  private orders: Map<string, TrackedOrder> = new Map();
  private completedTrades: Trade[] = [];
  private orderCounter = 1;

  /**
   * Create and track a new order
   */
  trackOrder(order: Omit<TrackedOrder, 'orderId' | 'status' | 'filledQuantity' | 'submittedAt'>): string {
    const orderId = `ORD-${Date.now()}-${this.orderCounter++}`;

    const trackedOrder: TrackedOrder = {
      ...order,
      orderId,
      status: 'PENDING',
      filledQuantity: 0,
      submittedAt: new Date(),
    };

    this.orders.set(orderId, trackedOrder);

    logger.info('Order tracked', {
      orderId,
      symbol: order.symbol,
      action: order.action,
      quantity: order.quantity,
    });

    return orderId;
  }

  /**
   * Update order status to filled
   */
  markFilled(
    orderId: string,
    fillPrice: number,
    commission: number = 0
  ): void {
    const order = this.orders.get(orderId);
    if (!order) {
      logger.warn('Order not found for fill update', { orderId });
      return;
    }

    order.status = 'FILLED';
    order.filledQuantity = order.quantity;
    order.avgFillPrice = fillPrice;
    order.commission = commission;
    order.filledAt = new Date();

    logger.info('Order marked as filled', {
      orderId,
      symbol: order.symbol,
      fillPrice,
    });
  }

  /**
   * Update order status to partially filled
   */
  markPartiallyFilled(
    orderId: string,
    filledQuantity: number,
    avgFillPrice: number
  ): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.status = 'PARTIALLY_FILLED';
    order.filledQuantity = filledQuantity;
    order.avgFillPrice = avgFillPrice;

    logger.info('Order partially filled', {
      orderId,
      filledQuantity,
      totalQuantity: order.quantity,
    });
  }

  /**
   * Mark order as rejected
   */
  markRejected(orderId: string, reason: string): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.status = 'REJECTED';
    order.reason = reason;

    logger.info('Order rejected', { orderId, reason });
  }

  /**
   * Mark order as cancelled
   */
  markCancelled(orderId: string): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    order.status = 'CANCELLED';

    logger.info('Order cancelled', { orderId });
  }

  /**
   * Get order by ID
   */
  getOrderById(orderId: string): TrackedOrder | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Get order by ID (alias for compatibility)
   */
  getOrder(orderId: string): TrackedOrder | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Update order status based on IBKR status
   */
  updateOrderStatus(
    orderId: string,
    status: string,
    filledQuantity: number = 0,
    avgFillPrice: number = 0
  ): void {
    const order = this.orders.get(orderId);
    if (!order) {
      logger.warn('Order not found for status update', { orderId, status });
      return;
    }

    // Map IBKR status to our status
    switch (status) {
      case 'Filled':
        order.status = 'FILLED';
        order.filledQuantity = order.quantity;
        order.avgFillPrice = avgFillPrice;
        order.filledAt = new Date();
        break;
      case 'PartiallyFilled':
        order.status = 'PARTIALLY_FILLED';
        order.filledQuantity = filledQuantity;
        order.avgFillPrice = avgFillPrice;
        break;
      case 'Cancelled':
        order.status = 'CANCELLED';
        break;
      case 'Submitted':
      case 'PreSubmitted':
        order.status = 'PENDING';
        break;
      case 'Inactive':
        order.status = 'REJECTED';
        order.reason = 'Order inactive';
        break;
      default:
        logger.debug('Unknown order status', { orderId, status });
    }

    logger.info('Order status updated', {
      orderId,
      status: order.status,
      filledQuantity: order.filledQuantity,
      avgFillPrice: order.avgFillPrice,
    });
  }

  /**
   * Get all orders
   */
  getAllOrders(): TrackedOrder[] {
    return Array.from(this.orders.values());
  }

  /**
   * Get recent orders (last N)
   */
  getRecentOrders(limit: number = 50): TrackedOrder[] {
    const orders = this.getAllOrders();
    return orders
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get orders for specific symbol
   */
  getOrdersBySymbol(symbol: string): TrackedOrder[] {
    return Array.from(this.orders.values()).filter(
      (order) => order.symbol === symbol
    );
  }

  /**
   * Get orders by status
   */
  getOrdersByStatus(status: TrackedOrder['status']): TrackedOrder[] {
    return Array.from(this.orders.values()).filter(
      (order) => order.status === status
    );
  }

  /**
   * Get today's orders
   */
  getTodaysOrders(): TrackedOrder[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from(this.orders.values()).filter(
      (order) => order.submittedAt >= today
    );
  }

  /**
   * Record a completed trade
   */
  recordTrade(trade: Omit<Trade, 'id'>): void {
    const tradeWithId: Trade = {
      ...trade,
      id: `TRADE-${Date.now()}-${this.completedTrades.length + 1}`,
    };

    this.completedTrades.push(tradeWithId);

    logger.info('Trade recorded', {
      id: tradeWithId.id,
      symbol: trade.symbol,
      pnl: trade.pnl,
    });
  }

  /**
   * Get all completed trades
   */
  getAllTrades(): Trade[] {
    return this.completedTrades;
  }

  /**
   * Get today's trades
   */
  getTodaysTrades(): Trade[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.completedTrades.filter((trade) => trade.exitTime >= today);
  }

  /**
   * Calculate daily performance
   */
  getDailyPerformance(): DailyPerformance {
    const trades = this.getTodaysTrades();
    const totalTrades = trades.length;

    if (totalTrades === 0) {
      return {
        date: new Date().toISOString().split('T')[0],
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakEvenTrades: 0,
        totalPnL: 0,
        totalCommission: 0,
        netPnL: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        largestWin: 0,
        largestLoss: 0,
        trades: [],
      };
    }

    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl < 0);
    const breakEvenTrades = trades.filter((t) => t.pnl === 0);

    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalCommission = trades.reduce((sum, t) => sum + t.commission, 0);
    const netPnL = totalPnL - totalCommission;

    const winRate = (winningTrades.length / totalTrades) * 100;

    const avgWin =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) /
          winningTrades.length
        : 0;

    const avgLoss =
      losingTrades.length > 0
        ? Math.abs(
            losingTrades.reduce((sum, t) => sum + t.pnl, 0) /
              losingTrades.length
          )
        : 0;

    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(
      losingTrades.reduce((sum, t) => sum + t.pnl, 0)
    );
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

    const largestWin = Math.max(...trades.map((t) => t.pnl), 0);
    const largestLoss = Math.min(...trades.map((t) => t.pnl), 0);

    return {
      date: new Date().toISOString().split('T')[0],
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      totalPnL,
      totalCommission,
      netPnL,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      largestWin,
      largestLoss,
      trades,
    };
  }

  /**
   * Clear old orders (keep last 1000)
   */
  cleanup(): void {
    const orders = this.getAllOrders();
    if (orders.length <= 1000) return;

    const sorted = orders.sort(
      (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
    );
    const toKeep = sorted.slice(0, 1000);

    this.orders.clear();
    toKeep.forEach((order) => this.orders.set(order.orderId, order));

    logger.info('Order cleanup completed', {
      removed: orders.length - 1000,
      remaining: 1000,
    });
  }

  /**
   * Clear all data (for testing/reset)
   */
  clear(): void {
    this.orders.clear();
    this.completedTrades = [];
    this.orderCounter = 1;
    logger.info('Order tracker cleared');
  }
}

export const orderTracker = new OrderTracker();

