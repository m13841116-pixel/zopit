import { getPrisma } from '../prisma.js';
import { calculateAuthoritativeFinalPrice } from './StoreRecommendationService.js';
import { PaymentServiceFactory } from './payment/PaymentServiceFactory.js';
import { Decimal } from 'decimal.js';

export interface FeaturedConfigs {
  priceToman: number;
  durationHours: number;
}

export class FeaturedPlacementService {
  private prisma: any;

  constructor() {
    this.prisma = getPrisma();
  }

  /**
   * 1. Get Admin Configured Pricing & Duration for Paid Placement
   */
  public async getConfigs(): Promise<FeaturedConfigs> {
    try {
      const priceConfig = await this.prisma.systemConfig.findUnique({
        where: { key: 'FEATURED_PRICE_TOMAN' }
      });
      const durationConfig = await this.prisma.systemConfig.findUnique({
        where: { key: 'FEATURED_DURATION_HOURS' }
      });

      return {
        priceToman: priceConfig ? parseInt(priceConfig.value) || 99000 : 99000,
        durationHours: durationConfig ? parseInt(durationConfig.value) || 24 : 24
      };
    } catch (err) {
      console.error('Error fetching featured configs:', err);
      return { priceToman: 99000, durationHours: 24 };
    }
  }

  /**
   * 2. Save Admin Configured Pricing & Duration
   */
  public async saveConfigs(priceToman: number, durationHours: number): Promise<boolean> {
    try {
      await this.prisma.systemConfig.upsert({
        where: { key: 'FEATURED_PRICE_TOMAN' },
        update: { value: String(priceToman) },
        create: { key: 'FEATURED_PRICE_TOMAN', value: String(priceToman) }
      });

      await this.prisma.systemConfig.upsert({
        where: { key: 'FEATURED_DURATION_HOURS' },
        update: { value: String(durationHours) },
        create: { key: 'FEATURED_DURATION_HOURS', value: String(durationHours) }
      });

      return true;
    } catch (err) {
      console.error('Error saving featured configs:', err);
      return false;
    }
  }

