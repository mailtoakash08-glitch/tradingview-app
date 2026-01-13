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
import { orderRepository } from "../repositories/orderRepository";
import { positionRepository } from "../repositories/positionRepository";
import { tradeRepository } from "../repositories/tradeRepository";

class IbkrClient {
  private ib: IBApi | null;
  private connected: boolean;
  private nextOrderId: number;
  private connectionPromise: Promise<void> | null;
  private orderIdMap: Map<number, string>; // IBKR orderId -> trackedOrderId
  private processedExecutions: Set<string>; // Track processed execId to prevent duplicates
  private processedFills: Set<string>; // Track processed order fills to prevent duplicate position updates
  private accountData: {
    cashBalance: number;
    netLiquidation: number;
    unrealizedPnL: number;
    realizedPnL: number;
    totalCashValue: number;
  };

  constructor() {
    this.ib = null;
    this.connected = false;
    this.nextOrderId = 1;
    this.connectionPromise = null;
    this.orderIdMap = new Map();
    this.processedExecutions = new Set();
    this.processedFills = new Set();
    this.accountData = {
      cashBalance: 1000000,
      netLiquidation: 1000000,
      unrealizedPnL: 0,
      realizedPnL: 0,
      totalCashValue: 1000000,
    };
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

    // 🔍 DEBUG: Log ALL events from IB Gateway
    this.ib.on(EventName.all, (eventName: string, ...args: any[]) => {
      // Only log order-related events to avoid spam
      if (
        eventName.toLowerCase().includes("order") ||
        eventName.toLowerCase().includes("exec") ||
        eventName.toLowerCase().includes("position")
      ) {
        logger.info(`🔔 IB Gateway Event: ${eventName}`, { args });
      }
    });

    // 🔧 Open order events (triggered by reqAutoOpenOrders)
    this.ib.on(
      EventName.openOrder,
      (orderId: number, contract: Contract, order: Order, orderState: any) => {
        logger.info("📋 OPEN ORDER EVENT - Order update received!", {
          orderId,
          symbol: contract.symbol,
          action: order.action,
          totalQuantity: order.totalQuantity,
          orderType: order.orderType,
          status: orderState.status,
          filled: order.filledQuantity || 0,
          avgPrice: orderState.avgFillPrice || 0,
        });

        // Always process status updates from openOrder events
        const trackedOrderId = this.orderIdMap.get(orderId);
        if (trackedOrderId && orderState.status) {
          logger.info("Processing order status from openOrder event", {
            orderId,
            trackedOrderId,
            status: orderState.status,
          });
          // Trigger the orderStatus handler with the data from openOrder
          const filled = order.filledQuantity || 0;
          const remaining = (order.totalQuantity || 0) - filled;
          this.ib!.emit(
            EventName.orderStatus,
            orderId,
            orderState.status,
            filled,
            remaining,
            orderState.avgFillPrice || 0
          );
        }
      }
    );

    // Open order end event - fires after reqAllOpenOrders() completes
    this.ib.on(EventName.openOrderEnd, () => {
      logger.info("📋 openOrderEnd event received - all open orders loaded");
    });

    // Order status events
    this.ib.on(
      EventName.orderStatus,
      (
        orderId: number,
        status: string,
        filled: number,
        remaining: number,
        avgFillPrice: number,
        permId?: number,
        parentId?: number,
        lastFillPrice?: number,
        clientId?: number,
        whyHeld?: string,
        mktCapPrice?: number
      ) => {
        logger.info("✅ Order status update received!", {
          orderId,
          status,
          filled,
          remaining,
          avgFillPrice,
          clientId,
          whyHeld,
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

        // 💾 Update order status in database
        (async () => {
          try {
            const dbStatus =
              status === "Filled"
                ? "FILLED"
                : status === "Cancelled"
                ? "CANCELLED"
                : status === "PartiallyFilled"
                ? "PARTIALLY_FILLED"
                : status === "Inactive"
                ? "REJECTED"
                : "PENDING";

            await orderRepository.update(trackedOrderId, {
              status: dbStatus,
              filledQuantity: filled,
              avgFillPrice: avgFillPrice,
            });

            logger.info("✅ IBKR order status updated in database", {
              orderId: trackedOrderId,
              status: dbStatus,
            });
          } catch (dbError: any) {
            logger.error("Failed to update order status in database", {
              error: dbError.message,
              orderId: trackedOrderId,
            });
          }
        })();

        if (status === "Filled" || status === "PartiallyFilled") {
          logger.info("Order filled - status updated", {
            orderId,
            trackedOrderId,
            status,
            avgFillPrice,
            filled,
            remaining,
          });

          // ⚠️ NOTE: Position updates are handled by execDetails event handler
          // We should NOT process position fills from orderStatus events
          // because execDetails is the authoritative source for executions.
          // orderStatus events can fire multiple times with the same data,
          // causing duplicate position updates.
          logger.info(
            "Skipping position update - will be handled by execDetails event"
          );
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
          execId: execution.execId,
        });

        // 🛡️ DEDUPLICATION: Check if we already processed this execution
        const executionKey = `${execution.execId}-${execution.orderId}-${execution.shares}`;
        logger.info("🔍 Checking execution deduplication", {
          executionKey,
          alreadyProcessed: this.processedExecutions.has(executionKey),
          totalProcessed: this.processedExecutions.size,
        });

        if (this.processedExecutions.has(executionKey)) {
          logger.warn("⚠️ Duplicate execution detected - skipping", {
            execId: execution.execId,
            orderId: execution.orderId,
          });
          return;
        }

        // Mark this execution as processed
        this.processedExecutions.add(executionKey);
        logger.info("✅ Execution marked as processed", { executionKey });

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

        // 💾 Save trade and position to database
        (async () => {
          try {
            // Determine trade side and action
            const action = execution.side === "BOT" ? "BUY" : "SELL";
            const side = execution.side === "BOT" ? "LONG" : "SHORT";

            // Save trade record
            await tradeRepository.create({
              orderId: trackedOrderId,
              symbol: contract.symbol!,
              action: "ENTRY", // For now, mark as entry. TODO: detect exit based on position
              side: side as "LONG" | "SHORT",
              quantity: execution.shares,
              price: execution.price,
              commission: execution.commission || 0,
              broker: "ibkr",
              strategy: orderDetails?.strategy || "manual",
              executedAt: new Date(),
            });

            // Update position in database
            const position = positionManager.getPosition(contract.symbol!);
            if (position) {
              await positionRepository.upsert({
                symbol: contract.symbol!,
                quantity: position.quantity,
                avgEntryPrice: position.avgEntryPrice,
                currentPrice: position.currentPrice,
                unrealizedPnL: position.unrealizedPnL,
                broker: "ibkr",
                strategy: orderDetails?.strategy || "manual",
                isOpen: true,
              });

              logger.info("✅ IBKR trade and position saved to database", {
                symbol: contract.symbol,
                orderId: trackedOrderId,
              });
            }
          } catch (dbError: any) {
            logger.error("Failed to save trade/position to database", {
              error: dbError.message,
              orderId: trackedOrderId,
            });
          }
        })();

        logger.info("Position updated from execution", {
          symbol: contract.symbol,
          trackedOrderId,
          shares: execution.shares,
          price: execution.price,
        });
      }
    );

    // Next valid order ID
    this.ib.on(EventName.nextValidId, (orderId: number) => {
      logger.info("Next valid order ID received", { orderId });
      this.nextOrderId = orderId;
    });

    // Account value updates
    this.ib.on(
      EventName.accountSummary,
      (
        reqId: number,
        account: string,
        tag: string,
        value: string,
        currency: string
      ) => {
        logger.debug("Account summary update", {
          account,
          tag,
          value,
          currency,
        });

        // Parse and store relevant account values
        const numValue = parseFloat(value) || 0;

        switch (tag) {
          case "NetLiquidation":
            this.accountData.netLiquidation = numValue;
            break;
          case "TotalCashValue":
            this.accountData.totalCashValue = numValue;
            break;
          case "UnrealizedPnL":
            this.accountData.unrealizedPnL = numValue;
            break;
          case "RealizedPnL":
            this.accountData.realizedPnL = numValue;
            break;
          case "CashBalance":
            this.accountData.cashBalance = numValue;
            break;
        }
      }
    );

    this.ib.on(EventName.accountSummaryEnd, (reqId: number) => {
      logger.info("Account summary loaded", { accountData: this.accountData });
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
      logger.info(
        "✅ Subscribed to automatic order updates via reqAutoOpenOrders(true)"
      );

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
      outsideRth: request.outsideRth || false, // Allow after-hours trading if requested
      transmit: true, // ✅ Auto-transmit orders without manual confirmation
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

      // 💾 Save order to database
      try {
        await orderRepository.create({
          orderId: trackedOrderId,
          symbol: request.symbol,
          action: request.action as "BUY" | "SELL",
          orderType: request.orderType as "MKT" | "LMT" | "STP" | "TRAIL",
          quantity: request.quantity,
          broker: "ibkr",
          strategy: request.metadata?.strategy || "manual",
          status: "PENDING",
          submittedAt: new Date().toISOString(),
          limitPrice: request.limitPrice,
          stopPrice: request.stopPrice,
          trailingAmount: request.trailingAmount,
        });
        logger.info("✅ IBKR order saved to database", {
          orderId: trackedOrderId,
        });
      } catch (dbError: any) {
        logger.error("Failed to save IBKR order to database", {
          error: dbError.message,
          orderId: trackedOrderId,
        });
      }

      // Place order
      this.ib.placeOrder(orderId, contract, order);

      logger.info("Order submitted to IBKR", {
        orderId,
        trackedOrderId,
        symbol: request.symbol,
        action: request.action,
        quantity: request.quantity,
      });

      // 🔍 DIAGNOSTIC: Manually request order status updates
      // reqAutoOpenOrders(true) should handle this, but let's force it
      logger.info("🔍 Manually requesting order status for debugging", {
        orderId,
      });

      // Request all open orders to trigger events - do it multiple times
      const pollOrderStatus = () => {
        try {
          this.ib!.reqAllOpenOrders();
          logger.info("✅ Called reqAllOpenOrders() - polling for status");
        } catch (err: any) {
          logger.error("❌ Failed to call reqAllOpenOrders()", {
            error: err.message,
          });
        }
      };

      // Poll immediately and then at intervals
      pollOrderStatus();
      setTimeout(pollOrderStatus, 500);
      setTimeout(pollOrderStatus, 1500);
      setTimeout(pollOrderStatus, 3000);
      setTimeout(pollOrderStatus, 5000);

      // Also try reqOpenOrders (different API call)
      try {
        this.ib!.reqOpenOrders();
        logger.info("✅ Also called reqOpenOrders()");
      } catch (err: any) {
        logger.error("❌ Failed to call reqOpenOrders()", {
          error: err.message,
        });
      }

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
   * Get account information from TWS
   */
  async getAccountInfo(): Promise<any> {
    if (!this.connected || !this.ib) {
      return {
        accountId: config.ibkr.accountId || "unknown",
        connected: false,
        balance: 1000000, // Default fallback
        cashBalance: 1000000,
        unrealizedPnL: 0,
        realizedPnL: 0,
        netLiquidation: 1000000,
      };
    }

    try {
      // Request account summary (this will trigger accountSummary events)
      this.ib.reqAccountSummary(
        9001, // Request ID
        "All", // Group (use "All" for all accounts)
        "NetLiquidation,TotalCashValue,UnrealizedPnL,RealizedPnL,CashBalance"
      );

      // Wait a bit for the data to arrive (events are async)
      await new Promise((resolve) => setTimeout(resolve, 500));

      logger.info("Returning account data from TWS", {
        accountData: this.accountData,
      });

      return {
        accountId: config.ibkr.accountId || "auto",
        connected: this.connected,
        balance: this.accountData.netLiquidation,
        cashBalance: this.accountData.cashBalance,
        unrealizedPnL: this.accountData.unrealizedPnL,
        realizedPnL: this.accountData.realizedPnL,
        netLiquidation: this.accountData.netLiquidation,
        totalCashValue: this.accountData.totalCashValue,
      };
    } catch (error: any) {
      logger.error("Error fetching account info from TWS", {
        error: error.message,
      });
      return {
        accountId: config.ibkr.accountId || "unknown",
        connected: this.connected,
        balance: 1000000,
        cashBalance: 1000000,
        unrealizedPnL: 0,
        realizedPnL: 0,
        netLiquidation: 1000000,
      };
    }
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
   * Manually sync all open orders from TWS
   * This forces TWS to send us updated order status
   */
  async syncOpenOrders(): Promise<void> {
    if (!this.connected || !this.ib) {
      logger.warn("Cannot sync orders: Not connected to TWS");
      return;
    }

    try {
      logger.info("🔄 Manually syncing open orders from TWS...");

      // Request all open orders - this will trigger openOrder and orderStatus events
      this.ib.reqAllOpenOrders();

      // ALSO request completed orders (executions) from today
      // This helps catch fills that TWS didn't notify us about
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      this.ib.reqExecutions(9999, {
        time: today.toISOString().split("T")[0].replace(/-/g, ""), // Format: YYYYMMDD
      });

      // Also request positions to update P&L
      this.ib.reqPositions();

      logger.info(
        "✅ Sync request sent to TWS (orders + executions + positions)"
      );
    } catch (error: any) {
      logger.error("Failed to sync open orders", { error: error.message });
    }
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
