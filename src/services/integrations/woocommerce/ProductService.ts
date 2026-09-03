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

    for (const sel of selections) {
      try {
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

        const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10000), 
          method,
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });

        if (response.ok) {
          const data = await response.json() as any;
          await prisma.storeProductSelection.update({
            where: { id: sel.id },
            data: { status: 'SYNCED', wc_product_id: data.id }
          });
          successCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        failedCount++;
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

    const auth = Buffer.from(`${conn.consumerKey}:${conn.consumerSecret}`).toString('base64');
    let successCount = 0;
    let failedCount = 0;

    for (const sel of selections) {
      if (!sel.wc_product_id) continue;
      
      try {
        const url = new URL(`/wp-json/wc/v3/products/${sel.wc_product_id}`, conn.storeUrl);
        const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10000), 
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ manage_stock: true, stock_quantity: sel.product.inventory })
        });
        
        if (response.ok) successCount++;
        else failedCount++;
      } catch (err) {
        failedCount++;
      }
    }
    return { successCount, failedCount };
  }
}
