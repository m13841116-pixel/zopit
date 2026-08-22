import { PrismaClient } from '@prisma/client';
import { PaymentServiceFactory } from './payment/PaymentServiceFactory.js';
import { getCanonicalAppUrl } from '../utils/canonicalUrl.js';

export function registerStoreShippingRoutes(app: any, prisma: PrismaClient, authenticateToken: any, requireStoreManager: any) {
  // Pay shipping cost
  app.post('/api/store-manager/shipping/:orderId/pay', authenticateToken, requireStoreManager, async (req: any, res: any) => {
    try {
      const { orderId } = req.params;

      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId), storeId: req.user.userId },
        include: { shippingInvoice: true }
      });

      if (!order) {
        return res.status(404).json({ error: 'سفارش یافت نشد' });
      }
      if (order.status !== 'WAITING_SHIPPING_PAYMENT' || !order.shippingInvoice) {
        return res.status(400).json({ error: 'سفارش آماده پرداخت هزینه ارسال نیست.' });
      }
      if (order.shippingInvoice.status === 'PAID') {
        return res.status(400).json({ error: 'هزینه ارسال قبلا پرداخت شده است.' });
      }

      const paymentGateway = await PaymentServiceFactory.getService();
      const baseUrl = getCanonicalAppUrl(req);
      const callbackUrl = `${baseUrl}/api/public/shipping/callback?invoiceId=${order.shippingInvoice.id}`;

      try {
        const zibalResult = await paymentGateway.createPayment(
          order.shippingInvoice.shippingCost * 10,
          `پرداخت هزینه ارسال سفارش #${order.id}`,
          callbackUrl
        );

        await prisma.shippingInvoice.update({
          where: { id: order.shippingInvoice.id },
          data: { payLink: zibalResult.payLink }
        });

        return res.json({ payLink: zibalResult.payLink });
      } catch (paymentErr: any) {
        console.error('Error creating Zibal payment for shipping:', paymentErr);
        const isProduction = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
        if (isProduction) {
          return res.status(502).json({ error: 'خطا در ارتباط با درگاه پرداخت. لطفاً دقایقی دیگر مجدداً تلاش کنید.' });
        }
        // Development-only fallback
        return res.json({ payLink: `/api/public/shipping/callback?invoiceId=${order.shippingInvoice.id}&success=true` });
      }
    } catch (err: any) {
      return res.status(500).json({ error: 'خطا در پرداخت هزینه ارسال' });
    }
  });
}

