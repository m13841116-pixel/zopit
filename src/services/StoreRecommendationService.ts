import { PrismaClient } from '@prisma/client';

export function calculateAuthoritativeFinalPrice(
  supplierBasePrice: number,
  marginType: string,
  marginValue: number
): number {
  const base = Math.max(0, Number(supplierBasePrice) || 0);
  const mVal = Number(marginValue) || 0;
  if (marginType === 'PERCENTAGE') {
    return Math.round(base * (1 + mVal / 100));
  } else if (marginType === 'FIXED') {
    return Math.round(base + mVal);
  }
  return Math.round(base);
}

export interface RecommendationScoreResult {
  productId: number;
  score: number;
  reasonCodes: string[];
  primaryReason: string;
  recommendationType: string;
  metrics: {
    categoryFit: number;
    demand: number;
    supplierReliability: number;
    inventory: number;
    profitPotential: number;
    priceFit: number;
    storeBehaviorFit: number;
    freshness: number;
    penalties: number;
  };
}

export interface RecommendationReasonDetail {
  code: string;
  title: string;
  description: string;
}

export const REASON_DICTIONARY: Record<string, { title: string; description: string }> = {
  CATEGORY_MATCH: {
    title: 'همخوانی دسته‌بندی',
    description: 'همخوانی کامل با حوزه تخصصی و دسته‌بندی فروشگاه شما'
  },
  HIGH_DEMAND: {
    title: 'تقاضای بالا',
    description: 'محصول پرفروش و پرمخاطب در شبکه فروشگاه‌های زوپیت'
  },
  GOOD_PROFIT_POTENTIAL: {
    title: 'حاشیه سود مناسب',
    description: 'دارای پتانسیل حاشیه سود و درآمدزایی بالا برای خرده‌فروشی'
  },
  IN_STOCK: {
    title: 'موجودی پایدار',
    description: 'موجودی انبار مطمئن و آماده ارسال فوری توسط تأمین‌کننده'
  },
  RELIABLE_SUPPLIER: {
    title: 'تأمین‌کننده برتر',
    description: 'تأمین‌کننده با رتبه کیفی بالا و نرخ تحویل موفق'
  },
  PRICE_MATCH: {
    title: 'تناسب قیمتی',
    description: 'متناسب با بازه قیمتی سبد فروش و سفارشات قبلی فروشگاه شما'
  },
  SIMILAR_TO_YOUR_PRODUCTS: {
    title: 'مکمل سبد فروش',
    description: 'مشابه و مکمل کالاهایی که پیش‌تر در فروشگاه خود به فروش رسانده‌اید'
  },
  TRENDING: {
    title: 'روند صعودی',
    description: 'رشد چشمگیر سفارشات و اقبال مشتریان در روزهای اخیر'
  },
  NEW_PRODUCT: {
    title: 'کالای جدید',
    description: 'محصول تازه اضافه شده به شبکه با فرصت ورود زودهنگام به بازار'
  }
};

export interface RecommendationOptions {
  type?: 'for_you' | 'best_sellers' | 'new_arrivals' | 'similar' | 'opportunities' | 'all';
  categoryId?: number;
  page?: number;
  limit?: number;
  excludeImported?: boolean;
}

