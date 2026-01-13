/**
 * Order Repository
 * Handles all database operations for orders
 */

import prisma from '../services/database';

export interface InternalOrder {
  orderId: string;
  symbol: string;
  action: string;
  orderType: string;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  trailingAmount?: number;
  status?: string;
  filledQuantity?: number;
  avgFillPrice?: number;
  strategy?: string;
  broker?: string;
  outsideRth?: boolean;
  submittedAt?: string;
  filledAt?: string;
  cancelledAt?: string;
  errorMessage?: string;
}

export class OrderRepository {
  /**
   * Create a new order in the database
   */
  async create(order: InternalOrder): Promise<void> {
    try {
      await prisma.order.create({
        data: {
          // Don't set `id` manually - let Prisma auto-increment it
          orderId: order.orderId,
          symbol: order.symbol,
          strategy: order.strategy || 'manual',
          broker: order.broker || 'demo',
          action: order.action,
          orderType: order.orderType,
          quantity: order.quantity,
          limitPrice: order.limitPrice,
          stopPrice: order.stopPrice,
          trailingAmount: order.trailingAmount,
          status: order.status || 'PENDING',
          filledQuantity: order.filledQuantity || 0,
          avgFillPrice: order.avgFillPrice,
          outsideRth: order.outsideRth ?? false,
          submittedAt: order.submittedAt ? new Date(order.submittedAt) : new Date(),
        },
      });
    } catch (error) {
      console.error('Error creating order in database:', error);
      throw error;
    }
  }

  /**
   * Update an existing order
   */
  async update(orderId: string, updates: Partial<InternalOrder>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.status) updateData.status = updates.status;
      if (updates.filledQuantity !== undefined) updateData.filledQuantity = updates.filledQuantity;
      if (updates.avgFillPrice !== undefined) updateData.avgFillPrice = updates.avgFillPrice;
      if (updates.status === 'FILLED') updateData.filledAt = new Date();
      if (updates.status === 'CANCELLED') updateData.cancelledAt = new Date();
      if (updates.status === 'REJECTED') {
        updateData.rejectedAt = new Date();
        if (updates.errorMessage) updateData.errorMessage = updates.errorMessage;
      }

      await prisma.order.update({
        where: { orderId },
        data: updateData,
      });
    } catch (error) {
      console.error('Error updating order in database:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getById(orderId: string): Promise<InternalOrder | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { orderId },
      });

      if (!order) return null;

      return this.mapToInternalOrder(order);
    } catch (error) {
      console.error('Error fetching order from database:', error);
      return null;
    }
  }

  /**
   * Get all orders with optional filters
   */
  async getAll(filters?: {
    broker?: string;
    symbol?: string;
    status?: string;
    limit?: number;
  }): Promise<InternalOrder[]> {
    try {
      const where: any = {};
      
      if (filters?.broker) where.broker = filters.broker;
      if (filters?.symbol) where.symbol = filters.symbol;
      if (filters?.status) where.status = filters.status;

      const orders = await prisma.order.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        take: filters?.limit || 100,
      });

      return orders.map(order => this.mapToInternalOrder(order));
    } catch (error) {
      console.error('Error fetching orders from database:', error);
      return [];
    }
  }

  /**
   * Get pending orders
   */
  async getPending(broker?: string): Promise<InternalOrder[]> {
    return this.getAll({ status: 'PENDING', broker });
  }

  /**
   * Map database order to internal order format
   */
  private mapToInternalOrder(order: any): InternalOrder {
    return {
      orderId: order.orderId,
      symbol: order.symbol,
      action: order.action,
      orderType: order.orderType,
      quantity: order.quantity,
      limitPrice: order.limitPrice || undefined,
      stopPrice: order.stopPrice || undefined,
      trailingAmount: order.trailingAmount || undefined,
      status: order.status,
      filledQuantity: order.filledQuantity,
      avgFillPrice: order.avgFillPrice || undefined,
      strategy: order.strategy,
      broker: order.broker,
      outsideRth: order.outsideRth,
      submittedAt: order.submittedAt.toISOString(),
      filledAt: order.filledAt?.toISOString(),
      cancelledAt: order.cancelledAt?.toISOString(),
    };
  }
}

export const orderRepository = new OrderRepository();

