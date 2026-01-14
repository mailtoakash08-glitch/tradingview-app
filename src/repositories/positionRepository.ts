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
  // 🔒 Mutex to prevent race conditions when multiple execDetails events fire simultaneously
  private upsertLocks: Map<string, Promise<void>> = new Map();

  /**
   * Create or update a position (with race condition protection)
   */
  async upsert(position: Position): Promise<void> {
    // Create unique lock key for this symbol+broker combination
    const lockKey = `${position.symbol}-${position.broker}`;

    // Wait for any existing upsert operation to complete
    while (this.upsertLocks.has(lockKey)) {
      await this.upsertLocks.get(lockKey);
    }

    // Create new lock for this operation
    const operation = this._doUpsert(position);
    this.upsertLocks.set(lockKey, operation);

    try {
      await operation;
    } finally {
      // Release lock
      this.upsertLocks.delete(lockKey);
    }
  }

  /**
   * Internal upsert logic (protected by lock)
   */
  private async _doUpsert(position: Position): Promise<void> {
    try {
      // Since we removed the unique constraint, we need to manually check if position exists
      const existingPosition = await prisma.position.findFirst({
        where: {
          symbol: position.symbol,
          broker: position.broker,
          isOpen: true,
        },
      });

      if (existingPosition) {
        // Update existing position - ADD to quantity and recalculate average entry price
        const newQuantity = existingPosition.quantity + position.quantity;
        const newAvgEntryPrice = 
          (existingPosition.avgEntryPrice * existingPosition.quantity + 
           position.avgEntryPrice * position.quantity) / newQuantity;
        
        console.log(`🔄 Accumulating position: ${position.symbol} from ${existingPosition.quantity} to ${newQuantity} shares`);
        
        await prisma.position.update({
          where: { id: existingPosition.id },
          data: {
            quantity: newQuantity,
            avgEntryPrice: newAvgEntryPrice,
            currentPrice: position.currentPrice,
            unrealizedPnL: (position.currentPrice - newAvgEntryPrice) * newQuantity,
            realizedPnL: (existingPosition.realizedPnL || 0) + (position.realizedPnL || 0),
          },
        });
      } else {
        // Create new position
        console.log(`✨ Creating new position: ${position.symbol} ${position.quantity} shares @ $${position.avgEntryPrice}`);
        
        await prisma.position.create({
          data: {
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
      }
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