  /**
   * 3. Start Checkout Flow (Enforces Product Governance & Eligibility)
   */
  public async checkoutFeatured(productId: number, supplierId: number, callbackUrl: string): Promise<{ payLink: string; authority: string; paymentId: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { supplier: true }
    });

    if (!product) {
      throw new Error('محصول مورد نظر یافت نشد');
    }

    // Governance: Supplier Ownership
    if (product.supplierId !== supplierId) {
      throw new Error('شما مالک این محصول نیستید');
    }

    // Governance: Product Approval / Publication Rules
    if (product.status !== 'PUBLISHED' && product.status !== 'ACTIVE') {
      throw new Error('فقط محصولات منتشر شده و فعال امکان ویژه شدن دارند');
    }

    // Governance: Inventory Rules
    if (product.inventory <= 0) {
      throw new Error('محصولاتی که موجودی انبار آن‌ها صفر است، امکان ویژه شدن ندارند');
    }

    const configs = await this.getConfigs();
    const amountIrr = configs.priceToman * 10; // Toman to Rial

    // Create unique Payment record (Idempotency and Fraud Prevention)
    const idempotencyKey = `fp_${productId}_${supplierId}_${Date.now()}`;
    const payment = await this.prisma.payment.create({
      data: {
        amount: new Decimal(amountIrr),
        currency: 'IRR',
        status: 'PENDING',
        idempotencyKey,
        paymentMethod: 'ONLINE_FEATURED_PLACEMENT',
        userId: supplierId
      }
    });

    // Request PayLink from the Zibal Payment Gateway
    const gateway = await PaymentServiceFactory.getService();
    const description = `تبلیغات ویژه محصول زوپیت: ${product.name.slice(0, 30)}`;
    const checkoutRes = await gateway.createPayment(amountIrr, description, callbackUrl, payment.id);

    // Save gateway authority reference to our payment record
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayReference: checkoutRes.authority }
    });

    // Write audit/transaction logs
    await this.prisma.transactionLog.create({
      data: {
        paymentId: payment.id,
        action: 'INIT_FEATURED_PLACEMENT',
        payload: JSON.stringify({
          productId,
          supplierId,
          priceToman: configs.priceToman,
          durationHours: configs.durationHours,
          idempotencyKey
        })
      }
    });

    // Set product status to PENDING_PAYMENT during checkout
    await this.prisma.product.update({
      where: { id: productId },
      data: { featuredStatus: 'PENDING_PAYMENT' }
    });

    return {
      payLink: checkoutRes.payLink,
      authority: checkoutRes.authority,
      paymentId: payment.id
    };
  }

  /**
   * 4. Verify Payment (Authoritative, Server-Verified, Duplicate-Safe Verification)
   */
  public async verifyFeaturedPayment(authority: string): Promise<{ success: boolean; productId?: number }> {
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayReference: authority }
    });

    if (!payment) {
      throw new Error('تراکنش پرداخت یافت نشد');
    }

    // Duplicate charge prevention / Idempotency
    if (payment.status === 'SUCCESS' || payment.status === 'PAID') {
      // Already verified and processed!
      const initLog = await this.prisma.transactionLog.findFirst({
        where: { paymentId: payment.id, action: 'INIT_FEATURED_PLACEMENT' }
      });
      let productId: number | undefined;
      if (initLog?.payload) {
        try {
          const parsed = JSON.parse(initLog.payload);
          productId = parsed.productId;
        } catch {}
      }
      return { success: true, productId };
    }

    const initLog = await this.prisma.transactionLog.findFirst({
      where: { paymentId: payment.id, action: 'INIT_FEATURED_PLACEMENT' }
    });

    if (!initLog || !initLog.payload) {
      throw new Error('اطلاعات اولیه تراکنش ویژه کردن محصول یافت نشد');
    }

    const payload = JSON.parse(initLog.payload);
    const productId = payload.productId;
    const durationHours = payload.durationHours || 24;

    const gateway = await PaymentServiceFactory.getService();
    const verifyRes = await gateway.verifyPayment(authority, payment.amount.toNumber());

    if (verifyRes.success) {
      // 1. Authoritative payment confirmation
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS' }
      });

      // 2. Fetch current product featured times to support explicit renewal/extensions
      const product = await this.prisma.product.findUnique({
        where: { id: productId }
      });

      let featuredUntil = new Date();
      if (product && product.featuredUntil && new Date(product.featuredUntil) > new Date()) {
        // Extend existing active period
        featuredUntil = new Date(new Date(product.featuredUntil).getTime() + durationHours * 60 * 60 * 1000);
      } else {
        // Set new period from now
        featuredUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);
      }

      // 3. Mark the product as ACTIVE featured
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          featuredStatus: 'ACTIVE',
          featuredUntil
        }
      });

      // 4. Log validation
      await this.prisma.transactionLog.create({
        data: {
          paymentId: payment.id,
          action: 'ACTIVATE_FEATURED_PLACEMENT',
          payload: JSON.stringify({
            productId,
            durationHours,
            featuredUntil: featuredUntil.toISOString(),
            trackId: verifyRes.trackId,
            refId: verifyRes.refId
          })
        }
      });

      return { success: true, productId };
    } else {
      // Payment Failed
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });

      await this.prisma.product.update({
        where: { id: productId },
        data: { featuredStatus: 'PAYMENT_FAILED' }
      });

      return { success: false, productId };
    }
  }

  /**
   * 5. Record Analytics Event
   */
  public async recordAnalytics(productId: number, eventType: 'impression' | 'click' | 'view' | 'import' | 'order', storeId?: number, supplierId?: number) {
    try {
      let finalSupplierId = supplierId;
      if (!finalSupplierId) {
        const p = await this.prisma.product.findUnique({
          where: { id: productId },
          select: { supplierId: true }
        });
        if (p) finalSupplierId = p.supplierId;
      }

      await this.prisma.activityLog.create({
        data: {
          userId: storeId || 0,
          action: 'FEATURED_EVENT',
          details: JSON.stringify({
            eventType,
            productId,
            supplierId: finalSupplierId || 0,
            storeId: storeId || 0,
            timestamp: new Date().toISOString()
          })
        }
      });
      return true;
    } catch (err) {
      console.error('Failed to log featured analytics:', err);
      return false;
    }
  }

  /**
   * 6. Get Supplier UI Products & Statuses & Performance Metrics
   */
  public async getSupplierFeaturedDashboard(supplierId: number) {
    const products = await this.prisma.product.findMany({
      where: { supplierId },
      include: {
        category: { select: { name: true } },
        images: { select: { url: true }, take: 1 }
      },
      orderBy: { id: 'desc' }
    });

    const configs = await this.getConfigs();

    // Fetch featured activity events in bulk for this supplier
    const logs = await this.prisma.activityLog.findMany({
      where: {
        action: 'FEATURED_EVENT',
        details: { contains: `"supplierId":${supplierId}` }
      }
    });

    // Group analytics by product
    const metricsMap = new Map<number, { impressions: number; clicks: number; imports: number; orders: number }>();
    logs.forEach((log: any) => {
      try {
        const parsed = JSON.parse(log.details);
        const pId = parsed.productId;
        const type = parsed.eventType;
        if (!pId) return;

        if (!metricsMap.has(pId)) {
          metricsMap.set(pId, { impressions: 0, clicks: 0, imports: 0, orders: 0 });
        }

        const metrics = metricsMap.get(pId)!;
        if (type === 'impression') metrics.impressions++;
        else if (type === 'click' || type === 'view') metrics.clicks++;
        else if (type === 'import') metrics.imports++;
        else if (type === 'order') metrics.orders++;
      } catch {}
    });

    const formatted = products.map((p: any) => {
      const metrics = metricsMap.get(p.id) || { impressions: 0, clicks: 0, imports: 0, orders: 0 };
      
      // Determine remaining featured time
      let remainingSeconds = 0;
      let status = p.featuredStatus || 'NONE';

      if (status === 'ACTIVE' && p.featuredUntil) {
        const diffMs = new Date(p.featuredUntil).getTime() - Date.now();
        if (diffMs > 0) {
          remainingSeconds = Math.round(diffMs / 1000);
        } else {
          status = 'EXPIRED';
        }
      }

      // Eligibility flag
      const isEligible = p.status === 'PUBLISHED' && p.inventory > 0;

      return {
        id: p.id,
        name: p.name,
        categoryName: p.category?.name || 'عمومی',
        imageUrl: p.images?.[0]?.url || '',
        inventory: p.inventory,
        status: p.status,
        featuredStatus: status,
        featuredUntil: p.featuredUntil,
        remainingSeconds,
        isEligible,
        metrics,
        priceToman: configs.priceToman,
        durationHours: configs.durationHours
      };
    });

    return {
      products: formatted,
      configs
    };
  }

  /**
   * 7. Super Admin Featured Dashboard (Stats, Audits, Revenue & Configurations)
   */
  public async getAdminFeaturedDashboard() {
    const configs = await this.getConfigs();

    // Calculate total revenue from SUCCESS featured placement payments
    const successfulPayments = await this.prisma.payment.findMany({
      where: {
        paymentMethod: 'ONLINE_FEATURED_PLACEMENT',
        status: 'SUCCESS'
      }
    });

    const totalRevenueIrr = successfulPayments.reduce((acc: number, p: any) => acc + p.amount.toNumber(), 0);
    const totalRevenueToman = Math.round(totalRevenueIrr / 10);

    // Fetch all active featured products
    const activeFeaturedProducts = await this.prisma.product.findMany({
      where: {
        featuredStatus: 'ACTIVE',
        featuredUntil: { gte: new Date() }
      },
      include: {
        supplier: { select: { id: true, username: true, brandName: true } },
        category: { select: { name: true } }
      }
    });

    // Load recent activity logs for audits
    const recentEvents = await this.prisma.activityLog.findMany({
      where: { action: 'FEATURED_EVENT' },
      orderBy: { id: 'desc' },
      take: 20
    });

    const recentLogsParsed = recentEvents.map((log: any) => {
      try {
        return {
          id: log.id,
          createdAt: log.createdAt,
          storeId: log.userId,
          ...JSON.parse(log.details)
        };
      } catch {
        return { id: log.id, createdAt: log.createdAt, raw: log.details };
      }
    });

    return {
      configs,
      totalRevenueToman,
      activeCount: activeFeaturedProducts.length,
      activeFeaturedProducts,
      recentLogs: recentLogsParsed
    };
  }

  /**
   * 8. Static/Dynamic Cleanup Job
   */
  public async expireCompletedPlacements(): Promise<number> {
    try {
      const expired = await this.prisma.product.updateMany({
        where: {
          featuredStatus: 'ACTIVE',
          featuredUntil: { lte: new Date() }
        },
        data: {
          featuredStatus: 'EXPIRED'
        }
      });
      return expired.count;
    } catch (err) {
      console.error('Error auto-expiring featured products:', err);
      return 0;
    }
  }
}
