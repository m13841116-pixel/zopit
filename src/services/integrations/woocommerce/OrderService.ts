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
      
      const orders = await response.json() as any[];
      let importedCount = 0;

      for (const order of orders) {
        try {
          const res = await processOrderPayload(order, storeId);
          if (res) importedCount++;
        } catch (itemErr) {
          console.warn(`Error processing synced order #${order.id}:`, itemErr);
        }
      }
      
      return { successCount: importedCount, totalFetched: orders.length, failedCount: 0 };
    } catch (err) {
      return { successCount: 0, failedCount: 1 };
    }
  }
}
