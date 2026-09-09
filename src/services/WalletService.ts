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
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED'
} as const;
export type PayoutStatus = keyof typeof PayoutStatus | string;

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
    description: string,
    allowNegative: boolean = false
  ) {
    const transactionAmount = new Decimal(amount);

    if (transactionAmount.lte(0)) {
      throw new Error('Debit amount must be greater than zero.');
    }

    return await prisma.$transaction(async (tx: any) => {
      // 1. Fetch the wallet to check balance
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet not found.');
      }

      // 2. Check if sufficient funds exist (unless negative balance is allowed for reversals/refunds)
      if (!allowNegative && wallet.balance.lt(transactionAmount)) {
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
      
      // Ensure balance hasn't gone negative due to a race condition (unless allowNegative is set)
      if (!allowNegative && updatedWallet.balance.lt(0)) {
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

  /**
   * Reverse a previously credited revenue entry (compensating financial event for cancellation/return).
   * Never deletes original ledger entry. Creates an immutable compensating entry and decrements balance.
   * If reversal exceeds available balance, allows negative balance to record platform payable/debt.
   */
  async reverseCredit(
    walletId: string,
    amount: Decimal | number | string,
    referenceId: string,
    description: string
  ) {
    const revAmount = new Decimal(amount);
    if (revAmount.lte(0)) {
      throw new Error('Reversal amount must be greater than zero.');
    }

    return await prisma.$transaction(async (tx: any) => {
      // 1. Check idempotency: ensure this reference has not already been reversed
      const existingReversal = await tx.ledgerEntry.findFirst({
        where: {
          walletId,
          referenceId,
          type: LedgerType.REFUND
        }
      });
      if (existingReversal) {
        return existingReversal;
      }

      // 2. Fetch wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId }
      });
      if (!wallet) {
        throw new Error('Wallet not found.');
      }

      // 3. Decrement balance (negative balance permitted to represent liability/debt)
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            decrement: revAmount
          }
        }
      });

      // 4. Create immutable compensating ledger entry
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          walletId,
          amount: revAmount.negated(),
          type: LedgerType.REFUND,
          status: LedgerStatus.COMPLETED,
          referenceId,
          description
        }
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
  async requestPayout(
    walletId: string,
    amount: Decimal | number | string,
    shaba: string,
    options?: {
      bankName?: string;
      accountHolderName?: string;
      supplierId?: number;
      supplierName?: string;
      minThreshold?: number | Decimal;
      directGateway?: boolean;
    }
  ) {
    const payoutAmount = new Decimal(amount);

    if (payoutAmount.lte(0)) {
      throw new Error('مبلغ برداشت باید بزرگتر از صفر باشد.');
    }

    if (options?.minThreshold) {
      const minVal = new Decimal(options.minThreshold);
      if (payoutAmount.lt(minVal)) {
        throw new Error(`مبلغ درخواستی کمتر از حداقل مجاز برداشت (${minVal.toNumber().toLocaleString()} تومان) است.`);
      }
    }

    const payoutRequest = await prisma.$transaction(async (tx: any) => {
      // 1. Safety check inside transaction: Ensure no payout is requested if there are already PENDING or PROCESSING payouts
      // (Prevents double-payouts and race conditions on concurrent requests)
      const activePayout = await tx.payoutRequest.findFirst({
        where: {
          walletId,
          status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] }
        }
      });

      if (activePayout) {
        throw new Error('شما در حال حاضر یک درخواست تسویه حساب در حال بررسی دارید. پس از تعیین تکلیف آن می‌توانید مجدداً درخواست ثبت کنید.');
      }

      // 2. Fetch wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('کیف پول یافت نشد.');
      }

      // 3. Ensure sufficient funds
      if (wallet.balance.lt(payoutAmount)) {
        throw new Error(`موجودی قابل برداشت کافی نیست. موجودی فعلی شما: ${wallet.balance.toString()} تومان است.`);
      }

      // 4. Decrement balance to lock the funds immediately
      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            decrement: payoutAmount
          }
        },
      });

      if (updatedWallet.balance.lt(0)) {
        throw new Error('موجودی کافی نیست. تراکنش لغو گردید.');
      }

      // 5. Create a PayoutRequest in PENDING state
      const pr = await tx.payoutRequest.create({
        data: {
          walletId,
          amount: payoutAmount,
          shaba,
          bankName: options?.bankName || null,
          accountHolderName: options?.accountHolderName || null,
          supplierId: options?.supplierId || wallet.supplierId || null,
          supplierName: options?.supplierName || null,
          currentBalance: wallet.balance,
          remainingBalance: updatedWallet.balance,
          status: PayoutStatus.PENDING,
          trackId: WalletService.generateTrackId(),
          financiallyLocked: true,
        },
      });

      // 6. Create a PENDING LedgerEntry to represent the locked funds
      await tx.ledgerEntry.create({
        data: {
          walletId,
          amount: payoutAmount.negated(),
          type: LedgerType.WITHDRAWAL,
          status: LedgerStatus.PENDING,
          referenceId: pr.id,
          payoutRequestId: pr.id,
          description: `درخواست برداشت وجه به شماره شبا: ${shaba}`,
        },
      });

      return pr;
    });

    if (options?.directGateway) {
      // Try calling gateway automated payout if requested, or fallback to PENDING for admin review
      try {
        const paymentService = await PaymentServiceFactory.getService();
        const gatewayResponse = await paymentService.requestPayout(
          payoutAmount.toNumber(),
          shaba,
          `تسویه حساب زوپیت - شماره ${payoutRequest.id}`
        );

        return await prisma.payoutRequest.update({
          where: { id: payoutRequest.id },
          data: {
            trackId: gatewayResponse.trackId,
            status: PayoutStatus.PROCESSING,
          },
        });
      } catch (error: any) {
        console.warn(`Direct gateway payout unavailable (${error.message}). Saved request as PENDING for admin approval.`);
        return payoutRequest;
      }
    }

    return payoutRequest;
  }

  /**
   * Approves a PENDING payout request and moves it to PROCESSING.
   * Records an audit log and notifies the supplier.
   */
  async approvePayout(payoutId: string, adminId?: number) {
    return await prisma.$transaction(async (tx: any) => {
      const pr = await tx.payoutRequest.findUnique({
        where: { id: payoutId },
        include: { wallet: true },
      });

      if (!pr) {
        throw new Error('درخواست تسویه یافت نشد.');
      }

      if (pr.status !== PayoutStatus.PENDING) {
        throw new Error(`درخواست در وضعیت ${pr.status} است و امکان تایید ندارد.`);
      }

      const updatedPR = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.PROCESSING,
          updatedAt: new Date(),
        },
      });

      // Log in AuditTrail
      if (adminId) {
        await tx.auditTrail.create({
          data: {
            actorId: adminId,
            action: 'PAYOUT_APPROVED',
            resource: 'PAYOUT',
            metadata: JSON.stringify({
              payoutId,
              amount: pr.amount.toString(),
              walletId: pr.walletId,
              shaba: pr.shaba,
            }),
          },
        });
      }

      // Notify supplier
      const targetUserId = pr.supplierId || pr.wallet?.supplierId;
      if (targetUserId) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            title: 'درخواست تسویه تایید شد',
            message: `درخواست تسویه حساب شما به مبلغ ${Number(pr.amount).toLocaleString()} تومان تایید شد و در صف پرداخت قرار گرفت.`,
            type: 'FINANCIAL',
          },
        }).catch(() => {});
      }

      return updatedPR;
    });
  }

  /**
   * Rejects a payout request (from PENDING or PROCESSING), unlocks the reserved funds,
   * returns them to the supplier wallet balance, updates ledger, and logs audit.
   */
  async rejectPayout(payoutId: string, adminId?: number, reason?: string) {
    return await prisma.$transaction(async (tx: any) => {
      const pr = await tx.payoutRequest.findUnique({
        where: { id: payoutId },
        include: { wallet: true },
      });

      if (!pr) {
        throw new Error('درخواست تسویه یافت نشد.');
      }

      if (pr.status === PayoutStatus.SUCCESS || pr.status === PayoutStatus.FAILED) {
        throw new Error(`امکان تغییر وضعیت درخواست در حالت نهایی (${pr.status}) وجود ندارد.`);
      }

      // 1. Update payout request status to FAILED
      const updatedPR = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.FAILED,
          paymentNotes: reason || 'رد شده توسط مدیریت',
          financiallyLocked: false,
          updatedAt: new Date(),
        },
      });

      // 2. Mark related ledger entry as FAILED
      await tx.ledgerEntry.updateMany({
        where: {
          OR: [
            { referenceId: payoutId },
            { payoutRequestId: payoutId }
          ],
          type: LedgerType.WITHDRAWAL,
        },
        data: {
          status: LedgerStatus.FAILED,
        },
      });

      // 3. Unlock funds: Increment wallet balance back by the payout amount
      await tx.wallet.update({
        where: { id: pr.walletId },
        data: {
          balance: {
            increment: pr.amount,
          },
        },
      });

      // 4. Audit Trail
      if (adminId) {
        await tx.auditTrail.create({
          data: {
            actorId: adminId,
            action: 'PAYOUT_REJECTED',
            resource: 'PAYOUT',
            metadata: JSON.stringify({
              payoutId,
              reason: reason || 'رد درخواست تسویه',
              amount: pr.amount.toString(),
              walletId: pr.walletId,
            }),
          },
        });
      }

      // 5. Notify supplier
      const targetUserId = pr.supplierId || pr.wallet?.supplierId;
      if (targetUserId) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            title: 'درخواست تسویه رد شد',
            message: `درخواست تسویه حساب به مبلغ ${Number(pr.amount).toLocaleString()} تومان رد شد و وجه به کیف پول شما بازگشت داده شد.${reason ? ` علت: ${reason}` : ''}`,
            type: 'FINANCIAL',
          },
        }).catch(() => {});
      }

      return updatedPR;
    });
  }

  /**
   * Marks a payout request as PAID / SUCCESS.
   * Enforces strict idempotency (cannot pay twice).
   * Completes the ledger entry, records payment details, audit trail, and notifies supplier.
   */
  async markPaid(
    payoutId: string,
    adminId?: number,
    paymentDetails?: {
      receiptUrl?: string;
      transactionRef?: string;
      paymentDate?: Date;
      paymentNotes?: string;
    }
  ) {
    return await prisma.$transaction(async (tx: any) => {
      const pr = await tx.payoutRequest.findUnique({
        where: { id: payoutId },
        include: { wallet: true },
      });

      if (!pr) {
        throw new Error('درخواست تسویه یافت نشد.');
      }

      // Strict idempotency check
      if (pr.status === PayoutStatus.SUCCESS) {
        throw new Error('این تسویه قبلاً پرداخت و نهایی شده است و امکان پرداخت مجدد آن وجود ندارد.');
      }

      if (pr.status === PayoutStatus.FAILED) {
        throw new Error('این درخواست تسویه قبلاً رد شده است و امکان پرداخت ندارد.');
      }

      // 1. Update payout request to SUCCESS
      const updatedPR = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.SUCCESS,
          receiptUrl: paymentDetails?.receiptUrl || pr.receiptUrl || null,
          transactionRef: paymentDetails?.transactionRef || pr.transactionRef || null,
          paymentDate: paymentDetails?.paymentDate || new Date(),
          paymentNotes: paymentDetails?.paymentNotes || pr.paymentNotes || 'پرداخت با موفقیت ثبت شد',
          financiallyLocked: true,
          updatedAt: new Date(),
        },
      });

      // 2. Complete the corresponding withdrawal ledger entry
      await tx.ledgerEntry.updateMany({
        where: {
          OR: [
            { referenceId: payoutId },
            { payoutRequestId: payoutId }
          ],
          type: LedgerType.WITHDRAWAL,
        },
        data: {
          status: LedgerStatus.COMPLETED,
        },
      });

      // 3. Audit Trail
      if (adminId) {
        await tx.auditTrail.create({
          data: {
            actorId: adminId,
            action: 'PAYOUT_PAID',
            resource: 'PAYOUT',
            metadata: JSON.stringify({
              payoutId,
              transactionRef: paymentDetails?.transactionRef,
              receiptUrl: paymentDetails?.receiptUrl,
              amount: pr.amount.toString(),
              walletId: pr.walletId,
            }),
          },
        });
      }

      // 4. Notify supplier
      const targetUserId = pr.supplierId || pr.wallet?.supplierId;
      if (targetUserId) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            title: 'تسویه حساب واریز شد',
            message: `مبلغ ${Number(pr.amount).toLocaleString()} تومان به حساب شما واریز شد.${paymentDetails?.transactionRef ? ` شماره پیگیری: ${paymentDetails.transactionRef}` : ''}`,
            type: 'FINANCIAL',
          },
        }).catch(() => {});
      }

      // 5. Emit payout.success event
      appEvents.emit('payout.success', {
        walletId: pr.walletId,
        amount: pr.amount.toNumber(),
        supplierId: targetUserId,
        shaba: pr.shaba,
        transactionRef: paymentDetails?.transactionRef,
      });

      return updatedPR;
    });
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
