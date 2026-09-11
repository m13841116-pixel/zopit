import { getPrisma } from '../prisma.js';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentServiceFactory } from './payment/PaymentServiceFactory.js';
import { appEvents } from './NotificationService.js';

export const LedgerType = {
  CREDIT: 'CREDIT',
  WITHDRAWAL: 'WITHDRAWAL',
  ORDER_REVENUE: 'ORDER_REVENUE',
  FEE: 'FEE',
  REFUND: 'REFUND'
} as const;
export type LedgerType = keyof typeof LedgerType | string;

export const LedgerStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const;
export type LedgerStatus = keyof typeof LedgerStatus | string;

export const PayoutStatus = {
  PENDING: 'PENDING',
  QUEUED_FOR_PAYA: 'QUEUED_FOR_PAYA',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED'
} as const;
export type PayoutStatus = keyof typeof PayoutStatus | string;

export const MIN_WITHDRAWAL_AMOUNT = 300000; // 300,000 Tomans minimum for withdrawal

const prisma = getPrisma();

export class WalletService {
  /**
   * Get the wallet balance for a specific wallet ID
   * @param walletId The ID of the wallet
   * @returns The current balance as a Decimal
   */
  async getBalance(walletId: string): Promise<Decimal> {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new Error('Wallet not found.');
    }

