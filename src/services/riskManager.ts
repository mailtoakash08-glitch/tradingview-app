/**
 * Risk management service
 * Implements symbol whitelist, trade limits, strategy-specific rules, and kill-switch
 */

import { TradeSignal, RiskCheckResult } from "../types/order";
import { StrategyName } from "../types/tradingView";
import config from "../config";
import { stateStore } from "./stateStore";
import { logger } from "../logger";

class RiskManager {
  /**
   * Check if a symbol is allowed for a specific strategy
   */
  private isSymbolAllowedForStrategy(
    symbol: string,
    strategy: StrategyName
  ): boolean {
    switch (strategy) {
      case "bread_and_butter":
        return config.strategies.breadAndButter.symbols.includes(symbol);

      case "momentum":
        // Momentum strategy requires daily ticker to be set
        const momentumTicker = stateStore.getMomentumDailyTicker();
        if (!momentumTicker) {
          return false; // No ticker set yet
        }
        return symbol === momentumTicker;

      case "manual_bmnr":
        // Manual strategy should NOT be automated
        return false;

      default:
        // Fallback to global whitelist
        return config.allowedSymbols.includes(symbol);
    }
  }

  /**
   * Check if strategy is enabled
   */
  private isStrategyEnabled(strategy: StrategyName): boolean {
    switch (strategy) {
      case "bread_and_butter":
        return config.strategies.breadAndButter.enabled;
      case "momentum":
        return config.strategies.momentum.enabled;
      case "manual_bmnr":
        return config.strategies.manualBmnr.enabled;
      default:
        return false;
    }
  }

  /**
   * Check if strategy is within trade limit
   */
  private isWithinStrategyTradeLimit(strategy: StrategyName): boolean {
    const currentCount = stateStore.getStrategyTradeCount(strategy);

    switch (strategy) {
      case "bread_and_butter":
        return currentCount < config.strategies.breadAndButter.maxTradesPerDay;
      case "momentum":
        return currentCount < config.strategies.momentum.maxTradesPerDay;
      default:
        return true;
    }
  }

  /**
   * Check if symbol has exceeded max trades for today
   */
  private isWithinSymbolTradeLimit(symbol: string): boolean {
    const currentCount = stateStore.getTradeCount(symbol);
    return currentCount < config.maxTradesPerSymbolPerDay;
  }

