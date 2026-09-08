import { PrismaClient } from '@prisma/client';
import { StoreRecommendationService } from './StoreRecommendationService.js';

export interface StoreProfitOverview {
  todaySales: number;
  todayProfit: number;
  todayOrdersCount: number;
  yesterdaySales: number;
  yesterdayProfit: number;
  yesterdayOrdersCount: number;
  profitDailyChangePercent: number;
  salesDailyChangePercent: number;
  monthSales: number;
  monthProfit: number;
  monthOrdersCount: number;
  activeCatalogProducts: number;
  soldProductsCount: number;
  averageOrderValue: number;
  profitMarginRate: number;
  last7DaysTrend: Array<{
    date: string;
    dayName: string;
    sales: number;
    profit: number;
    orders: number;
  }>;
}

export interface StoreTargetProgress {
  periodTarget: number;
  dailyTarget: number;
  currentPerformance: number;
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  dailyRequiredRunRate: number;
  status: 'ON_TRACK' | 'NEAR_TARGET' | 'BEHIND' | 'REACHED';
  statusLabel: string;
  statusColor: string;
  tolerancePercent: number;
  rewardEligibility: {
    eligible: boolean;
    status: 'ELIGIBLE_FOR_FREE_MONTH' | 'IN_PROGRESS' | 'NOT_ELIGIBLE' | 'REWARD_CLAIMED';
    title: string;
    description: string;
  };
}

export interface StoreHealthSignal {
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  message: string;
  metric?: string | number;
}

export interface StoreHealthOverview {
  overallStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
  overallLabel: string;
  signals: {
    catalogSize: StoreHealthSignal;
    orderVelocity: StoreHealthSignal;
    inventoryAvailability: StoreHealthSignal;
    fulfillmentRate: StoreHealthSignal;
    targetPace: StoreHealthSignal;
  };
}

export interface StoreTopProductItem {
  productId: number;
  name: string;
  sku: string;
  imageUrl: string;
  categoryName: string;
  unitsSold: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  inventory: number;
}

export interface GrowthOpportunityItem {
  id: string;
  type: 'CATEGORY_EXPANSION' | 'BESTSELLER_ADD' | 'RESTOCK_ALERT' | 'HIGH_MARGIN' | 'PRICING_OPTIMIZATION';
  title: string;
  description: string;
  actionLabel: string;
  actionType: 'NAVIGATE_MARKETPLACE' | 'VIEW_RECOMMENDATIONS' | 'NAVIGATE_CATALOG' | 'SET_PRICING';
  badge?: string;
  badgeColor?: string;
  count?: number;
}

export interface StoreGrowthDashboardResult {
  profitOverview: StoreProfitOverview;
  targetProgress: StoreTargetProgress;
  storeHealth: StoreHealthOverview;
  topProducts: {
    topSelling: StoreTopProductItem[];
    topProfitable: StoreTopProductItem[];
    lowPerforming: StoreTopProductItem[];
  };
  growthOpportunities: GrowthOpportunityItem[];
}

