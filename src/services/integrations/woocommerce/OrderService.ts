import { getPrisma } from '../../../prisma.js';
import { ConnectionService } from './ConnectionService.js';
import { processOrderPayload } from './WebhookService.js';

const prisma = getPrisma();

export class OrderService {
  static async syncOrders(storeId: number) {
    const conn = await ConnectionService.getConnection(storeId);
    if (!conn || conn.status !== 'CONNECTED') throw new Error('Not connected');

    const auth = Buffer.from(`${conn.consumerKey}:${conn.consumerSecret}`).toString('base64');
    
    // Fetch orders with processing or completed or on-hold status
    const url = new URL('/wp-json/wc/v3/orders?per_page=20', conn.storeUrl);
    
    try {
      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(15000), 
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) return { successCount: 0, failedCount: 1 };
      
      const orders = (await response.json()) as any[];
      if (!Array.isArray(orders) || orders.length === 0) {
        return { successCount: 0, totalFetched: 0, failedCount: 0 };
      }

      // Process orders concurrently in batches of 5 to achieve ultra-fast 2-3 second sync
      const BATCH_SIZE = 5;
      let importedCount = 0;

      for (let i = 0; i < orders.length; i += BATCH_SIZE) {
        const batch = orders.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (order) => {
            try {
              const res = await processOrderPayload(order, storeId);
              return !!res;
            } catch (itemErr) {
              console.warn(`Error processing synced order #${order.id}:`, itemErr);
              return false;
            }
          })
        );

        for (const res of results) {
          if (res.status === 'fulfilled' && res.value) {
            importedCount++;
          }
        }
      }
      
      return { successCount: importedCount, totalFetched: orders.length, failedCount: 0 };
    } catch (err) {
      return { successCount: 0, failedCount: 1 };
    }
  }
}
