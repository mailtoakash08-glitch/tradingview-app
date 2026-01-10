-- Trading App Database Schema
-- Run this manually: psql -U tradinguser -d tradingdb -f manual-migration.sql

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT PRIMARY KEY,
    "orderId" TEXT UNIQUE NOT NULL,
    "symbol" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "limitPrice" DOUBLE PRECISION,
    "stopPrice" DOUBLE PRECISION,
    "trailingAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "filledQuantity" INTEGER NOT NULL DEFAULT 0,
    "avgFillPrice" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION,
    "outsideRth" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filledAt" TIMESTAMP,
    "cancelledAt" TIMESTAMP,
    "rejectedAt" TIMESTAMP,
    "errorMessage" TEXT
);

CREATE INDEX IF NOT EXISTS "Order_symbol_idx" ON "Order"("symbol");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_broker_idx" ON "Order"("broker");
CREATE INDEX IF NOT EXISTS "Order_submittedAt_idx" ON "Order"("submittedAt");

-- ============================================
-- POSITIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "Position" (
    "id" SERIAL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "avgEntryPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "unrealizedPnL" DOUBLE PRECISION NOT NULL,
    "realizedPnL" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    UNIQUE("symbol", "broker", "isOpen")
);

CREATE INDEX IF NOT EXISTS "Position_symbol_idx" ON "Position"("symbol");
CREATE INDEX IF NOT EXISTS "Position_broker_idx" ON "Position"("broker");
CREATE INDEX IF NOT EXISTS "Position_isOpen_idx" ON "Position"("isOpen");
CREATE INDEX IF NOT EXISTS "Position_openedAt_idx" ON "Position"("openedAt");

-- ============================================
-- TRADES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "Trade" (
    "id" SERIAL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION,
    "pnl" DOUBLE PRECISION,
    "pnlPercent" DOUBLE PRECISION,
    "executedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "positionId" INTEGER REFERENCES "Position"("id")
);

CREATE INDEX IF NOT EXISTS "Trade_symbol_idx" ON "Trade"("symbol");
CREATE INDEX IF NOT EXISTS "Trade_broker_idx" ON "Trade"("broker");
CREATE INDEX IF NOT EXISTS "Trade_executedAt_idx" ON "Trade"("executedAt");
CREATE INDEX IF NOT EXISTS "Trade_orderId_idx" ON "Trade"("orderId");

-- ============================================
-- ACCOUNT SNAPSHOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "AccountSnapshot" (
    "id" SERIAL PRIMARY KEY,
    "broker" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "equity" DOUBLE PRECISION NOT NULL,
    "totalPnL" DOUBLE PRECISION NOT NULL,
    "dayPnL" DOUBLE PRECISION NOT NULL,
    "openPositions" INTEGER NOT NULL,
    "openPositionsValue" DOUBLE PRECISION NOT NULL,
    "todayTrades" INTEGER NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AccountSnapshot_broker_idx" ON "AccountSnapshot"("broker");
CREATE INDEX IF NOT EXISTS "AccountSnapshot_timestamp_idx" ON "AccountSnapshot"("timestamp");

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "Setting" (
    "id" SERIAL PRIMARY KEY,
    "key" TEXT UNIQUE NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "Log" (
    "id" SERIAL PRIMARY KEY,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Log_level_idx" ON "Log"("level");
CREATE INDEX IF NOT EXISTS "Log_timestamp_idx" ON "Log"("timestamp");

