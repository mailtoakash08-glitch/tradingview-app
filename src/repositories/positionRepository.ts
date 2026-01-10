/**
 * Position Repository
 * Handles all database operations for positions
 */

import prisma from '../services/database';

export interface Position {
  id?: number;
  symbol: string;
  broker: string;
  strategy: string;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  realizedPnL?: number;
  openedAt?: Date | string;
  closedAt?: Date | string | null;
  isOpen: boolean;
}

export class PositionRepository {
  /**
   * Create or update a position
   */
  async upsert(position: Position): Promise<void> {
    try {
      await prisma.position.upsert({
        where: {
          symbol_broker_isOpen: {
            symbol: position.symbol,
            broker: position.broker,
            isOpen: true,
          },
        },
        update: {
          quantity: position.quantity,
          avgEntryPrice: position.avgEntryPrice,
          currentPrice: position.currentPrice,
          unrealizedPnL: position.unrealizedPnL,
          realizedPnL: position.realizedPnL || 0,
        },
        create: {
          symbol: position.symbol,
          broker: position.broker,
          strategy: position.strategy,
          quantity: position.quantity,
          avgEntryPrice: position.avgEntryPrice,
          currentPrice: position.currentPrice,
          unrealizedPnL: position.unrealizedPnL,
          realizedPnL: position.realizedPnL || 0,
          isOpen: true,
        },
      });
    } catch (error) {
      console.error('Error upserting position in database:', error);
      throw error;
    }
  }

  /**
   * Get all open positions
   */
  async getOpen(broker?: string): Promise<Position[]> {
    try {
      const where: any = { isOpen: true };
      if (broker) where.broker = broker;

      const positions = await prisma.position.findMany({
        where,
        orderBy: { openedAt: 'desc' },
      });

      return positions.map(this.mapToPosition);
    } catch (error) {
      console.error('Error fetching open positions from database:', error);
      return [];
    }
  }

  /**
   * Get position by symbol and broker
   */
  async getBySymbol(symbol: string, broker: string): Promise<Position | null> {
    try {
      const position = await prisma.position.findFirst({
        where: {
          symbol,
          broker,
          isOpen: true,
        },
      });

      return position ? this.mapToPosition(position) : null;
    } catch (error) {
      console.error('Error fetching position from database:', error);
      return null;
    }
  }

  /**
   * Close a position
   */
  async close(symbol: string, broker: string, realizedPnL: number): Promise<void> {
    try {
      await prisma.position.updateMany({
        where: {
          symbol,
          broker,
          isOpen: true,
        },
        data: {
          isOpen: false,
          closedAt: new Date(),
          realizedPnL,
        },
      });
    } catch (error) {
      console.error('Error closing position in database:', error);
      throw error;
    }
  }

  /**
   * Update position prices and P&L
   */
  async updatePrices(symbol: string, broker: string, currentPrice: number, unrealizedPnL: number): Promise<void> {
    try {
      await prisma.position.updateMany({
        where: {
          symbol,
          broker,
          isOpen: true,
        },
        data: {
          currentPrice,
          unrealizedPnL,
        },
      });
    } catch (error) {
      console.error('Error updating position prices in database:', error);
      throw error;
    }
  }

  /**
   * Get all positions (open and closed)
   */
  async getAll(filters?: {
    broker?: string;
    symbol?: string;
    isOpen?: boolean;
    limit?: number;
  }): Promise<Position[]> {
    try {
      const where: any = {};
      
      if (filters?.broker) where.broker = filters.broker;
      if (filters?.symbol) where.symbol = filters.symbol;
      if (filters?.isOpen !== undefined) where.isOpen = filters.isOpen;

      const positions = await prisma.position.findMany({
        where,
        orderBy: { openedAt: 'desc' },
        take: filters?.limit || 100,
      });

      return positions.map(this.mapToPosition);
    } catch (error) {
      console.error('Error fetching positions from database:', error);
      return [];
    }
  }

  /**
   * Map database position to internal position format
   */
  private mapToPosition(position: any): Position {
    return {
      id: position.id,
      symbol: position.symbol,
      broker: position.broker,
      strategy: position.strategy,
      quantity: position.quantity,
      avgEntryPrice: position.avgEntryPrice,
      currentPrice: position.currentPrice,
      unrealizedPnL: position.unrealizedPnL,
      realizedPnL: position.realizedPnL,
      openedAt: position.openedAt.toISOString(),
      closedAt: position.closedAt?.toISOString() || null,
      isOpen: position.isOpen,
    };
  }
}

export const positionRepository = new PositionRepository();

