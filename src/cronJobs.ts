import { getPrisma } from './prisma.js';
import { sendPattern } from './services/sms/SmsService.js';
import { WalletService } from './services/WalletService.js';

export async function runPayaBatchProcessing() {
  try {
    const result = await WalletService.processPayaBatch();
    if (result.processedCount > 0) {
      console.log(`[Cron/Paya] Processed batch ${result.batchTrackId}: ${result.processedCount} payouts, total: ${result.totalAmount.toLocaleString()} Tomans`);
      const prisma = getPrisma();
      await prisma.auditTrail.create({
        data: {
          action: 'PAYA_BATCH_PROCESSED',
          resource: result.batchTrackId,
          metadata: `Processed ${result.processedCount} requests totaling ${result.totalAmount} Tomans`
        }
      }).catch(() => {});
    }
    return result;
  } catch (err: any) {
    console.error('[Cron/Paya] Error during batch paya processing:', err?.message || err);
    throw err;
  }
}

export function startCronJobs() {
  // Run every 1 hour
  setInterval(async () => {
    try {
      const prisma = getPrisma();
      const now = new Date();

      // 3. Batch Paya Processing at 13:00 (Tehran Time GMT+3:30)
      // Check current hour in Asia/Tehran
      const tehranHour = Number(new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tehran',
        hour: 'numeric',
        hour12: false
      }).format(now));

      // Working days in Iran are Saturday to Wednesday (0 is Sunday, 4 is Thursday, 5 is Friday)
      const tehranDay = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tehran',
        weekday: 'short'
      }).format(now);
      const isWorkingDay = !['Thu', 'Fri'].includes(tehranDay);

      if (tehranHour === 13 && isWorkingDay) {
        // Run Paya batch processing
        await runPayaBatchProcessing();
      }

      // 1. Supplier unconfirmed order (6 hours)
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      const pendingSupplierOrders = await prisma.order.findMany({
        where: {
          status: 'WAITING_SUPPLIER_CONFIRMATION',
          createdAt: { lte: sixHoursAgo }
        },
        include: { items: { include: { product: { include: { supplier: true } } } } }
      });

      for (const order of pendingSupplierOrders) {
        // Check if SMS already sent
        const alreadySent = await prisma.auditTrail.findFirst({
          where: { action: 'SMS_SUPPLIER_6H_DELAY', resource: order.id.toString() }
        });

        if (!alreadySent) {
          // Get supplier mobile
          const supplierMobile = order.items.find((i: any) => i.product?.supplier?.mobile)?.product?.supplier?.mobile;
          if (supplierMobile) {
            await sendPattern(supplierMobile, 'MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT', [order.id.toString()]);
            await prisma.auditTrail.create({
              data: {
                action: 'SMS_SUPPLIER_6H_DELAY',
                resource: order.id.toString(),
                metadata: 'Sent 6h delay reminder to supplier'
              }
            });
            console.log(`Sent 6h reminder SMS to supplier ${supplierMobile} for order ${order.id}`);
          }
        }
      }

      // 2. Label uploaded but not shipped (18 hours)
      // Status is PROCESSING, meaning admin uploaded label, supplier needs to ship.
      const eighteenHoursAgo = new Date(now.getTime() - 18 * 60 * 60 * 1000);
      const processingOrders = await prisma.order.findMany({
        where: {
          status: 'PROCESSING',
          statusHistory: {
            some: {
              toStatus: 'PROCESSING',
              createdAt: { lte: eighteenHoursAgo }
            }
          }
        },
        include: { items: { include: { product: { include: { supplier: true } } } } }
      });

      for (const order of processingOrders) {
        const alreadySent = await prisma.auditTrail.findFirst({
          where: { action: 'SMS_LABEL_18H_DELAY', resource: order.id.toString() }
        });

        if (!alreadySent) {
          const supplierMobile = order.items.find((i: any) => i.product?.supplier?.mobile)?.product?.supplier?.mobile;
          if (supplierMobile) {
            await sendPattern(supplierMobile, 'MELLIPAYAMAK_PATTERN_LABEL_ISSUED', [order.id.toString()]);
            await prisma.auditTrail.create({
              data: {
                action: 'SMS_LABEL_18H_DELAY',
                resource: order.id.toString(),
                metadata: 'Sent 18h label print reminder to supplier'
              }
            });
            console.log(`Sent 18h label reminder SMS to supplier ${supplierMobile} for order ${order.id}`);
          }
        }
      }

    } catch (err) {
      console.error('Error running cron jobs:', err);
    }
  }, 1000 * 60 * 60); // Every hour
}
