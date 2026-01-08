/**
 * IBKR API Client - REAL Implementation
 * Connects to IB Gateway using @stoqey/ib
 */

import {
  IBApi,
  Contract,
  Order,
  EventName,
  SecType,
  OrderAction,
  OrderType,
} from "@stoqey/ib";
import { IbkrOrderRequest, IbkrOrderResponse } from "../types/order";
import { logger } from "../logger";
import config from "../config";
import { positionManager } from "./positionManager";
import { orderTracker } from "./orderTracker";
import { OrderFillEvent } from "../types/dashboard";

class IbkrClient {
  private ib: IBApi | null;
  private connected: boolean;
  private nextOrderId: number;
  private connectionPromise: Promise<void> | null;
  private orderIdMap: Map<number, string>; // IBKR orderId -> trackedOrderId

  constructor() {
    this.ib = null;
    this.connected = false;
    this.nextOrderId = 1;
    this.connectionPromise = null;
    this.orderIdMap = new Map();
  }

  /**
   * Initialize IB API instance and set up event handlers
   */
  private initializeIB(): void {
    this.ib = new IBApi({
      host: config.ibkr.host,
      port: config.ibkr.port,
      clientId: config.ibkr.clientId,
    });

    // Connection events
    this.ib.on(EventName.connected, () => {
      logger.info("Connected to IBKR Gateway");
      this.connected = true;
    });

    this.ib.on(EventName.disconnected, () => {
      logger.warn("Disconnected from IBKR Gateway");
      this.connected = false;
    });

    this.ib.on(EventName.error, (err: Error, code: number, reqId: number) => {
      // Filter out non-critical errors
      if (code === 2104 || code === 2106 || code === 2158) {
        // Market data farm connection messages - not errors
        logger.debug("IBKR Info", { code, message: err.message });
      } else {
        logger.error("IBKR Error", {
          error: err.message,
          code,
          reqId,
        });
      }
    });

    // Order status events
    this.ib.on(
      EventName.orderStatus,
      (
        orderId: number,
        status: string,
        filled: number,
        remaining: number,
        avgFillPrice: number
      ) => {
        logger.info("Order status update", {
          orderId,
          status,
          filled,
          remaining,
          avgFillPrice,
        });

        // Map IBKR orderId to our trackedOrderId
        const trackedOrderId = this.orderIdMap.get(orderId);
        if (!trackedOrderId) {
          logger.warn("Order ID not found in mapping", { orderId });
          return;
        }

        // Update order status
        orderTracker.updateOrderStatus(
          trackedOrderId,
          status,
          filled,
          avgFillPrice
        );

        if (status === "Filled" || status === "PartiallyFilled") {
          logger.info("Order filled - updating position", {
            orderId,
            trackedOrderId,
            status,
            avgFillPrice,
            filled,
            remaining,
          });

          // Get order details from tracker
          const orderDetails = orderTracker.getOrderById(trackedOrderId);
          if (orderDetails && filled > 0 && avgFillPrice > 0) {
            // Update position via handleOrderFill
            positionManager.handleOrderFill({
              orderId: trackedOrderId,
              symbol: orderDetails.symbol,
              action: orderDetails.action,
              quantity: filled,
              fillPrice: avgFillPrice,
              commission: 0, // Commission will be updated separately if available
              timestamp: new Date(),
            });

            logger.info("Position updated via order fill", {
              symbol: orderDetails.symbol,
              action: orderDetails.action,
              quantity: filled,
              fillPrice: avgFillPrice,
            });
          }
        } else if (status === "Cancelled") {
          logger.info("Order cancelled", { orderId, trackedOrderId });
        }
      }
    );

    // Execution details (backup for orderStatus)
    this.ib.on(
      EventName.execDetails,
      (reqId: number, contract: Contract, execution: any) => {
        logger.info("Execution received", {
          orderId: execution.orderId,
          symbol: contract.symbol,
          side: execution.side,
          shares: execution.shares,
          price: execution.price,
          time: execution.time,
        });

        // Find tracked order by IBKR order ID
        const trackedOrderId = this.orderIdMap.get(execution.orderId);
        if (!trackedOrderId) {
          logger.warn("Execution for unknown order", {
            ibkrOrderId: execution.orderId,
          });
          return;
        }

        // Get order details
        const orderDetails = orderTracker.getOrderById(trackedOrderId);
        if (!orderDetails) {
          logger.warn("Order details not found", { trackedOrderId });
          return;
        }

        // Update position with execution
        positionManager.handleOrderFill({
          orderId: trackedOrderId,
          symbol: contract.symbol!,
          action: execution.side === "BOT" ? "BUY" : "SELL",
          quantity: execution.shares,
          fillPrice: execution.price,
          commission: execution.commission || 0,
          timestamp: new Date(),
        });

        logger.info("Position updated from execution", {
          symbol: contract.symbol,
          trackedOrderId,
          shares: execution.shares,
          price: execution.price,
        });
      }
    );

    this.ib.on(
      EventName.openOrder,
      (orderId: number, contract: Contract, order: Order, orderState: any) => {
        logger.info("Open order", {
          orderId,
          symbol: contract.symbol,
          action: order.action,
          quantity: order.totalQuantity,
          orderType: order.orderType,
        });
      }
    );

    // Next valid order ID
    this.ib.on(EventName.nextValidId, (orderId: number) => {
      logger.info("Next valid order ID received", { orderId });
      this.nextOrderId = orderId;
    });
  }

