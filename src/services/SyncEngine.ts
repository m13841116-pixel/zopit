import { getPrisma } from '../prisma.js';
import { ConnectionService } from './integrations/woocommerce/ConnectionService.js';

const prisma = getPrisma();

export interface ProductUpdatePayload {
  oldStock?: number;
  newStock?: number;
  oldBasePrice?: number;
  newBasePrice?: number;
}

export class SyncEngine {
  /**
   * Triggered whenever a supplier or admin updates a product's stock or base price.
   */
  static async onProductUpdated(productId: number, payload: ProductUpdatePayload) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { supplier: true }
      });

      if (!product) return;

      const { oldStock, newStock, oldBasePrice, newBasePrice } = payload;
      const isStockChanged = newStock !== undefined && (oldStock === undefined || newStock !== oldStock);
      const isPriceChanged = newBasePrice !== undefined && oldBasePrice !== undefined && newBasePrice !== oldBasePrice;

      // 1. OUT OF STOCK (عدم موجودی)
      // اگر موجودی کالا در انبار تامین‌کننده صفر شد، وضعیت آن کالا در تمام فروشگاه‌های متصل به حالت «ناموجود» تغییر کند
      if (isStockChanged && newStock <= 0) {
        await this.handleOutOfStock(product);
      } else if (isStockChanged && newStock > 0 && oldStock !== undefined && oldStock <= 0) {
        // Returned to stock
        await this.handleBackInStock(product, newStock);
      }

      // 2. PRICE CHANGE (تغییر قیمت پایه)
      // اگر تامین‌کننده قیمت پایه کالا را تغییر داد، قیمت فروش کالا در فروشگاه‌ها بر اساس «فرمول سود» هر فروشگاه‌دار به‌روزرسانی شود
      // و یک اعلان (Price Alert) در پنل مدیر فروشگاه ثبت گردد.
      if (isPriceChanged && newBasePrice > 0) {
        await this.handlePriceChange(product, oldBasePrice, newBasePrice);
      }
    } catch (err: any) {
      console.error(`[SyncEngine] Error processing sync for product #${productId}:`, err?.message || err);
    }
  }

  /**
   * When product inventory drops to 0 or below, set all connected store listings to OUT_OF_STOCK
   * and synchronize zero inventory to connected WooCommerce stores.
   */
  private static async handleOutOfStock(product: any) {
    console.log(`[SyncEngine] Product #${product.id} (${product.name}) is OUT OF STOCK. Updating connected stores...`);

    // Fetch all connected store selections for this product
    const selections = await prisma.storeProductSelection.findMany({
      where: { productId: product.id },
      include: {
        store: {
          include: {
            storeConnection: true
          }
        }
      }
    });

    if (selections.length === 0) return;

    // Update status in store selections
    await prisma.storeProductSelection.updateMany({
      where: { productId: product.id },
      data: {
        status: 'OUT_OF_STOCK'
      }
    });

    // Notify store managers and sync zero stock to WooCommerce if connected
    for (const sel of selections) {
      // 1. In-app Notification for Store Manager
      await prisma.notification.create({
        data: {
          userId: sel.storeId,
          title: 'اتمام موجودی کالا (ناموجود شد)',
          message: `کالای «${product.name}» (کد: ${product.id}) در انبار تامین‌کننده به پایان رسید و وضعیت آن در فروشگاه شما به حالت «ناموجود» تغییر یافت.`,
          type: 'STOCK_ALERT'
        }
      }).catch(() => {});

      // 2. WooCommerce zero stock synchronization
      if (sel.wc_product_id && sel.store.storeConnection && sel.store.storeConnection.status === 'CONNECTED') {
        const conn = sel.store.storeConnection;
        try {
          const auth = Buffer.from(`${conn.consumerKey}:${conn.consumerSecret}`).toString('base64');
          const url = new URL(`/wp-json/wc/v3/products/${sel.wc_product_id}`, conn.storeUrl);

          await fetch(url.toString(), {
            signal: AbortSignal.timeout(6000),
            method: 'PUT',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              manage_stock: true,
              stock_quantity: 0,
              stock_status: 'outofstock'
            })
          });
          console.log(`[SyncEngine] Synced out-of-stock to WooCommerce product #${sel.wc_product_id} for store #${sel.storeId}`);
        } catch (wcErr: any) {
          console.warn(`[SyncEngine] Failed to sync out-of-stock to WooCommerce for store #${sel.storeId}:`, wcErr?.message);
        }
      }
    }
  }

  /**
   * When product is back in stock after being 0
   */
  private static async handleBackInStock(product: any, newStock: number) {
    console.log(`[SyncEngine] Product #${product.id} is back in stock (${newStock} items). Restoring status...`);

    const selections = await prisma.storeProductSelection.findMany({
      where: { productId: product.id, status: 'OUT_OF_STOCK' },
      include: {
        store: {
          include: {
            storeConnection: true
          }
        }
      }
    });

    if (selections.length === 0) return;

    await prisma.storeProductSelection.updateMany({
      where: { productId: product.id, status: 'OUT_OF_STOCK' },
      data: { status: 'PENDING_SYNC' }
    });

    for (const sel of selections) {
      await prisma.notification.create({
        data: {
          userId: sel.storeId,
          title: 'شارژ مجدد موجودی کالا',
          message: `کالای «${product.name}» مجدداً توسط تامین‌کننده با موجودی ${newStock} عدد در انبار شارژ شد.`,
          type: 'INFO'
        }
      }).catch(() => {});

      if (sel.wc_product_id && sel.store.storeConnection && sel.store.storeConnection.status === 'CONNECTED') {
        const conn = sel.store.storeConnection;
        try {
          const auth = Buffer.from(`${conn.consumerKey}:${conn.consumerSecret}`).toString('base64');
          const url = new URL(`/wp-json/wc/v3/products/${sel.wc_product_id}`, conn.storeUrl);

          await fetch(url.toString(), {
            signal: AbortSignal.timeout(6000),
            method: 'PUT',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              manage_stock: true,
              stock_quantity: newStock,
              stock_status: 'instock'
            })
          });
        } catch (e) {}
      }
    }
  }

  /**
   * When base price changes, recalculate retail price using each store manager's markup formula:
   * [قیمت فروش = (قیمت پایه تامین‌کننده × درصد سود) + مبلغ ثابت تومان]
   * and issue a Price Alert notification to the store manager.
   */
  private static async handlePriceChange(product: any, oldBasePrice: number, newBasePrice: number) {
    console.log(`[SyncEngine] Base price changed for product #${product.id} from ${oldBasePrice} to ${newBasePrice}. Recalculating store prices...`);

    const selections = await prisma.storeProductSelection.findMany({
      where: { productId: product.id },
      include: {
        store: {
          include: {
            storeConnection: true
          }
        }
      }
    });

    if (selections.length === 0) return;

    for (const sel of selections) {
      const storeUser = sel.store;

      // Extract store manager's pricing markup formula:
      // profitMarginPercent (percent) + profitFixedAmount (Toman)
      let percent = (storeUser as any).profitMarginPercent;
      let fixed = (storeUser as any).profitFixedAmount;

      if (percent === undefined || percent === null) {
        if (storeUser.profitMarginType === 'percent' && storeUser.profitMarginValue) {
          percent = storeUser.profitMarginValue;
        } else {
          percent = 15; // default 15% markup
        }
      }

      if (fixed === undefined || fixed === null) {
        if (storeUser.profitMarginType === 'fixed' && storeUser.profitMarginValue) {
          fixed = storeUser.profitMarginValue;
        } else {
          fixed = 0;
        }
      }

      const percentNum = Number(percent) || 0;
      const fixedNum = Number(fixed) || 0;

      // Formula: Retail Price = (Supplier Base Price * (1 + percent / 100)) + fixed amount
      const newRetailPrice = Math.round((newBasePrice * (1 + percentNum / 100)) + fixedNum);
      const newProfit = Math.max(0, Math.round(newRetailPrice - newBasePrice));

      // Update store product selection
      await prisma.storeProductSelection.update({
        where: { id: sel.id },
        data: {
          customPrice: newRetailPrice,
          customProfit: newProfit,
          status: 'PENDING_SYNC'
        }
      }).catch(async () => {
        await (prisma as any).$executeRawUnsafe(
          `UPDATE "StoreProductSelection" SET "customPrice" = $1, "customProfit" = $2, "status" = 'PENDING_SYNC' WHERE "id" = $3`,
          newRetailPrice, newProfit, sel.id
        ).catch(() => {});
      });

      // Register Price Alert Notification for store manager
      const priceDiff = newBasePrice - oldBasePrice;
      const diffText = priceDiff > 0 
        ? `افزایش ${priceDiff.toLocaleString('fa-IR')} تومان`
        : `کاهش ${Math.abs(priceDiff).toLocaleString('fa-IR')} تومان`;

      await prisma.notification.create({
        data: {
          userId: sel.storeId,
          title: 'تغییر قیمت پایه تامین‌کننده (Price Alert)',
          message: `قیمت پایه کالای «${product.name}» توسط تامین‌کننده از ${oldBasePrice.toLocaleString('fa-IR')} تومان به ${newBasePrice.toLocaleString('fa-IR')} تومان تغییر یافت (${diffText}). قیمت فروش ویترین شما طبق فرمول هوشمند سود به ${newRetailPrice.toLocaleString('fa-IR')} تومان به‌روزرسانی شد.`,
          type: 'PRICE_ALERT'
        }
      }).catch(() => {});

      // Synchronize updated price to WooCommerce if connected
      if (sel.wc_product_id && sel.store.storeConnection && sel.store.storeConnection.status === 'CONNECTED') {
        const conn = sel.store.storeConnection;
        try {
          const auth = Buffer.from(`${conn.consumerKey}:${conn.consumerSecret}`).toString('base64');
          const url = new URL(`/wp-json/wc/v3/products/${sel.wc_product_id}`, conn.storeUrl);

          await fetch(url.toString(), {
            signal: AbortSignal.timeout(6000),
            method: 'PUT',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              regular_price: newRetailPrice.toString()
            })
          });
          console.log(`[SyncEngine] Synced new price (${newRetailPrice}) to WooCommerce product #${sel.wc_product_id} for store #${sel.storeId}`);
        } catch (wcErr: any) {
          console.warn(`[SyncEngine] Failed to sync price to WooCommerce for store #${sel.storeId}:`, wcErr?.message);
        }
      }
    }
  }
}
