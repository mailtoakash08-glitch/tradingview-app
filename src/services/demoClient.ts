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

interface PendingOrder {
  orderId: string;
  order: IbkrOrderRequest;
  submittedAt: Date;
}

class DemoClient {
  private connected: boolean;
  private demoPositions: Map<string, DemoPosition>;
  private orderIdCounter: number;
  private fillDelay: number = 2000; // 2 second delay to simulate real fills (MKT orders)
  private pendingOrders: Map<string, PendingOrder>; // Track pending stop/limit orders
  private priceMonitorInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connected = false;
    this.demoPositions = new Map();
    this.orderIdCounter = 1000;
    this.pendingOrders = new Map();
  }

  /**
   * Initialize Demo client
   */
  async connect(): Promise<void> {
    logger.info("🎮 Connecting to DEMO MODE (No real money)");

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.connected = true;
    
    // Start price monitoring for pending orders
    this.startPriceMonitoring();
    
    logger.info(
      "🎮 DEMO MODE connected successfully - All orders are simulated"
    );
  }

  /**
   * Monitor prices and trigger pending stop/limit orders
   */
  private startPriceMonitoring(): void {
    // Check prices every 5 seconds
    this.priceMonitorInterval = setInterval(async () => {
      if (this.pendingOrders.size === 0) return;

      logger.info(`🎮 DEMO: Monitoring ${this.pendingOrders.size} pending orders...`);

      for (const [orderId, pendingOrder] of this.pendingOrders.entries()) {
        try {
          await this.checkPendingOrder(orderId, pendingOrder);
        } catch (error) {
          logger.error(`🎮 DEMO: Error checking pending order ${orderId}`, { error });
        }
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Check if a pending order should be triggered
   */
  private async checkPendingOrder(orderId: string, pendingOrder: PendingOrder): Promise<void> {
    const { order } = pendingOrder;
    
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

      if (currentPrice === 0) {
        logger.warn(`🎮 DEMO: Could not get price for ${order.symbol}, skipping check`);
        return;
      }

      let shouldTrigger = false;

      // Check if order should trigger based on type
      if (order.orderType === 'STP' && order.stopPrice) {
        // Stop order logic:
        // BUY STOP: triggers when price rises to or above stop price
        // SELL STOP: triggers when price falls to or below stop price
        if (order.action === 'BUY' && currentPrice >= order.stopPrice) {
          shouldTrigger = true;
          logger.info(`🎮 DEMO: BUY STOP triggered! Price ${currentPrice} >= ${order.stopPrice}`);
        } else if (order.action === 'SELL' && currentPrice <= order.stopPrice) {
          shouldTrigger = true;
          logger.info(`🎮 DEMO: SELL STOP triggered! Price ${currentPrice} <= ${order.stopPrice}`);
        }
      } else if (order.orderType === 'STP_LMT' && order.stopPrice && order.limitPrice) {
        // 🎯 Stop-Limit order logic:
        // 1. First check if stop price is triggered
        // 2. Then check if price is within limit
        let stopTriggered = false;
        if (order.action === 'BUY' && currentPrice >= order.stopPrice) {
          stopTriggered = true;
        } else if (order.action === 'SELL' && currentPrice <= order.stopPrice) {
          stopTriggered = true;
        }
        
        if (stopTriggered) {
          // Stop triggered, now check limit
          if (order.action === 'BUY' && currentPrice <= order.limitPrice) {
            shouldTrigger = true;
            logger.info(`🎮 DEMO: BUY STOP-LIMIT triggered! Stop: ${order.stopPrice}, Limit: ${order.limitPrice}, Price: ${currentPrice}`);
          } else if (order.action === 'SELL' && currentPrice >= order.limitPrice) {
            shouldTrigger = true;
            logger.info(`🎮 DEMO: SELL STOP-LIMIT triggered! Stop: ${order.stopPrice}, Limit: ${order.limitPrice}, Price: ${currentPrice}`);
          }
        }
      } else if (order.orderType === 'LMT' && order.limitPrice) {
        // Limit order logic:
        // BUY LIMIT: triggers when price falls to or below limit price
        // SELL LIMIT: triggers when price rises to or above limit price
        if (order.action === 'BUY' && currentPrice <= order.limitPrice) {
          shouldTrigger = true;
          logger.info(`🎮 DEMO: BUY LIMIT triggered! Price ${currentPrice} <= ${order.limitPrice}`);
        } else if (order.action === 'SELL' && currentPrice >= order.limitPrice) {
          shouldTrigger = true;
          logger.info(`🎮 DEMO: SELL LIMIT triggered! Price ${currentPrice} >= ${order.limitPrice}`);
        }
      }

      if (shouldTrigger) {
        // Remove from pending
        this.pendingOrders.delete(orderId);
        
        // Trigger the fill
        logger.info(`🎮 DEMO: Order ${orderId} triggered, filling now...`);
        await this.simulateFill(orderId, order, currentPrice);
      } else {
        logger.info(`🎮 DEMO: Order ${orderId} still pending (${order.symbol} current: $${currentPrice.toFixed(2)}, trigger: $${(order.stopPrice || order.limitPrice)?.toFixed(2)})`);
      }
    } catch (error) {
      logger.error(`🎮 DEMO: Error checking price for ${order.symbol}`, { error });
    }
  }

  /**
   * Place demo order (simulates fill after delay)
   */
  async placeOrder(orderRequest: IbkrOrderRequest): Promise<IbkrOrderResponse> {
    if (!this.connected) {
      throw new Error("Demo broker not connected");
    }

    const orderId = `DEMO-${this.orderIdCounter++}`;

    logger.info("🎮 DEMO: Order placed", {
      orderId,
      symbol: orderRequest.symbol,
      action: orderRequest.action,
      quantity: orderRequest.quantity,
      orderType: orderRequest.orderType,
      stopPrice: orderRequest.stopPrice,
      limitPrice: orderRequest.limitPrice,
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

    // Handle different order types
    if (orderRequest.orderType === 'MKT') {
      // Market order: fill immediately after short delay
      logger.info(`🎮 DEMO: Market order will fill in ${this.fillDelay/1000} seconds`);
      setTimeout(() => {
        this.simulateFill(orderId, orderRequest);
      }, this.fillDelay);
    } else if (orderRequest.orderType === 'STP' || orderRequest.orderType === 'LMT' || orderRequest.orderType === 'STP_LMT') {
      // Stop/Limit/Stop-Limit order: add to pending orders for price monitoring
      this.pendingOrders.set(orderId, {
        orderId,
        order: orderRequest,
        submittedAt: new Date(),
      });
      
      const triggerPrice = orderRequest.stopPrice || orderRequest.limitPrice;
      const orderTypeLabel = orderRequest.orderType === 'STP_LMT' ? 'STOP-LIMIT' : orderRequest.orderType;
      logger.info(`🎮 DEMO: ${orderTypeLabel} order is PENDING - waiting for price to reach $${triggerPrice?.toFixed(2)}`);
    } else if (orderRequest.orderType === 'TRAIL') {
      // Trailing stop: for now, fill immediately (TODO: implement trailing logic)
      logger.info(`🎮 DEMO: Trailing stop will fill in ${this.fillDelay/1000} seconds`);
      setTimeout(() => {
        this.simulateFill(orderId, orderRequest);
      }, this.fillDelay);
    }

    return {
      success: true,
      orderId: orderId,
      message: `🎮 DEMO: ${orderRequest.orderType} order placed`,
    };
  }

  /**
   * Simulate order fill
   */
  private async simulateFill(orderId: string, order: IbkrOrderRequest, forcedPrice?: number): Promise<void> {
    // Fetch REAL market price from Yahoo Finance (unless price is forced by trigger)
    let fillPrice = forcedPrice || 0;

    if (!fillPrice) {
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
          // Limit order: fill at limit price
          fillPrice = order.limitPrice;
        } else if (order.orderType === "STP" && order.stopPrice) {
          // Stop order: fill at current market price (stop price was the trigger)
          fillPrice = currentPrice || order.stopPrice;
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

    // Remove from pending orders if it exists
    if (this.pendingOrders.has(orderId)) {
      this.pendingOrders.delete(orderId);
      logger.info("🎮 DEMO: Pending order cancelled", { orderId });
      
      // Update database
      try {
        await orderRepository.update(orderId, {
          status: 'CANCELLED',
        } as any);
      } catch (error) {
        logger.error('Error updating cancelled order in database', { error });
      }
    } else {
      logger.info("🎮 DEMO: Order cancelled (or already filled)", { orderId });
    }
    
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
    this.pendingOrders.clear();
    
    // Stop price monitoring
    if (this.priceMonitorInterval) {
      clearInterval(this.priceMonitorInterval);
      this.priceMonitorInterval = null;
    }
    
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

  /**
   * Get pending orders
   */
  getPendingOrders(): PendingOrder[] {
    return Array.from(this.pendingOrders.values());
  }
}

export const demoClient = new DemoClient();
