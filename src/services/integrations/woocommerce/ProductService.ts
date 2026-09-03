import { getPrisma } from '../../../prisma.js';
import { ConnectionService } from './ConnectionService.js';

const prisma = getPrisma();

export class ProductService {
  static async syncProducts(storeId: number) {
    const conn = await ConnectionService.getConnection(storeId);
    if (!conn || conn.status !== 'CONNECTED') throw new Error('Not connected');

    const selections = await prisma.storeProductSelection.findMany({
      where: { storeId },
      include: { product: { include: { category: true, images: true } } }
    });

    const auth = Buffer.from(`${conn.consumerKey}:${conn.consumerSecret}`).toString('base64');
    
    let successCount = 0;
    let failedCount = 0;

    // Process product sync concurrently in chunks of 4 for maximum speed (2-3s)
    const CHUNK_SIZE = 4;
    for (let i = 0; i < selections.length; i += CHUNK_SIZE) {
      const chunk = selections.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(
        chunk.map(async (sel) => {
          const productData = {
            name: sel.product.name,
            type: 'simple',
            regular_price: (sel.customPrice || sel.product.finalPrice || 0).toString(),
            description: sel.product.longDescription || '',
            short_description: sel.product.shortDescription || '',
            manage_stock: true,
            stock_quantity: sel.product.inventory,
            images: Array.isArray(sel.product.images)
              ? sel.product.images.map((img: any) => ({ src: typeof img === 'string' ? img : img?.url }))
              : (sel.product.imageUrl ? [{ src: sel.product.imageUrl }] : [])
          };

          let wcId = sel.wc_product_id;
          let url = new URL('/wp-json/wc/v3/products', conn.storeUrl);
          let method = 'POST';

          if (wcId) {
            url = new URL(`/wp-json/wc/v3/products/${wcId}`, conn.storeUrl);
            method = 'PUT';
          }

          const response = await fetch(url.toString(), {
            signal: AbortSignal.timeout(8000),
            method,
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
          });

          if (response.ok) {
            const data = (await response.json()) as any;
            await prisma.storeProductSelection.update({
              where: { id: sel.id },
              data: { status: 'SYNCED', wc_product_id: data.id }
            });
            return true;
          }
          return false;
        })
      );

      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          successCount++;
        } else {
          failedCount++;
        }
      }
    }

    return { successCount, failedCount };
  }
  
  static async syncStock(storeId: number) {
    const conn = await ConnectionService.getConnection(storeId);
    if (!conn || conn.status !== 'CONNECTED') throw new Error('Not connected');

    const selections = await prisma.storeProductSelection.findMany({
      where: { storeId, status: 'SYNCED', wc_product_id: { not: null } },
      include: { product: true }
    });

    if (selections.length === 0) {
      return { successCount: 0, failedCount: 0 };
    }

    const auth = Buffer.from(`${conn.consumerKey}:${conn.consumerSecret}`).toString('base64');
    let successCount = 0;
    let failedCount = 0;

    // Fast-path: Attempt WooCommerce Batch update API first (~500ms for all products)
    try {
      const batchUrl = new URL('/wp-json/wc/v3/products/batch', conn.storeUrl);
      const batchPayload = {
        update: selections.map((sel) => ({
          id: sel.wc_product_id,
          manage_stock: true,
          stock_quantity: sel.product.inventory
        }))
      };

      const batchRes = await fetch(batchUrl.toString(), {
        signal: AbortSignal.timeout(6000),
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchPayload)
      });

      if (batchRes.ok) {
        const batchData = (await batchRes.json()) as any;
        const updated = batchData?.update || [];
        successCount = updated.length || selections.length;
        return { successCount, failedCount: 0 };
      }
    } catch (batchErr) {
      // Fall through to concurrent item update
    }

    // Fallback: Concurrent batch requests in chunks of 5
    const CHUNK_SIZE = 5;
    for (let i = 0; i < selections.length; i += CHUNK_SIZE) {
      const chunk = selections.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(
        chunk.map(async (sel) => {
          if (!sel.wc_product_id) return false;
          const url = new URL(`/wp-json/wc/v3/products/${sel.wc_product_id}`, conn.storeUrl);
          const response = await fetch(url.toString(), {
            signal: AbortSignal.timeout(6000),
            method: 'PUT',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ manage_stock: true, stock_quantity: sel.product.inventory })
          });
          return response.ok;
        })
      );

      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) successCount++;
        else failedCount++;
      }
    }
    return { successCount, failedCount };
  }
}
