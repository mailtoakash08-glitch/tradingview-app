/**
 * Order routing service
 * Converts internal TradeSignal into IBKR order requests
 */

import { TradeSignal, IbkrOrderRequest } from "../types/order";
import config from "../config";
import { logger } from "../logger";

class OrderRouter {
  /**
   * Build IBKR order request from trade signal
   */
  buildOrder(signal: TradeSignal): IbkrOrderRequest {
    logger.info("Building IBKR order", {
      symbol: signal.symbol,
      action: signal.action,
    });

    const orderRequest: IbkrOrderRequest = {
      symbol: signal.symbol,
      action: this.determineAction(signal),
      orderType: this.determineOrderType(signal),
      quantity: signal.quantity,
      outsideRth: signal.outsideRth,
      timeInForce: config.defaultTimeInForce,
      metadata: {
        strategy: signal.strategy,
        originalAction: signal.action,
      },
    };

    // Add limit price for limit orders
    if (orderRequest.orderType === "LMT" && (signal.limitPrice || signal.takeProfitPrice)) {
      orderRequest.limitPrice = signal.limitPrice || signal.takeProfitPrice;
    }

    // Add stop price for stop orders
    if (orderRequest.orderType === "STP" && (signal.stopLossPrice || signal.stopPrice)) {
      orderRequest.stopPrice = signal.stopLossPrice || signal.stopPrice;
    }

    // 🎯 Add BOTH stop and limit prices for Stop-Limit orders
    if (orderRequest.orderType === "STP_LMT") {
      if (signal.stopPrice && signal.limitPrice) {
        orderRequest.stopPrice = signal.stopPrice;
        orderRequest.limitPrice = signal.limitPrice;
      } else {
        logger.warn("Stop-Limit order missing stop or limit price", {
          stopPrice: signal.stopPrice,
          limitPrice: signal.limitPrice,
        });
      }
    }

    // Add trailing stop amount
    if (orderRequest.orderType === "TRAIL" && signal.trailingStopDistance) {
      orderRequest.trailingAmount = signal.trailingStopDistance;
      
      // IMPORTANT: IBKR does NOT support trailing stops in extended hours
      // Force outsideRth to false for TRAIL orders to avoid warning
      // "Attribute 'Outside Regular Trading Hours' is ignored..."
      orderRequest.outsideRth = false;
      
      logger.info("Trailing stop orders only work in regular hours (IBKR limitation)", {
        symbol: signal.symbol,
        trailingAmount: signal.trailingStopDistance,
      });
    }

    logger.debug("Built order request", orderRequest);

    return orderRequest;
  }

  /**
   * Determine IBKR action (BUY/SELL) from signal action
   */
  private determineAction(signal: TradeSignal): "BUY" | "SELL" {
    switch (signal.action) {
      case "ENTRY_LONG":
      case "TP": // Take-profit on long is typically a sell limit
        return "BUY";

      case "ENTRY_SHORT":
      case "SL": // Stop-loss handling (simplified for now)
        return "SELL";

      case "EXIT":
        // TODO: In production, determine direction based on current position
        // For now, default to SELL (assuming we're exiting a long)
        logger.warn(
          "EXIT action requires position tracking - defaulting to SELL",
          {
            symbol: signal.symbol,
          }
        );
        return "SELL";

      default:
        logger.error("Unknown action type", { action: signal.action });
        return "BUY"; // Safe default
    }
  }

  /**
   * Determine order type based on signal characteristics
   */
  private determineOrderType(
    signal: TradeSignal
  ): "MKT" | "LMT" | "STP" | "STP_LMT" | "TRAIL" {
    // If order type is explicitly specified (from UI), use it
    if (signal.orderType) {
      return signal.orderType;
    }

    // TP (take-profit) uses limit orders
    if (signal.action === "TP" && signal.takeProfitPrice) {
      return "LMT";
    }

    // SL (stop-loss) uses stop orders
    // TODO: In production, use stop-loss order type or bracket orders
    if (signal.action === "SL" && signal.stopLossPrice) {
      logger.warn(
        "Stop-loss order - using STP type (TODO: implement proper stop logic)",
        {
          symbol: signal.symbol,
        }
      );
      return "STP";
    }

    // Trailing stop
    if (signal.action === "TRAILING_STOP" || signal.trailingStopDistance) {
      logger.info("Using TRAIL order type for trailing stop", {
        symbol: signal.symbol,
        trailingAmount: signal.trailingStopDistance,
      });
      return "TRAIL";
    }

    // STOP MARKET entries - for fast-moving stocks
    // When stopPrice is set on ENTRY_LONG/SHORT, use STOP order
    if (
      (signal.action === "ENTRY_LONG" || signal.action === "ENTRY_SHORT") &&
      signal.stopPrice
    ) {
      logger.info("Using STOP MARKET order for entry", {
        symbol: signal.symbol,
        stopPrice: signal.stopPrice,
        action: signal.action,
      });
      return "STP";
    }

    // Entry orders with TP/SL could use bracket orders
    // For now, just use market orders for entries
    if (signal.action === "ENTRY_LONG" || signal.action === "ENTRY_SHORT") {
      // TODO: Consider using limit orders at better prices
      return "MKT";
    }

    // Default to market order
    return "MKT";
  }

  /**
   * Build multiple orders (e.g., entry + TP + SL as bracket)
   * TODO: Implement bracket order logic for production
   */
  buildBracketOrder(signal: TradeSignal): IbkrOrderRequest[] {
    const orders: IbkrOrderRequest[] = [];

    // Main entry order
    orders.push(this.buildOrder(signal));

    // If TP and SL are provided, create accompanying orders
    // TODO: Link these as a bracket order in IBKR
    if (signal.takeProfitPrice) {
      logger.debug("TODO: Add take-profit order to bracket", {
        tp: signal.takeProfitPrice,
      });
    }

    if (signal.stopLossPrice) {
      logger.debug("TODO: Add stop-loss order to bracket", {
        sl: signal.stopLossPrice,
      });
    }

    return orders;
  }
}

export const orderRouter = new OrderRouter();
