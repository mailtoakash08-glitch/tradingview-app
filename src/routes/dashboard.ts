/**
 * Dashboard API Routes
 * Real-time position tracking, order history, and performance stats
 * Now loads data from PostgreSQL database for persistence
 */

import { Router, Request, Response } from "express";
import { positionManager } from "../services/positionManager";
import { orderTracker } from "../services/orderTracker";
import { positionRepository } from "../repositories/positionRepository";
import { orderRepository } from "../repositories/orderRepository";
import { logger } from "../logger";

const router = Router();

/**
 * GET /api/positions - Get all open positions (from database)
 */
router.get("/positions", async (req: Request, res: Response) => {
  try {
    // Get broker from query parameter (default to 'demo')
    const broker = (req.query.broker as string) || "demo";

    // Load from database, filtered by broker
    const openPositions = await positionRepository.getOpen();
    const brokerPositions = openPositions.filter((p) => p.broker === broker);

    // Update current prices for all positions
    const axios = require("axios");
    const positionsWithPrices = await Promise.all(
      brokerPositions.map(async (position) => {
        try {
          // Fetch current price from market API
          const priceResponse = await axios.get(
            `http://localhost:${process.env.PORT || 3000}/api/market/quote/${
              position.symbol
            }`,
            {
              timeout: 2000,
            }
          );

          if (
            priceResponse.data &&
            priceResponse.data.data &&
            priceResponse.data.data.price
          ) {
            const currentPrice = priceResponse.data.data.price;
            const unrealizedPnL =
              (currentPrice - position.avgEntryPrice) * position.quantity;

            logger.info(`Updating ${position.symbol} price`, {
              entry: position.avgEntryPrice,
              current: currentPrice,
              pnl: unrealizedPnL,
            });

            // Update in database
            await positionRepository.updatePrices(
              position.symbol,
              position.broker,
              currentPrice,
              unrealizedPnL
            );

            return {
              ...position,
              currentPrice,
              unrealizedPnL,
            };
          }
        } catch (priceError: any) {
          logger.warn(`Failed to fetch price for ${position.symbol}`, {
            error: priceError.message,
          });
        }

        // Return original position if price fetch failed
        return position;
      })
    );

    // Calculate summary with updated prices
    const totalValue = positionsWithPrices.reduce(
      (sum, p) => sum + p.quantity * p.currentPrice,
      0
    );
    const totalPnL = positionsWithPrices.reduce(
      (sum, p) => sum + p.unrealizedPnL,
      0
    );

    res.json({
      success: true,
      data: {
        positions: positionsWithPrices.map((p) => ({
          symbol: p.symbol,
          quantity: p.quantity,
          avgEntryPrice: p.avgEntryPrice,
          currentPrice: p.currentPrice,
          unrealizedPnL: p.unrealizedPnL,
          realizedPnL: p.realizedPnL,
          value: p.quantity * p.currentPrice,
          broker: p.broker,
          strategy: p.strategy,
          openedAt: p.openedAt,
        })),
        summary: {
          totalPositions: positionsWithPrices.length,
          totalValue,
          totalPnL,
        },
      },
    });
  } catch (error: any) {
    logger.error("Error fetching positions", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch positions",
    });
  }
});

/**
 * GET /api/positions/:symbol - Get position for specific symbol
 */
router.get("/positions/:symbol", async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const broker = (req.query.broker as string) || "demo"; // Default to demo if not specified
    const position = await positionRepository.getBySymbol(
      symbol.toUpperCase(),
      broker
    );

    if (!position) {
      return res.status(404).json({
        success: false,
        error: `No position found for ${symbol}`,
      });
    }

    res.json({
      success: true,
      data: position,
    });
  } catch (error: any) {
    logger.error("Error fetching position", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch position",
    });
  }
});

/**
 * GET /api/orders - Get recent orders (from database)
 */
router.get("/orders", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const orders = await orderRepository.getAll({ limit });

    res.json({
      success: true,
      data: {
        orders,
        count: orders.length,
      },
    });
  } catch (error: any) {
    logger.error("Error fetching orders", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
    });
  }
});

/**
 * GET /api/orders/pending - Get pending orders (from database)
 */
router.get("/orders/pending", async (req: Request, res: Response) => {
  try {
    // Get broker from query parameter (default to 'demo')
    const broker = (req.query.broker as string) || "demo";

    const pendingOrders = await orderRepository.getPending();

    // Filter by broker
    const brokerOrders = pendingOrders.filter((o) => o.broker === broker);

    res.json({
      success: true,
      data: {
        orders: brokerOrders,
        count: brokerOrders.length,
      },
    });
  } catch (error: any) {
    logger.error("Error fetching pending orders", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch pending orders",
    });
  }
});

/**
 * GET /api/orders/today - Get today's orders
 */
router.get("/orders/today", (req: Request, res: Response) => {
  try {
    const orders = orderTracker.getTodaysOrders();

    res.json({
      success: true,
      data: {
        orders,
        count: orders.length,
      },
    });
  } catch (error: any) {
    logger.error("Error fetching today orders", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
    });
  }
});

/**
 * POST /api/orders/sync - Manually sync orders from TWS
 */
router.post("/orders/sync", async (req: Request, res: Response) => {
  try {
    const broker = (req.body.broker as string) || "demo";

    if (broker !== "ibkr") {
      return res.json({
        success: true,
        message: "Sync only available for IBKR broker",
      });
    }

    // Import ibkrClient and trigger sync
    const { ibkrClient } = await import("../services/ibkrClient");

    if (!ibkrClient.isConnected()) {
      return res.status(400).json({
        success: false,
        error: "Not connected to TWS",
      });
    }

    await ibkrClient.syncOpenOrders();

    res.json({
      success: true,
      message: "Order sync requested from TWS",
    });
  } catch (error: any) {
    logger.error("Error syncing orders", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to sync orders",
    });
  }
});

