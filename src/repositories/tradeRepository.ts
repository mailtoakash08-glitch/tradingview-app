/**
 * Trade Repository
 * Handles all database operations for trades
 */

import prisma from '../services/database';

export interface Trade {
  id?: number;
  orderId: string;
  symbol: string;
  strategy: string;
  broker: string;
  side: 'LONG' | 'SHORT';
  action: 'ENTRY' | 'EXIT';
  quantity: number;
  price: number;
  commission?: number;
  pnl?: number;
  pnlPercent?: number;
  executedAt?: Date | string;
  positionId?: number;
}

export class TradeRepository {
  /**
   * Create a new trade
   */
  async create(trade: Trade): Promise<void> {
    try {
      await prisma.trade.create({
        data: {
          orderId: trade.orderId,
          symbol: trade.symbol,
          strategy: trade.strategy,
          broker: trade.broker,
          action: trade.action,
          quantity: trade.quantity,
          price: trade.price,
          commission: trade.commission,
          pnl: trade.pnl,
          executedAt: trade.executedAt ? new Date(trade.executedAt) : new Date(),
        },
      });
    } catch (error) {
      console.error('Error creating trade in database:', error);
      throw error;
    }
  }

  /**
   * Get all trades with optional filters
   */
  async getAll(filters?: {
    broker?: string;
    symbol?: string;
    limit?: number;
  }): Promise<Trade[]> {
    try {
      const where: any = {};
      
      if (filters?.broker) where.broker = filters.broker;
      if (filters?.symbol) where.symbol = filters.symbol;

      const trades = await prisma.trade.findMany({
        where,
        orderBy: { executedAt: 'desc' },
        take: filters?.limit || 100,
      });

      return trades.map(this.mapToTrade);
    } catch (error) {
      console.error('Error fetching trades from database:', error);
      return [];
    }
  }

  /**
   * Get trades for a specific position (NOT IMPLEMENTED - no positionId in schema)
   */
  async getByPosition(positionId: number): Promise<Trade[]> {
    // TODO: Add positionId to Trade schema if needed
    return [];
  }

  /**
   * Get today's trades
   */
  async getToday(broker?: string): Promise<Trade[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const where: any = {
        executedAt: {
          gte: today,
        },
      };
      
      if (broker) where.broker = broker;

      const trades = await prisma.trade.findMany({
        where,
        orderBy: { executedAt: 'desc' },
      });

      return trades.map(this.mapToTrade);
    } catch (error) {
      console.error('Error fetching today trades from database:', error);
      return [];
    }
  }

  /**
   * Calculate win rate
   */
  async getWinRate(broker?: string, days?: number): Promise<number> {
    try {
      const where: any = {
        action: 'EXIT',
        pnl: { not: null },
      };
      
      if (broker) where.broker = broker;
      
      if (days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        where.executedAt = { gte: startDate };
      }

      const trades = await prisma.trade.findMany({
        where,
        select: { pnl: true },
      });

      if (trades.length === 0) return 0;

      const winners = trades.filter(t => (t.pnl || 0) > 0).length;
      return (winners / trades.length) * 100;
    } catch (error) {
      console.error('Error calculating win rate from database:', error);
      return 0;
    }
  }

  /**
   * Map database trade to internal trade format
   */
  private mapToTrade(trade: any): Trade {
    return {
      id: trade.id,
      orderId: trade.orderId,
      symbol: trade.symbol,
      strategy: trade.strategy,
      broker: trade.broker,
      side: trade.side,
      action: trade.action,
      quantity: trade.quantity,
      price: trade.price,
      commission: trade.commission || undefined,
      pnl: trade.pnl || undefined,
      pnlPercent: trade.pnlPercent || undefined,
      executedAt: trade.executedAt.toISOString(),
      positionId: trade.positionId || undefined,
    };
  }
}

export const tradeRepository = new TradeRepository();

