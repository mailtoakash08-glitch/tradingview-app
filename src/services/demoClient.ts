/**
 * Demo Broker Client
 * Simulates order fills for testing without real money
 */

import { IbkrOrderRequest, IbkrOrderResponse } from "../types/order";
import { logger } from "../logger";
import { positionManager } from "./positionManager";
import { orderTracker } from "./orderTracker";
import { orderRepository } from "../repositories/orderRepository";
import { positionRepository } from "../repositories/positionRepository";
import { tradeRepository } from "../repositories/tradeRepository";

interface DemoPosition {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
}

class DemoClient {
  private connected: boolean;
  private demoPositions: Map<string, DemoPosition>;
  private orderIdCounter: number;
  private fillDelay: number = 2000; // 2 second delay to simulate real fills

  constructor() {
    this.connected = false;
    this.demoPositions = new Map();
    this.orderIdCounter = 1000;
  }

  /**
   * Initialize Demo client
   */
  async connect(): Promise<void> {
    logger.info("🎮 Connecting to DEMO MODE (No real money)");

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.connected = true;
    logger.info(
      "🎮 DEMO MODE connected successfully - All orders are simulated"
    );
  }

  /**
   * Place demo order (simulates fill after delay)
   */
  async placeOrder(orderRequest: IbkrOrderRequest): Promise<IbkrOrderResponse> {
    if (!this.connected) {
      throw new Error("Demo broker not connected");
    }

    const orderId = `DEMO-${this.orderIdCounter++}`;

    logger.info("🎮 DEMO: Order placed (will fill in 2 seconds)", {
      orderId,
      symbol: orderRequest.symbol,
      action: orderRequest.action,
      quantity: orderRequest.quantity,
      orderType: orderRequest.orderType,
    });

    // Save order to database
    try {
      await orderRepository.create({
        orderId,
        symbol: orderRequest.symbol,
        action: orderRequest.action,
        orderType: orderRequest.orderType,
        quantity: orderRequest.quantity,
        limitPrice: orderRequest.limitPrice,
        stopPrice: orderRequest.stopPrice,
        trailingAmount: orderRequest.trailingAmount,
        status: 'PENDING',
        broker: 'demo',
        strategy: 'manual',
        outsideRth: orderRequest.outsideRth ?? false,
        submittedAt: new Date().toISOString(),
      } as any);
    } catch (error) {
      logger.error('Error saving order to database', { error });
    }

    // Simulate order fill after delay
    setTimeout(() => {
      this.simulateFill(orderId, orderRequest);
    }, this.fillDelay);

    return {
      success: true,
      orderId: orderId,
      message: "🎮 DEMO: Order placed (simulated)",
    };
  }

