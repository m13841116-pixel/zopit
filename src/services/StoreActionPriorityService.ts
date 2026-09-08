import { PrismaClient } from '@prisma/client';
import { StoreGrowthService } from './StoreGrowthService.js';
import { StoreRecommendationService } from './StoreRecommendationService.js';

export type ActionType =
  | 'PRODUCT_DISCOVERY'
  | 'PRODUCT_IMPORT'
  | 'LOW_STOCK'
  | 'SALES_GROWTH'
  | 'TARGET_PROGRESS'
  | 'NEW_PRODUCT'
  | 'PRODUCT_PERFORMANCE'
  | 'INVENTORY_OPPORTUNITY';

export interface StoreActionCard {
  id: string;
  type: ActionType;
  title: string;
  shortExplanation: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  priorityScore: number;
  reason: string;
  cta: string;
  targetDestination: 'marketplace' | 'recommendations' | 'catalog' | 'growth_center' | 'orders';
  metadata?: Record<string, any>;
  dismissible?: boolean;
}

export class StoreActionPriorityService {
  /**
   * Authoritative Action Priority Generator
   * Considers financial impact, urgency, relevance, confidence, and ease of execution.
   */
  public static async getSmartActions(
    prisma: PrismaClient,
    storeId: number,
    limit: number = 5
  ): Promise<StoreActionCard[]> {
    // 1. Gather Store Growth & Target Metrics
    const growthData = await StoreGrowthService.getGrowthDashboardData(prisma, storeId);
    const { profitOverview, targetProgress, storeHealth, topProducts } = growthData;

    // 2. Gather Recommendations Signal
    const recResult = await StoreRecommendationService.getRecommendationsForStore(
      prisma,
      storeId,
      { limit: 8 }
    );
    const recommendations = (recResult?.items || []) as any[];

    // 3. Fetch Dismissed or Completed Actions from ActivityLog in past 7 days
    const recentActivityLogs = await prisma.activityLog.findMany({
      where: {
        userId: storeId,
        action: { in: ['ACTION_CENTER_DISMISS', 'ACTION_CENTER_COMPLETE'] },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      take: 50
    });

    const dismissedActionIds = new Set(
      recentActivityLogs
        .filter(l => l.action === 'ACTION_CENTER_DISMISS')
        .map(l => {
          try {
            return JSON.parse(l.details || '{}').actionId;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    );

    const completedActionIds = new Set(
      recentActivityLogs
        .filter(l => l.action === 'ACTION_CENTER_COMPLETE')
        .map(l => {
          try {
            return JSON.parse(l.details || '{}').actionId;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    );

    const candidateActions: StoreActionCard[] = [];

    // Helper to calculate score
    const scoreAction = (
      financialImpact: number, // 0-100
      urgency: number,         // 0-100
      relevance: number,       // 0-100
      confidence: number,      // 0-100
      ease: number             // 0-100
    ): { score: number; priority: 'HIGH' | 'MEDIUM' | 'LOW' } => {
      const score = Math.round(
        financialImpact * 0.35 +
        urgency * 0.25 +
        relevance * 0.20 +
        confidence * 0.10 +
        ease * 0.10
      );
      let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (score >= 80) priority = 'HIGH';
      else if (score >= 65) priority = 'MEDIUM';
      return { score, priority };
    };

    // -------------------------------------------------------------
    // RULE 1: TARGET_PROGRESS (Target Gap or Target Reached)
    // -------------------------------------------------------------
    const targetGap = Math.max(0, targetProgress.remainingAmount);
    if (targetProgress.status === 'BEHIND' || (targetProgress.status === 'NEAR_TARGET' && targetGap > 0)) {
      const actionId = `action-target-gap-${targetProgress.periodTarget}`;
      // Do not suppress severe target gaps if dismissed over 24 hours ago
      if (!completedActionIds.has(actionId) && !dismissedActionIds.has(actionId)) {
        const gapInMillions = (targetGap / 1000000).toFixed(1);
        const { score, priority } = scoreAction(95, 90, 95, 90, 85);
        candidateActions.push({
          id: actionId,
          type: 'TARGET_PROGRESS',
          title: `فاصله ${gapInMillions} میلیون تومانی تا تکمیل هدف این دوره`,
          shortExplanation: `برای رسیدن به هدف ماهانه و دریافت پاداش تمدید رایگان، ${targetGap.toLocaleString('fa-IR')} تومان فاصله دارید.`,
          priority,
          priorityScore: score,
          reason: `هدف درآمدی: ${targetProgress.periodTarget.toLocaleString('fa-IR')} تومان | عملکرد فعلی: ${targetProgress.currentPerformance.toLocaleString('fa-IR')} تومان`,
          cta: 'افزایش فروش و دریافت کالا',
          targetDestination: 'recommendations',
          metadata: { remainingAmount: targetGap, periodTarget: targetProgress.periodTarget },
          dismissible: true
        });
      }
    } else if (targetProgress.status === 'REACHED') {
      const actionId = `action-target-reached-${targetProgress.periodTarget}`;
      if (!completedActionIds.has(actionId) && !dismissedActionIds.has(actionId)) {
        const { score, priority } = scoreAction(70, 40, 95, 100, 90);
        candidateActions.push({
          id: actionId,
          type: 'TARGET_PROGRESS',
          title: 'تارگت این دوره با موفقیت تحقق یافت! 🎉',
          shortExplanation: 'تبریک! فروشگاه شما به هدف درآمدی این ماه دست یافت و پاداش اشتراک آزاد گردید.',
          priority,
          priorityScore: score,
          reason: 'پوشش ۱۰۰٪ تارگت تعیین شده در مرکز رشد و سودآوری',
          cta: 'مشاهده کارنامه و پاداش',
          targetDestination: 'growth_center',
          metadata: { targetStatus: 'REACHED' },
          dismissible: true
        });
      }
    }

    // -------------------------------------------------------------
    // RULE 2: LOW_STOCK (Low Inventory Alerts for Active Catalog)
    // -------------------------------------------------------------
    const catalogWithStock = await prisma.storeProductSelection.findMany({
      where: { storeId, status: { in: ['ACTIVE', 'SYNCED'] } },
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      take: 100
    });

    const lowStockItems = catalogWithStock
      .filter(item => item.product && item.product.status === 'PUBLISHED' && item.product.inventory > 0 && item.product.inventory <= 5)
      .sort((a, b) => a.product.inventory - b.product.inventory);

    if (lowStockItems.length > 0) {
      const topLowStock = lowStockItems[0];
      const actionId = `action-low-stock-${topLowStock.productId}-${topLowStock.product.inventory}`;
      if (!completedActionIds.has(actionId)) {
        const { score, priority } = scoreAction(90, 95, 90, 95, 80);
        candidateActions.push({
          id: actionId,
          type: 'LOW_STOCK',
          title: `موجودی کالا «${topLowStock.product.name}» رو به اتمام است (${topLowStock.product.inventory} عدد باقی‌مانده)`,
          shortExplanation: 'برای جلوگیری از ناموجود شدن کالا و از دست رفتن مشتریان، اقدام به بررسی موجودی تامین‌کننده کنید.',
          priority,
          priorityScore: score,
          reason: `موجودی بحرانی انبار تامین‌کننده: فقط ${topLowStock.product.inventory} عدد در انبار موجود است.`,
          cta: 'مشاهده محصول در کاتالوگ',
          targetDestination: 'catalog',
          metadata: { productId: topLowStock.productId, inventory: topLowStock.product.inventory },
          dismissible: true
        });
      }
    }

    // -------------------------------------------------------------
    // RULE 3: SALES_GROWTH (Weekly or Daily Trend Drops / Rises)
    // -------------------------------------------------------------
    if (profitOverview.salesDailyChangePercent < -5) {
      const actionId = `action-sales-drop-${Math.abs(Math.round(profitOverview.salesDailyChangePercent))}`;
      if (!completedActionIds.has(actionId) && !dismissedActionIds.has(actionId)) {
        const dropPercent = Math.abs(Math.round(profitOverview.salesDailyChangePercent));
        const { score, priority } = scoreAction(88, 85, 85, 90, 80);
        candidateActions.push({
          id: actionId,
          type: 'SALES_GROWTH',
          title: `فروش این دوره نسبت به روز قبل ${dropPercent}٪ کاهش داشته است`,
          shortExplanation: 'با افزودن ۲ کالای پرفروش و پرتقاضای روز، ویترین آنلاین خود را برای مشتریان فعال کنید.',
          priority,
          priorityScore: score,
          reason: `کاهش ${dropPercent} درصدی درآمد بر اساس آنالیز هوشمند سفارشات روزانه`,
          cta: 'مشاهده کالاهای پرتقاضا',
          targetDestination: 'recommendations',
          metadata: { dropPercent },
          dismissible: true
        });
      }
    } else if (profitOverview.salesDailyChangePercent > 10) {
      const actionId = `action-sales-rise-${Math.round(profitOverview.salesDailyChangePercent)}`;
      if (!completedActionIds.has(actionId) && !dismissedActionIds.has(actionId)) {
        const risePercent = Math.round(profitOverview.salesDailyChangePercent);
        const { score, priority } = scoreAction(80, 50, 85, 95, 85);
        candidateActions.push({
          id: actionId,
          type: 'SALES_GROWTH',
          title: `رشد چشمگیر فروش فروشگاه شما (+${risePercent}٪)`,
          shortExplanation: 'استقبال مشتریان رو به افزایش است. بهترین زمان برای افزودن محصولات مکمل و تثبیت رشد درآمد.',
          priority,
          priorityScore: score,
          reason: `رشد مثبت ${risePercent} درصدی فروش در ۲۴ ساعت گذشته`,
          cta: 'توسعه دسته‌بندی‌ها',
          targetDestination: 'marketplace',
          metadata: { risePercent },
          dismissible: true
        });
      }
    }

    // -------------------------------------------------------------
    // RULE 4: PRODUCT_IMPORT (Small Catalog Size Warning)
    // -------------------------------------------------------------
    if (profitOverview.activeCatalogProducts < 5) {
      const actionId = `action-catalog-small-${profitOverview.activeCatalogProducts}`;
      if (!completedActionIds.has(actionId) && !dismissedActionIds.has(actionId)) {
        const { score, priority } = scoreAction(85, 80, 90, 95, 90);
        candidateActions.push({
          id: actionId,
          type: 'PRODUCT_IMPORT',
          title: `کاتالوگ شما کوچک است (${profitOverview.activeCatalogProducts} کالا موجود است)`,
          shortExplanation: 'فروشگاه‌های دارای بیش از ۱۰ محصول تا ۳ برابر سفارشات بیشتری دریافت می‌کنند.',
          priority,
          priorityScore: score,
          reason: `بر اساس آمار زوپیت، تنوع کالایی بالای ۱۰ عدد باعث بازدید بیشتر ویترین فروشگاه می‌شود.`,
          cta: 'دریافت محصولات پیشنهادی',
          targetDestination: 'marketplace',
          metadata: { activeCount: profitOverview.activeCatalogProducts },
          dismissible: true
        });
      }
    }

    // -------------------------------------------------------------
    // RULE 5: NEW_PRODUCT (New relevant products in matched category)
    // -------------------------------------------------------------
    const newProductsRec = recommendations.filter(r => r.recommendationType === 'NEW_PRODUCT' || r.metrics?.freshness > 70);
    if (newProductsRec.length > 0) {
      const topNew = newProductsRec[0];
      const prodId = topNew.id;
      const prodName = topNew.name;
      const actionId = `action-new-product-${prodId}`;
      if (!completedActionIds.has(actionId) && !dismissedActionIds.has(actionId)) {
        const { score, priority } = scoreAction(82, 70, 88, 90, 85);
        candidateActions.push({
          id: actionId,
          type: 'NEW_PRODUCT',
          title: 'محصول جدیدی در دسته مورد علاقه فروشگاه شما اضافه شد',
          shortExplanation: `کالای «${prodName}» توسط تامین‌کننده برتر با ارسال سریع به بازارچه اضافه گردید.`,
          priority,
          priorityScore: score,
          reason: topNew.primaryReason || 'فرصت ورود زودهنگام به بازار با کالای تازه ثبت شده',
          cta: 'مشاهده و افزودن به کاتالوگ',
          targetDestination: 'recommendations',
          metadata: { productId: prodId, productName: prodName },
          dismissible: true
        });
      }
    }

    // -------------------------------------------------------------
    // RULE 6: PRODUCT_DISCOVERY (High-Fit Recommendations)
    // -------------------------------------------------------------
    const highFitRecs = recommendations.filter(r => r.score >= 75);
    if (highFitRecs.length >= 2) {
      const actionId = `action-discovery-${highFitRecs.length}`;
      if (!completedActionIds.has(actionId) && !dismissedActionIds.has(actionId)) {
        const { score, priority } = scoreAction(84, 65, 92, 90, 90);
        candidateActions.push({
          id: actionId,
          type: 'PRODUCT_DISCOVERY',
          title: `${highFitRecs.length} محصول پرفروش جدید متناسب با فروشگاه شما پیدا شد`,
          shortExplanation: 'الگوریتم هوشمند زوپیت محصولات پرتقاضای همخوان با سبد فروشگاه شما را آنالیز کرده است.',
          priority,
          priorityScore: score,
          reason: 'همخوانی بالا با الگوی خریداران و دسته‌بندی تخصصی فروشگاه شما',
          cta: 'مشاهده پیشنهادها',
          targetDestination: 'recommendations',
          metadata: { count: highFitRecs.length },
          dismissible: true
        });
      }
    }

    // -------------------------------------------------------------
    // RULE 7: PRODUCT_PERFORMANCE (Top Selling or Low Performing)
    // -------------------------------------------------------------
    if (topProducts.topSelling && topProducts.topSelling.length > 0) {
      const starProd = topProducts.topSelling[0];
      if (starProd.unitsSold >= 3) {
        const actionId = `action-star-product-${starProd.productId}`;
        if (!completedActionIds.has(actionId) && !dismissedActionIds.has(actionId)) {
          const { score, priority } = scoreAction(78, 50, 85, 95, 80);
          candidateActions.push({
            id: actionId,
            type: 'PRODUCT_PERFORMANCE',
            title: `محصول «${starProd.name}» پرفروش‌ترین کالای این دوره شماست`,
            shortExplanation: `با معرفی بیشتر این محصول در کانال‌های فروش خود، سود بیشتری کسب کنید (${starProd.unitsSold} عدد فروش).`,
            priority,
            priorityScore: score,
            reason: `ثبت ${starProd.unitsSold} سفارش موفق با درآمد کل ${starProd.totalRevenue.toLocaleString('fa-IR')} تومان`,
            cta: 'مدیریت محصول در کاتالوگ',
            targetDestination: 'catalog',
            metadata: { productId: starProd.productId, unitsSold: starProd.unitsSold },
            dismissible: true
          });
        }
      }
    }

    // -------------------------------------------------------------
    // RULE 8: INVENTORY_OPPORTUNITY (High Margin Items Available)
    // -------------------------------------------------------------
    const highMarginRecs = recommendations.filter(r => r.metrics.profitPotential >= 80);
    if (highMarginRecs.length > 0) {
      const topMarginRec = highMarginRecs[0];
      const actionId = `action-high-margin-${topMarginRec.productId}`;
      if (!completedActionIds.has(actionId) && !dismissedActionIds.has(actionId)) {
        const { score, priority } = scoreAction(76, 55, 80, 85, 90);
        candidateActions.push({
          id: actionId,
          type: 'INVENTORY_OPPORTUNITY',
          title: 'فرصت ویژه‌: محصولات با حاشیه سود بالا و موجودی مطمئن',
          shortExplanation: `کالای «${topMarginRec.product.name}» امکان کسب سود مناسب در هر فروش را فراهم می‌سازد.`,
          priority,
          priorityScore: score,
          reason: 'پتانسیل بالایی برای افزایش درصد سود خالصی خرده‌فروشی شما',
          cta: 'مشاهده فرصت‌های سودآور',
          targetDestination: 'recommendations',
          metadata: { productId: topMarginRec.productId },
          dismissible: true
        });
      }
    }

    // Sort candidate actions by priorityScore descending
    candidateActions.sort((a, b) => b.priorityScore - a.priorityScore);

    // Return limited top actions
    return candidateActions.slice(0, limit);
  }

  /**
   * Dismiss an action card for a store manager
   */
  public static async dismissAction(prisma: PrismaClient, storeId: number, actionId: string): Promise<void> {
    await prisma.activityLog.create({
      data: {
        userId: storeId,
        action: 'ACTION_CENTER_DISMISS',
        details: JSON.stringify({ actionId, timestamp: new Date().toISOString() })
      }
    });
  }

  /**
   * Mark an action card complete for a store manager
   */
  public static async completeAction(prisma: PrismaClient, storeId: number, actionId: string): Promise<void> {
    await prisma.activityLog.create({
      data: {
        userId: storeId,
        action: 'ACTION_CENTER_COMPLETE',
        details: JSON.stringify({ actionId, timestamp: new Date().toISOString() })
      }
    });
  }

  /**
   * Track action impressions
   */
  public static async trackActionImpression(prisma: PrismaClient, storeId: number, actionIds: string[]): Promise<void> {
    await prisma.activityLog.create({
      data: {
        userId: storeId,
        action: 'ACTION_CENTER_IMPRESSION',
        details: JSON.stringify({ actionIds, count: actionIds.length, timestamp: new Date().toISOString() })
      }
    });
  }

  /**
   * Track action clicks
   */
  public static async trackActionClick(prisma: PrismaClient, storeId: number, actionId: string): Promise<void> {
    await prisma.activityLog.create({
      data: {
        userId: storeId,
        action: 'ACTION_CENTER_CLICK',
        details: JSON.stringify({ actionId, timestamp: new Date().toISOString() })
      }
    });
  }

  /**
   * Admin Insights analytics for Smart Action Center
   */
  public static async getAdminActionAnalytics(prisma: PrismaClient) {
    const logs = await prisma.activityLog.findMany({
      where: {
        action: {
          in: ['ACTION_CENTER_IMPRESSION', 'ACTION_CENTER_CLICK', 'ACTION_CENTER_DISMISS', 'ACTION_CENTER_COMPLETE']
        }
      },
      take: 1000,
      orderBy: { createdAt: 'desc' }
    });

    let impressionsCount = 0;
    let clicksCount = 0;
    let dismissalsCount = 0;
    let completionsCount = 0;

    const actionClickFrequency: Record<string, number> = {};

    logs.forEach(log => {
      try {
        const details = JSON.parse(log.details || '{}');
        if (log.action === 'ACTION_CENTER_IMPRESSION') {
          impressionsCount += details.count || 1;
        } else if (log.action === 'ACTION_CENTER_CLICK') {
          clicksCount++;
          if (details.actionId) {
            actionClickFrequency[details.actionId] = (actionClickFrequency[details.actionId] || 0) + 1;
          }
        } else if (log.action === 'ACTION_CENTER_DISMISS') {
          dismissalsCount++;
        } else if (log.action === 'ACTION_CENTER_COMPLETE') {
          completionsCount++;
        }
      } catch {}
    });

    const ctr = impressionsCount > 0 ? Math.round((clicksCount / impressionsCount) * 100) : 0;
    const completionRate = clicksCount > 0 ? Math.round((completionsCount / clicksCount) * 100) : 0;

    return {
      summary: {
        impressionsCount,
        clicksCount,
        dismissalsCount,
        completionsCount,
        ctrPercentage: ctr,
        completionRatePercentage: completionRate
      },
      mostClickedActions: Object.entries(actionClickFrequency)
        .map(([actionId, count]) => ({ actionId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  }
}
