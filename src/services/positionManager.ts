/**
 * Position Manager - Tracks open positions and calculates P&L
 */

import { Position, OrderFillEvent, PositionUpdate } from '../types/dashboard';
import { logger } from '../logger';

class PositionManager {
  private positions: Map<string, Position> = new Map();
  private lastPrices: Map<string, number> = new Map();

  /**
   * Handle order fill - update positions
   */
  handleOrderFill(fill: OrderFillEvent): void {
    const symbol = fill.symbol;
    const existing = this.positions.get(symbol);

    logger.info('Processing order fill for position tracking', {
      symbol: fill.symbol,
      action: fill.action,
      quantity: fill.quantity,
      fillPrice: fill.fillPrice,
    });

    if (!existing) {
      // New position
      if (fill.quantity === 0) return;

      const position: Position = {
        symbol,
        quantity: fill.action === 'BUY' ? fill.quantity : -fill.quantity,
        avgEntryPrice: fill.fillPrice,
        currentPrice: fill.fillPrice,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        side: fill.action === 'BUY' ? 'LONG' : 'SHORT',
        value: fill.quantity * fill.fillPrice,
        cost: fill.quantity * fill.fillPrice,
        lastUpdate: fill.timestamp,
      };

      this.positions.set(symbol, position);
      this.lastPrices.set(symbol, fill.fillPrice);

      logger.info('Created new position', { symbol, position });
    } else {
      // Update existing position
      const isClosing =
        (existing.side === 'LONG' && fill.action === 'SELL') ||
        (existing.side === 'SHORT' && fill.action === 'BUY');

      if (isClosing) {
        // Closing position (fully or partially)
        const newQuantity =
          existing.side === 'LONG'
            ? existing.quantity - fill.quantity
            : existing.quantity + fill.quantity;

        if (Math.abs(newQuantity) < 0.01) {
          // Position fully closed
          this.positions.delete(symbol);
          logger.info('Position fully closed', { symbol });
        } else {
          // Partial close
          existing.quantity = newQuantity;
          existing.value = Math.abs(newQuantity) * existing.currentPrice;
          existing.lastUpdate = fill.timestamp;
          this.updatePnL(symbol);
          logger.info('Position partially closed', { symbol, newQuantity });
        }
      } else {
        // Adding to position
        const totalCost =
          existing.avgEntryPrice * Math.abs(existing.quantity) +
          fill.fillPrice * fill.quantity;
        const totalQuantity = Math.abs(existing.quantity) + fill.quantity;

        existing.avgEntryPrice = totalCost / totalQuantity;
        existing.quantity =
          existing.side === 'LONG'
            ? existing.quantity + fill.quantity
            : existing.quantity - fill.quantity;
        existing.cost = totalCost;
        existing.value = Math.abs(existing.quantity) * existing.currentPrice;
        existing.lastUpdate = fill.timestamp;
        this.updatePnL(symbol);

        logger.info('Position increased', {
          symbol,
          newQuantity: existing.quantity,
          newAvgPrice: existing.avgEntryPrice,
        });
      }
    }
  }

  /**
   * Update price for a symbol and recalculate P&L
   */
  updatePrice(symbol: string, price: number): void {
    this.lastPrices.set(symbol, price);

    const position = this.positions.get(symbol);
    if (position) {
      position.currentPrice = price;
      position.value = Math.abs(position.quantity) * price;
      this.updatePnL(symbol);
    }
  }

  /**
   * Update P&L for a position
   */
  private updatePnL(symbol: string): void {
    const position = this.positions.get(symbol);
    if (!position) return;

    const priceDiff = position.currentPrice - position.avgEntryPrice;
    const multiplier = position.side === 'LONG' ? 1 : -1;

    position.unrealizedPnL =
      priceDiff * Math.abs(position.quantity) * multiplier;
    position.unrealizedPnLPercent =
      (priceDiff / position.avgEntryPrice) * 100 * multiplier;
  }

  /**
   * Get all positions
   */
  getAllPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  /**
   * Get position for specific symbol
   */
  getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }

  /**
   * Get position update summary
   */
  getPositionUpdate(): PositionUpdate {
    const positions = this.getAllPositions();
    const totalPnL = positions.reduce(
      (sum, pos) => sum + pos.unrealizedPnL,
      0
    );
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

    return {
      positions,
      totalPnL,
      totalValue,
    };
  }

  /**
   * Get total unrealized P&L
   */
  getTotalPnL(): number {
    return Array.from(this.positions.values()).reduce(
      (sum, pos) => sum + pos.unrealizedPnL,
      0
    );
  }

  /**
   * Clear all positions (for testing or reset)
   */
  clear(): void {
    this.positions.clear();
    this.lastPrices.clear();
    logger.info('All positions cleared');
  }

  /**
   * Get position count
   */
  getPositionCount(): number {
    return this.positions.size;
  }

  /**
   * Check if has position for symbol
   */
  hasPosition(symbol: string): boolean {
    return this.positions.has(symbol);
  }
}

export const positionManager = new PositionManager();

