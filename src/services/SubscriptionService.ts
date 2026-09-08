import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface PlanConfig {
  code: "PRO_MONTHLY" | "PRO_ANNUAL";
  displayName: string;
  billingInterval: "MONTHLY" | "ANNUAL";
  priceToman: number;
  priceRials: number;
  currency: "TOMAN" | "IRR";
  durationMonths: number;
  durationDays: number;
  isActive: boolean;
  description: string;
  hostingIncluded: boolean;
  features: string[];
}

export interface SubscriptionStatusResult {
  userId: number;
  hasSubscription: boolean;
  isActive: boolean;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING_PAYMENT" | "PAYMENT_FAILED" | "PENDING" | "NONE";
  planType: "PRO_MONTHLY" | "PRO_ANNUAL" | string | null;
  planDisplayName: string | null;
  startDate: Date | null;
  expiresAt: Date | null;
  daysRemaining: number;
  canRenew: boolean;
  freeMonthCredits: number;
  renewalCount: number;
  details?: any;
}

export class SubscriptionService {
  /**
   * Get server-authoritative plan configurations from system settings
   */
  static async getPlanConfigs(): Promise<{ PRO_MONTHLY: PlanConfig; PRO_ANNUAL: PlanConfig }> {
    try {
      const settingsRows = await prisma.systemSettings.findMany({
        where: {
          key: {
            in: [
              "pro_monthly_price",
              "pro_annual_price",
              "pro_plan_title",
              "pro_plan_desc",
              "pro_plan_active"
            ]
          }
        }
      });

      const settingsMap: Record<string, string> = {};
      settingsRows.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      const monthlyPrice = parseInt(settingsMap["pro_monthly_price"] || "2490000", 10);
      const annualPrice = parseInt(settingsMap["pro_annual_price"] || "24900000", 10);
      const isPlanActive = settingsMap["pro_plan_active"] !== "false";
      const planTitle = settingsMap["pro_plan_title"] || "اشتراک حرفه‌ای Zopit";
      const planDesc = settingsMap["pro_plan_desc"] || "دسترسی کامل به سیستم مدیریت فروشگاه، میزبانی ابری و زیرساخت فصلی";

      return {
        PRO_MONTHLY: {
          code: "PRO_MONTHLY",
          displayName: `${planTitle} (ماهانه)`,
          billingInterval: "MONTHLY",
          priceToman: monthlyPrice,
          priceRials: monthlyPrice * 10,
          currency: "TOMAN",
          durationMonths: 1,
          durationDays: 30,
          isActive: isPlanActive,
          description: planDesc,
          hostingIncluded: true,
          features: [
            "میزبانی ابری اختصاصی و پرسرعت NVMe",
            "اتصال به درگاه پرداخت مستقیم بانکی",
            "دریافت ای‌نماد و پرونده مالیاتی سریع",
            "ارسال سیستم اتوماتیک مرسولات و انبارداری",
            "پشتیبانی اختصاصی VIP زوپیت"
          ]
        },
        PRO_ANNUAL: {
          code: "PRO_ANNUAL",
          displayName: `${planTitle} (سالانه)`,
          billingInterval: "ANNUAL",
          priceToman: annualPrice,
          priceRials: annualPrice * 10,
          currency: "TOMAN",
          durationMonths: 12,
          durationDays: 365,
          isActive: isPlanActive,
          description: `${planDesc} - شامل ۲ ماه تخفیف ویژه سالانه`,
          hostingIncluded: true,
          features: [
            "میزبانی ابری اختصاصی و پرسرعت NVMe (۱ ساله)",
            "اتصال به درگاه پرداخت مستقیم بانکی",
            "دریافت ای‌نماد و پرونده مالیاتی رایگان",
            "۲ ماه استفاده رایگان در مقایسه با پرداخت ماهانه",
            "پشتیبانی اولویت‌دار اختصاصی VIP"
          ]
        }
      };
    } catch (error) {
      console.error("Error fetching plan configs:", error);
      // Fallback defaults
      return {
        PRO_MONTHLY: {
          code: "PRO_MONTHLY",
          displayName: "اشتراک حرفه‌ای Zopit (ماهانه)",
          billingInterval: "MONTHLY",
          priceToman: 2490000,
          priceRials: 24900000,
          currency: "TOMAN",
          durationMonths: 1,
          durationDays: 30,
          isActive: true,
          description: "دسترسی کامل به امکانات توسعه و زیرساخت اختصاصی فروشگاه",
          hostingIncluded: true,
          features: ["میزبانی ابری NVMe", "درگاه پرداخت مستقیم", "پشتیبانی اختصاصی"]
        },
        PRO_ANNUAL: {
          code: "PRO_ANNUAL",
          displayName: "اشتراک حرفه‌ای Zopit (سالانه)",
          billingInterval: "ANNUAL",
          priceToman: 24900000,
          priceRials: 249000000,
          currency: "TOMAN",
          durationMonths: 12,
          durationDays: 365,
          isActive: true,
          description: "دسترسی ۱ ساله کامل (۲ ماه تخفیف ویژه)",
          hostingIncluded: true,
          features: ["میزبانی ابری NVMe", "۲ ماه تخفیف سالانه", "پشتیبانی اختصاصی"]
        }
      };
    }
  }

