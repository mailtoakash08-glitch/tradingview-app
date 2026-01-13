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
  broker?: 'ibkr' | 'lightspeed' | 'demo'; // Broker selection
  orderType?: 'MKT' | 'LMT' | 'STP' | 'TRAIL'; // Explicit order type from UI
  limitPrice?: number | null; // For LIMIT orders
  tp?: number | null;
  sl?: number | null;
  stopPrice?: number | null; // For STOP MARKET orders (entries)
  trailingStop?: number | null; // Trailing stop distance in $
  trailingAmount?: number | null; // Alternative field name for trailing stop
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
