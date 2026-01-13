/**
 * Application configuration loaded from environment variables
 */

import * as dotenv from "dotenv";

// Load .env file if it exists
dotenv.config();

interface Config {
  // Server
  port: number;
  nodeEnv: string;

  // Risk Management (Global)
  allowedSymbols: string[];
  maxTradesPerSymbolPerDay: number;
  defaultQty: number;

  // Strategy-Specific Settings
  strategies: {
    breadAndButter: {
      enabled: boolean;
      symbols: string[];
      maxTradesPerDay: number;
    };
    momentum: {
      enabled: boolean;
      maxTradesPerDay: number;
    };
    manualBmnr: {
      enabled: boolean;
    };
  };

  // IBKR
  ibkr: {
    host: string;
    port: number;
    clientId: number;
    accountId: string;
  };

  // Lightspeed
  lightspeed: {
    enabled: boolean;
    apiUrl: string;
    apiKey: string;
    apiSecret: string;
    accountId: string;
  };

  // Trading
  defaultBroker: "ibkr" | "lightspeed";
  defaultTimeInForce: "DAY" | "GTC";
  autoStopOnErrors: boolean;
  maxConsecutiveErrors: number;
}

const config: Config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Global allowed symbols (fallback)
  allowedSymbols: process.env.ALLOWED_SYMBOLS
    ? process.env.ALLOWED_SYMBOLS.split(",").map((s) => s.trim())
    : ["AAPL", "MSFT", "NVDA"],

  maxTradesPerSymbolPerDay: parseInt(
    process.env.MAX_TRADES_PER_SYMBOL_PER_DAY || "20",
    10
  ),

  defaultQty: parseInt(process.env.DEFAULT_QTY || "100", 10),

  // Strategy-specific configurations
  strategies: {
    breadAndButter: {
      enabled: process.env.BREAD_AND_BUTTER_ENABLED !== "false",
      symbols: process.env.BREAD_AND_BUTTER_SYMBOLS
        ? process.env.BREAD_AND_BUTTER_SYMBOLS.split(",").map((s) => s.trim())
        : ["AAPL", "MSFT"],
      maxTradesPerDay: parseInt(
        process.env.BREAD_AND_BUTTER_MAX_TRADES || "10",
        10
      ),
    },
    momentum: {
      enabled: process.env.MOMENTUM_ENABLED !== "false",
      maxTradesPerDay: parseInt(process.env.MOMENTUM_MAX_TRADES || "20", 10),
    },
    manualBmnr: {
      enabled: true, // Manual trading via desktop interface
    },
  },

  ibkr: {
    host: process.env.IBKR_HOST || "localhost",
    port: parseInt(process.env.IBKR_PORT || "7497", 10),
    clientId: parseInt(process.env.IBKR_CLIENT_ID || "0", 10),
    accountId: process.env.IBKR_ACCOUNT_ID || "",
  },

  lightspeed: {
    enabled: process.env.LIGHTSPEED_ENABLED === "true",
    apiUrl: process.env.LIGHTSPEED_API_URL || "https://api.lightspeed.com",
    apiKey: process.env.LIGHTSPEED_API_KEY || "",
    apiSecret: process.env.LIGHTSPEED_API_SECRET || "",
    accountId: process.env.LIGHTSPEED_ACCOUNT_ID || "",
  },

  defaultBroker:
    (process.env.DEFAULT_BROKER as "ibkr" | "lightspeed") || "ibkr",
  defaultTimeInForce:
    (process.env.DEFAULT_TIME_IN_FORCE as "DAY" | "GTC") || "DAY",
  autoStopOnErrors: process.env.AUTO_STOP_ON_ERRORS !== "false",
  maxConsecutiveErrors: parseInt(process.env.MAX_CONSECUTIVE_ERRORS || "3", 10),
};

export default config;
