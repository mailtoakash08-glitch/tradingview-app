/**
 * Express application setup
 */

import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import webhookRoutes from "./routes/webhook";
import healthRoutes from "./routes/health";
import adminRoutes from "./routes/admin";
import uiRoutes from "./routes/ui";
import tradingRoutes from "./routes/trading";
import dashboardRoutes from "./routes/dashboard";
import workspaceRoutes from "./routes/workspace";
import desktopRoutes from "./routes/desktop";
import analyticsRoutes from "./routes/analytics";
import { logger } from "./logger";

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from public directory
  const publicPath = path.join(__dirname, "../public");
  app.use(express.static(publicPath));
  logger.info(`Serving static files from: ${publicPath}`);

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const reqId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Log incoming request immediately
    logger.info(`>>> INCOMING REQUEST [${reqId}]`, {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      contentType: req.get("content-type"),
      contentLength: req.get("content-length"),
    });

    // Log request body for POST/PUT requests
    if ((req.method === "POST" || req.method === "PUT") && req.body) {
      logger.info(`>>> REQUEST BODY [${reqId}]`, {
        bodyType: typeof req.body,
        body: req.body,
      });
    }

    res.on("finish", () => {
      const duration = Date.now() - start;
      logger.info(`<<< RESPONSE [${reqId}]`, {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        statusText: res.statusMessage,
        duration: `${duration}ms`,
      });
    });

    next();
  });

  // Routes
  app.use("/webhook", webhookRoutes);
  app.use("/health", healthRoutes);
  app.use("/admin", adminRoutes);
  app.use("/ui", uiRoutes);
  app.use("/trading", tradingRoutes);
  app.use("/workspace", workspaceRoutes); // Integrated trading workspace
  app.use("/desktop", desktopRoutes); // TradingView Desktop-style interface
  app.use("/api/dashboard", dashboardRoutes); // Dashboard API routes
  app.use("/api/analytics", analyticsRoutes); // Analytics API routes

  // Dashboard page
  app.get("/dashboard", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../public/dashboard.html"));
  });

  // Root endpoint
  app.get("/", (req: Request, res: Response) => {
    res.json({
      service: "trading-automation-backend",
      version: "1.0.0",
      status: "running",
      endpoints: {
        desktop: "/desktop", // 🚀 NEW: TradingView Desktop-style interface
        trading: "/trading",
        dashboard: "/dashboard",
        workspace: "/workspace",
        ui: "/ui",
        webhook: "/webhook/tradingview",
        health: "/health",
        healthDetailed: "/health/detailed",
        admin: "/admin",
        api: {
          positions: "/api/positions",
          orders: "/api/orders",
          performance: "/api/performance",
          account: "/api/account",
        },
      },
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    logger.warn("404 Not Found", {
      method: req.method,
      path: req.path,
      url: req.url,
      ip: req.ip,
    });

    res.status(404).json({
      status: "error",
      message: "Not found",
      path: req.path,
      availableEndpoints: {
        ui: "/ui",
        webhook: "/webhook/tradingview",
        health: "/health",
        admin: "/admin",
      },
    });
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error("Unhandled error", {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  });

  return app;
}