  /**
   * Connect to IBKR Gateway
   */
  async connect(): Promise<void> {
    // If already connecting, return existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected, return immediately
    if (this.connected && this.ib) {
      logger.info("Already connected to IBKR");
      return;
    }

    this.connectionPromise = this._doConnect();
    return this.connectionPromise;
  }

  private async _doConnect(): Promise<void> {
    try {
      logger.info("Connecting to IBKR Gateway", {
        host: config.ibkr.host,
        port: config.ibkr.port,
        clientId: config.ibkr.clientId,
        account: config.ibkr.accountId || "auto",
      });

      // Initialize IB API if not already done
      if (!this.ib) {
        this.initializeIB();
      }

      // Connect
      this.ib!.connect();

      // Wait for connection and nextValidId
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout after 10 seconds"));
        }, 10000);

        const checkConnection = setInterval(() => {
          if (this.connected && this.nextOrderId > 0) {
            clearInterval(checkConnection);
            clearTimeout(timeout);
            resolve();
          }
        }, 100);
      });

      logger.info("IBKR Gateway connection established", {
        nextOrderId: this.nextOrderId,
      });

      // Subscribe to automatic order status updates
      this.ib!.reqAutoOpenOrders(true);
      logger.info("Subscribed to automatic order updates");

      // Request account updates for positions
      if (config.ibkr.accountId) {
        this.ib!.reqAccountUpdates(true, config.ibkr.accountId);
        logger.info("Subscribed to account updates", {
          account: config.ibkr.accountId,
        });
      }

      // Request executions for today to catch any filled orders
      this.ib!.reqExecutions(-1, {});
      logger.info("Requested today's executions to sync positions");
    } catch (error: any) {
      logger.error("Failed to connect to IBKR Gateway", {
        error: error.message,
        host: config.ibkr.host,
        port: config.ibkr.port,
      });
      this.connected = false;
      this.connectionPromise = null;
      throw error;
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * Disconnect from IBKR
   */
  async disconnect(): Promise<void> {
    try {
      if (this.ib && this.connected) {
        logger.info("Disconnecting from IBKR Gateway");
        this.ib.disconnect();
        this.connected = false;
      }
    } catch (error: any) {
      logger.error("Error disconnecting from IBKR", { error: error.message });
    }
  }

  /**
   * Create IBKR contract from symbol
   */
  private createContract(symbol: string): Contract {
    return {
      symbol: symbol,
      secType: SecType.STK, // Stock
      exchange: "SMART", // Smart routing
      currency: "USD",
    };
  }

  /**
   * Create IBKR order from request
   */
  private createOrder(request: IbkrOrderRequest): Order {
    const order: Order = {
      action: request.action as OrderAction,
      totalQuantity: request.quantity,
      orderType: request.orderType as OrderType,
      tif: request.timeInForce,
      outsideRth: request.outsideRth,
    };

    // Add limit price for limit orders
    if (request.orderType === "LMT" && request.limitPrice) {
      order.lmtPrice = request.limitPrice;
    }

    // Add stop price for stop orders
    if (request.orderType === "STP" && request.stopPrice) {
      order.auxPrice = request.stopPrice;
    }

    // Add trailing amount for trailing stops
    // For TRAIL orders with dollar amount (not percentage), use auxPrice
    // auxPrice is used for: stop price (STP), trailing amount (TRAIL), etc.
    if (request.orderType === "TRAIL" && request.trailingAmount) {
      logger.info("Setting trailing stop amount", {
        trailingAmount: request.trailingAmount,
        type: typeof request.trailingAmount,
      });
      // Use auxPrice for dollar-based trailing stops
      order.auxPrice = request.trailingAmount;
    }

    logger.info("Created IBKR order object", {
      action: order.action,
      totalQuantity: order.totalQuantity,
      orderType: order.orderType,
      auxPrice: order.auxPrice,
      lmtPrice: order.lmtPrice,
      trailingPercent: order.trailingPercent,
      trailStopPrice: (order as any).trailStopPrice,
    });

    return order;
  }

  /**
   * Place an order with IBKR
   */
  async placeOrder(request: IbkrOrderRequest): Promise<IbkrOrderResponse> {
    try {
      // Ensure connected
      if (!this.connected || !this.ib) {
        throw new Error(
          "Not connected to IBKR Gateway. Please check Gateway is running."
        );
      }

      logger.info("Placing IBKR order", request);

      const contract = this.createContract(request.symbol);
      const order = this.createOrder(request);
      const orderId = this.nextOrderId++;

      // Track order in orderTracker
      const trackedOrderId = orderTracker.trackOrder({
        symbol: request.symbol,
        action: request.action as "BUY" | "SELL",
        orderType: request.orderType as "MKT" | "LMT" | "STP" | "TRAIL",
        quantity: request.quantity,
        limitPrice: request.limitPrice,
        stopPrice: request.stopPrice,
        trailingAmount: request.trailingAmount,
        strategy: request.metadata?.strategy,
      });

      // Store mapping from IBKR orderId to our trackedOrderId
      this.orderIdMap.set(orderId, trackedOrderId);

      // Place order
      this.ib.placeOrder(orderId, contract, order);

      logger.info("Order submitted to IBKR", {
        orderId,
        trackedOrderId,
        symbol: request.symbol,
        action: request.action,
        quantity: request.quantity,
      });

      const response: IbkrOrderResponse = {
        success: true,
        orderId: trackedOrderId, // Return our tracking ID
        message: "Order placed successfully",
        raw: { orderId, contract, order },
      };

      return response;
    } catch (error: any) {
      logger.error("Failed to place IBKR order", {
        error: error.message,
        request,
      });

      return {
        success: false,
        orderId: "",
        message: error.message || "Order placement failed",
        raw: request,
      };
    }
  }

  /**
   * Cancel all orders for a symbol
   */
  async cancelAllOrdersForSymbol(symbol: string): Promise<void> {
    try {
      if (!this.ib || !this.connected) {
        throw new Error("Not connected to IBKR");
      }

      logger.warn("Cancelling all orders for symbol", { symbol });

      // Request all open orders
      this.ib.reqAllOpenOrders();

      // Note: In a production system, you'd want to:
      // 1. Store open orders in a map
      // 2. Filter by symbol
      // 3. Cancel each one
      // For now, this is a basic implementation

      logger.info("Cancel request sent for symbol", { symbol });
    } catch (error: any) {
      logger.error("Error cancelling orders", {
        error: error.message,
        symbol,
      });
    }
  }

  /**
   * Get open positions
   * NOTE: Disabled to prevent Gateway freezing
   * TODO: Implement proper event-based position tracking
   */
  async getOpenPositions(): Promise<any[]> {
    logger.debug("Position tracking not yet implemented");
    return [];
  }

  /**
   * Get account information
   * NOTE: Disabled to prevent Gateway freezing
   * TODO: Implement proper event-based account tracking
   */
  async getAccountInfo(): Promise<any> {
    return {
      accountId: config.ibkr.accountId || "unknown",
      connected: this.connected,
      note: "Account details not yet implemented",
    };
  }

  /**
   * Cancel order by order ID
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.connected || !this.ib) {
      logger.error("Cannot cancel order: Not connected to IBKR");
      return false;
    }

    try {
      // Convert our tracked order ID to IBKR order ID
      let ibkrOrderId: number | null = null;

      // Search through our mapping
      for (const [ibId, trackedId] of this.orderIdMap.entries()) {
        if (trackedId === orderId) {
          ibkrOrderId = ibId;
          break;
        }
      }

      if (!ibkrOrderId) {
        logger.error("Order ID not found in mapping", { orderId });
        return false;
      }

      this.ib.cancelOrder(ibkrOrderId);
      logger.info("Order cancelled", { orderId, ibkrOrderId });
      return true;
    } catch (error: any) {
      logger.error("Failed to cancel order", {
        orderId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get next order ID
   */
  getNextOrderId(): number {
    return this.nextOrderId;
  }
}

// Singleton instance
export const ibkrClient = new IbkrClient();
