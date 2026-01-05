/**
 * Health and status endpoints
 */

import { Router, Request, Response } from 'express';
import { stateStore } from '../services/stateStore';
import { ibkrClient } from '../services/ibkrClient';
import config from '../config';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /health/detailed
 * Detailed health and status information
 */
router.get('/detailed', (req: Request, res: Response) => {
  const state = stateStore.getState();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: {
      name: 'trading-automation-backend',
      environment: config.nodeEnv,
    },
    ibkr: {
      connected: ibkrClient.isConnected(),
      status: ibkrClient.isConnected() ? 'connected' : 'disconnected',
    },
    trading: {
      killSwitch: state.killSwitch,
      tradesPerSymbol: state.tradesPerSymbol,
      allowedSymbols: config.allowedSymbols,
      maxTradesPerSymbolPerDay: config.maxTradesPerSymbolPerDay,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    },
  });
});

/**
 * GET /health/ready
 * Readiness probe (for k8s/docker)
 */
router.get('/ready', (req: Request, res: Response) => {
  // Check if service is ready to accept traffic
  const isReady = ibkrClient.isConnected(); // In production, check all dependencies

  if (isReady) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      reason: 'IBKR client not connected',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/live
 * Liveness probe (for k8s/docker)
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export default router;

