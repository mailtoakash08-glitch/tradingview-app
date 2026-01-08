/**
 * Broker Router
 * Routes orders to the appropriate broker (IBKR or Lightspeed)
 */

import { IbkrOrderRequest, IbkrOrderResponse } from '../types/order';
import { ibkrClient } from './ibkrClient';
import { lightspeedClient } from './lightspeedClient';
import { logger } from '../logger';
import config from '../config';

class BrokerRouter {
  /**
   * Place order with specified broker
   */
  async placeOrder(
    orderRequest: IbkrOrderRequest,
    broker: 'ibkr' | 'lightspeed' = config.defaultBroker
  ): Promise<IbkrOrderResponse> {
    logger.info('Routing order to broker', {
      broker,
      symbol: orderRequest.symbol,
      action: orderRequest.action,
      quantity: orderRequest.quantity,
    });

    try {
      switch (broker) {
        case 'lightspeed':
          if (!config.lightspeed.enabled || !lightspeedClient.isConnected()) {
            logger.warn('Lightspeed not available, falling back to IBKR');
            return await ibkrClient.placeOrder(orderRequest);
          }
          return await lightspeedClient.placeOrder(orderRequest);

        case 'ibkr':
        default:
          if (!ibkrClient.isConnected()) {
            throw new Error('IBKR not connected');
          }
          return await ibkrClient.placeOrder(orderRequest);
      }
    } catch (error: any) {
      logger.error('Failed to place order', {
        broker,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Cancel order with specified broker
   */
  async cancelOrder(
    orderId: string,
    broker: 'ibkr' | 'lightspeed'
  ): Promise<boolean> {
    logger.info('Cancelling order', { broker, orderId });

    try {
      switch (broker) {
        case 'lightspeed':
          return await lightspeedClient.cancelOrder(orderId);
        case 'ibkr':
        default:
          return await ibkrClient.cancelOrder(orderId);
      }
    } catch (error: any) {
      logger.error('Failed to cancel order', {
        broker,
        orderId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get broker connection status
   */
  getBrokerStatus(): {
    ibkr: boolean;
    lightspeed: boolean;
  } {
    return {
      ibkr: ibkrClient.isConnected(),
      lightspeed: lightspeedClient.isConnected(),
    };
  }

  /**
   * Initialize all enabled brokers
   */
  async initializeBrokers(): Promise<void> {
    logger.info('Initializing brokers');

    // Always initialize IBKR
    try {
      await ibkrClient.connect();
    } catch (error: any) {
      logger.error('Failed to initialize IBKR', { error: error.message });
    }

    // Initialize Lightspeed if enabled
    if (config.lightspeed.enabled) {
      try {
        await lightspeedClient.connect();
      } catch (error: any) {
        logger.error('Failed to initialize Lightspeed', {
          error: error.message,
        });
      }
    }

    logger.info('Broker initialization complete', {
      status: this.getBrokerStatus(),
    });
  }
}

export const brokerRouter = new BrokerRouter();