  /**
   * Simulate order fill
   */
  private async simulateFill(orderId: string, order: IbkrOrderRequest): Promise<void> {
    // Fetch REAL market price from Yahoo Finance
    let fillPrice = 0;

    try {
      // Fetch current market price
      const axios = require('axios');
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${order.symbol}`,
        {
          params: { interval: '1m', range: '1d' },
          timeout: 5000,
        }
      );

      const result = response.data?.chart?.result?.[0];
      const currentPrice = result?.meta?.regularMarketPrice || 0;

      if (order.orderType === "MKT") {
        // Market order: fill at current REAL market price
        fillPrice = currentPrice || 100; // Fallback only if API fails
      } else if (order.orderType === "LMT" && order.limitPrice) {
        // Limit order: fill at limit price (if current price crosses it)
        fillPrice = order.limitPrice;
      } else if (order.orderType === "STP" && order.stopPrice) {
        // Stop order: fill at stop price (trigger point)
        fillPrice = order.stopPrice;
      } else if (order.orderType === "TRAIL" && order.trailingAmount) {
        // Trailing stop: use stop price + trailing amount
        fillPrice = (order.stopPrice || currentPrice) - order.trailingAmount;
      } else {
        fillPrice = currentPrice || 100; // Default to current price
      }
    } catch (error) {
      logger.warn(`🎮 DEMO: Could not fetch real price for ${order.symbol}, using fallback`, { error });
      // Fallback to reasonable prices if Yahoo Finance fails
      if (order.orderType === "LMT" && order.limitPrice) {
        fillPrice = order.limitPrice;
      } else if (order.orderType === "STP" && order.stopPrice) {
        fillPrice = order.stopPrice;
      } else {
        fillPrice = 100; // Safe fallback
      }
    }

    logger.info("🎮 DEMO: Order FILLED", {
      orderId,
      symbol: order.symbol,
      action: order.action,
      quantity: order.quantity,
      fillPrice: fillPrice.toFixed(2),
      commission: 0.0, // Demo mode = no commission
    });

    // Update position manager
    positionManager.handleOrderFill({
      orderId: orderId,
      symbol: order.symbol,
      action: order.action,
      quantity: order.quantity,
      fillPrice: fillPrice,
      commission: 0.0,
      timestamp: new Date(),
    });

    // Update database - mark order as filled
    try {
      await orderRepository.update(orderId, {
        status: 'FILLED',
        filledQuantity: order.quantity,
        avgFillPrice: fillPrice,
      } as any);
    } catch (error) {
      logger.error('Error updating order in database', { error });
    }

    // Update demo positions for tracking
    const currentPos = this.demoPositions.get(order.symbol);
    const newQuantity =
      order.action === "BUY"
        ? (currentPos?.quantity || 0) + order.quantity
        : (currentPos?.quantity || 0) - order.quantity;

    if (newQuantity === 0) {
      this.demoPositions.delete(order.symbol);
      // Close position in database
      try {
        await positionRepository.close(order.symbol, 'demo', 0);
      } catch (error) {
        logger.error('Error closing position in database', { error });
      }
    } else {
      this.demoPositions.set(order.symbol, {
        symbol: order.symbol,
        quantity: newQuantity,
        entryPrice: fillPrice,
        currentPrice: fillPrice,
      });

      // Upsert position in database
      try {
        await positionRepository.upsert({
          symbol: order.symbol,
          broker: 'demo',
          strategy: 'manual',
          quantity: newQuantity,
          avgEntryPrice: fillPrice,
          currentPrice: fillPrice,
          unrealizedPnL: 0,
          isOpen: true,
        });
      } catch (error) {
        logger.error('Error upserting position in database', { error });
      }
    }

    // Record trade in database
    try {
      await tradeRepository.create({
        orderId,
        symbol: order.symbol,
        strategy: 'manual',
        broker: 'demo',
        side: order.action === 'BUY' ? 'LONG' : 'SHORT',
        action: newQuantity === 0 ? 'EXIT' : 'ENTRY',
        quantity: order.quantity,
        price: fillPrice,
        commission: 0,
      });
    } catch (error) {
      logger.error('Error creating trade in database', { error });
    }

    logger.info("🎮 DEMO: Position updated", {
      symbol: order.symbol,
      quantity: newQuantity,
      entryPrice: fillPrice,
    });
  }

  /**
   * Cancel demo order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    logger.info("🎮 DEMO: Order cancelled", { orderId });
    return true;
  }

  /**
   * Get demo account data
   */
  async getAccountData(): Promise<any> {
    if (!this.connected) {
      return null;
    }

    // Return demo account values
    return {
      accountId: "DEMO123456",
      balance: 100000.0,
      buyingPower: 400000.0, // 4x margin
      equity: 100000.0,
      pnl: 0.0,
    };
  }

  /**
   * Get demo positions
   */
  async getPositions(): Promise<any[]> {
    if (!this.connected) {
      return [];
    }

    const positions = Array.from(this.demoPositions.values()).map((pos) => ({
      symbol: pos.symbol,
      quantity: pos.quantity,
      entryPrice: pos.entryPrice,
      currentPrice: pos.currentPrice,
      unrealizedPnl: (pos.currentPrice - pos.entryPrice) * pos.quantity,
    }));

    return positions;
  }

  /**
   * Disconnect demo client
   */
  disconnect(): void {
    this.connected = false;
    this.demoPositions.clear();
    logger.info("🎮 DEMO MODE disconnected");
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Update demo price (for simulating market movement)
   */
  updatePrice(symbol: string, newPrice: number): void {
    const pos = this.demoPositions.get(symbol);
    if (pos) {
      pos.currentPrice = newPrice;
    }
  }

  /**
   * Get demo info
   */
  getInfo(): string {
    return "🎮 DEMO MODE - All trades are simulated. No real money is used.";
  }
}

export const demoClient = new DemoClient();