  /**
   * Check store subscription status authoritatively on server
   */
  static async getStoreSubscriptionStatus(userId: number): Promise<SubscriptionStatusResult> {
    const proAccount = await prisma.proAccount.findUnique({
      where: { userId }
    });

    if (!proAccount) {
      return {
        userId,
        hasSubscription: false,
        isActive: false,
        status: "NONE",
        planType: null,
        planDisplayName: null,
        startDate: null,
        expiresAt: null,
        daysRemaining: 0,
        canRenew: true,
        freeMonthCredits: 0,
        renewalCount: 0
      };
    }

    const now = new Date();
    // Resolve effective expiration date (check expiresAt or hostExpiresAt)
    let expirationDate = proAccount.expiresAt || proAccount.hostExpiresAt;

    let currentStatus = proAccount.status || "PENDING";
    let isCurrentlyActive = currentStatus === "ACTIVE" || currentStatus === "APPROVED";

    // Handle Expiration Server-Side
    if (isCurrentlyActive && expirationDate && new Date(expirationDate) < now) {
      currentStatus = "EXPIRED";
      isCurrentlyActive = false;

      // Update in DB
      await prisma.proAccount.update({
        where: { userId },
        data: { status: "EXPIRED" }
      }).catch(() => {});

      // Log event
      await prisma.subscriptionEvent.create({
        data: {
          userId,
          proAccountId: proAccount.id,
          eventType: "SUBSCRIPTION_EXPIRED",
          planType: proAccount.planType || "PRO_ANNUAL",
          amount: 0,
          startDate: proAccount.startDate,
          endDate: expirationDate,
          metadata: JSON.stringify({ reason: "Exceeded valid subscription duration" })
        }
      }).catch(() => {});
    }

    let daysRemaining = 0;
    if (isCurrentlyActive && expirationDate) {
      const diffTime = new Date(expirationDate).getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const plans = await this.getPlanConfigs();
    const effectivePlan = proAccount.planType === "PRO_MONTHLY" ? plans.PRO_MONTHLY : plans.PRO_ANNUAL;

    return {
      userId,
      hasSubscription: true,
      isActive: isCurrentlyActive,
      status: currentStatus as any,
      planType: proAccount.planType,
      planDisplayName: effectivePlan?.displayName || "اشتراک حرفه‌ای Zopit",
      startDate: proAccount.startDate || proAccount.createdAt,
      expiresAt: expirationDate,
      daysRemaining,
      canRenew: true,
      freeMonthCredits: proAccount.freeMonthCredits || 0,
      renewalCount: proAccount.renewalCount || 0,
      details: {
        domainName: proAccount.domainName,
        cpanelUrl: proAccount.cpanelUrl,
        wpAdminUrl: proAccount.wpAdminUrl,
        hasEnamad: proAccount.hasEnamad,
        hasGateway: proAccount.hasGateway,
        torobConnected: proAccount.torobConnected
      }
    };
  }

  /**
   * Handle server-side subscription activation / renewal after payment confirmation
   */
  static async activateOrRenewSubscription(params: {
    userId: number;
    planType: "PRO_MONTHLY" | "PRO_ANNUAL";
    paymentRef: string;
    invoiceId?: number;
    amountPaidToman: number;
  }): Promise<{ success: boolean; proAccount: any; isNew: boolean; extendedDays: number }> {
    const { userId, planType, paymentRef, invoiceId, amountPaidToman } = params;

    // Idempotency check on StoreInvoice if provided
    if (invoiceId) {
      const invoice = await prisma.storeInvoice.findUnique({ where: { id: invoiceId } });
      if (invoice && invoice.status === "PAID" && invoice.trackId === paymentRef) {
        console.log(`[SubscriptionService] Invoice #${invoiceId} already processed as PAID. Idempotent return.`);
        const existingPro = await prisma.proAccount.findUnique({ where: { userId } });
        return { success: true, proAccount: existingPro, isNew: false, extendedDays: 0 };
      }
    }

    const plans = await this.getPlanConfigs();
    const planConfig = planType === "PRO_MONTHLY" ? plans.PRO_MONTHLY : plans.PRO_ANNUAL;
    const durationDays = planConfig.durationDays;

    const existingPro = await prisma.proAccount.findUnique({ where: { userId } });
    const now = new Date();

    let startDate = now;
    let newExpiresAt = new Date();

    let isRenewal = false;

    if (existingPro && (existingPro.status === "ACTIVE" || existingPro.status === "APPROVED")) {
      const currentExp = existingPro.expiresAt || existingPro.hostExpiresAt;
      if (currentExp && new Date(currentExp) > now) {
        // Stack extension on top of current expiration date
        startDate = existingPro.startDate || existingPro.createdAt;
        newExpiresAt = new Date(new Date(currentExp).getTime() + durationDays * 24 * 60 * 60 * 1000);
        isRenewal = true;
      } else {
        newExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }
    } else {
      newExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }

    // Upsert ProAccount
    const updatedPro = await prisma.proAccount.upsert({
      where: { userId },
      update: {
        planType,
        status: "ACTIVE",
        startDate,
        expiresAt: newExpiresAt,
        hostExpiresAt: newExpiresAt,
        lastRenewedAt: now,
        payLink: null,
        renewalCount: { increment: isRenewal ? 1 : 0 }
      },
      create: {
        userId,
        planType,
        status: "ACTIVE",
        startDate,
        expiresAt: newExpiresAt,
        hostExpiresAt: newExpiresAt,
        lastRenewedAt: now,
        renewalCount: 0
      }
    });

    // Mark invoice paid if present
    if (invoiceId) {
      await prisma.storeInvoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAt: now,
          trackId: paymentRef,
          receiptNotes: `پرداخت اشتراک ${planConfig.displayName}`
        }
      }).catch((e) => console.error("Error updating StoreInvoice status:", e));
    }

    // Log Subscription Event
    const eventType = isRenewal ? "SUBSCRIPTION_RENEWED" : "SUBSCRIPTION_ACTIVATED";
    await prisma.subscriptionEvent.create({
      data: {
        userId,
        proAccountId: updatedPro.id,
        eventType,
        planType,
        amount: amountPaidToman,
        durationMonths: planConfig.durationMonths,
        startDate,
        endDate: newExpiresAt,
        paymentRef,
        metadata: JSON.stringify({
          invoiceId,
          durationDays,
          planDisplayName: planConfig.displayName
        })
      }
    });

    // Record Audit Trail
    await prisma.auditTrail.create({
      data: {
        actorId: userId,
        action: eventType,
        resource: `ProAccount:${updatedPro.id}`,
        metadata: JSON.stringify({ amountPaidToman, paymentRef, planType, newExpiresAt })
      }
    }).catch(() => {});

    return {
      success: true,
      proAccount: updatedPro,
      isNew: !isRenewal,
      extendedDays: durationDays
    };
  }

  /**
   * Admin configuration update for subscription plan prices
   */
  static async adminUpdatePlanPrices(adminId: number, monthlyPriceToman: number, annualPriceToman: number): Promise<boolean> {
    if (monthlyPriceToman <= 0 || annualPriceToman <= 0) {
      throw new Error("قیمت اشتراک باید بزرگتر از صفر باشد.");
    }

    await prisma.systemSettings.upsert({
      where: { key: "pro_monthly_price" },
      update: { value: String(monthlyPriceToman) },
      create: { key: "pro_monthly_price", value: String(monthlyPriceToman), description: "قیمت اشتراک ماهانه پرو زوپیت (تومان)" }
    });

    await prisma.systemSettings.upsert({
      where: { key: "pro_annual_price" },
      update: { value: String(annualPriceToman) },
      create: { key: "pro_annual_price", value: String(annualPriceToman), description: "قیمت اشتراک سالانه پرو زوپیت (تومان)" }
    });

    await prisma.auditTrail.create({
      data: {
        actorId: adminId,
        action: "UPDATE_SUBSCRIPTION_PRICES",
        resource: "SystemSettings",
        metadata: JSON.stringify({ monthlyPriceToman, annualPriceToman })
      }
    }).catch(() => {});

    return true;
  }

  /**
   * Admin list of all store subscriptions
   */
  static async adminGetSubscriptions(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.user = {
        OR: [
          { storeName: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { mobile: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } }
        ]
      };
    }

    const [items, total] = await Promise.all([
      prisma.proAccount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              storeName: true,
              mobile: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.proAccount.count({ where })
    ]);

    // Aggregate subscription revenue from paid invoices
    const revenueAggregate = await prisma.storeInvoice.aggregate({
      where: {
        status: "PAID",
        receiptNotes: { contains: "اشتراک" }
      },
      _sum: { totalAmount: true }
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalRevenueToman: revenueAggregate._sum.totalAmount || 0
    };
  }

  /**
   * Admin manual action (Activate, Expire, Extend)
   */
  static async adminManualAction(adminId: number, targetUserId: number, action: "ACTIVATE" | "EXPIRE" | "EXTEND", extensionDays: number = 30) {
    const pro = await prisma.proAccount.findUnique({ where: { userId: targetUserId } });
    const now = new Date();

    if (action === "EXPIRE") {
      const updated = await prisma.proAccount.update({
        where: { userId: targetUserId },
        data: { status: "EXPIRED" }
      });

      await prisma.auditTrail.create({
        data: {
          actorId: adminId,
          action: "ADMIN_EXPIRE_SUBSCRIPTION",
          resource: `ProAccount:${targetUserId}`
        }
      });

      return updated;
    }

    let startDate = pro?.startDate || now;
    let baseExp = (pro?.expiresAt && new Date(pro.expiresAt) > now) ? new Date(pro.expiresAt) : now;
    let newExpiresAt = new Date(baseExp.getTime() + extensionDays * 24 * 60 * 60 * 1000);

    const updated = await prisma.proAccount.upsert({
      where: { userId: targetUserId },
      update: {
        status: "ACTIVE",
        startDate,
        expiresAt: newExpiresAt,
        hostExpiresAt: newExpiresAt
      },
      create: {
        userId: targetUserId,
        status: "ACTIVE",
        startDate: now,
        expiresAt: newExpiresAt,
        hostExpiresAt: newExpiresAt,
        planType: "PRO_ANNUAL"
      }
    });

    await prisma.subscriptionEvent.create({
      data: {
        userId: targetUserId,
        proAccountId: updated.id,
        eventType: action === "EXTEND" ? "SUBSCRIPTION_RENEWED" : "SUBSCRIPTION_ACTIVATED",
        planType: updated.planType || "PRO_ANNUAL",
        amount: 0,
        durationMonths: Math.round(extensionDays / 30),
        startDate: updated.startDate,
        endDate: newExpiresAt,
        metadata: JSON.stringify({ adminAction: action, extensionDays, adminId })
      }
    });

    await prisma.auditTrail.create({
      data: {
        actorId: adminId,
        action: `ADMIN_${action}_SUBSCRIPTION`,
        resource: `ProAccount:${targetUserId}`,
        metadata: JSON.stringify({ extensionDays, newExpiresAt })
      }
    });

    return updated;
  }
}
