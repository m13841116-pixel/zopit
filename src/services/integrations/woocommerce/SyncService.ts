import { getPrisma } from '../../../prisma.js';
import { ProductService } from './ProductService.js';
import { OrderService } from './OrderService.js';

const prisma = getPrisma();

export class SyncService {
  static async logSync(connectionId: number, type: string, direction: string, status: string, message?: string, executionTime?: number) {
    await prisma.syncLog.create({
      data: {
        connectionId,
        type,
        direction,
        status,
        message,
        executionTime
      }
    });
  }

  static async runProductSync(storeId: number) {
    const conn = await prisma.storeConnection.findUnique({ where: { storeId } });
    if (!conn) return;
    
    const start = Date.now();
    try {
      const result = await ProductService.syncProducts(storeId);
      const executionTime = Date.now() - start;
      await this.logSync(conn.id, 'PRODUCTS', 'EXPORT', 'SUCCESS', `Synced ${result.successCount}, Failed ${result.failedCount}`, executionTime);
      await prisma.storeConnection.update({
        where: { id: conn.id },
        data: { lastSync: new Date(), lastSuccessfulSync: new Date() }
      });
      return result;
    } catch (err: any) {
      const executionTime = Date.now() - start;
      await this.logSync(conn.id, 'PRODUCTS', 'EXPORT', 'FAILED', err.message, executionTime);
      throw err;
    }
  }

  static async runStockSync(storeId: number) {
    const conn = await prisma.storeConnection.findUnique({ where: { storeId } });
    if (!conn) return;
    
    const start = Date.now();
    try {
      const result = await ProductService.syncStock(storeId);
      const executionTime = Date.now() - start;
      await this.logSync(conn.id, 'STOCK', 'EXPORT', 'SUCCESS', `Synced ${result.successCount}, Failed ${result.failedCount}`, executionTime);
      await prisma.storeConnection.update({
        where: { id: conn.id },
        data: { lastSync: new Date(), lastSuccessfulSync: new Date() }
      });
      return result;
    } catch (err: any) {
      const executionTime = Date.now() - start;
      await this.logSync(conn.id, 'STOCK', 'EXPORT', 'FAILED', err.message, executionTime);
      throw err;
    }
  }

  static async runOrderSync(storeId: number) {
    const conn = await prisma.storeConnection.findUnique({ where: { storeId } });
    if (!conn) return;
    
    const start = Date.now();
    try {
      const result = await OrderService.syncOrders(storeId);
      const executionTime = Date.now() - start;
      await this.logSync(conn.id, 'ORDERS', 'IMPORT', 'SUCCESS', `Synced ${result.successCount}, Failed ${result.failedCount}`, executionTime);
      await prisma.storeConnection.update({
        where: { id: conn.id },
        data: { lastSync: new Date(), lastSuccessfulSync: new Date() }
      });
      return result;
    } catch (err: any) {
      const executionTime = Date.now() - start;
      await this.logSync(conn.id, 'ORDERS', 'IMPORT', 'FAILED', err.message, executionTime);
      throw err;
    }
  }
}
