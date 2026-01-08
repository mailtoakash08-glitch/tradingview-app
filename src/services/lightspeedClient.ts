/**
 * Lightspeed Trading API Client
 * Handles order placement, position management, and account data via Lightspeed API
 */

import axios, { AxiosInstance } from 'axios';
import { IbkrOrderRequest, IbkrOrderResponse } from '../types/order';
import { logger } from '../logger';
import config from '../config';
import { positionManager } from './positionManager';
import { orderTracker } from './orderTracker';

class LightspeedClient {
  private apiClient: AxiosInstance | null;
  private connected: boolean;
  private reconnectTimer: NodeJS.Timeout | null;

  constructor() {
    this.apiClient = null;
    this.connected = false;
    this.reconnectTimer = null;
  }

  /**
   * Initialize Lightspeed API client
   */
  async connect(): Promise<void> {
    if (!config.lightspeed.enabled) {
      logger.warn('Lightspeed is not enabled in configuration');
      return;
    }

    if (!config.lightspeed.apiKey || !config.lightspeed.apiSecret) {
      logger.error('Lightspeed API credentials not configured');
      throw new Error('Lightspeed credentials missing');
    }

    logger.info('Connecting to Lightspeed API', {
      apiUrl: config.lightspeed.apiUrl,
      accountId: config.lightspeed.accountId,
    });

    try {
      // Create axios instance with authentication
      this.apiClient = axios.create({
        baseURL: config.lightspeed.apiUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.lightspeed.apiKey,
          'X-API-Secret': config.lightspeed.apiSecret,
        },
      });

      // Test connection
      await this.testConnection();
      
      this.connected = true;
      logger.info('Connected to Lightspeed API successfully');

      // Start polling for position updates
      this.startPolling();
    } catch (error: any) {
      logger.error('Failed to connect to Lightspeed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Test API connection
   */
  private async testConnection(): Promise<void> {
    try {
      const response = await this.apiClient!.get('/account/status');
      logger.info('Lightspeed connection test successful', {
        status: response.data,
      });
    } catch (error: any) {
      logger.error('Lightspeed connection test failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Place order via Lightspeed
   */
  async placeOrder(orderRequest: IbkrOrderRequest): Promise<IbkrOrderResponse> {
    if (!this.connected || !this.apiClient) {
      throw new Error('Not connected to Lightspeed');
    }

    logger.info('Placing Lightspeed order', {
      symbol: orderRequest.symbol,
      action: orderRequest.action,
      quantity: orderRequest.quantity,
      orderType: orderRequest.orderType,
    });

    try {
      // Map our order format to Lightspeed format
      const lightspeedOrder = this.mapToLightspeedOrder(orderRequest);

      // Place order
      const response = await this.apiClient.post('/orders', lightspeedOrder);

      const lightspeedOrderId = response.data.orderId;
      
      logger.info('Lightspeed order placed successfully', {
        lightspeedOrderId,
        symbol: orderRequest.symbol,
      });

      return {
        success: true,
        orderId: lightspeedOrderId,
        message: 'Order placed with Lightspeed',
      };
    } catch (error: any) {
      logger.error('Failed to place Lightspeed order', {
        error: error.message,
        response: error.response?.data,
      });

      return {
        success: false,
        orderId: '',
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Map our order format to Lightspeed API format
   */
  private mapToLightspeedOrder(order: IbkrOrderRequest): any {
    return {
      accountId: config.lightspeed.accountId,
      symbol: order.symbol,
      side: order.action === 'BUY' ? 'buy' : 'sell',
      quantity: order.quantity,
      orderType: this.mapOrderType(order.orderType),
      timeInForce: order.timeInForce || 'day',
      limitPrice: order.limitPrice,
      stopPrice: order.stopPrice,
      trailingAmount: order.trailingAmount,
      extendedHours: order.outsideRth || false,
    };
  }

  /**
   * Map order type to Lightspeed format
   */
  private mapOrderType(orderType: string): string {
    const mapping: { [key: string]: string } = {
      'MKT': 'market',
      'LMT': 'limit',
      'STP': 'stop',
      'STP LMT': 'stop_limit',
      'TRAIL': 'trailing_stop',
    };
    return mapping[orderType] || 'market';
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.connected || !this.apiClient) {
      throw new Error('Not connected to Lightspeed');
    }

    try {
      await this.apiClient.delete(`/orders/${orderId}`);
      logger.info('Lightspeed order cancelled', { orderId });
      return true;
    } catch (error: any) {
      logger.error('Failed to cancel Lightspeed order', {
        orderId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get account positions
   */
  async getPositions(): Promise<any[]> {
    if (!this.connected || !this.apiClient) {
      return [];
    }

    try {
      const response = await this.apiClient.get('/positions');
      return response.data.positions || [];
    } catch (error: any) {
      logger.error('Failed to fetch Lightspeed positions', {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get account data
   */
  async getAccountData(): Promise<any> {
    if (!this.connected || !this.apiClient) {
      return null;
    }

    try {
      const response = await this.apiClient.get('/account');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch Lightspeed account data', {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Start polling for updates
   */
  private startPolling(): void {
    // Poll positions every 5 seconds
    setInterval(async () => {
      if (this.connected) {
        const positions = await this.getPositions();
        // Update position manager with Lightspeed positions
        // TODO: Sync positions with position manager
      }
    }, 5000);
  }

  /**
   * Disconnect from Lightspeed
   */
  disconnect(): void {
    this.connected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    logger.info('Disconnected from Lightspeed');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}

export const lightspeedClient = new LightspeedClient();

