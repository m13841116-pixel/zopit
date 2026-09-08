import { PrismaClient } from '@prisma/client';
import { StoreRecommendationService } from './StoreRecommendationService.js';

export interface MatchingReasonDetail {
  code: string;
  title: string;
  description: string;
}

export const MATCHING_REASON_DICTIONARY: Record<string, MatchingReasonDetail> = {
  CATEGORY_MATCH: {
    code: 'CATEGORY_MATCH',
    title: 'همخوانی دسته‌بندی',
    description: 'دسته محصول با حوزه فعالیت و فروشگاه همخوانی کامل دارد'
  },
  PRICE_MATCH: {
    code: 'PRICE_MATCH',
    title: 'محدوده قیمت مناسب',
    description: 'قیمت پایه کالا با بازه قیمتی فروش و توان بازار خریدار متناسب است'
  },
  PRODUCT_AFFINITY: {
    code: 'PRODUCT_AFFINITY',
    title: 'تناسب با سبد کالا',
    description: 'کالای مشابه یا مکمل محصولات فعال در فروشگاه می‌باشد'
  },
  HIGH_SUPPLIER_SCORE: {
    code: 'HIGH_SUPPLIER_SCORE',
    title: 'تأمین‌کننده برتر',
    description: 'تأمین‌کننده دارای رتبه عملکرد بالا و بازخورد مثبت شبکه است'
  },
  STRONG_INVENTORY: {
    code: 'STRONG_INVENTORY',
    title: 'موجودی پایدار انبار',
    description: 'موجودی کافی و آماده ارسال فوری بدون ریسک عدم تامین'
  },
  HIGH_DEMAND: {
    code: 'HIGH_DEMAND',
    title: 'تقاضای بالای بازار',
    description: 'کالای پرفروش و با تقاضای اثبات‌شده در شبکه زوپیت'
  },
  SIMILAR_PRODUCTS: {
    code: 'SIMILAR_PRODUCTS',
    title: 'محصولات مشابه',
    description: 'مشابه کالاهای موفق و پرفروش فروشگاه خریدار'
  },
  STORE_ACTIVITY_MATCH: {
    code: 'STORE_ACTIVITY_MATCH',
    title: 'فروشگاه فعال',
    description: 'فروشگاه دارای سابقه فروش منظم و جذب مشتری بالاست'
  },
  FULFILLMENT_RELIABILITY: {
    code: 'FULFILLMENT_RELIABILITY',
    title: 'ارسال به موقع',
    description: 'نرخ تحویل بسیار بالا و لغو سفارش نزدیک به صفر'
  }
};

export interface SanitizedStoreMatch {
  id: number;
  storeName: string;
  fieldOfActivity: string;
  activityType: string;
  platformType?: string;
  province?: string;
  city?: string;
  avatarUrl?: string;
  matchScore: number;
  matchReasons: MatchingReasonDetail[];
  primaryReason: string;
  relevantProduct?: {
    id: number;
    name: string;
    imageUrl?: string;
    categoryName?: string;
    supplierBasePrice: number;
  };
  actionCTA: string;
}

export interface SanitizedSupplierMatch {
  id: number;
  brandName: string;
  username: string;
  performanceScore: number;
  warningLevel: string;
  province?: string;
  city?: string;
  avatarUrl?: string;
  categories: string[];
  productCount: number;
  matchScore: number;
  matchReasons: MatchingReasonDetail[];
  primaryReason: string;
  topProducts: Array<{
    id: number;
    name: string;
    imageUrl?: string;
    categoryName?: string;
    supplierBasePrice: number;
    inventory: number;
    matchScore: number;
  }>;
  actionCTA: string;
}

export interface SupplierMatchOptions {
  productId?: number;
  categoryId?: number;
  minScore?: number;
  page?: number;
  limit?: number;
  sort?: 'score_desc' | 'name_asc' | 'orders_desc';
}

