/**
 * TradingView webhook endpoint
 */

import { Router, Request, Response } from "express";
import { orderParser } from "../services/orderParser";
import { riskManager } from "../services/riskManager";
import { orderRouter } from "../services/orderRouter";
import { ibkrClient } from "../services/ibkrClient";
import { logger } from "../logger";

const router = Router();

/**
 * POST /webhook/tradingview
 * Receives alerts from TradingView and processes them
 */
router.post("/tradingview", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}`;

  logger.info(`[${requestId}] ========== NEW WEBHOOK REQUEST ==========`);

  try {
    // Log raw request details
    logger.info(`[${requestId}] Step 1: Received webhook`, {
      method: req.method,
      path: req.path,
      ip: req.ip,
      headers: {
        "content-type": req.get("content-type"),
        "user-agent": req.get("user-agent"),
        "content-length": req.get("content-length"),
      },
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      rawBody: JSON.stringify(req.body),
    });

    // Validate alert structure
    logger.info(`[${requestId}] Step 2: Validating alert structure`);
    const validation = orderParser.validateAlert(req.body);

    if (!validation.valid) {
      logger.error(`[${requestId}] Step 2 FAILED: Invalid alert structure`, {
        errors: validation.errors,
        receivedBody: req.body,
      });
      return res.status(400).json({
        status: "error",
        reason: "Invalid alert structure",
        errors: validation.errors,
      });
    }

    logger.info(`[${requestId}] Step 2 SUCCESS: Alert structure valid`);

    // Parse alert into internal signal
    logger.info(`[${requestId}] Step 3: Parsing alert into trade signal`);
    const signal = orderParser.parseAlert(req.body);
    logger.info(`[${requestId}] Step 3 SUCCESS: Signal parsed`, {
      symbol: signal.symbol,
      action: signal.action,
      strategy: signal.strategy,
      quantity: signal.quantity,
      stopLossPrice: signal.stopLossPrice,
      takeProfitPrice: signal.takeProfitPrice,
      trailingStopDistance: signal.trailingStopDistance,
      stopPrice: signal.stopPrice,
      outsideRth: signal.outsideRth,
    });

    // Run risk checks
    logger.info(`[${requestId}] Step 4: Running risk checks`);
    const riskCheck = riskManager.checkSignalAllowed(signal);

    if (!riskCheck.allowed) {
      logger.warn(`[${requestId}] Step 4 FAILED: Risk check rejected`, {
        symbol: signal.symbol,
        strategy: signal.strategy,
        action: signal.action,
        reason: riskCheck.reason,
      });
      return res.status(400).json({
        status: "rejected",
        reason: riskCheck.reason,
        symbol: signal.symbol,
        action: signal.action,
      });
    }

    logger.info(`[${requestId}] Step 4 SUCCESS: Risk checks passed`);

    // Build IBKR order
    logger.info(`[${requestId}] Step 5: Building IBKR order`);
    const orderRequest = orderRouter.buildOrder(signal);
    logger.info(`[${requestId}] Step 5 SUCCESS: Order built`, {
      ibkrAction: orderRequest.action,
      orderType: orderRequest.orderType,
      quantity: orderRequest.quantity,
      limitPrice: orderRequest.limitPrice,
      stopPrice: orderRequest.stopPrice,
      trailingAmount: orderRequest.trailingAmount,
      outsideRth: orderRequest.outsideRth,
    });

    // Place order with IBKR
    logger.info(`[${requestId}] Step 6: Placing order with IBKR Gateway`);
    const orderResponse = await ibkrClient.placeOrder(orderRequest);

    logger.info(`[${requestId}] Step 6 COMPLETE: IBKR response received`, {
      success: orderResponse.success,
      orderId: orderResponse.orderId,
      message: orderResponse.message,
    });

    if (!orderResponse.success) {
      logger.error(`[${requestId}] Step 6 FAILED: Order placement failed`, {
        orderRequest,
        response: orderResponse,
      });

      // Record failure for auto-stop tracking
      riskManager.recordFailure(
        signal,
        orderResponse.message || "Order placement failed"
      );

      return res.status(500).json({
        status: "error",
        reason: orderResponse.message || "Order placement failed",
        orderId: orderResponse.orderId,
      });
    }

    // Increment trade counters (symbol + strategy)
    logger.info(`[${requestId}] Step 7: Updating trade counters`);
    riskManager.incrementTrades(signal);
    logger.info(`[${requestId}] Step 7 SUCCESS: Trade counters updated`);

    const processingTime = Date.now() - startTime;
    logger.info(
      `[${requestId}] ========== SUCCESS: Order placed in ${processingTime}ms ==========`,
      {
        orderId: orderResponse.orderId,
        symbol: signal.symbol,
        action: signal.action,
        quantity: signal.quantity,
      }
    );

    return res.status(200).json({
      status: "ok",
      orderId: orderResponse.orderId,
      symbol: signal.symbol,
      action: signal.action,
      quantity: signal.quantity,
      details: {
        orderType: orderRequest.orderType,
        ibkrAction: orderRequest.action,
        outsideRth: orderRequest.outsideRth,
        processingTime: `${processingTime}ms`,
      },
    });
  } catch (error: any) {
    logger.error(
      `[${requestId}] ========== ERROR: Unexpected error ==========`,
      {
        errorMessage: error.message,
        errorName: error.name,
        stack: error.stack,
        requestBody: req.body,
      }
    );

    // Record error if we have a signal
    try {
      if (req.body && req.body.symbol) {
        const partialSignal = {
          symbol: req.body.symbol,
          strategy: req.body.strategy || "unknown",
        };
        riskManager.recordFailure(partialSignal as any, error);
      }
    } catch (recordError) {
      logger.error(`[${requestId}] Failed to record error`, { recordError });
    }

    return res.status(500).json({
      status: "error",
      reason: "Internal server error",
      message: error.message,
      requestId,
    });
  }
});

export default router;