export class StoreGrowthService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  public static async getGrowthDashboardData(prismaClient: PrismaClient, storeId: number): Promise<StoreGrowthDashboardResult> {
    const service = new StoreGrowthService(prismaClient);
    return service.getStoreGrowthDashboard(storeId);
  }

  async getGrowthDashboardData(storeId: number): Promise<StoreGrowthDashboardResult> {
    return this.getStoreGrowthDashboard(storeId);
  }

  /**
   * Retrieves Admin-configured Growth Settings with fallbacks
   */
  async getGrowthSettings() {
    try {
      const configs = await this.prisma.systemConfig.findMany({
        where: {
          key: {
            in: [
              'STORE_DAILY_GROWTH_TARGET',
              'STORE_GROWTH_TARGET_TOLERANCE',
              'STORE_GROWTH_PERIOD_DAYS',
              'STORE_GROWTH_REWARD_ENABLED',
              'STORE_GROWTH_MIN_ORDERS'
            ]
          }
        }
      });

      const map = new Map<string, string>();
      configs.forEach(c => map.set(c.key, c.value));

      return {
        dailyTargetBaseline: parseInt(map.get('STORE_DAILY_GROWTH_TARGET') || '500000', 10),
        tolerancePercent: parseFloat(map.get('STORE_GROWTH_TARGET_TOLERANCE') || '0.05'),
        periodDays: parseInt(map.get('STORE_GROWTH_PERIOD_DAYS') || '30', 10),
        rewardFreeMonthEnabled: map.get('STORE_GROWTH_REWARD_ENABLED') !== 'false',
        minOrdersForReward: parseInt(map.get('STORE_GROWTH_MIN_ORDERS') || '1', 10)
      };
    } catch (err) {
      return {
        dailyTargetBaseline: 500000,
        tolerancePercent: 0.05,
        periodDays: 30,
        rewardFreeMonthEnabled: true,
        minOrdersForReward: 1
      };
    }
  }

  /**
   * Updates Admin Growth Settings
   */
  async updateGrowthSettings(settings: {
    dailyTargetBaseline?: number;
    tolerancePercent?: number;
    periodDays?: number;
    rewardFreeMonthEnabled?: boolean;
    minOrdersForReward?: number;
  }) {
    const upserts = [];

    if (settings.dailyTargetBaseline !== undefined) {
      upserts.push(
        this.prisma.systemConfig.upsert({
          where: { key: 'STORE_DAILY_GROWTH_TARGET' },
          update: { value: String(settings.dailyTargetBaseline) },
          create: { key: 'STORE_DAILY_GROWTH_TARGET', value: String(settings.dailyTargetBaseline) }
        })
      );
    }

    if (settings.tolerancePercent !== undefined) {
      upserts.push(
        this.prisma.systemConfig.upsert({
          where: { key: 'STORE_GROWTH_TARGET_TOLERANCE' },
          update: { value: String(settings.tolerancePercent) },
          create: { key: 'STORE_GROWTH_TARGET_TOLERANCE', value: String(settings.tolerancePercent) }
        })
      );
    }

    if (settings.periodDays !== undefined) {
      upserts.push(
        this.prisma.systemConfig.upsert({
          where: { key: 'STORE_GROWTH_PERIOD_DAYS' },
          update: { value: String(settings.periodDays) },
          create: { key: 'STORE_GROWTH_PERIOD_DAYS', value: String(settings.periodDays) }
        })
      );
    }

    if (settings.rewardFreeMonthEnabled !== undefined) {
      upserts.push(
        this.prisma.systemConfig.upsert({
          where: { key: 'STORE_GROWTH_REWARD_ENABLED' },
          update: { value: String(settings.rewardFreeMonthEnabled) },
          create: { key: 'STORE_GROWTH_REWARD_ENABLED', value: String(settings.rewardFreeMonthEnabled) }
        })
      );
    }

    if (settings.minOrdersForReward !== undefined) {
      upserts.push(
        this.prisma.systemConfig.upsert({
          where: { key: 'STORE_GROWTH_MIN_ORDERS' },
          update: { value: String(settings.minOrdersForReward) },
          create: { key: 'STORE_GROWTH_MIN_ORDERS', value: String(settings.minOrdersForReward) }
        })
      );
    }

    await Promise.all(upserts);
    return this.getGrowthSettings();
  }

  /**
   * Main Growth & Profit Dashboard Aggregator for a Store Manager
   */
  async getStoreGrowthDashboard(storeId: number): Promise<StoreGrowthDashboardResult> {
    const now = new Date();
    
    // Time bounds
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    const startOf30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOf7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel fetch: Store settings, admin settings, store catalog, orders
    const [growthSettings, storeSettings, catalogSelections, recentOrders] = await Promise.all([
      this.getGrowthSettings(),
      this.prisma.storeSettings.findUnique({ where: { storeManagerId: storeId } }).catch(() => null),
      this.prisma.storeProductSelection.findMany({
        where: { storeId },
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true } },
              images: { select: { id: true, url: true } }
            }
          }
        }
      }),
      this.prisma.order.findMany({
        where: {
          storeId,
          createdAt: { gte: startOf30DaysAgo },
          status: { notIn: ['CANCELLED', 'REFUNDED'] }
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: { select: { id: true, name: true } },
                  images: { select: { id: true, url: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // 1. PROFIT & SALES CALCULATIONS
    let todaySales = 0;
    let todayProfit = 0;
    let todayOrdersCount = 0;

    let yesterdaySales = 0;
    let yesterdayProfit = 0;
    let yesterdayOrdersCount = 0;

    let monthSales = 0;
    let monthProfit = 0;
    let monthOrdersCount = 0;

    // Daily breakdown for last 7 days
    const last7DaysMap = new Map<string, { date: string; dayName: string; sales: number; profit: number; orders: number }>();
    const persianDayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayName = persianDayNames[d.getDay()];
      last7DaysMap.set(key, { date: key, dayName, sales: 0, profit: 0, orders: 0 });
    }

    // Product sales performance tracking
    const productStatsMap = new Map<number, {
      productId: number;
      name: string;
      sku: string;
      imageUrl: string;
      categoryName: string;
      unitsSold: number;
      totalRevenue: number;
      totalProfit: number;
      inventory: number;
    }>();

    for (const order of recentOrders) {
      const orderDate = new Date(order.createdAt);
      const isToday = orderDate >= startOfToday;
      const isYesterday = orderDate >= startOfYesterday && orderDate <= endOfYesterday;
      const dateKey = orderDate.toISOString().split('T')[0];

      let orderItemRevenueSum = 0;
      let orderItemProfitSum = 0;

      for (const item of order.items) {
        const qty = item.quantity || 1;
        const retailPrice = item.price > 0 ? item.price : (item.supplierPrice > 0 ? Math.round(item.supplierPrice * 1.2) : 0);
        const wholesaleCost = item.supplierPrice > 0 ? item.supplierPrice : Math.round(retailPrice * 0.8);
        const itemProfitPerUnit = Math.max(0, retailPrice - wholesaleCost);

        const itemTotalRevenue = retailPrice * qty;
        const itemTotalProfit = itemProfitPerUnit * qty;

        orderItemRevenueSum += itemTotalRevenue;
        orderItemProfitSum += itemTotalProfit;

        // Track per-product metrics
        if (item.productId) {
          const existing = productStatsMap.get(item.productId) || {
            productId: item.productId,
            name: item.product?.name || `محصول #${item.productId}`,
            sku: item.product?.sku || `SKU-${item.productId}`,
            imageUrl: item.product?.images?.[0]?.url || '',
            categoryName: item.product?.category?.name || 'عمومی',
            unitsSold: 0,
            totalRevenue: 0,
            totalProfit: 0,
            inventory: item.product?.inventory ?? 0
          };

          existing.unitsSold += qty;
          existing.totalRevenue += itemTotalRevenue;
          existing.totalProfit += itemTotalProfit;
          productStatsMap.set(item.productId, existing);
        }
      }

      // Order totals
      const effectiveOrderSales = order.totalAmount > 0 ? order.totalAmount : orderItemRevenueSum;
      const effectiveOrderProfit = orderItemProfitSum > 0 ? orderItemProfitSum : Math.round(effectiveOrderSales * 0.2);

      monthSales += effectiveOrderSales;
      monthProfit += effectiveOrderProfit;
      monthOrdersCount += 1;

      if (isToday) {
        todaySales += effectiveOrderSales;
        todayProfit += effectiveOrderProfit;
        todayOrdersCount += 1;
      } else if (isYesterday) {
        yesterdaySales += effectiveOrderSales;
        yesterdayProfit += effectiveOrderProfit;
        yesterdayOrdersCount += 1;
      }

      if (last7DaysMap.has(dateKey)) {
        const dayEntry = last7DaysMap.get(dateKey)!;
        dayEntry.sales += effectiveOrderSales;
        dayEntry.profit += effectiveOrderProfit;
        dayEntry.orders += 1;
      }
    }

    // Daily percentage changes
    let profitDailyChangePercent = 0;
    if (yesterdayProfit > 0) {
      profitDailyChangePercent = Math.round(((todayProfit - yesterdayProfit) / yesterdayProfit) * 100);
    } else if (todayProfit > 0) {
      profitDailyChangePercent = 100;
    }

    let salesDailyChangePercent = 0;
    if (yesterdaySales > 0) {
      salesDailyChangePercent = Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);
    } else if (todaySales > 0) {
      salesDailyChangePercent = 100;
    }

    const activeCatalogProducts = catalogSelections.length;
    const soldProductsCount = productStatsMap.size;
    const averageOrderValue = monthOrdersCount > 0 ? Math.round(monthSales / monthOrdersCount) : 0;
    const profitMarginRate = monthSales > 0 ? Math.round((monthProfit / monthSales) * 100) : 20;

    const profitOverview: StoreProfitOverview = {
      todaySales,
      todayProfit,
      todayOrdersCount,
      yesterdaySales,
      yesterdayProfit,
      yesterdayOrdersCount,
      profitDailyChangePercent,
      salesDailyChangePercent,
      monthSales,
      monthProfit,
      monthOrdersCount,
      activeCatalogProducts,
      soldProductsCount,
      averageOrderValue,
      profitMarginRate,
      last7DaysTrend: Array.from(last7DaysMap.values())
    };

    // 2. TARGET & GROWTH PROGRESSION
    const periodDays = growthSettings.periodDays;
    const dailyTarget = growthSettings.dailyTargetBaseline;
    const customMonthlyTarget = storeSettings?.monthlyTarget;
    const periodTarget = customMonthlyTarget && customMonthlyTarget > 0 ? customMonthlyTarget : dailyTarget * periodDays;
    const currentPerformance = monthSales;
    const progressPercentage = Math.min(100, Math.round((currentPerformance / periodTarget) * 100));
    const remainingAmount = Math.max(0, periodTarget - currentPerformance);
    
    // Calculate remaining days in 30-day period
    const daysElapsedInMonth = Math.max(1, now.getDate());
    const daysRemaining = Math.max(1, periodDays - daysElapsedInMonth);
    const dailyRequiredRunRate = Math.round(remainingAmount / daysRemaining);

    // Target Status Determination
    const tolerance = growthSettings.tolerancePercent;
    const effectiveTargetWithTolerance = periodTarget * (1 - tolerance);
    let targetStatus: 'ON_TRACK' | 'NEAR_TARGET' | 'BEHIND' | 'REACHED' = 'BEHIND';
    let statusLabel = 'نیاز به افزایش فعالیت';
    let statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';

    if (currentPerformance >= effectiveTargetWithTolerance) {
      targetStatus = 'REACHED';
      statusLabel = 'هدف تکمیل شد 🎉';
      statusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    } else if (progressPercentage >= 75) {
      targetStatus = 'NEAR_TARGET';
      statusLabel = 'نزدیک به هدف 🚀';
      statusColor = 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
    } else if (currentPerformance > 0) {
      // Check if daily run rate is on track relative to elapsed days
      const expectedPaceSoFar = (periodTarget / periodDays) * daysElapsedInMonth;
      if (currentPerformance >= expectedPaceSoFar * 0.9) {
        targetStatus = 'ON_TRACK';
        statusLabel = 'در مسیر هدف 📈';
        statusColor = 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      }
    }

    // Subscription Reward Eligibility
    const isRewardEligible = targetStatus === 'REACHED' && monthOrdersCount >= growthSettings.minOrdersForReward;
    const targetProgress: StoreTargetProgress = {
      periodTarget,
      dailyTarget,
      currentPerformance,
      progressPercentage,
      remainingAmount,
      daysRemaining,
      dailyRequiredRunRate,
      status: targetStatus,
      statusLabel,
      statusColor,
      tolerancePercent: Math.round(tolerance * 100),
      rewardEligibility: {
        eligible: isRewardEligible,
        status: isRewardEligible ? 'ELIGIBLE_FOR_FREE_MONTH' : (targetStatus === 'NEAR_TARGET' || targetStatus === 'ON_TRACK' ? 'IN_PROGRESS' : 'NOT_ELIGIBLE'),
        title: 'پاداش رشد: ۱ ماه اشتراک رایگان بعدی',
        description: isRewardEligible
          ? 'تبریک! با دستیابی به تارگت رشد، دوره اشتراک بعدی شما شامل ۱ ماه رایگان خواهد بود.'
          : `با تکمیل ${periodTarget.toLocaleString('fa-IR')} تومان تارگت فروش، ۱ ماه اشتراک ماه بعد به رایگان تمدید خواهد شد.`
      }
    };

    // 3. STORE HEALTH SIGNALS
    const inStockCatalogItems = catalogSelections.filter(s => (s.product?.inventory ?? 0) > 0).length;
    const inStockRatio = activeCatalogProducts > 0 ? Math.round((inStockCatalogItems / activeCatalogProducts) * 100) : 100;
    
    // Order velocity in past 7 days
    const weeklyOrders = recentOrders.filter(o => new Date(o.createdAt) >= startOf7DaysAgo).length;

    // Fulfillment Rate
    const completedOrders = recentOrders.filter(o => ['DELIVERED', 'COMPLETED', 'SHIPPED'].includes(o.status)).length;
    const fulfillmentRate = recentOrders.length > 0 ? Math.round((completedOrders / recentOrders.length) * 100) : 100;

    const catalogHealthSignal: StoreHealthSignal = activeCatalogProducts >= 10
      ? { status: 'GOOD', message: 'تعداد محصولات مناسب و کاتالوگ فعال', metric: `${activeCatalogProducts} کالا` }
      : activeCatalogProducts > 0
        ? { status: 'WARNING', message: 'برای افزایش بازدید، تنوع کالاها را به بیش از ۱۰ عدد برسانید', metric: `${activeCatalogProducts} کالا` }
        : { status: 'CRITICAL', message: 'کاتالوگ خالی است. محصولات پیشنهادی را اضافه کنید', metric: '۰ کالا' };

    const orderVelocitySignal: StoreHealthSignal = weeklyOrders >= 5
      ? { status: 'GOOD', message: 'جریان سفارشات هفتگی فعال و پررونق', metric: `${weeklyOrders} سفارش در هفته` }
      : weeklyOrders > 0
        ? { status: 'WARNING', message: 'سفارشات نیازمند شتاب‌بخشی بازاریابی هستند', metric: `${weeklyOrders} سفارش در هفته` }
        : { status: 'CRITICAL', message: 'هیچ سفارشی در ۷ روز گذشته ثبت نشده است', metric: '۰ سفارش' };

    const inventorySignal: StoreHealthSignal = inStockRatio >= 80
      ? { status: 'GOOD', message: 'موجودی انبار تأمین‌کنندگان پایدار است', metric: `${inStockRatio}٪ آماده ارسال` }
      : { status: 'WARNING', message: 'برخی کالاهای کاتالوگ ناموجود شده‌اند', metric: `${inStockRatio}٪ آماده ارسال` };

    const fulfillmentSignal: StoreHealthSignal = fulfillmentRate >= 70
      ? { status: 'GOOD', message: 'تکمیل و ارسال سفارشات در وضعیت مناسب', metric: `${fulfillmentRate}٪ موفق` }
      : { status: 'WARNING', message: 'برخی سفارشات در انتظار پیگیری مقصد هستند', metric: `${fulfillmentRate}٪ موفق` };

    const targetPaceSignal: StoreHealthSignal = targetStatus === 'REACHED' || targetStatus === 'ON_TRACK' || targetStatus === 'NEAR_TARGET'
      ? { status: 'GOOD', message: 'عملکرد همگام با برنامه رشد ماهانه', metric: `${progressPercentage}٪` }
      : { status: 'WARNING', message: 'نیازمند محصولات جدید برای رسیدن به تارگت', metric: `${progressPercentage}٪` };

    // Overall Health Status
    const goodSignalsCount = [catalogHealthSignal, orderVelocitySignal, inventorySignal, fulfillmentSignal, targetPaceSignal].filter(s => s.status === 'GOOD').length;
    let overallStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' = 'NEEDS_ATTENTION';
    let overallLabel = 'نیازمند توجه و تقویت';

    if (goodSignalsCount >= 4) {
      overallStatus = 'EXCELLENT';
      overallLabel = 'عالی و پرشتاب';
    } else if (goodSignalsCount >= 2) {
      overallStatus = 'GOOD';
      overallLabel = 'مطلوب و رو به رشد';
    }

    const storeHealth: StoreHealthOverview = {
      overallStatus,
      overallLabel,
      signals: {
        catalogSize: catalogHealthSignal,
        orderVelocity: orderVelocitySignal,
        inventoryAvailability: inventorySignal,
        fulfillmentRate: fulfillmentSignal,
        targetPace: targetPaceSignal
      }
    };

    // 4. TOP PRODUCTS & LOW PERFORMING BREAKDOWN
    const allProductStats = Array.from(productStatsMap.values()).map(p => ({
      ...p,
      profitMargin: p.totalRevenue > 0 ? Math.round((p.totalProfit / p.totalRevenue) * 100) : 20
    }));

    const topSelling = [...allProductStats].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
    const topProfitable = [...allProductStats].sort((a, b) => b.totalProfit - a.totalProfit).slice(0, 5);

    // Low performing items in catalog (0 sales in past 30 days)
    const soldProductIds = new Set(allProductStats.map(p => p.productId));
    const lowPerforming: StoreTopProductItem[] = catalogSelections
      .filter(s => !soldProductIds.has(s.productId) && s.product)
      .slice(0, 5)
      .map(s => ({
        productId: s.productId,
        name: s.product.name,
        sku: s.product.sku || `SKU-${s.productId}`,
        imageUrl: s.product.images?.[0]?.url || '',
        categoryName: s.product.category?.name || 'عمومی',
        unitsSold: 0,
        totalRevenue: 0,
        totalProfit: 0,
        profitMargin: 0,
        inventory: s.product.inventory ?? 0
      }));

    // 5. ACTIONABLE GROWTH OPPORTUNITIES
    const growthOpportunities: GrowthOpportunityItem[] = [];

    if (activeCatalogProducts < 10) {
      growthOpportunities.push({
        id: 'opp-catalog-expand',
        type: 'CATEGORY_EXPANSION',
        title: 'توسعه کاتالوگ فروشگاه به بیش از ۱۰ کالا',
        description: 'فروشگاه‌های با تنوع بالای ۱۰ محصول، تا ۳ برابر سفارشات بیشتری دریافت می‌کنند.',
        actionLabel: 'مشاهده بانک زوپیت',
        actionType: 'NAVIGATE_MARKETPLACE',
        badge: 'اولویت بالا',
        badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        count: 10 - activeCatalogProducts
      });
    }

    if (targetStatus === 'BEHIND' || targetStatus === 'NEAR_TARGET') {
      growthOpportunities.push({
        id: 'opp-bestsellers',
        type: 'BESTSELLER_ADD',
        title: 'افزودن ۵ کالای پرفروش روز به فروشگاه',
        description: 'کالاهای منتخب پرفروش شبکه می‌توانند تارگت این دوره شما را با سرعت تکمیل کنند.',
        actionLabel: 'پیشنهادات هوشمند',
        actionType: 'VIEW_RECOMMENDATIONS',
        badge: 'سودآور',
        badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        count: 5
      });
    }

    if (inStockRatio < 85) {
      const outOfStockCount = activeCatalogProducts - inStockCatalogItems;
      growthOpportunities.push({
        id: 'opp-restock',
        type: 'RESTOCK_ALERT',
        title: `${outOfStockCount} کالا در کاتالوگ شما ناموجود شده است`,
        description: 'جایگزینی کالاهای ناموجود با محصولات مشابه، مانع از دست رفتن مشتریان می‌شود.',
        actionLabel: 'مدیریت کاتالوگ من',
        actionType: 'NAVIGATE_CATALOG',
        badge: 'نیاز به اقدام',
        badgeColor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        count: outOfStockCount
      });
    }

    growthOpportunities.push({
      id: 'opp-margin-boost',
      type: 'HIGH_MARGIN',
      title: 'محصولات با حاشیه سود بالای ۲۵٪',
      description: 'کالاهایی با سودآوری مضاعف و حاشیه سود رقابتی مناسب برای فروشگاه شما در دسترس است.',
      actionLabel: 'مشاهده فرصت‌های سودآور',
      actionType: 'VIEW_RECOMMENDATIONS',
      badge: 'سود عالی',
      badgeColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20'
    });

    return {
      profitOverview,
      targetProgress,
      storeHealth,
      topProducts: {
        topSelling,
        topProfitable,
        lowPerforming
      },
      growthOpportunities
    };
  }
}
