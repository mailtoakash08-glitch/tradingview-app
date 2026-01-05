/**
 * Types for TradingView webhook alerts
 */

export type TradingViewAction = 
  | 'ENTRY_LONG' 
  | 'ENTRY_SHORT' 
  | 'EXIT' 
  | 'SL' 
  | 'TP'
  | 'TRAILING_STOP';

export type StrategyName = 
  | 'bread_and_butter' 
  | 'momentum' 
  | 'manual_bmnr';

/**
 * Raw alert payload from TradingView webhook
 */
export interface TradingViewAlert {
  strategy: StrategyName;
  symbol: string;
  action: TradingViewAction;
  qty?: number | null;
  tp?: number | null;
  sl?: number | null;
  stopPrice?: number | null; // For STOP MARKET orders (entries)
  trailingStop?: number | null; // Trailing stop distance in $
  outsideRth?: boolean;
  timestamp?: string;
}

/**
 * Validation result for TradingView alerts
 */
export interface AlertValidationResult {
  valid: boolean;
  errors?: string[];
}
