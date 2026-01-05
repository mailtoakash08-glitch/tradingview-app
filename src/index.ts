/**
 * Application entrypoint
 */

import { createApp } from "./server";
import { ibkrClient } from "./services/ibkrClient";
import { logger } from "./logger";
import config from "./config";

async function start() {
  try {
    logger.info("Starting trading automation backend", {
      nodeEnv: config.nodeEnv,
      port: config.port,
      allowedSymbols: config.allowedSymbols,
    });

    // Initialize IBKR connection
    try {
      await ibkrClient.connect();
    } catch (error: any) {
      logger.error("Failed to connect to IBKR", {
        error: error.message,
        note: "Running in simulation mode",
      });
    }

    // Create and start Express app
    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port}`, {
        environment: config.nodeEnv,
        endpoints: {
          webhook: `http://localhost:${config.port}/webhook/tradingview`,
          health: `http://localhost:${config.port}/health`,
          admin: `http://localhost:${config.port}/admin`,
        },
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);

      server.close(async () => {
        logger.info("HTTP server closed");

        try {
          await ibkrClient.disconnect();
          logger.info("IBKR client disconnected");
        } catch (error: any) {
          logger.error("Error disconnecting IBKR client", {
            error: error.message,
          });
        }

        logger.info("Shutdown complete");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle uncaught errors
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught exception", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    process.on("unhandledRejection", (reason: any) => {
      logger.error("Unhandled promise rejection", {
        reason: reason?.message || reason,
      });
      process.exit(1);
    });
  } catch (error: any) {
    logger.error("Failed to start application", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Start the application
start();
