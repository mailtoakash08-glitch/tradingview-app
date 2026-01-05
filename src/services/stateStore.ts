/**
 * In-memory state store for trade counters and kill-switch
 * TODO: Replace with Redis or database for production
 */

import { logger } from '../logger';
import { StrategyName } from '../types/tradingView';

class StateStore {
  private tradesPerSymbolToday: Map<string, number>;
  private tradesPerStrategyToday: Map<StrategyName, number>;
  private killSwitch: boolean;
  private lastResetDate: string;
  
  // Momentum strategy - daily ticker selection
  private momentumDailyTicker: string | null;
  private momentumTickerSetDate: string | null;
  
  // Error tracking for auto-stop
  private consecutiveErrors: number;
  private lastErrorTime: Date | null;
  private autoStopTriggered: boolean;

  constructor() {
    this.tradesPerSymbolToday = new Map();
    this.tradesPerStrategyToday = new Map();
    this.killSwitch = false;
    this.lastResetDate = this.getTodayDate();
    
    this.momentumDailyTicker = null;
    this.momentumTickerSetDate = null;
    
    this.consecutiveErrors = 0;
    this.lastErrorTime = null;
    this.autoStopTriggered = false;

    // Reset counters daily at midnight
    this.scheduleDailyReset();
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private scheduleDailyReset(): void {
    // Check every hour if we need to reset
    setInterval(() => {
      const today = this.getTodayDate();
      if (today !== this.lastResetDate) {
        this.resetDailyCounters();
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  private resetDailyCounters(): void {
    logger.info('Resetting daily trade counters');
    this.tradesPerSymbolToday.clear();
    this.tradesPerStrategyToday.clear();
    this.momentumDailyTicker = null;
    this.momentumTickerSetDate = null;
    this.consecutiveErrors = 0;
    this.autoStopTriggered = false;
    this.lastResetDate = this.getTodayDate();
  }

  /**
   * Get trade count for a symbol today
   */
  getTradeCount(symbol: string): number {
    return this.tradesPerSymbolToday.get(symbol) || 0;
  }

  /**
   * Increment trade count for a symbol
   */
  incrementTradeCount(symbol: string): void {
    const current = this.getTradeCount(symbol);
    this.tradesPerSymbolToday.set(symbol, current + 1);
    logger.debug(`Trade count for ${symbol}: ${current + 1}`);
  }

  /**
   * Check if kill-switch is enabled
   */
  isKillSwitchOn(): boolean {
    return this.killSwitch;
  }

  /**
   * Set kill-switch state
   */
  setKillSwitch(enabled: boolean): void {
    this.killSwitch = enabled;
    logger.warn(`Kill-switch ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Get strategy trade count
   */
  getStrategyTradeCount(strategy: StrategyName): number {
    return this.tradesPerStrategyToday.get(strategy) || 0;
  }

  /**
   * Increment strategy trade count
   */
  incrementStrategyTradeCount(strategy: StrategyName): void {
    const current = this.getStrategyTradeCount(strategy);
    this.tradesPerStrategyToday.set(strategy, current + 1);
    logger.debug(`Trade count for strategy ${strategy}: ${current + 1}`);
  }

  /**
   * Set momentum strategy daily ticker
   */
  setMomentumDailyTicker(symbol: string): void {
    const today = this.getTodayDate();
    this.momentumDailyTicker = symbol.toUpperCase();
    this.momentumTickerSetDate = today;
    logger.info(`Momentum daily ticker set to: ${this.momentumDailyTicker}`);
  }

  /**
   * Get momentum strategy daily ticker
   */
  getMomentumDailyTicker(): string | null {
    const today = this.getTodayDate();
    // Reset if ticker was set on a different day
    if (this.momentumTickerSetDate && this.momentumTickerSetDate !== today) {
      this.momentumDailyTicker = null;
      this.momentumTickerSetDate = null;
    }
    return this.momentumDailyTicker;
  }

  /**
   * Clear momentum daily ticker
   */
  clearMomentumDailyTicker(): void {
    logger.info('Clearing momentum daily ticker');
    this.momentumDailyTicker = null;
    this.momentumTickerSetDate = null;
  }

  /**
   * Record an error for auto-stop tracking
   */
  recordError(): void {
    this.consecutiveErrors++;
    this.lastErrorTime = new Date();
    logger.warn(`Error recorded. Consecutive errors: ${this.consecutiveErrors}`);
  }

  /**
   * Reset error counter (on successful trade)
   */
  resetErrorCount(): void {
    if (this.consecutiveErrors > 0) {
      logger.info('Resetting error counter after successful trade');
      this.consecutiveErrors = 0;
      this.lastErrorTime = null;
    }
  }

  /**
   * Get consecutive error count
   */
  getConsecutiveErrors(): number {
    return this.consecutiveErrors;
  }

  /**
   * Trigger auto-stop due to errors
   */
  triggerAutoStop(): void {
    this.autoStopTriggered = true;
    this.killSwitch = true;
    logger.error('AUTO-STOP TRIGGERED due to consecutive errors');
  }

  /**
   * Check if auto-stop was triggered
   */
  isAutoStopTriggered(): boolean {
    return this.autoStopTriggered;
  }

  /**
   * Reset auto-stop (manual intervention required)
   */
  resetAutoStop(): void {
    logger.warn('Auto-stop reset - manual intervention');
    this.autoStopTriggered = false;
    this.consecutiveErrors = 0;
    this.lastErrorTime = null;
  }

  /**
   * Get current state snapshot
   */
  getState(): any {
    return {
      killSwitch: this.killSwitch,
      autoStopTriggered: this.autoStopTriggered,
      tradesPerSymbol: Object.fromEntries(this.tradesPerSymbolToday),
      tradesPerStrategy: Object.fromEntries(this.tradesPerStrategyToday),
      momentumDailyTicker: this.momentumDailyTicker,
      consecutiveErrors: this.consecutiveErrors,
      lastErrorTime: this.lastErrorTime?.toISOString() || null,
      lastResetDate: this.lastResetDate,
    };
  }
}

// Singleton instance
export const stateStore = new StateStore();

