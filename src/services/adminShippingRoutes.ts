import { NotificationService } from './NotificationService.js';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

export function registerAdminShippingRoutes(app: any, prisma: PrismaClient, authenticateToken: any, requireSuperAdmin: any) {
  // Get shipping management list
  app.get('/api/admin/shipping', authenticateToken, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const orders = await prisma.order.findMany({
        where: {
          status: {
            in: [
              'WAITING_SHIPPING_COST',
              'WAITING_SHIPPING_PAYMENT',
              'READY_TO_SHIP',
              'SHIPPED',
              'DELIVERED'
            ]
          }
        },
        include: {
          items: {
            include: {
              product: {
                include: { supplier: true }
              }
            }
          },
          store: true,
          shippingInvoice: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: 'خطا در دریافت لیست مرسولات' });
    }
  });

  // Calculate and set shipping cost
  app.post('/api/admin/shipping/:orderId/cost', authenticateToken, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const { orderId } = req.params;
      const { cost, description } = req.body;

      if (!cost || cost <= 0) {
        return res.status(400).json({ error: 'هزینه ارسال نامعتبر است.' });
      }

      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) }
      });

      if (!order) {
        return res.status(404).json({ error: 'سفارش یافت نشد.' });
      }

      if (order.status !== 'WAITING_SHIPPING_COST') {
        return res.status(400).json({ error: 'وضعیت سفارش برای ثبت هزینه ارسال معتبر نیست.' });
      }

      const invoice = await prisma.shippingInvoice.create({
        data: {
          orderId: order.id,
          shippingCost: Number(cost),
          shippingMethod: order.shippingMethod || 'POST',
          description: description || ''
        }
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'WAITING_SHIPPING_PAYMENT',
          statusHistory: {
            create: {
              fromStatus: order.status,
              toStatus: 'WAITING_SHIPPING_PAYMENT',
              actorRole: 'SUPER_ADMIN',
              actorName: req.user.username || 'مدیر کل',
              note: `هزینه ارسال به مبلغ ${cost} تعیین شد. در انتظار پرداخت توسط فروشگاه.`
            }
          }
        }
      });

      
      // Send notification to store manager
      console.log(`[Notification] To Store ${order.storeId}: هزینه ارسال سفارش #${order.id} به مبلغ ${cost} تومان محاسبه شد.`);
      res.json({ message: 'هزینه ارسال با موفقیت ثبت شد.', invoice });
    
    } catch (err: any) {
      res.status(500).json({ error: 'خطا در ثبت هزینه ارسال.' });
    }
  });

  // Pay shipping invoice by Store Manager
  // Wait, that belongs to store manager API, but we can put it here or somewhere else
}
