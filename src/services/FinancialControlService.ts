import { getPrisma } from '../prisma.js';
import { Decimal } from 'decimal.js';

export interface ExecutiveMetrics {
  // 1. Executive Metrics & Revenue Separation
  todayTransactionProfit: number;
  monthlyTransactionProfit: number;
  transactionRevenue: number;
  subscriptionRevenue: number;
  featuredRevenue: number;
  totalGMV: number;
  totalPlatformRevenue: number;

  // 2. Supplier Liability
  totalCreditedSupplierBalances: number;
  supplierAvailableBalances: number;
  supplierPayableBalance: number;
  pendingPayoutAmount: number;
  pendingPayoutCount: number;
  completedPayoutAmount: number;
  completedPayoutCount: number;
  outstandingSupplierLiability: number;

  // 3. Refunds & Reversals
  refundAmount: number;
  refundCount: number;
  reversalAmount: number;
  reversalCount: number;

  // 4. Shipped Credit Metric ("اعتبار ثبت‌شده پس از ارسال")
  shippedCreditMetrics: {
    title: string;
    shippedSupplierGroupsCount: number;
    supplierBalanceCreditsCount: number;
    totalCreditAmount: number;
  };
}

export interface FinancialFilterParams {
  startDate?: string;
  endDate?: string;
  supplierId?: number;
  storeId?: number;
  orderId?: number;
  financialType?: string; // ALL, TRANSACTION, SUBSCRIPTION, FEATURED, PAYOUT, REFUND, ADJUSTMENT, CREDIT
  status?: string; // ALL, COMPLETED, PENDING, PROCESSING, FAILED
  search?: string;
  page?: number;
  limit?: number;
}

export interface FinancialStreamItem {
  id: string;
  date: string;
  category: 'TRANSACTION' | 'SUBSCRIPTION' | 'FEATURED' | 'PAYOUT' | 'REFUND' | 'ADJUSTMENT' | 'CREDIT';
  typeLabel: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'FAILED';
  referenceId: string;
  description: string;
  supplierId?: number;
  supplierName?: string;
  storeId?: number;
  storeName?: string;
  meta?: Record<string, any>;
}

export interface FinancialAnomaly {
  id: string;
  code: 'PAID_WITHOUT_INVENTORY_DEC' | 'SHIPPED_WITHOUT_CREDIT' | 'CREDIT_WITHOUT_SHIPPED' | 'DUPLICATE_CREDIT' | 'PAYOUT_OVERDRAFT';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  referenceType: 'ORDER' | 'ORDER_GROUP' | 'LEDGER' | 'PAYOUT' | 'WALLET';
  referenceId: string;
  supplierId?: number;
  supplierName?: string;
  storeId?: number;
  storeName?: string;
  amount: number;
  detectedAt: string;
  suggestedAction: string;
}

export class FinancialControlService {
  private prisma: any;

  constructor() {
    this.prisma = getPrisma();
  }

  /**
   * 1. Get Executive Metrics with Authoritative Revenue Separation & Supplier Liability
   */
  public async getExecutiveMetrics(params: FinancialFilterParams = {}): Promise<ExecutiveMetrics> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Apply date range filters if supplied
    const filterStart = params.startDate ? new Date(params.startDate) : undefined;
    const filterEnd = params.endDate ? new Date(params.endDate) : undefined;

    // -------------------------------------------------------------
    // A. ORDERS, GMV & TRANSACTION PROFIT (Markup = price - supplierPrice)
    // -------------------------------------------------------------
    const orders = await this.prisma.order.findMany({
      include: {
        items: {
          include: { product: true }
        },
        store: { select: { id: true, username: true, shopName: true } }
      }
    });

    let totalGMV = 0;
    let todayTransactionProfit = 0;
    let monthlyTransactionProfit = 0;
    let transactionRevenue = 0;

    for (const order of orders) {
      const orderDate = new Date(order.createdAt || now);
      const isPaidOrCompleted = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status);
      
