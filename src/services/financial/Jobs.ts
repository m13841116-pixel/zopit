import { getPrisma } from '../../prisma.js';
import { PaymentStatus } from '../../types.js';
import { PaymentLifecycleService } from './PaymentLifecycleService.js';

const prisma = getPrisma();
const paymentService = new PaymentLifecycleService();

export class FinancialJobs {
  static async pollPendingPayments() {
    console.log('[Background Job] Polling for pending payments...');
    
    // Find payments that are PENDING and created more than 15 minutes ago
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    try {
      const pendingPayments = await prisma.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          gatewayReference: { not: null },
          createdAt: { lte: fifteenMinsAgo }
        }
      });

      for (const payment of pendingPayments) {
        if (payment.gatewayReference) {
          try {
            console.log(`[Background Job] Verifying pending payment ${payment.id} with gateway ref ${payment.gatewayReference}`);
            await paymentService.verifyPayment(payment.gatewayReference, 0, '127.0.0.1');
          } catch (err: any) {
            console.error(`[Background Job] Failed to verify payment ${payment.id}: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      console.error('[Background Job] Error in pollPendingPayments:', err.message);
    }
  }

  static start() {
    // Run every 10 minutes
    setInterval(this.pollPendingPayments, 10 * 60 * 1000);
    console.log('[Background Job] Started FinancialJobs');
  }
}
