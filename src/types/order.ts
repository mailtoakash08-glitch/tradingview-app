/**
 * Internal order and signal types
 */

import { TradingViewAction, StrategyName } from "./tradingView";

/**
 * Normalized internal trade signal
 */
export interface TradeSignal {
  strategy: StrategyName;
  symbol: string;
  action: TradingViewAction;
  quantity: number;
  broker?: "ibkr" | "lightspeed" | "demo"; // Broker selection (added demo)
  orderType?: "MKT" | "LMT" | "STP" | "STP_LMT" | "TRAIL"; // Added Stop-Limit
  takeProfitPrice?: number;
  stopLossPrice?: number;
  stopPrice?: number; // For STOP MARKET entry orders
  limitPrice?: number; // For LIMIT orders and Stop-Limit orders
  trailingStopDistance?: number;
  outsideRth: boolean;
  timestamp: Date;
  rawAlert: any;
}

/**
 * IBKR order request
 */
export interface IbkrOrderRequest {
  symbol: string;
  action: "BUY" | "SELL";
  orderType: "MKT" | "LMT" | "STP" | "STP_LMT" | "TRAIL"; // Added Stop-Limit
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  trailingAmount?: number;
  outsideRth: boolean;
  timeInForce: "DAY" | "GTC";
  metadata?: {
    strategy: StrategyName;
    originalAction: TradingViewAction;
  };
}

/**
 * IBKR order response
 */
export interface IbkrOrderResponse {
  success: boolean;
  orderId: string;
  message?: string;
  error?: string;
  raw?: any;
}

/**
 * Risk check result
 */
export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Strategy configuration
 */
export interface StrategyConfig {
  name: StrategyName;
  enabled: boolean;
  allowedSymbols: string[];
  maxTradesPerDay: number;
  allowExtendedHours: boolean;
  requiresDailySetup?: boolean; // For momentum strategy
}