export interface StoreSupplierMatchOptions {
  categoryId?: number;
  minScore?: number;
  page?: number;
  limit?: number;
  sort?: 'score_desc' | 'rating_desc' | 'products_desc';
}

export class MarketplaceMatchingService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Helper to sanitize public store profile (Hides phone, email, national code, bank info, address, margins)
   */
  public static sanitizeStoreProfile(storeUser: any): Partial<SanitizedStoreMatch> {
    return {
      id: storeUser.id,
      storeName: storeUser.storeName || storeUser.brandName || storeUser.username || `فروشگاه کد ${storeUser.id}`,
      fieldOfActivity: storeUser.fieldOfActivity || storeUser.activityType || 'فروشگاه عمومی',
      activityType: storeUser.activityType || 'آنلاین شاپ',
      platformType: storeUser.platformType || 'سایت / اینستاگرام',
      province: storeUser.province || '',
      city: storeUser.city || '',
      avatarUrl: storeUser.avatarUrl || ''
    };
  }

  /**
   * Helper to sanitize public supplier profile (Hides phone, email, national code, bank info, address, margins)
   */
  public static sanitizeSupplierProfile(supplierUser: any): Partial<SanitizedSupplierMatch> {
    return {
      id: supplierUser.id,
      brandName: supplierUser.brandName || supplierUser.username || `تأمین‌کننده کد ${supplierUser.id}`,
      username: supplierUser.username,
      performanceScore: supplierUser.performanceScore ?? 100,
      warningLevel: supplierUser.warningLevel || 'NONE',
      province: supplierUser.province || '',
      city: supplierUser.city || '',
      avatarUrl: supplierUser.avatarUrl || ''
    };
  }

  /**
   * SUPPLIER → STORE MATCHING
   * Find matching stores for a supplier's product(s)
   */
  async getMatchingStoresForSupplier(supplierId: number, options: SupplierMatchOptions = {}): Promise<{
    matches: SanitizedStoreMatch[];
    total: number;
    page: number;
    limit: number;
    evaluatedProduct?: { id: number; name: string };
  }> {
    const {
      productId,
      categoryId,
      minScore = 30,
      page = 1,
      limit = 10,
      sort = 'score_desc'
    } = options;

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));

    // 1. Verify supplier status & products
    const supplier = await this.prisma.user.findUnique({
      where: { id: supplierId },
      select: { id: true, role: true, status: true }
    });

    if (!supplier || supplier.role !== 'SUPPLIER' || supplier.status !== 'ACTIVE') {
      throw new Error('تأمین‌کننده معتبر یا فعال نیست');
    }

    // 2. Load supplier products (published only)
    const productWhere: any = {
      supplierId,
      status: 'PUBLISHED'
    };

    if (productId && !isNaN(productId)) {
      productWhere.id = productId;
    } else if (categoryId && !isNaN(categoryId)) {
      productWhere.categoryId = categoryId;
    }

    const supplierProducts = await this.prisma.product.findMany({
      where: productWhere,
      include: {
        category: { select: { id: true, name: true } },
        images: { take: 1, select: { url: true } },
        _count: { select: { orderItems: true, storeProductSelections: true } }
      }
    });

    if (supplierProducts.length === 0) {
      return { matches: [], total: 0, page: safePage, limit: safeLimit };
    }

    // Target product evaluated
    const primaryProduct = productId
      ? supplierProducts.find(p => p.id === productId) || supplierProducts[0]
      : supplierProducts[0];

    // 3. Fetch candidate stores (Active store users)
    const candidateStores = await this.prisma.user.findMany({
      where: {
        role: 'STORE',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        username: true,
        storeName: true,
        brandName: true,
        activityType: true,
        fieldOfActivity: true,
        platformType: true,
        province: true,
        city: true,
        avatarUrl: true,
        storeProductSelections: {
          take: 50,
          select: {
            productId: true,
            product: { select: { categoryId: true, supplierId: true, supplierBasePrice: true } }
          }
        },
        orders: {
          take: 30,
          select: {
            id: true,
            createdAt: true,
            items: {
              select: { productId: true, price: true, product: { select: { categoryId: true } } }
            }
          }
        }
      }
    });

    // 4. Calculate Match Score for each candidate Store
    const matches: SanitizedStoreMatch[] = [];

    for (const store of candidateStores) {
      // Evaluate store matching signals against supplier products
      const storeCategoryIds = new Set<number>();
      const storeSupplierIds = new Set<number>();
      const pricePoints: number[] = [];
      let totalStoreOrders = store.orders.length;

      store.storeProductSelections.forEach(s => {
        if (s.product) {
          if (s.product.categoryId) storeCategoryIds.add(s.product.categoryId);
          if (s.product.supplierId) storeSupplierIds.add(s.product.supplierId);
          if (s.product.supplierBasePrice) pricePoints.push(s.product.supplierBasePrice);
        }
      });

      store.orders.forEach(o => {
        o.items.forEach(it => {
          if (it.product?.categoryId) storeCategoryIds.add(it.product.categoryId);
          if (it.price) pricePoints.push(it.price);
        });
      });

      const avgStorePrice = pricePoints.length > 0
        ? pricePoints.reduce((a, b) => a + b, 0) / pricePoints.length
        : 0;

      // Find best matching product among supplier products for this store
      let bestScore = 0;
      let bestMatchingProduct = primaryProduct;
      let bestReasons: string[] = [];

      for (const prod of supplierProducts) {
        let categoryFit = 0;
        let activityFit = 0;
        let productAffinity = 0;
        let priceFit = 0;
        let supplyFit = 0;
        const reasons: string[] = [];

        // Category Fit
        if (prod.categoryId && storeCategoryIds.has(prod.categoryId)) {
          categoryFit = 25;
          reasons.push('CATEGORY_MATCH');
        } else if (store.fieldOfActivity || store.activityType) {
          const act = `${store.fieldOfActivity || ''} ${store.activityType || ''}`.toLowerCase();
          const catName = (prod.category?.name || '').toLowerCase();
          if (catName && act.includes(catName)) {
            categoryFit = 22;
            reasons.push('CATEGORY_MATCH');
          } else {
            categoryFit = 12; // Cold start baseline
          }
        } else {
          categoryFit = 10;
        }

        // Store Activity Match
        if (totalStoreOrders >= 10) {
          activityFit = 20;
          reasons.push('STORE_ACTIVITY_MATCH');
        } else if (totalStoreOrders >= 2 || store.storeProductSelections.length >= 5) {
          activityFit = 15;
          reasons.push('STORE_ACTIVITY_MATCH');
        } else {
          activityFit = 8;
        }

        // Product Affinity & Demand
        if (storeSupplierIds.has(prod.supplierId)) {
          productAffinity += 15;
          reasons.push('PRODUCT_AFFINITY');
        }
        if ((prod._count?.orderItems || 0) >= 5 || (prod._count?.storeProductSelections || 0) >= 5) {
          productAffinity += 10;
          reasons.push('HIGH_DEMAND');
        } else {
          productAffinity += 5;
        }

        // Price Fit
        const prodPrice = prod.supplierBasePrice || 0;
        if (avgStorePrice > 0 && prodPrice > 0) {
          const ratio = prodPrice / avgStorePrice;
          if (ratio >= 0.5 && ratio <= 2.0) {
            priceFit = 15;
            reasons.push('PRICE_MATCH');
          } else if (ratio >= 0.25 && ratio <= 3.5) {
            priceFit = 10;
          } else {
            priceFit = 5;
          }
        } else {
          priceFit = 10; // Baseline
        }

        // Supply Reliability & Inventory
        if (prod.inventory >= 10) {
          supplyFit += 10;
          reasons.push('STRONG_INVENTORY');
        } else if (prod.inventory >= 1) {
          supplyFit += 5;
        } else {
          supplyFit -= 20; // Out of stock
        }

        const score = Math.max(0, Math.min(100, Math.round(categoryFit + activityFit + productAffinity + priceFit + supplyFit)));

        if (score > bestScore) {
          bestScore = score;
          bestMatchingProduct = prod;
          bestReasons = reasons;
        }
      }

      if (bestScore >= minScore) {
        const uniqueReasonCodes = Array.from(new Set(bestReasons));
        const matchReasons = uniqueReasonCodes.map(code => MATCHING_REASON_DICTIONARY[code] || {
          code,
          title: 'تناسب با فروشگاه',
          description: 'همخوانی عالی با پتانسیل بازار فروشگاه'
        });

        const primaryReasonObj = matchReasons[0] || MATCHING_REASON_DICTIONARY.CATEGORY_MATCH;

        matches.push({
          ...MarketplaceMatchingService.sanitizeStoreProfile(store) as SanitizedStoreMatch,
          matchScore: bestScore,
          matchReasons,
          primaryReason: primaryReasonObj.description,
          relevantProduct: {
            id: bestMatchingProduct.id,
            name: bestMatchingProduct.name,
            imageUrl: bestMatchingProduct.images?.[0]?.url || (bestMatchingProduct as any).imageUrl || '',
            categoryName: bestMatchingProduct.category?.name || 'عمومی',
            supplierBasePrice: bestMatchingProduct.supplierBasePrice || 0
          },
          actionCTA: 'مشاهده فرصت'
        });
      }
    }

    // Sort
    if (sort === 'score_desc') {
      matches.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sort === 'name_asc') {
      matches.sort((a, b) => a.storeName.localeCompare(b.storeName, 'fa'));
    }

    // Pagination
    const total = matches.length;
    const startIndex = (safePage - 1) * safeLimit;
    const paginatedMatches = matches.slice(startIndex, startIndex + safeLimit);

    return {
      matches: paginatedMatches,
      total,
      page: safePage,
      limit: safeLimit,
      evaluatedProduct: primaryProduct ? { id: primaryProduct.id, name: primaryProduct.name } : undefined
    };
  }

  /**
   * STORE → SUPPLIER MATCHING
   * Find matching suppliers for a store manager
   */
  async getMatchingSuppliersForStore(storeId: number, options: StoreSupplierMatchOptions = {}): Promise<{
    matches: SanitizedSupplierMatch[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      categoryId,
      minScore = 30,
      page = 1,
      limit = 10,
      sort = 'score_desc'
    } = options;

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));

    // 1. Get Store Profile using StoreRecommendationService
    const recService = new StoreRecommendationService(this.prisma);
    const storeProfile = await recService.getStoreProfile(storeId);

    if (!storeProfile.storeUser || storeProfile.storeUser.status !== 'ACTIVE') {
      throw new Error('فروشگاه معتبر یا فعال نیست');
    }

    // 2. Fetch Active Candidate Suppliers
    const candidateSuppliers = await this.prisma.user.findMany({
      where: {
        role: 'SUPPLIER',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        username: true,
        brandName: true,
        province: true,
        city: true,
        avatarUrl: true,
        performanceScore: true,
        penaltyPoints: true,
        warningLevel: true,
        products: {
          where: {
            status: 'PUBLISHED',
            inventory: { gt: 0 },
            ...(categoryId && !isNaN(categoryId) ? { categoryId } : {})
          },
          take: 20,
          include: {
            category: { select: { id: true, name: true } },
            images: { take: 1, select: { url: true } },
            _count: { select: { orderItems: true, storeProductSelections: true } }
          }
        }
      }
    });

    const matches: SanitizedSupplierMatch[] = [];

    for (const supp of candidateSuppliers) {
      if (supp.products.length === 0) continue;

      // Calculate matching metrics for each supplier product
      const supplierCategories = new Set<string>();
      const scoredProducts: Array<any> = [];
      const supplierReasons: string[] = [];

      for (const prod of supp.products) {
        if (prod.category?.name) supplierCategories.add(prod.category.name);

        const scoreRes = recService.calculateProductScore(prod, storeProfile);
        scoredProducts.push({
          id: prod.id,
          name: prod.name,
          imageUrl: prod.images?.[0]?.url || (prod as any).imageUrl || '',
          categoryName: prod.category?.name || 'عمومی',
          supplierBasePrice: prod.supplierBasePrice,
          inventory: prod.inventory,
          matchScore: scoreRes.score,
          reasonCodes: scoreRes.reasonCodes
        });

        scoreRes.reasonCodes.forEach(rc => supplierReasons.push(rc));
      }

      // Sort supplier's products by matchScore
      scoredProducts.sort((a, b) => b.matchScore - a.matchScore);
      const topProducts = scoredProducts.slice(0, 3);

      // Supplier level match score calculation
      const avgTopScore = topProducts.length > 0
        ? topProducts.reduce((acc, p) => acc + p.matchScore, 0) / topProducts.length
        : 0;

      let supplierScoreBonus = 0;
      if (supp.performanceScore >= 90 && supp.penaltyPoints === 0) {
        supplierScoreBonus += 10;
        supplierReasons.push('HIGH_SUPPLIER_SCORE');
        supplierReasons.push('FULFILLMENT_RELIABILITY');
      }

      const overallMatchScore = Math.max(0, Math.min(100, Math.round(avgTopScore + supplierScoreBonus)));

      if (overallMatchScore >= minScore) {
        const uniqueReasonCodes = Array.from(new Set(supplierReasons));
        const matchReasons = uniqueReasonCodes.map(code => MATCHING_REASON_DICTIONARY[code] || {
          code,
          title: 'همخوانی با تأمین‌کننده',
          description: 'کیفیت و تنوع مناسب کالایی برای توسعه فروشگاه شما'
        });

        const primaryReasonObj = matchReasons[0] || MATCHING_REASON_DICTIONARY.HIGH_SUPPLIER_SCORE;

        matches.push({
          ...MarketplaceMatchingService.sanitizeSupplierProfile(supp) as SanitizedSupplierMatch,
          categories: Array.from(supplierCategories),
          productCount: supp.products.length,
          matchScore: overallMatchScore,
          matchReasons,
          primaryReason: primaryReasonObj.description,
          topProducts,
          actionCTA: 'مشاهده محصولات'
        });
      }
    }

    // Sort
    if (sort === 'score_desc') {
      matches.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sort === 'rating_desc') {
      matches.sort((a, b) => b.performanceScore - a.performanceScore);
    } else if (sort === 'products_desc') {
      matches.sort((a, b) => b.productCount - a.productCount);
    }

    // Pagination
    const total = matches.length;
    const startIndex = (safePage - 1) * safeLimit;
    const paginatedMatches = matches.slice(startIndex, startIndex + safeLimit);

    return {
      matches: paginatedMatches,
      total,
      page: safePage,
      limit: safeLimit
    };
  }

  /**
   * Track match interaction (impression, click, product view, import)
   */
  async trackMatchInteraction(
    userId: number,
    eventType: 'match_impression' | 'match_click' | 'match_product_view' | 'match_import',
    targetEntity: { targetType: 'STORE' | 'SUPPLIER' | 'PRODUCT'; targetId: number; metadata?: any }
  ) {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId,
          action: `MATCH_EVENT:${eventType.toUpperCase()}`,
          details: JSON.stringify({
            eventType,
            targetType: targetEntity.targetType,
            targetId: targetEntity.targetId,
            timestamp: new Date().toISOString(),
            ...(targetEntity.metadata || {})
          })
        }
      });
      return { success: true };
    } catch (err) {
      console.error('Error tracking match interaction:', err);
      return { success: false };
    }
  }
}
