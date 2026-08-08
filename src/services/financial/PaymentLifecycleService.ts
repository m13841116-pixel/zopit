import { getPrisma } from '../../prisma.js';
import { PaymentStatus } from '../../types.js';
import { PaymentServiceFactory } from '../payment/PaymentServiceFactory.js';

const prisma = getPrisma();

export class PaymentLifecycleService {
  /**
   * Initialize a new payment
   */
  async initiatePayment(userId: number, amount: number, callbackUrl: string) {
    // Generate an idempotency key if not provided
    const idempotencyKey = `PAY_${userId}_${Date.now()}`;
    
    // Create the DB record first
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        idempotencyKey,
        status: PaymentStatus.PENDING,
      }
    });

    try {
      const paymentGateway = await PaymentServiceFactory.getService();
      
      // Request payment from gateway
      const gatewayResponse = await paymentGateway.createPayment(amount, 'Payment for order', callbackUrl);
      
      // Update payment with gateway reference
      const updatedPayment = await prisma.$transaction(async  (tx: any) => {
        const p = await tx.payment.update({
          where: { id: payment.id },
          data: { gatewayReference: gatewayResponse.authority }
        });

        await tx.transactionLog.create({
          data: {
            paymentId: payment.id,
            action: 'INIT',
            payload: JSON.stringify(gatewayResponse),
            responseCode: '200'
          }
        });
        
        await tx.auditTrail.create({
          data: {
            actorId: userId,
            action: 'PAYMENT_INITIATE',
            resource: 'Payment',
            metadata: JSON.stringify({ paymentId: p.id, amount })
          }
        });

        return p;
      });

      return {
        payment: updatedPayment,
        payLink: gatewayResponse.payLink
      };
    } catch (err: any) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED }
      });
      throw new Error(`Failed to initiate payment: ${err.message}`);
    }
  }

  /**
   * Verify a callback from the payment gateway
   */
  async verifyPayment(authority: string, userId: number, ipAddress: string) {
    const payment = await prisma.payment.findFirst({
      where: { gatewayReference: authority }
    });

    if (!payment) {
      throw new Error('Payment not found for the given authority');
    }

    if (payment.status === PaymentStatus.PAID) {
      return { payment, message: 'Payment already verified' };
    }
    
    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error(`Invalid payment state: ${payment.status}`);
    }

    const paymentGateway = await PaymentServiceFactory.getService();
    const verification = await paymentGateway.verifyPayment(authority, Number(payment.amount));

    return await prisma.$transaction(async  (tx: any) => {
      const newStatus = verification.success ? PaymentStatus.PAID : PaymentStatus.FAILED;
      
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status: newStatus }
      });

      await tx.transactionLog.create({
        data: {
          paymentId: payment.id,
          action: 'VERIFY',
          payload: JSON.stringify(verification),
          responseCode: verification.success ? '100' : 'FAILED',
          ipAddress
        }
      });
      
      await tx.auditTrail.create({
        data: {
          actorId: userId,
          action: 'PAYMENT_VERIFY',
          resource: 'Payment',
          metadata: JSON.stringify({ paymentId: payment.id, status: newStatus })
        }
      });

      // If PAID, queue invoice generation...
      if (newStatus === PaymentStatus.PAID) {
        console.log(`[Invoice Job] Queued invoice generation for payment ${payment.id}`);
      }

      return { payment: updatedPayment, verification };
    });
  }

  /**
   * Admin: Refund a payment
   */
  async refundPayment(paymentId: string, adminId: number) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== PaymentStatus.PAID) throw new Error('Can only refund PAID payments');

    return await prisma.$transaction(async  (tx: any) => {
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.REFUNDED }
      });

      await tx.transactionLog.create({
        data: {
          paymentId,
          action: 'REFUND',
          responseCode: '200'
        }
      });

      await tx.auditTrail.create({
        data: {
          actorId: adminId,
          action: 'PAYMENT_REFUND',
          resource: 'Payment',
          metadata: JSON.stringify({ paymentId })
        }
      });

      return updated;
    });
  }
}