  /**
   * Check momentum strategy requirements
   */
  private checkMomentumRequirements(signal: TradeSignal): RiskCheckResult {
    const momentumTicker = stateStore.getMomentumDailyTicker();

    if (!momentumTicker) {
      return {
        allowed: false,
        reason:
          "Momentum strategy requires daily ticker to be set first. Use /admin/momentum/set-ticker endpoint.",
      };
    }

    if (signal.symbol !== momentumTicker) {
      return {
        allowed: false,
        reason: `Momentum strategy only allows trading ${momentumTicker} today. Received: ${signal.symbol}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if auto-stop should trigger
   */
  private checkAutoStop(): void {
    if (!config.autoStopOnErrors) {
      return;
    }

    const errorCount = stateStore.getConsecutiveErrors();
    if (
      errorCount >= config.maxConsecutiveErrors &&
      !stateStore.isAutoStopTriggered()
    ) {
      stateStore.triggerAutoStop();
    }
  }

  /**
   * Perform all risk checks on a trade signal
   */
  checkSignalAllowed(signal: TradeSignal): RiskCheckResult {
    logger.info("Running risk checks", {
      symbol: signal.symbol,
      action: signal.action,
      strategy: signal.strategy,
    });

    // Check auto-stop status
    if (stateStore.isAutoStopTriggered()) {
      return {
        allowed: false,
        reason:
          "Auto-stop triggered due to consecutive errors. Manual reset required via /admin/reset-auto-stop",
      };
    }

    // Check kill-switch
    if (stateStore.isKillSwitchOn()) {
      logger.warn("Trade blocked by kill-switch", { signal });
      return {
        allowed: false,
        reason: "Kill-switch is enabled - all trading is disabled",
      };
    }

    // Check if strategy is enabled
    if (!this.isStrategyEnabled(signal.strategy)) {
      logger.warn("Strategy not enabled", { strategy: signal.strategy });
      return {
        allowed: false,
        reason: `Strategy "${signal.strategy}" is not enabled`,
      };
    }

    // Check momentum strategy requirements
    if (signal.strategy === "momentum") {
      const momentumCheck = this.checkMomentumRequirements(signal);
      if (!momentumCheck.allowed) {
        logger.warn("Momentum strategy requirements not met", {
          reason: momentumCheck.reason,
        });
        return momentumCheck;
      }
    }

    // Check symbol whitelist for strategy
    if (!this.isSymbolAllowedForStrategy(signal.symbol, signal.strategy)) {
      logger.warn("Symbol not allowed for strategy", {
        symbol: signal.symbol,
        strategy: signal.strategy,
      });

      if (signal.strategy === "momentum") {
        const ticker = stateStore.getMomentumDailyTicker();
        return {
          allowed: false,
          reason: `Momentum strategy only allows ${ticker} today. Received: ${signal.symbol}`,
        };
      }

      return {
        allowed: false,
        reason: `Symbol ${signal.symbol} is not allowed for ${signal.strategy} strategy`,
      };
    }

    // Check strategy trade limits
    if (!this.isWithinStrategyTradeLimit(signal.strategy)) {
      const currentCount = stateStore.getStrategyTradeCount(signal.strategy);
      logger.warn("Strategy trade limit exceeded", {
        strategy: signal.strategy,
        currentCount,
      });
      return {
        allowed: false,
        reason: `Daily trade limit exceeded for ${signal.strategy} strategy`,
      };
    }

    // Check symbol trade limits
    if (!this.isWithinSymbolTradeLimit(signal.symbol)) {
      const currentCount = stateStore.getTradeCount(signal.symbol);
      logger.warn("Symbol trade limit exceeded", {
        symbol: signal.symbol,
        currentCount,
        maxAllowed: config.maxTradesPerSymbolPerDay,
      });
      return {
        allowed: false,
        reason: `Daily trade limit exceeded for ${signal.symbol} (${currentCount}/${config.maxTradesPerSymbolPerDay})`,
      };
    }

    logger.info("Risk checks passed", {
      symbol: signal.symbol,
      strategy: signal.strategy,
    });
    return { allowed: true };
  }

  /**
   * Increment trade counters after successful order
   */
  incrementTrades(signal: TradeSignal): void {
    stateStore.incrementTradeCount(signal.symbol);
    stateStore.incrementStrategyTradeCount(signal.strategy);
    stateStore.resetErrorCount(); // Reset error count on success
  }

  /**
   * Record a failed order
   */
  recordFailure(signal: TradeSignal, error: any): void {
    stateStore.recordError();
    this.checkAutoStop();

    logger.error("Order failure recorded", {
      symbol: signal.symbol,
      strategy: signal.strategy,
      error: error.message || error,
      consecutiveErrors: stateStore.getConsecutiveErrors(),
    });
  }

  /**
   * Check kill-switch status
   */
  isKillSwitchOn(): boolean {
    return stateStore.isKillSwitchOn();
  }

  /**
   * Enable or disable kill-switch
   */
  setKillSwitch(enabled: boolean): void {
    stateStore.setKillSwitch(enabled);
  }

  /**
   * Set momentum daily ticker
   */
  setMomentumDailyTicker(symbol: string): void {
    stateStore.setMomentumDailyTicker(symbol);
  }

  /**
   * Get momentum daily ticker
   */
  getMomentumDailyTicker(): string | null {
    return stateStore.getMomentumDailyTicker();
  }

  /**
   * Clear momentum daily ticker
   */
  clearMomentumDailyTicker(): void {
    stateStore.clearMomentumDailyTicker();
  }

  /**
   * Reset auto-stop
   */
  resetAutoStop(): void {
    stateStore.resetAutoStop();
  }
}

export const riskManager = new RiskManager();
