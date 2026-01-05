/**
 * Types for Position Tracking and Dashboard
 */

export interface Position {
  symbol: string;
  quantity: number; // Positive = long, Negative = short
  avgEntryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  side: 'LONG' | 'SHORT';
  value: number; // Current position value
  cost: number; // Total cost basis
  lastUpdate: Date;
}

export interface TrackedOrder {
  orderId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  orderType: 'MKT' | 'LMT' | 'STP' | 'TRAIL';
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  trailingAmount?: number;
  status: 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED';
  filledQuantity: number;
  avgFillPrice?: number;
  submittedAt: Date;
  filledAt?: Date;
  commission?: number;
  reason?: string; // For rejections
  strategy?: string;
}

export interface Trade {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  side: 'LONG' | 'SHORT';
  entryTime: Date;
  exitTime: Date;
  pnl: number;
  pnlPercent: number;
  commission: number;
  strategy?: string;
  duration: number; // milliseconds
}

export interface DailyPerformance {
  date: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  totalPnL: number;
  totalCommission: number;
  netPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  trades: Trade[];
}

export interface AccountSummary {
  balance: number;
  equity: number; // Balance + unrealized P&L
  buyingPower: number;
  totalPnL: number;
  dayPnL: number;
  openPositionsCount: number;
  openPositionsValue: number;
  marginUsed: number;
  availableMargin: number;
}

export interface PerformanceStats {
  today: DailyPerformance;
  allTime: {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    avgPnL: number;
    profitFactor: number;
    sharpeRatio?: number;
  };
  byStrategy: {
    [strategy: string]: {
      trades: number;
      winRate: number;
      totalPnL: number;
    };
  };
  bySymbol: {
    [symbol: string]: {
      trades: number;
      winRate: number;
      totalPnL: number;
    };
  };
}

export interface OrderFillEvent {
  orderId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  fillPrice: number;
  commission: number;
  timestamp: Date;
}

export interface PositionUpdate {
  positions: Position[];
  totalPnL: number;
  totalValue: number;
}

