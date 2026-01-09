/**
 * Service to parse TradingView alerts into internal TradeSignal format
 */

import { TradingViewAlert, AlertValidationResult } from '../types/tradingView';
import { TradeSignal } from '../types/order';
import config from '../config';
import { logger } from '../logger';

class OrderParser {
  /**
   * Validate TradingView alert structure and required fields
   */
  validateAlert(alert: any): AlertValidationResult {
    const errors: string[] = [];

    if (!alert) {
      return { valid: false, errors: ['Alert body is empty'] };
    }

    // Check required fields
    if (!alert.strategy || typeof alert.strategy !== 'string') {
      errors.push('Missing or invalid field: strategy');
    }

    if (!alert.symbol || typeof alert.symbol !== 'string') {
      errors.push('Missing or invalid field: symbol');
    }

    if (!alert.action || typeof alert.action !== 'string') {
      errors.push('Missing or invalid field: action');
    } else {
      const validActions = ['ENTRY_LONG', 'ENTRY_SHORT', 'EXIT', 'SL', 'TP', 'TRAILING_STOP'];
      if (!validActions.includes(alert.action)) {
        errors.push(
          `Invalid action: ${alert.action}. Must be one of: ${validActions.join(', ')}`
        );
      }
    }

    // Validate strategy
    if (alert.strategy) {
      const validStrategies = ['bread_and_butter', 'momentum', 'manual_bmnr'];
      if (!validStrategies.includes(alert.strategy)) {
        errors.push(
          `Invalid strategy: ${alert.strategy}. Must be one of: ${validStrategies.join(', ')}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Parse and normalize TradingView alert into internal TradeSignal
   */
  parseAlert(alert: TradingViewAlert): TradeSignal {
    logger.info('Parsing TradingView alert', { symbol: alert.symbol, action: alert.action });

    // Normalize symbol (uppercase, trim)
    const symbol = alert.symbol.trim().toUpperCase();

    // Determine quantity
    const quantity = alert.qty && alert.qty > 0 ? alert.qty : config.defaultQty;

    // Parse timestamp
    const timestamp = alert.timestamp ? new Date(alert.timestamp) : new Date();

    const signal: TradeSignal = {
      strategy: alert.strategy,
      symbol,
      action: alert.action,
      quantity,
      // Extract broker selection (ibkr, lightspeed, or demo)
      broker: alert.broker as "ibkr" | "lightspeed" | "demo" | undefined,
      // Default to true for extended hours trading (client requirement)
      // Can be explicitly set to false in alert if regular hours only
      outsideRth: alert.outsideRth !== undefined ? alert.outsideRth : true,
      timestamp,
      rawAlert: alert,
    };

    // Add optional fields if present
    if (alert.tp && alert.tp > 0) {
      signal.takeProfitPrice = alert.tp;
    }

    if (alert.sl && alert.sl > 0) {
      signal.stopLossPrice = alert.sl;
    }

    if (alert.stopPrice && alert.stopPrice > 0) {
      signal.stopPrice = alert.stopPrice;
    }

    if (alert.trailingStop && alert.trailingStop > 0) {
      signal.trailingStopDistance = alert.trailingStop;
    }

    logger.debug('Parsed signal', signal);

    return signal;
  }
}

export const orderParser = new OrderParser();

