import { getPrisma } from './prisma.js';
import { sendPattern } from './services/sms/SmsService.js';

export function startCronJobs() {
  // Run every 1 hour
  setInterval(async () => {
    try {
      const prisma = getPrisma();
      const now = new Date();

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

      // 2. Label uploaded but not shipped (12 hours)
      // Status is PROCESSING, meaning admin uploaded label, supplier needs to ship.
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const processingOrders = await prisma.order.findMany({
        where: {
          status: 'PROCESSING',
          statusHistory: {
            some: {
              toStatus: 'PROCESSING',
              createdAt: { lte: twelveHoursAgo }
            }
          }
        },
        include: { items: { include: { product: { include: { supplier: true } } } } }
      });

      for (const order of processingOrders) {
        const alreadySent = await prisma.auditTrail.findFirst({
          where: { action: 'SMS_LABEL_12H_DELAY', resource: order.id.toString() }
        });

        if (!alreadySent) {
          const supplierMobile = order.items.find((i: any) => i.product?.supplier?.mobile)?.product?.supplier?.mobile;
          if (supplierMobile) {
            await sendPattern(supplierMobile, 'MELLIPAYAMAK_PATTERN_LABEL_ISSUED', [order.id.toString()]);
            await prisma.auditTrail.create({
              data: {
                action: 'SMS_LABEL_12H_DELAY',
                resource: order.id.toString(),
                metadata: 'Sent 12h label print reminder to supplier'
              }
            });
            console.log(`Sent 12h label reminder SMS to supplier ${supplierMobile} for order ${order.id}`);
          }
        }
      }

    } catch (err) {
      console.error('Error running cron jobs:', err);
    }
  }, 1000 * 60 * 60); // Every hour
}