    return wallet.balance;
  }

  /**
   * Credit the wallet (increase balance) and create a ledger entry.
   * Runs inside an ACID compliant transaction to prevent race conditions.
   *
   * @param walletId The ID of the wallet
   * @param amount The transaction amount (positive)
   * @param type The type of ledger entry
   * @param referenceId Optional reference ID to external entities
   * @param description Transaction description
   * @returns The created ledger entry record
   */
  async creditWallet(
    walletId: string,
    amount: Decimal | number | string,
    type: LedgerType,
    referenceId: string | null = null,
    description: string
  ) {
    const transactionAmount = new Decimal(amount);

    if (transactionAmount.lte(0)) {
      throw new Error('Credit amount must be greater than zero.');
    }

    return await prisma.$transaction(async  (tx: any) => {
      // 1. Fetch and lock the wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet not found.');
      }

      // 2. Increment the wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            increment: transactionAmount
          }
        },
      });

      // 3. Create the immutable ledger entry record
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          walletId,
          amount: transactionAmount,
          type,
          status: LedgerStatus.COMPLETED,
          description,
          referenceId,
        },
      });

      
      // Emit event after successful credit
      appEvents.emit('wallet.credited', {
        walletId,
        amount: transactionAmount.toNumber(),
        supplierId: wallet.supplierId
      });

      return ledgerEntry;
    });
  }

  /**
   * Debit the wallet (decrease balance) and create a ledger entry.
   * Ensures the wallet has sufficient funds before debiting.
   * Runs inside an ACID compliant transaction.
   *
   * @param walletId The ID of the wallet
   * @param amount The transaction amount (positive)
   * @param type The type of ledger entry
   * @param referenceId Optional reference ID to external entities
   * @param description Transaction description
   * @returns The created ledger entry record
   */
  async debitWallet(
    walletId: string,
    amount: Decimal | number | string,
    type: LedgerType,
    referenceId: string | null = null,
    description: string
  ) {
    const transactionAmount = new Decimal(amount);

    if (transactionAmount.lte(0)) {
      throw new Error('Debit amount must be greater than zero.');
    }

    return await prisma.$transaction(async  (tx: any) => {
      // 1. Fetch the wallet to check balance
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet not found.');
      }

      // 2. Check if sufficient funds exist
      if (wallet.balance.lt(transactionAmount)) {
        throw new Error(`Insufficient funds. Available balance: ${wallet.balance.toString()}`);
      }

      // 3. Decrement the wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            decrement: transactionAmount
          }
        },
      });
      
      // Ensure balance hasn't gone negative due to a race condition
      if (updatedWallet.balance.lt(0)) {
        throw new Error('Insufficient funds. Transaction reverted.');
      }

      // 4. Create the immutable ledger entry record
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          walletId,
          amount: transactionAmount.negated(),
          type,
          status: LedgerStatus.COMPLETED,
          description,
          referenceId,
        },
      });

      return ledgerEntry;
    });
  }

  private static generateTrackId(): string {
    return `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;
  }

  /**
   * Request a payout (withdrawal) to a bank account (Shaba).
   * Debits the wallet immediately to reserve/lock funds and creates a PayoutRequest.
   * Integrates with PaymentGateway for actual transfer.
   *
   * @param walletId The ID of the wallet
   * @param amount The withdrawal amount
   * @param shaba The supplier's Shaba number
   * @returns The created PayoutRequest record
   */
  async requestPayout(walletId: string, amount: Decimal | number | string, shaba: string) {
    const payoutAmount = new Decimal(amount);

    if (payoutAmount.lt(MIN_WITHDRAWAL_AMOUNT)) {
      throw new Error(`حداقل مبلغ مجاز برای ثبت درخواست تسویه حساب، ۳۰۰,۰۰۰ تومان است.`);
    }

    // Safety check: Ensure no payout is requested if there are already PENDING, QUEUED_FOR_PAYA or PROCESSING payouts
    const activePayouts = await prisma.payoutRequest.findFirst({
      where: {
        walletId,
        status: { in: [PayoutStatus.PENDING, PayoutStatus.QUEUED_FOR_PAYA, PayoutStatus.PROCESSING] }
      }
    });

    if (activePayouts) {
      throw new Error('یک درخواست تسویه حساب فعال در حال پردازش یا در صف تسویه پایا دارید. لطفاً تا تکمیل آن شکیبا باشید.');
    }

    const payoutRequest = await prisma.$transaction(async (tx: any) => {
      // 1. Fetch wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet not found.');
      }

      // 2. Ensure sufficient funds
      if (wallet.balance.lt(payoutAmount)) {
        throw new Error(`Insufficient funds for payout. Available balance: ${wallet.balance.toString()}`);
      }

      // 3. Decrement balance to lock the funds immediately
      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            decrement: payoutAmount
          }
        },
      });

      if (updatedWallet.balance.lt(0)) {
        throw new Error('Insufficient funds. Transaction reverted.');
      }

      // 4. Create a PayoutRequest in QUEUED_FOR_PAYA state (batch processed at 13:00 on business days)
      const pr = await tx.payoutRequest.create({
        data: {
          walletId,
          amount: payoutAmount,
          shaba,
          status: PayoutStatus.QUEUED_FOR_PAYA,
          trackId: WalletService.generateTrackId(),
        },
      });

      // 5. Create a PENDING LedgerEntry to represent the locked funds
      await tx.ledgerEntry.create({
        data: {
          walletId,
          amount: payoutAmount.negated(),
          type: LedgerType.WITHDRAWAL,
          status: LedgerStatus.PENDING,
          referenceId: pr.id,
          description: `درخواست تسویه در صف پایا به شماره شبا: ${shaba}`,
        },
      });

      return pr;
    });

    return payoutRequest;
  }

  /**
   * Process all payout requests currently queued for Paya batch processing (scheduled for 13:00)
   */
  static async processPayaBatch(): Promise<{ processedCount: number; batchTrackId: string; totalAmount: number }> {
    const queuedRequests = await prisma.payoutRequest.findMany({
      where: { status: PayoutStatus.QUEUED_FOR_PAYA }
    });

    if (queuedRequests.length === 0) {
      return { processedCount: 0, batchTrackId: '', totalAmount: 0 };
    }

    const batchTrackId = `PAYA-BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    let totalAmount = 0;

    for (const req of queuedRequests) {
      totalAmount += Number(req.amount);
      await prisma.payoutRequest.update({
        where: { id: req.id },
        data: {
          status: PayoutStatus.PROCESSING,
          trackId: `${batchTrackId}-${req.id.slice(-4)}`
        }
      });

      await prisma.ledgerEntry.updateMany({
        where: { referenceId: req.id },
        data: {
          description: `پردازش تسویه پایا - شناسه پایا: ${batchTrackId} (شبا: ${req.shaba})`
        }
      });
    }

    console.log(`[WalletService] Processed Paya Batch ${batchTrackId}: ${queuedRequests.length} requests, total: ${totalAmount} Tomans`);
    return {
      processedCount: queuedRequests.length,
      batchTrackId,
      totalAmount
    };
  }

  /**
   * Syncs the payout status with the payment gateway
   * @param trackId The tracking ID from the gateway
   */
  async syncPayoutStatus(trackId: string) {
    const payoutRequest = await prisma.payoutRequest.findFirst({
      where: { trackId },
    });

    if (!payoutRequest || payoutRequest.status === PayoutStatus.SUCCESS || payoutRequest.status === PayoutStatus.FAILED) {
      return; // Already in final state or not found
    }

    const paymentService = await PaymentServiceFactory.getService();
    const gatewayStatus = await paymentService.getPayoutStatus(trackId);

    if (gatewayStatus.status === 'SUCCESS' || gatewayStatus.status === 'FAILED') {
      await prisma.$transaction(async  (tx: any) => {
        const newStatus = gatewayStatus.status === 'SUCCESS' ? PayoutStatus.SUCCESS : PayoutStatus.FAILED;
        
        await tx.payoutRequest.update({
          where: { id: payoutRequest.id },
          data: { status: newStatus },
        });

        await tx.ledgerEntry.updateMany({
          where: { referenceId: payoutRequest.id, type: LedgerType.WITHDRAWAL },
          data: { 
            status: newStatus === PayoutStatus.SUCCESS ? LedgerStatus.COMPLETED : LedgerStatus.FAILED 
          },
        });

        
        if (newStatus === PayoutStatus.SUCCESS) {
          const wallet = await tx.wallet.findUnique({ where: { id: payoutRequest.walletId }});
          if (wallet) {
            appEvents.emit('payout.success', {
              walletId: payoutRequest.walletId,
              amount: payoutRequest.amount.toNumber(),
              supplierId: wallet.supplierId,
              shaba: payoutRequest.shaba
            });
          }
        }

        // If it failed, unlock the funds
        if (newStatus === PayoutStatus.FAILED) {
          await tx.wallet.update({
            where: { id: payoutRequest.walletId },
            data: {
              balance: {
                increment: payoutRequest.amount
              }
            }
          });
        }
      });
    }
  }
}