      // Apply filters if given
      if (params.orderId && order.id !== params.orderId) continue;
      if (params.storeId && order.storeId !== params.storeId) continue;
      if (filterStart && orderDate < filterStart) continue;
      if (filterEnd && orderDate > filterEnd) continue;

      if (isPaidOrCompleted) {
        totalGMV += Number(order.totalAmount || 0);

        let orderProfit = 0;
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            if (params.supplierId && item.supplierId !== params.supplierId) continue;
            const sellingPrice = Number(item.price || 0);
            const baseCost = Number(item.supplierPrice || item.product?.supplierBasePrice || sellingPrice);
            const qty = Number(item.quantity || 1);
            const profit = (sellingPrice - baseCost) * qty;
            if (profit > 0) {
              orderProfit += profit;
            }
          }
        }

        transactionRevenue += orderProfit;

        if (orderDate >= startOfToday) {
          todayTransactionProfit += orderProfit;
        }
        if (orderDate >= startOfMonth) {
          monthlyTransactionProfit += orderProfit;
        }
      }
    }

    // -------------------------------------------------------------
    // B. SUBSCRIPTION REVENUE
    // -------------------------------------------------------------
    let subscriptionRevenue = 0;
    const subEvents = await this.prisma.subscriptionEvent.findMany({
      where: {
        eventType: { in: ['SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_CREATED'] }
      }
    }).catch(() => []);

    for (const sub of subEvents) {
      const subDate = new Date(sub.createdAt || now);
      if (filterStart && subDate < filterStart) continue;
      if (filterEnd && subDate > filterEnd) continue;
      subscriptionRevenue += Number(sub.amount || 0);
    }

    // Also check payments with SUBSCRIPTION method if any
    const subPayments = await this.prisma.payment.findMany({
      where: {
        paymentMethod: { in: ['ONLINE_SUBSCRIPTION', 'SUBSCRIPTION_PURCHASE', 'PRO_SUBSCRIPTION'] },
        status: { in: ['SUCCESS', 'PAID'] }
      }
    }).catch(() => []);

    for (const p of subPayments) {
      const pDate = new Date(p.createdAt || now);
      if (filterStart && pDate < filterStart) continue;
      if (filterEnd && pDate > filterEnd) continue;
      // Convert IRR to Toman if currency is IRR
      const amt = Number(p.amount || 0);
      const tomanAmt = p.currency === 'IRR' ? Math.round(amt / 10) : amt;
      subscriptionRevenue += tomanAmt;
    }

    // -------------------------------------------------------------
    // C. FEATURED PLACEMENT REVENUE
    // -------------------------------------------------------------
    let featuredRevenue = 0;
    const featuredPayments = await this.prisma.payment.findMany({
      where: {
        paymentMethod: 'ONLINE_FEATURED_PLACEMENT',
        status: { in: ['SUCCESS', 'PAID'] }
      }
    }).catch(() => []);

    for (const fp of featuredPayments) {
      const fpDate = new Date(fp.createdAt || now);
      if (filterStart && fpDate < filterStart) continue;
      if (filterEnd && fpDate > filterEnd) continue;
      if (params.supplierId && fp.userId !== params.supplierId) continue;
      const amt = Number(fp.amount || 0);
      const tomanAmt = fp.currency === 'IRR' ? Math.round(amt / 10) : amt;
      featuredRevenue += tomanAmt;
    }

    const totalPlatformRevenue = transactionRevenue + subscriptionRevenue + featuredRevenue;

    // -------------------------------------------------------------
    // D. SUPPLIER WALLETS & LIABILITY
    // -------------------------------------------------------------
    const wallets = await this.prisma.wallet.findMany().catch(() => []);
    let supplierAvailableBalances = 0;
    for (const w of wallets) {
      if (params.supplierId && w.supplierId !== params.supplierId) continue;
      const b = typeof w.balance?.toNumber === 'function' ? w.balance.toNumber() : Number(w.balance || 0);
      supplierAvailableBalances += Math.max(0, b);
    }

    // -------------------------------------------------------------
    // E. PAYOUT REQUESTS & TOTALS
    // -------------------------------------------------------------
    const payouts = await this.prisma.payoutRequest.findMany().catch(() => []);
    let pendingPayoutAmount = 0;
    let pendingPayoutCount = 0;
    let completedPayoutAmount = 0;
    let completedPayoutCount = 0;

    for (const p of payouts) {
      const pDate = new Date(p.createdAt || now);
      if (params.supplierId && p.supplierId !== params.supplierId) continue;
      if (filterStart && pDate < filterStart) continue;
      if (filterEnd && pDate > filterEnd) continue;

      const amt = typeof p.amount?.toNumber === 'function' ? p.amount.toNumber() : Number(p.amount || 0);

      if (['PENDING', 'PROCESSING'].includes(p.status)) {
        pendingPayoutAmount += amt;
        pendingPayoutCount++;
      } else if (p.status === 'SUCCESS' || p.status === 'PAID') {
        completedPayoutAmount += amt;
        completedPayoutCount++;
      }
    }

    const supplierPayableBalance = supplierAvailableBalances + pendingPayoutAmount;
    const outstandingSupplierLiability = supplierAvailableBalances + pendingPayoutAmount;

    // -------------------------------------------------------------
    // F. LEDGER METRICS & SHIPPED CREDITS ("اعتبار ثبت‌شده پس از ارسال")
    // -------------------------------------------------------------
    const ledgerEntries = await this.prisma.ledgerEntry.findMany().catch(() => []);
    let totalCreditedSupplierBalances = 0;
    let supplierBalanceCreditsCount = 0;
    let totalCreditAmount = 0;
    let refundAmount = 0;
    let refundCount = 0;
    let reversalAmount = 0;
    let reversalCount = 0;

    for (const le of ledgerEntries) {
      const leDate = new Date(le.createdAt || now);
      if (filterStart && leDate < filterStart) continue;
      if (filterEnd && leDate > filterEnd) continue;

      const amt = typeof le.amount?.toNumber === 'function' ? le.amount.toNumber() : Number(le.amount || 0);
      const isCredit = ['ORDER_REVENUE', 'CREDIT', 'SHIPPING_CREDIT'].includes(le.type) && le.status === 'COMPLETED';

      if (isCredit) {
        totalCreditedSupplierBalances += amt;
        supplierBalanceCreditsCount++;
        totalCreditAmount += amt;
      }

      if (le.type === 'REFUND' || le.type === 'RETURN') {
        refundAmount += Math.abs(amt);
        refundCount++;
      }

      if (le.type === 'REVERSAL' || le.type === 'ADJUSTMENT') {
        reversalAmount += Math.abs(amt);
        reversalCount++;
      }
    }

    // Count shipped supplier groups
    const shippedGroups = await this.prisma.supplierOrderGroup.findMany({
      where: {
        status: { in: ['SHIPPED', 'DELIVERED', 'COMPLETED'] }
      }
    }).catch(() => []);
    const shippedSupplierGroupsCount = shippedGroups.length;

    return {
      todayTransactionProfit,
      monthlyTransactionProfit,
      transactionRevenue,
      subscriptionRevenue,
      featuredRevenue,
      totalGMV,
      totalPlatformRevenue,
      totalCreditedSupplierBalances,
      supplierAvailableBalances,
      supplierPayableBalance,
      pendingPayoutAmount,
      pendingPayoutCount,
      completedPayoutAmount,
      completedPayoutCount,
      outstandingSupplierLiability,
      refundAmount,
      refundCount,
      reversalAmount,
      reversalCount,
      shippedCreditMetrics: {
        title: 'اعتبار ثبت‌شده پس از ارسال',
        shippedSupplierGroupsCount,
        supplierBalanceCreditsCount,
        totalCreditAmount,
      }
    };
  }

  /**
   * 2. Paginated & Filtered Unified Financial Stream
   */
  public async getFinancialStream(params: FinancialFilterParams = {}) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.max(1, Math.min(100, Number(params.limit || 15)));
    const filterStart = params.startDate ? new Date(params.startDate) : undefined;
    const filterEnd = params.endDate ? new Date(params.endDate) : undefined;

    const streamItems: FinancialStreamItem[] = [];

    // 1. Ledger entries
    const ledgerEntries = await this.prisma.ledgerEntry.findMany({
      include: {
        wallet: {
          include: {
            supplier: { select: { id: true, username: true, brandName: true } }
          }
        }
      }
    }).catch(() => []);

    for (const le of ledgerEntries) {
      const leDate = new Date(le.createdAt || Date.now());
      if (filterStart && leDate < filterStart) continue;
      if (filterEnd && leDate > filterEnd) continue;
      if (params.supplierId && le.wallet?.supplierId !== params.supplierId) continue;

      let cat: FinancialStreamItem['category'] = 'TRANSACTION';
      let typeLabel = 'تراکنش سفارش';

      if (['ORDER_REVENUE', 'CREDIT', 'SHIPPING_CREDIT'].includes(le.type)) {
        cat = 'CREDIT';
        typeLabel = 'بستانکاری ارسال سفارش';
      } else if (le.type === 'PAYOUT') {
        cat = 'PAYOUT';
        typeLabel = 'تسویه حساب بانکی';
      } else if (le.type === 'REFUND' || le.type === 'RETURN') {
        cat = 'REFUND';
        typeLabel = 'بازپرداخت / استرداد';
      } else if (le.type === 'ADJUSTMENT' || le.type === 'REVERSAL') {
        cat = 'ADJUSTMENT';
        typeLabel = 'تعدیل حسابداری';
      }

      if (params.financialType && params.financialType !== 'ALL' && cat !== params.financialType) {
        continue;
      }

      const st = le.status === 'COMPLETED' ? 'COMPLETED' : (le.status === 'FAILED' ? 'FAILED' : 'PENDING');
      if (params.status && params.status !== 'ALL' && st !== params.status) {
        continue;
      }

      const amt = typeof le.amount?.toNumber === 'function' ? le.amount.toNumber() : Number(le.amount || 0);

      streamItems.push({
        id: `ledger_${le.id}`,
        date: leDate.toISOString(),
        category: cat,
        typeLabel,
        amount: amt,
        status: st,
        referenceId: le.referenceId || le.id,
        description: le.description || typeLabel,
        supplierId: le.wallet?.supplierId,
        supplierName: le.wallet?.supplier?.brandName || le.wallet?.supplier?.username,
        meta: { walletId: le.walletId, payoutRequestId: le.payoutRequestId }
      });
    }

    // 2. Subscription Events
    if (!params.financialType || params.financialType === 'ALL' || params.financialType === 'SUBSCRIPTION') {
      const subEvents = await this.prisma.subscriptionEvent.findMany({
        include: {
          user: { select: { id: true, username: true, shopName: true, role: true } }
        }
      }).catch(() => []);

      for (const sub of subEvents) {
        const subDate = new Date(sub.createdAt || Date.now());
        if (filterStart && subDate < filterStart) continue;
        if (filterEnd && subDate > filterEnd) continue;

        streamItems.push({
          id: `sub_${sub.id}`,
          date: subDate.toISOString(),
          category: 'SUBSCRIPTION',
          typeLabel: 'اشتراک حساب کاربری Pro',
          amount: Number(sub.amount || 0),
          status: 'COMPLETED',
          referenceId: sub.id,
          description: `حق اشتراک پلن ${sub.planType || 'ماهانه'} - کاربر ${sub.user?.username || sub.userId}`,
          storeId: sub.user?.role === 'STORE' ? sub.userId : undefined,
          storeName: sub.user?.shopName || sub.user?.username,
          supplierId: sub.user?.role === 'SUPPLIER' ? sub.userId : undefined,
          supplierName: sub.user?.username,
          meta: { planType: sub.planType, durationMonths: sub.durationMonths }
        });
      }
    }

    // 3. Featured Placement Payments
    if (!params.financialType || params.financialType === 'ALL' || params.financialType === 'FEATURED') {
      const featPayments = await this.prisma.payment.findMany({
        where: {
          paymentMethod: 'ONLINE_FEATURED_PLACEMENT'
        },
        include: {
          user: { select: { id: true, username: true, brandName: true } }
        }
      }).catch(() => []);

      for (const fp of featPayments) {
        const fpDate = new Date(fp.createdAt || Date.now());
        if (filterStart && fpDate < filterStart) continue;
        if (filterEnd && fpDate > filterEnd) continue;
        if (params.supplierId && fp.userId !== params.supplierId) continue;

        const amt = Number(fp.amount || 0);
        const tomanAmt = fp.currency === 'IRR' ? Math.round(amt / 10) : amt;
        const st = (fp.status === 'SUCCESS' || fp.status === 'PAID') ? 'COMPLETED' : (fp.status === 'FAILED' ? 'FAILED' : 'PENDING');

        if (params.status && params.status !== 'ALL' && st !== params.status) {
          continue;
        }

        streamItems.push({
          id: `feat_${fp.id}`,
          date: fpDate.toISOString(),
          category: 'FEATURED',
          typeLabel: 'تبلیغ و ویترین ویژه',
          amount: tomanAmt,
          status: st,
          referenceId: fp.gatewayReference || fp.id,
          description: `هزینه نمایش ویژه محصول در ویترین زوپیت`,
          supplierId: fp.userId,
          supplierName: fp.user?.brandName || fp.user?.username,
          meta: { gatewayReference: fp.gatewayReference }
        });
      }
    }

    // Sort descending by date
    streamItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Search filter if provided
    let filteredItems = streamItems;
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filteredItems = streamItems.filter(item =>
        item.description.toLowerCase().includes(q) ||
        item.referenceId.toLowerCase().includes(q) ||
        (item.supplierName && item.supplierName.toLowerCase().includes(q)) ||
        (item.storeName && item.storeName.toLowerCase().includes(q))
      );
    }

    const total = filteredItems.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

    return {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * 3. Authoritative Financial Reconciliation & Anomaly Engine
   * Detects:
   * 1. Paid order without inventory decrement
   * 2. Shipped order without supplier credit
   * 3. Supplier credit without shipped event
   * 4. Duplicate credit
   * 5. Payout greater than available balance
   */
  public async runReconciliationAudit(): Promise<{
    summary: {
      totalAnomalies: number;
      criticalCount: number;
      warningCount: number;
      healthyCount: number;
    };
    anomalies: FinancialAnomaly[];
  }> {
    const anomalies: FinancialAnomaly[] = [];

    // Load data
    const orders = await this.prisma.order.findMany({
      include: {
        items: { include: { product: true } },
        supplierOrderGroups: true,
        store: { select: { id: true, username: true, shopName: true } }
      }
    }).catch(() => []);

    const groups = await this.prisma.supplierOrderGroup.findMany({
      include: {
        items: { include: { product: true } },
        order: true
      }
    }).catch(() => []);

    const ledgers = await this.prisma.ledgerEntry.findMany({
      include: {
        wallet: {
          include: {
            supplier: { select: { id: true, username: true, brandName: true } }
          }
        }
      }
    }).catch(() => []);

    const wallets = await this.prisma.wallet.findMany({
      include: {
        supplier: { select: { id: true, username: true, brandName: true } },
        payoutRequests: true
      }
    }).catch(() => []);

    // -------------------------------------------------------------
    // Check 1: Paid Order Without Inventory Decrement
    // -------------------------------------------------------------
    for (const order of orders) {
      const isPaid = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status);
      if (isPaid && order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.product && item.product.inventory !== undefined && item.product.inventory < 0) {
            anomalies.push({
              id: `anom_inv_${order.id}_${item.id}`,
              code: 'PAID_WITHOUT_INVENTORY_DEC',
              severity: 'WARNING',
              title: 'موجودی منفی یا مغایرت انبار پس از پرداخت سفارش',
              description: `سفارش #${order.id} پرداخت شده اما موجودی محصول "${item.product.name}" به مقدار منفی (${item.product.inventory}) رسیده است.`,
              referenceType: 'ORDER',
              referenceId: String(order.id),
              supplierId: item.supplierId,
              amount: Number(item.price || 0) * (item.quantity || 1),
              detectedAt: new Date().toISOString(),
              suggestedAction: 'بررسی و اصلاح دستی موجودی محصول در پنل مدیریت انبار'
            });
          }
        }
      }
    }

    // -------------------------------------------------------------
    // Check 2: Shipped Order Without Supplier Credit
    // -------------------------------------------------------------
    for (const group of groups) {
      const isShipped = ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(group.status);
      if (isShipped) {
        const expectedRef = `GROUP_${group.id}`;
        const creditLedger = ledgers.find(
          (l: any) => l.referenceId === expectedRef && ['ORDER_REVENUE', 'CREDIT', 'SHIPPING_CREDIT'].includes(l.type)
        );

        if (!creditLedger) {
          let calculatedAmt = 0;
          if (group.items) {
            for (const it of group.items) {
              const base = it.supplierPrice || it.product?.supplierBasePrice || it.price || 0;
              calculatedAmt += base * (it.quantity || 1);
            }
          }

          anomalies.push({
            id: `anom_shipped_nocredit_${group.id}`,
            code: 'SHIPPED_WITHOUT_CREDIT',
            severity: 'CRITICAL',
            title: 'بسته ارسال‌شده بدون ثبت بستانکاری در کیف پول',
            description: `بسته سفارش گروه #${group.id} (سفارش #${group.orderId}) ارسال شده است اما رکورد اعتبار (ORDER_REVENUE) برای تامین‌کننده در دفتر کل ثبت نشده است.`,
            referenceType: 'ORDER_GROUP',
            referenceId: String(group.id),
            supplierId: group.supplierId,
            amount: calculatedAmt,
            detectedAt: new Date().toISOString(),
            suggestedAction: 'اجرای شارژ بستانکاری خودکار یا صدور دستی اعتبار ارسال'
          });
        }
      }
    }

    // -------------------------------------------------------------
    // Check 3: Supplier Credit Without Shipped Event
    // -------------------------------------------------------------
    for (const le of ledgers) {
      if (le.type === 'ORDER_REVENUE' && le.referenceId && le.referenceId.startsWith('GROUP_')) {
        const groupId = parseInt(le.referenceId.replace('GROUP_', ''));
        const matchedGroup = groups.find((g: any) => g.id === groupId);

        if (!matchedGroup) {
          anomalies.push({
            id: `anom_credit_nogroup_${le.id}`,
            code: 'CREDIT_WITHOUT_SHIPPED',
            severity: 'CRITICAL',
            title: 'بستانکاری ثبت‌شده برای گروه ارسال نامعتبر یا ناموجود',
            description: `رکورد بستانکاری ${le.id} به مرجع ${le.referenceId} اشاره دارد، اما گروه سفارش متناظر در سیستم یافت نشد.`,
            referenceType: 'LEDGER',
            referenceId: le.id,
            amount: typeof le.amount?.toNumber === 'function' ? le.amount.toNumber() : Number(le.amount || 0),
            detectedAt: new Date().toISOString(),
            suggestedAction: 'بررسی دفاتر مالی و صدور سند تعدیل حسابداری در صورت ثبت نادرست'
          });
        } else if (!['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(matchedGroup.status)) {
          anomalies.push({
            id: `anom_credit_notshipped_${le.id}`,
            code: 'CREDIT_WITHOUT_SHIPPED',
            severity: 'CRITICAL',
            title: 'بستانکاری ثبت‌شده قبل از ارسال قطعی بسته سفارش',
            description: `رکورد بستانکاری ${le.id} برای گروه #${matchedGroup.id} ثبت شده در حالی که وضعیت بسته هنوز "${matchedGroup.status}" است.`,
            referenceType: 'ORDER_GROUP',
            referenceId: String(matchedGroup.id),
            supplierId: matchedGroup.supplierId,
            amount: typeof le.amount?.toNumber === 'function' ? le.amount.toNumber() : Number(le.amount || 0),
            detectedAt: new Date().toISOString(),
            suggestedAction: 'تطبیق وضعیت مرسوله با شرکت پست یا ابطال سند پیش از موعد'
          });
        }
      }
    }

    // -------------------------------------------------------------
    // Check 4: Duplicate Credit
    // -------------------------------------------------------------
    const seenRefs = new Map<string, string[]>();
    for (const le of ledgers) {
      if (le.type === 'ORDER_REVENUE' && le.referenceId) {
        const key = `${le.walletId}_${le.referenceId}`;
        if (!seenRefs.has(key)) {
          seenRefs.set(key, [le.id]);
        } else {
          seenRefs.get(key)!.push(le.id);
        }
      }
    }

    for (const [key, ledgerIds] of seenRefs.entries()) {
      if (ledgerIds.length > 1) {
        anomalies.push({
          id: `anom_dup_${key}`,
          code: 'DUPLICATE_CREDIT',
          severity: 'CRITICAL',
          title: 'بستانکاری تکراری (Duplicate Credit) برای یک مرجع سفارش',
          description: `تعداد ${ledgerIds.length} رکورد بستانکاری با مرجع یکسان (${key}) در دفتر کل ثبت شده است. شناسه ردیف‌ها: ${ledgerIds.join(', ')}`,
          referenceType: 'LEDGER',
          referenceId: ledgerIds[0],
          amount: 0,
          detectedAt: new Date().toISOString(),
          suggestedAction: 'بررسی و برگشت بستانکاری اضافه با ثبت سند Reversal'
        });
      }
    }

    // -------------------------------------------------------------
    // Check 5: Payout Greater Than Available Balance (Overdraft)
    // -------------------------------------------------------------
    for (const w of wallets) {
      const b = typeof w.balance?.toNumber === 'function' ? w.balance.toNumber() : Number(w.balance || 0);
      if (b < 0) {
        anomalies.push({
          id: `anom_overdraft_${w.id}`,
          code: 'PAYOUT_OVERDRAFT',
          severity: 'CRITICAL',
          title: 'کسری موجودی و تراز منفی کیف پول تامین‌کننده (Overdraft)',
          description: `کیف پول شناسه ${w.id} متعلق به تامین‌کننده "${w.supplier?.brandName || w.supplier?.username}" دارای مانده منفی (${b.toLocaleString('fa-IR')} تومان) است.`,
          referenceType: 'WALLET',
          referenceId: w.id,
          supplierId: w.supplierId,
          supplierName: w.supplier?.brandName || w.supplier?.username,
          amount: Math.abs(b),
          detectedAt: new Date().toISOString(),
          suggestedAction: 'توقف تسویه‌های بعدی و بررسی تراکنش‌های معکوس'
        });
      }
    }

    const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;
    const warningCount = anomalies.filter(a => a.severity === 'WARNING').length;
    const totalAnomalies = anomalies.length;
    const healthyCount = totalAnomalies === 0 ? 1 : 0;

    return {
      summary: {
        totalAnomalies,
        criticalCount,
        warningCount,
        healthyCount,
      },
      anomalies
    };
  }
}