export class StoreRecommendationService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  public static async getRecommendationsForStore(prismaClient: PrismaClient, storeId: number, options?: RecommendationOptions) {
    const service = new StoreRecommendationService(prismaClient);
    return service.getRecommendations(storeId, options);
  }

  async getRecommendationsForStore(storeId: number, options?: RecommendationOptions) {
    return this.getRecommendations(storeId, options);
  }

  /**
   * Builds the Store Behavioral Profile
   */
  async getStoreProfile(storeId: number) {
    const storeUser = await this.prisma.user.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        activityType: true,
        fieldOfActivity: true,
        storeName: true,
        storeUrl: true,
        status: true,
      }
    });

    if (!storeUser) {
      throw new Error('فروشگاه مورد نظر یافت نشد.');
    }

    // 1. Existing imported products in StoreProductSelection
    const selections = await this.prisma.storeProductSelection.findMany({
      where: { storeId },
      include: {
        product: {
          select: {
            id: true,
            categoryId: true,
            supplierId: true,
            finalPrice: true,
            supplierBasePrice: true,
            marginType: true,
            marginValue: true,
          }
        }
      }
    });

    const importedProductIds = new Set<number>(selections.map(s => s.productId));
    const importedCategoryIds = new Set<number>();
    const importedSupplierIds = new Set<number>();
    const pricePoints: number[] = [];

    selections.forEach(s => {
      if (s.product) {
        if (s.product.categoryId) importedCategoryIds.add(s.product.categoryId);
        if (s.product.supplierId) importedSupplierIds.add(s.product.supplierId);
        const p = s.product.finalPrice || s.product.supplierBasePrice || 0;
        if (p > 0) pricePoints.push(p);
      }
    });

    // 2. Past Orders
    const orders = await this.prisma.order.findMany({
      where: { storeId },
      include: {
        items: {
          select: {
            productId: true,
            supplierId: true,
            price: true,
            quantity: true,
            product: {
              select: {
                categoryId: true
              }
            }
          }
        }
      },
      take: 100,
      orderBy: { id: 'desc' }
    });

    const soldProductIds = new Set<number>();
    const soldCategoryIds = new Set<number>();
    orders.forEach(o => {
      o.items.forEach(item => {
        soldProductIds.add(item.productId);
        if (item.product?.categoryId) soldCategoryIds.add(item.product.categoryId);
        if (item.price > 0) pricePoints.push(item.price);
      });
    });

    const avgPrice = pricePoints.length > 0
      ? pricePoints.reduce((a, b) => a + b, 0) / pricePoints.length
      : 0;

    const isColdStart = importedProductIds.size === 0 && soldProductIds.size === 0;

    return {
      storeUser,
      importedProductIds,
      importedCategoryIds,
      importedSupplierIds,
      soldProductIds,
      soldCategoryIds,
      avgPrice,
      isColdStart
    };
  }

  /**
   * Deterministic scoring engine for a single product against a store profile
   */
  calculateProductScore(
    product: any,
    profile: Awaited<ReturnType<typeof this.getStoreProfile>>,
    recType: string = 'for_you'
  ): RecommendationScoreResult {
    let categoryFit = 0;
    let demand = 0;
    let supplierReliability = 0;
    let inventory = 0;
    let profitPotential = 0;
    let priceFit = 0;
    let storeBehaviorFit = 0;
    let freshness = 0;
    let penalties = 0;

    const reasonCodes: string[] = [];

    // --- 1. Category Fit (Max 25 pts) ---
    if (profile.soldCategoryIds.has(product.categoryId)) {
      categoryFit = 25;
      reasonCodes.push('CATEGORY_MATCH');
    } else if (profile.importedCategoryIds.has(product.categoryId)) {
      categoryFit = 20;
      reasonCodes.push('CATEGORY_MATCH');
    } else if (profile.storeUser.activityType || profile.storeUser.fieldOfActivity) {
      const act = (profile.storeUser.activityType || profile.storeUser.fieldOfActivity || '').toLowerCase();
      const catName = (product.category?.name || '').toLowerCase();
      if (act && (act.includes(catName) || catName.includes(act))) {
        categoryFit = 22;
        reasonCodes.push('CATEGORY_MATCH');
      } else {
        categoryFit = 8;
      }
    } else if (profile.isColdStart) {
      categoryFit = 15;
    } else {
      categoryFit = 5;
    }

    // --- 2. Product Demand & Platform Popularity (Max 20 pts) ---
    const orderItemsCount = product._count?.orderItems || 0;
    const selectionsCount = product._count?.storeProductSelections || 0;

    if (orderItemsCount >= 15 || selectionsCount >= 10) {
      demand = 20;
      reasonCodes.push('HIGH_DEMAND');
      reasonCodes.push('TRENDING');
    } else if (orderItemsCount >= 5 || selectionsCount >= 4) {
      demand = 15;
      reasonCodes.push('HIGH_DEMAND');
    } else if (orderItemsCount >= 1 || selectionsCount >= 1) {
      demand = 10;
    } else {
      demand = 4;
    }

    // --- 3. Supplier Reliability (Max 15 pts) ---
    const suppScore = product.supplier?.performanceScore != null ? product.supplier.performanceScore : 100;
    const suppPenalties = product.supplier?.penaltyPoints || 0;

    supplierReliability = Math.max(0, Math.min(15, Math.round((suppScore / 100) * 15)));
    if (suppScore >= 90 && suppPenalties === 0) {
      reasonCodes.push('RELIABLE_SUPPLIER');
    }
    if (suppPenalties > 0) {
      penalties += Math.min(15, suppPenalties * 3);
    }

    // --- 4. Inventory Availability (Max 15 pts) ---
    const stock = product.inventory || 0;
    if (stock >= 30) {
      inventory = 15;
      reasonCodes.push('IN_STOCK');
    } else if (stock >= 10) {
      inventory = 12;
      reasonCodes.push('IN_STOCK');
    } else if (stock >= 3) {
      inventory = 8;
    } else if (stock >= 1) {
      inventory = 3;
      penalties += 5; // Low stock penalty
    } else {
      inventory = 0;
      penalties += 25; // Out of stock heavy penalty
    }

    // --- 5. Profit Potential (Max 10 pts) ---
    // Products with healthy pricing margins allow strong retail markups
    const effectivePrice = product.finalPrice || product.supplierBasePrice || 0;
    if (effectivePrice > 0) {
      profitPotential = 10;
      reasonCodes.push('GOOD_PROFIT_POTENTIAL');
    } else {
      profitPotential = 3;
    }

    // --- 6. Price Fit (Max 10 pts) ---
    if (profile.avgPrice > 0 && effectivePrice > 0) {
      const ratio = effectivePrice / profile.avgPrice;
      if (ratio >= 0.5 && ratio <= 2.0) {
        priceFit = 10;
        reasonCodes.push('PRICE_MATCH');
      } else if (ratio >= 0.25 && ratio <= 3.5) {
        priceFit = 6;
      } else {
        priceFit = 3;
      }
    } else {
      priceFit = 7; // Default baseline for cold start
    }

    // --- 7. Store Behavior Fit / Complementary (Max 10 pts) ---
    if (profile.importedSupplierIds.has(product.supplierId)) {
      storeBehaviorFit = 10;
      reasonCodes.push('SIMILAR_TO_YOUR_PRODUCTS');
    } else if (profile.importedCategoryIds.has(product.categoryId)) {
      storeBehaviorFit = 8;
    } else if (profile.isColdStart) {
      storeBehaviorFit = 5;
    } else {
      storeBehaviorFit = 2;
    }

    // --- 8. Product Freshness (Max 10 pts) ---
    const createdAt = product.createdAt ? new Date(product.createdAt).getTime() : 0;
    const daysSinceCreated = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated <= 7) {
      freshness = 10;
      reasonCodes.push('NEW_PRODUCT');
    } else if (daysSinceCreated <= 30) {
      freshness = 6;
    } else {
      freshness = 2;
    }

    // --- 9. Already Imported by this Store Adjustments ---
    const isImported = profile.importedProductIds.has(product.id);
    if (isImported) {
      // If we are evaluating for generic feed, apply penalty so new products rank first
      penalties += 35;
    }

    // Deduplicate reason codes
    const uniqueReasons = Array.from(new Set(reasonCodes));

    // Type-specific weighting adjustments
    let weightedScore = categoryFit + demand + supplierReliability + inventory + profitPotential + priceFit + storeBehaviorFit + freshness - penalties;

    if (recType === 'best_sellers') {
      weightedScore = (demand * 2.5) + (supplierReliability * 1.5) + (inventory * 1.2) + categoryFit - penalties;
    } else if (recType === 'new_arrivals') {
      weightedScore = (freshness * 3.5) + (inventory * 1.5) + categoryFit + supplierReliability - penalties;
    } else if (recType === 'similar') {
      weightedScore = (categoryFit * 2.5) + (storeBehaviorFit * 2.5) + demand + inventory - penalties;
    } else if (recType === 'opportunities') {
      weightedScore = (profitPotential * 2.5) + (inventory * 2.0) + (supplierReliability * 2.0) + demand - penalties;
    }

    // Primary human-readable reason
    const primaryCode = uniqueReasons[0] || 'CATEGORY_MATCH';
    const primaryReason = REASON_DICTIONARY[primaryCode]?.description || 'پیشنهاد متناسب با پتانسیل فروشگاه شما';

    return {
      productId: product.id,
      score: Math.max(0, Math.round(weightedScore)),
      reasonCodes: uniqueReasons,
      primaryReason,
      recommendationType: recType,
      metrics: {
        categoryFit,
        demand,
        supplierReliability,
        inventory,
        profitPotential,
        priceFit,
        storeBehaviorFit,
        freshness,
        penalties
      }
    };
  }

  /**
   * Main recommendation query method
   */
  async getRecommendations(storeId: number, options: RecommendationOptions = {}) {
    const {
      type = 'for_you',
      categoryId,
      page = 1,
      limit = 12,
      excludeImported = false
    } = options;

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));

    // 1. Fetch Store Profile
    const profile = await this.getStoreProfile(storeId);

    // 2. Build Base Product Query with Strict Backend Eligibility
    const whereClause: any = {
      status: 'PUBLISHED',
      inventory: { gt: 0 },
      supplier: {
        status: 'ACTIVE'
      }
    };

    if (categoryId && !isNaN(categoryId)) {
      whereClause.categoryId = categoryId;
    }

    if (excludeImported && profile.importedProductIds.size > 0) {
      whereClause.id = { notIn: Array.from(profile.importedProductIds) };
    }

    // Fetch candidate products (up to 200 candidates for scoring and diverse ranking)
    const candidateProducts = await this.prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: { id: true, name: true }
        },
        supplier: {
          select: {
            id: true,
            username: true,
            brandName: true,
            firstName: true,
            lastName: true,
            province: true,
            city: true,
            performanceScore: true,
            penaltyPoints: true,
            status: true
          }
        },
        images: {
          select: { id: true, url: true }
        },
        variants: {
          select: { id: true, attributes: true, stock: true, sku: true, supplierBasePrice: true }
        },
        exploreContent: {
          select: { customTitle: true, customDescription: true, customImageUrl: true }
        },
        _count: {
          select: {
            orderItems: true,
            storeProductSelections: true
          }
        }
      },
      take: 200
    });

    // 3. Calculate authoritative score for each candidate
    const scoredList = (candidateProducts as any[]).map((p: any) => {
      // Ensure authoritative final price
      let authoritativePrice = p.finalPrice;
      if (!authoritativePrice && p.supplierBasePrice) {
        authoritativePrice = calculateAuthoritativeFinalPrice(
          p.supplierBasePrice,
          p.marginType || 'PERCENTAGE',
          p.marginValue ?? 0
        );
      }

      const scoreData = this.calculateProductScore(p, profile, type);

      // Sanitize supplier info (NO sensitive financial or private info)
      const supp = p.supplier;
      let sName = 'تامین‌کننده زوپیت';
      if (supp) {
        const full = `${supp.firstName || ''} ${supp.lastName || ''}`.trim();
        sName = full || supp.brandName || supp.username || 'تامین‌کننده زوپیت';
      }

      const supplierInfo = supp ? {
        name: sName,
        username: supp.username || '',
        province: supp.province || 'تعیین‌نشده',
        city: supp.city || 'تعیین‌نشده',
        performanceScore: supp.performanceScore ?? 100
      } : null;

      const mainImg = p.exploreContent?.customImageUrl || (p.images && p.images[0]?.url) || '';

      const isImported = profile.importedProductIds.has(p.id);

      return {
        id: p.id,
        name: p.exploreContent?.customTitle || p.name,
        sku: p.sku || `ZOP-${p.id}`,
        shortDescription: p.shortDescription || '',
        longDescription: p.exploreContent?.customDescription || p.longDescription || '',
        finalPrice: authoritativePrice,
        inventory: p.inventory,
        category: p.category,
        categoryId: p.categoryId,
        imageUrl: mainImg,
        images: p.images || [],
        supplierInfo,
        isImported,
        score: scoreData.score,
        reasonCodes: scoreData.reasonCodes,
        primaryReason: scoreData.primaryReason,
        recommendationType: scoreData.recommendationType,
        metrics: scoreData.metrics,
        platformDemand: {
          totalOrders: p._count?.orderItems || 0,
          totalImports: p._count?.storeProductSelections || 0
        }
      };
    });

    // 4. Sort deterministically by Score DESC
    scoredList.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.id - a.id;
    });

    // 5. Diversity Interleaving (Avoid consecutive items from identical supplier if alternatives exist)
    const diversifiedList: typeof scoredList = [];
    const seenSuppliers = new Map<string, number>();

    for (const item of scoredList) {
      const suppKey = item.supplierInfo?.username || String(item.id);
      const count = seenSuppliers.get(suppKey) || 0;
      if (count < 3 || scoredList.length < safeLimit * 2) {
        diversifiedList.push(item);
        seenSuppliers.set(suppKey, count + 1);
      }
    }

    // Fallback if filtering was too aggressive
    const finalList = diversifiedList.length >= safeLimit ? diversifiedList : scoredList;

    // 6. Pagination
    const total = finalList.length;
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const startIndex = (safePage - 1) * safeLimit;
    const items = finalList.slice(startIndex, startIndex + safeLimit);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages
      },
      meta: {
        storeActivity: profile.storeUser.activityType || profile.storeUser.fieldOfActivity || 'عمومی',
        totalImported: profile.importedProductIds.size,
        isColdStart: profile.isColdStart,
        recommendationType: type
      }
    };
  }

  /**
   * Log Recommendation Analytics Event
   */
  async recordEvent(storeId: number, eventData: {
    eventType: 'recommendation_impression' | 'recommendation_click' | 'recommendation_import' | 'recommendation_favorite';
    productId: number;
    recommendationType?: string;
    score?: number;
    metadata?: any;
  }) {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: storeId,
          action: 'RECOMMENDATION_EVENT',
          details: JSON.stringify({
            eventType: eventData.eventType,
            productId: eventData.productId,
            recommendationType: eventData.recommendationType || 'for_you',
            score: eventData.score || 0,
            metadata: eventData.metadata || {},
            timestamp: new Date().toISOString()
          })
        }
      });
      return { success: true };
    } catch (err) {
      console.error('Failed to log recommendation event:', err);
      return { success: false };
    }
  }

  /**
   * Admin Analytics Summary
   */
  async getAdminStats() {
    try {
      const logs = await this.prisma.activityLog.findMany({
        where: { action: 'RECOMMENDATION_EVENT' },
        orderBy: { id: 'desc' },
        take: 1000
      });

      let totalImpressions = 0;
      let totalClicks = 0;
      let totalImports = 0;
      const productCounts: Record<number, { impressions: number; clicks: number; imports: number }> = {};
      const typeCounts: Record<string, number> = {};

      logs.forEach(l => {
        try {
          const parsed = JSON.parse(l.details || '{}');
          const evt = parsed.eventType;
          const pId = parsed.productId;
          const recType = parsed.recommendationType || 'for_you';

          typeCounts[recType] = (typeCounts[recType] || 0) + 1;

          if (pId) {
            if (!productCounts[pId]) productCounts[pId] = { impressions: 0, clicks: 0, imports: 0 };
          }

          if (evt === 'recommendation_impression') {
            totalImpressions++;
            if (pId) productCounts[pId].impressions++;
          } else if (evt === 'recommendation_click') {
            totalClicks++;
            if (pId) productCounts[pId].clicks++;
          } else if (evt === 'recommendation_import') {
            totalImports++;
            if (pId) productCounts[pId].imports++;
          }
        } catch {}
      });

      const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0';
      const importConversionRate = totalClicks > 0 ? ((totalImports / totalClicks) * 100).toFixed(1) : '0';

      return {
        totalEvents: logs.length,
        totalImpressions,
        totalClicks,
        totalImports,
        ctr: `${ctr}%`,
        importConversionRate: `${importConversionRate}%`,
        conversionRate: `${importConversionRate}%`,
        typeDistribution: typeCounts,
        recentActivity: logs.slice(0, 10).map(l => {
          let parsed: any = {};
          try { parsed = JSON.parse(l.details || '{}'); } catch {}
          return {
            id: l.id,
            storeId: l.userId,
            eventType: parsed.eventType,
            productId: parsed.productId,
            recommendationType: parsed.recommendationType,
            createdAt: l.createdAt
          };
        })
      };
    } catch (err) {
      console.error('Error fetching admin recommendation stats:', err);
      return {
        totalEvents: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalImports: 0,
        ctr: '0%',
        importConversionRate: '0%',
        typeDistribution: {},
        recentActivity: []
      };
    }
  }
}