/**
 * GET /api/performance - Get performance stats
 */
router.get("/performance", (req: Request, res: Response) => {
  try {
    const daily = orderTracker.getDailyPerformance();

    res.json({
      success: true,
      data: {
        today: daily,
      },
    });
  } catch (error: any) {
    logger.error("Error fetching performance", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch performance",
    });
  }
});

/**
 * GET /api/account - Get account summary (from TWS or calculated from database)
 */
router.get("/account", async (req: Request, res: Response) => {
  try {
    const broker = (req.query.broker as string) || "demo";
    const positions = await positionRepository.getOpen();
    const allPositions = await positionRepository.getAll(); // Get all positions including closed

    // Try to get real account data from IBKR if using TWS
    let accountData: any = null;
    if (broker === "ibkr") {
      try {
        const { ibkrClient } = await import("../services/ibkrClient");
        accountData = await ibkrClient.getAccountInfo();
        logger.info("Retrieved account data from TWS", { accountData });
      } catch (error: any) {
        logger.warn("Failed to get TWS account data, using calculated values", {
          error: error.message,
        });
      }
    }

    // If we have real TWS data, use it for balance but calculate P&L from positions
    if (accountData && accountData.connected && accountData.balance) {
      const dailyPerf = orderTracker.getDailyPerformance();

      // Filter positions by broker
      const brokerPositions = positions.filter((p) => p.broker === broker);
      const brokerAllPositions = allPositions.filter(
        (p) => p.broker === broker
      );

      // Calculate P&L from our position data (more accurate than TWS)
      const realizedPnL = brokerAllPositions
        .filter((p) => !p.isOpen)
        .reduce((sum, p) => sum + (p.realizedPnL || 0), 0);

      const unrealizedPnL = brokerPositions.reduce(
        (sum, p) => sum + p.unrealizedPnL,
        0
      );

      const openPositionsValue = brokerPositions.reduce(
        (sum, p) => sum + p.quantity * p.currentPrice,
        0
      );

      return res.json({
        success: true,
        data: {
          balance: accountData.netLiquidation,
          cashBalance: accountData.cashBalance,
          equity: accountData.netLiquidation,
          totalPnL: realizedPnL + unrealizedPnL, // Use calculated P&L
          realizedPnL: realizedPnL, // Use calculated P&L
          unrealizedPnL: unrealizedPnL, // Use calculated P&L
          dayPnL: dailyPerf.netPnL,
          openPositions: brokerPositions.length,
          openPositionsValue: openPositionsValue,
          todayTrades: dailyPerf.totalTrades,
          winRate: dailyPerf.winRate,
          source: "TWS + Calculated", // Indicator that balance is from TWS, P&L is calculated
        },
      });
    }

    // Fallback: Calculate from database (for Demo mode or when TWS data unavailable)
    const realizedPnL = allPositions
      .filter((p) => !p.isOpen)
      .reduce((sum, p) => sum + (p.realizedPnL || 0), 0);

    const unrealizedPnL = positions.reduce(
      (sum, p) => sum + p.unrealizedPnL,
      0
    );
    const openPositionsValue = positions.reduce(
      (sum, p) => sum + p.quantity * p.currentPrice,
      0
    );

    const startingBalance = 1000000; // $1M paper trading
    const balance = startingBalance + realizedPnL;
    const cashBalance = balance - openPositionsValue;
    const equity = cashBalance + openPositionsValue;
    const totalPnL = realizedPnL + unrealizedPnL;

    const dailyPerf = orderTracker.getDailyPerformance();

    res.json({
      success: true,
      data: {
        balance,
        cashBalance,
        equity,
        totalPnL,
        realizedPnL,
        unrealizedPnL,
        dayPnL: dailyPerf.netPnL,
        openPositions: positions.length,
        openPositionsValue,
        todayTrades: dailyPerf.totalTrades,
        winRate: dailyPerf.winRate,
        source: "Calculated", // Indicator that this is calculated
      },
    });
  } catch (error: any) {
    logger.error("Error fetching account", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch account",
    });
  }
});

/**
 * POST /api/orders/:orderId/cancel - Cancel a pending order
 */
router.post("/orders/:orderId/cancel", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // Get the order from database
    const order = await orderRepository.getById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel order with status: ${order.status}`,
      });
    }

    // Update order status to CANCELLED
    await orderRepository.update(orderId, {
      status: "CANCELLED",
      cancelledAt: new Date().toISOString(),
    });

    logger.info("Order cancelled", {
      orderId,
      symbol: order.symbol,
      broker: order.broker,
    });

    res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error: any) {
    logger.error("Error cancelling order", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to cancel order",
    });
  }
});

/**
 * POST /api/positions/:symbol/close - Close a position by placing opposite order
 */
router.post("/positions/:symbol/close", async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const broker = (req.query.broker as string) || "demo";

    // Get position from database
    const position = await positionRepository.getBySymbol(
      symbol.toUpperCase(),
      broker
    );

    if (!position) {
      return res.status(404).json({
        success: false,
        error: `No open position found for ${symbol}`,
      });
    }

    // Close the position in database
    await positionRepository.close(
      symbol.toUpperCase(),
      broker,
      position.unrealizedPnL
    );

    logger.info("Position closed", {
      symbol,
      broker,
      pnl: position.unrealizedPnL,
    });

    res.json({
      success: true,
      message: "Position closed successfully",
      data: {
        symbol,
        closedPnL: position.unrealizedPnL,
      },
    });
  } catch (error: any) {
    logger.error("Error closing position", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to close position",
    });
  }
});

export default router;
