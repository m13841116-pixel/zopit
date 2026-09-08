import { PrismaClient } from '@prisma/client';
import { MarketplaceMatchingService } from './MarketplaceMatchingService.js';

export type OpportunityType =
  | 'HIGH_DEMAND'
  | 'HIGH_STORE_INTEREST'
  | 'RISING'
  | 'LOW_STOCK_RISK'
  | 'STRONG_MATCH'
  | 'NEW_OPPORTUNITY'
  | 'LOW_PERFORMANCE'
  | 'INVENTORY_OPPORTUNITY';

export type DemandLevel = 'HIGH' | 'RISING' | 'MODERATE' | 'NEEDS_REVIEW';

export interface DemandLevelDetail {
  code: DemandLevel;
  label: string;
}

export const DEMAND_LEVEL_MAP: Record<DemandLevel, DemandLevelDetail> = {
  HIGH: { code: 'HIGH', label: 'تقاضای بالا' },
  RISING: { code: 'RISING', label: 'تقاضای رو به رشد' },
  MODERATE: { code: 'MODERATE', label: 'تقاضای متوسط' },
  NEEDS_REVIEW: { code: 'NEEDS_REVIEW', label: 'نیازمند بررسی' }
};

export interface ContentQualityDetail {
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface ActionableRecommendation {
  type: OpportunityType;
  priority: 'HIGH' | 'MEDIUM' | 'NORMAL';
  title: string;
  description: string;
  actionLabel: string;
  targetTab?: string;
  targetUrl?: string;
}

export interface ProductOpportunityResult {
  productId: number;
  productName: string;
  imageUrl?: string;
  categoryName: string;
  supplierBasePrice: number;
  inventory: number;
  status: string;
  createdAt: Date;

  opportunityScore: number;
  primaryOpportunityType: OpportunityType;
  opportunityTypes: OpportunityType[];
  demandLevel: DemandLevelDetail;

  salesVelocity: {
    recent30DaysUnits: number;
    previous30DaysUnits: number;
    growthRatePercent: number;
    recentSalesCount: number;
  };

  storeInterest: {
    totalStoreSelections: number;
    activeOrderingStores: number;
    activityLogInteractions: number;
  };

  inventoryHealth: {
    stock: number;
    isLowStock: boolean;
    isOutOfStock: boolean;
    restockRecommended: boolean;
  };

  storeMatchOpportunity: {
    matchingStoreCount: number;
    summary: string;
  };

  contentQuality: ContentQualityDetail;
  recommendedAction: ActionableRecommendation;

  primaryReason: string;
  opportunityHighlights: string[];
}

export interface SupplierOpportunitySummary {
  supplierId: number;
  totalProducts: number;
  evaluatedProducts: number;
  averageOpportunityScore: number;
  highOpportunityCount: number;
  risingCount: number;
  lowStockRiskCount: number;
  topOpportunities?: ProductOpportunityResult[];
}

export interface SupplierOpportunityQueryOptions {
  categoryId?: number;
  opportunityType?: OpportunityType;
  minScore?: number;
  page?: number;
  limit?: number;
  sort?: 'score_desc' | 'interest_desc' | 'sales_desc' | 'stock_asc';
}

export class ProductOpportunityService {
  private prisma: any;
  private matchingService: MarketplaceMatchingService;

  constructor(prismaClient: any) {
    this.prisma = prismaClient;
    this.matchingService = new MarketplaceMatchingService(prismaClient);
  }

  /**
   * Calculate Content Quality for a Product
   */
  public evaluateContentQuality(product: any): ContentQualityDetail {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const hasImage = Boolean(
      (product.images && product.images.length > 0) ||
      product.imageUrl
    );

    if (!hasImage) {
      score -= 35;
      issues.push('MISSING_IMAGE');
      suggestions.push('تصویر باکیفیت و جذاب برای محصول بارگذاری کنید.');
    }

    if (!product.name || product.name.trim().length < 8) {
      score -= 20;
      issues.push('SHORT_TITLE');
      suggestions.push('عنوان محصول را توصیفی‌تر و کامل‌تر کنید (حداقل ۸ کاراکتر).');
    }

    const descLength = (product.longDescription || product.shortDescription || '').trim().length;
    if (descLength < 30) {
      score -= 25;
      issues.push('WEAK_DESCRIPTION');
      suggestions.push('توضیحات و مشخصات کاربردی محصول را کامل‌تر کنید.');
    }

    if (!product.technicalSpecs && (!product.variants || product.variants.length === 0)) {
      score -= 20;
      issues.push('NO_SPECS_OR_VARIANTS');
      suggestions.push('مشخصات فنی یا تنوع‌های رنگ/سایز محصول را وارد کنید.');
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }

  /**
   * Analyze a single product's opportunity metrics
   */
  public async analyzeProductOpportunity(productId: number, supplierId?: number): Promise<ProductOpportunityResult> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { id: true, name: true } },
        images: { take: 1, select: { url: true } },
        variants: { select: { id: true, attributes: true, stock: true } },
        storeProductSelections: {
          select: { id: true, storeId: true, createdAt: true }
        },
        orderItems: {
          include: {
            order: { select: { id: true, createdAt: true, status: true, storeId: true } }
          }
        }
      }
    });

    if (!product) {
      throw new Error('محصول مورد نظر یافت نشد');
    }

    if (supplierId && product.supplierId !== supplierId) {
      throw new Error('شما دسترسی به اطلاعات این محصول را ندارید');
    }

    if (product.status !== 'PUBLISHED') {
      throw new Error('ارزیابی فرصت فقط برای محصولات منتشرشده امکان‌پذیر است');
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. Sales Velocity Calculations
    let recent30DaysUnits = 0;
    let recentSalesCount = 0;
    let previous30DaysUnits = 0;
    const orderingStoreIds = new Set<number>();

    for (const item of product.orderItems || []) {
      const orderDate = new Date(item.order?.createdAt || item.createdAt || now);
      const status = item.order?.status || item.status;
      if (status === 'REJECTED' || status === 'CANCELLED') continue;

      const qty = Number(item.quantity || 1);
      if (item.order?.storeId) orderingStoreIds.add(item.order.storeId);

      if (orderDate >= thirtyDaysAgo) {
        recent30DaysUnits += qty;
        recentSalesCount++;
      } else if (orderDate >= sixtyDaysAgo) {
        previous30DaysUnits += qty;
      }
    }

    let growthRatePercent = 0;
    if (previous30DaysUnits > 0) {
      growthRatePercent = Math.round(((recent30DaysUnits - previous30DaysUnits) / previous30DaysUnits) * 100);
    } else if (recent30DaysUnits > 0) {
      growthRatePercent = 100;
    }

    // 2. Store Interest Signals
    const totalStoreSelections = (product.storeProductSelections || []).length;
    const activeOrderingStores = orderingStoreIds.size;

    // Fetch activity log interactions for this product if recorded
    let activityLogInteractions = 0;
    try {
      if (this.prisma.activityLog) {
        activityLogInteractions = await this.prisma.activityLog.count({
          where: {
            details: { contains: `"targetId":${productId}` }
          }
        });
      }
    } catch {
      activityLogInteractions = 0;
    }

    // 3. Store Match Opportunities (Prompt 14 Integration)
    let matchingStoreCount = 0;
    try {
      const matchRes = await this.matchingService.getMatchingStoresForSupplier(product.supplierId, {
        productId: product.id,
        limit: 50,
        minScore: 25
      });
      matchingStoreCount = matchRes.total;
    } catch {
      matchingStoreCount = 0;
    }

    // 4. Content Quality
    const contentQuality = this.evaluateContentQuality(product);

    // 5. Centralized Opportunity Score Calculation (0 - 100)
    // A) Store Interest Sub-score (max 25)
    let interestSubScore = Math.min(20, totalStoreSelections * 3) + Math.min(5, activityLogInteractions);

    // B) Sales Velocity Sub-score (max 25)
    let velocitySubScore = Math.min(15, recent30DaysUnits * 3);
    if (growthRatePercent >= 20 && recent30DaysUnits >= 2) velocitySubScore += 10;
    else if (growthRatePercent > 0) velocitySubScore += 5;

    // C) Demand Frequency & Store Breadth (max 15)
    let demandSubScore = Math.min(15, activeOrderingStores * 5);

    // D) Inventory Health & Restock Urgency (max 15)
    let inventorySubScore = 0;
    const currentStock = product.inventory || 0;
    if (currentStock >= 10) {
      inventorySubScore = 15;
    } else if (currentStock >= 1) {
      inventorySubScore = 10;
    } else {
      inventorySubScore = 0; // Out of stock
    }

    // E) Store Match Potential (max 10)
    let matchSubScore = Math.min(10, matchingStoreCount * 2);

    // F) Content Quality (max 10)
    let contentSubScore = Math.round((contentQuality.score / 100) * 10);

    const rawOpportunityScore = interestSubScore + velocitySubScore + demandSubScore + inventorySubScore + matchSubScore + contentSubScore;
    const opportunityScore = Math.max(0, Math.min(100, Math.round(rawOpportunityScore)));

    // 6. Identify Opportunity Types
    const opportunityTypes: OpportunityType[] = [];
    const isLowStock = currentStock < 5;
    const isOutOfStock = currentStock === 0;
    const isNew = new Date(product.createdAt).getTime() > (now.getTime() - 14 * 24 * 60 * 60 * 1000);

    if (isLowStock && (totalStoreSelections >= 3 || recent30DaysUnits >= 2)) {
      opportunityTypes.push('LOW_STOCK_RISK');
      opportunityTypes.push('INVENTORY_OPPORTUNITY');
    }

    if (recent30DaysUnits >= 5 || (recent30DaysUnits >= 2 && activeOrderingStores >= 2)) {
      opportunityTypes.push('HIGH_DEMAND');
    }

    if (growthRatePercent >= 20 && recent30DaysUnits >= 2) {
      opportunityTypes.push('RISING');
    }

    if (totalStoreSelections >= 4) {
      opportunityTypes.push('HIGH_STORE_INTEREST');
    }

    if (matchingStoreCount >= 4) {
      opportunityTypes.push('STRONG_MATCH');
    }

    if (isNew && (totalStoreSelections >= 1 || opportunityScore >= 40)) {
      opportunityTypes.push('NEW_OPPORTUNITY');
    }

    if (!isNew && totalStoreSelections < 2 && recent30DaysUnits === 0) {
      opportunityTypes.push('LOW_PERFORMANCE');
    }

    // Fallback primary type
    let primaryOpportunityType: OpportunityType = 'HIGH_DEMAND';
    if (opportunityTypes.includes('LOW_STOCK_RISK')) primaryOpportunityType = 'LOW_STOCK_RISK';
    else if (opportunityTypes.includes('HIGH_DEMAND')) primaryOpportunityType = 'HIGH_DEMAND';
    else if (opportunityTypes.includes('RISING')) primaryOpportunityType = 'RISING';
    else if (opportunityTypes.includes('HIGH_STORE_INTEREST')) primaryOpportunityType = 'HIGH_STORE_INTEREST';
    else if (opportunityTypes.includes('INVENTORY_OPPORTUNITY')) primaryOpportunityType = 'INVENTORY_OPPORTUNITY';
    else if (opportunityTypes.includes('STRONG_MATCH')) primaryOpportunityType = 'STRONG_MATCH';
    else if (opportunityTypes.includes('NEW_OPPORTUNITY')) primaryOpportunityType = 'NEW_OPPORTUNITY';
    else if (opportunityTypes.includes('LOW_PERFORMANCE')) primaryOpportunityType = 'LOW_PERFORMANCE';
    else primaryOpportunityType = 'STRONG_MATCH';

    // 7. Demand Level
    let demandLevelCode: DemandLevel = 'MODERATE';
    if (opportunityScore >= 75 || primaryOpportunityType === 'HIGH_DEMAND') {
      demandLevelCode = 'HIGH';
    } else if (opportunityScore >= 55 || primaryOpportunityType === 'RISING') {
      demandLevelCode = 'RISING';
    } else if (opportunityScore < 40 || primaryOpportunityType === 'LOW_PERFORMANCE') {
      demandLevelCode = 'NEEDS_REVIEW';
    } else {
      demandLevelCode = 'MODERATE';
    }
    const demandLevel = DEMAND_LEVEL_MAP[demandLevelCode];

    // 8. Actionable Recommendation Mapping
    let recommendedAction: ActionableRecommendation;

    switch (primaryOpportunityType) {
      case 'LOW_STOCK_RISK':
      case 'INVENTORY_OPPORTUNITY':
        recommendedAction = {
          type: primaryOpportunityType,
          priority: 'HIGH',
          title: 'افزایش فوری موجودی انبار',
          description: `این محصول توسط ${totalStoreSelections} فروشگاه انتخاب شده اما موجودی آن (${currentStock} عدد) در شرف اتمام است.`,
          actionLabel: 'موجودی را افزایش دهید',
          targetTab: 'products'
        };
        break;
      case 'HIGH_DEMAND':
        recommendedAction = {
          type: 'HIGH_DEMAND',
          priority: 'HIGH',
          title: 'تأمین پایدار محصول پرفروش',
          description: 'تقاضای ثبت سفارش بالا است. موجودی انبار را همیشه شارژ نگه‌دارید.',
          actionLabel: 'مدیریت موجودی کالا',
          targetTab: 'products'
        };
        break;
      case 'RISING':
        recommendedAction = {
          type: 'RISING',
          priority: 'HIGH',
          title: 'تقاضا رو به رشد است',
          description: `فروش این محصول در ۳۰ روز اخیر ${growthRatePercent}% رشد داشته است. ظرفیت تأمین را توسعه دهید.`,
          actionLabel: 'توسعه ظرفیت تأمین',
          targetTab: 'products'
        };
        break;
      case 'HIGH_STORE_INTEREST':
        recommendedAction = {
          type: 'HIGH_STORE_INTEREST',
          priority: 'MEDIUM',
          title: 'استقبال بالای آنلاین‌شاپ‌ها',
          description: `${totalStoreSelections} فروشگاه این محصول را به ویترین خود افزوده‌اند. ارسال سریع و قیمت رقابتی بگذارید.`,
          actionLabel: 'مشاهده فروشگاه‌های دارنده کالا',
          targetTab: 'store-matches'
        };
        break;
      case 'STRONG_MATCH':
        recommendedAction = {
          type: 'STRONG_MATCH',
          priority: 'MEDIUM',
          title: 'بازار هدف آماده برای فروش',
          description: `این محصول برای ${matchingStoreCount} فروشگاه فعال همخوانی عالی دارد.`,
          actionLabel: 'مشاهده فروشگاه‌های مناسب',
          targetTab: 'store-matches'
        };
        break;
      case 'LOW_PERFORMANCE':
        recommendedAction = {
          type: 'LOW_PERFORMANCE',
          priority: 'MEDIUM',
          title: 'نیازمند بهینه‌سازی کالا',
          description: 'استقبال از این محصول پایین بوده است. تصویر، توضیحات و قیمت پایه را بررسی فرمایید.',
          actionLabel: 'ویرایش و اصلاح محصول',
          targetTab: 'products'
        };
        break;
      default:
        recommendedAction = {
          type: 'NEW_OPPORTUNITY',
          priority: 'NORMAL',
          title: 'معرفی بیشتر کالا به شبکه',
          description: 'محصول را به فروشگاه‌های پیشنهادی معرفی کنید تا فروش سریع‌تر آغاز شود.',
          actionLabel: 'معرفی به فروشگاه‌ها',
          targetTab: 'store-matches'
        };
    }

    // Highlights
    const opportunityHighlights: string[] = [];
    if (totalStoreSelections > 0) {
      opportunityHighlights.push(`توسط ${totalStoreSelections} فروشگاه فعال انتخاب شده است`);
    }
    if (recent30DaysUnits > 0) {
      opportunityHighlights.push(`${recent30DaysUnits} عدد فروش در ۳۰ روز اخیر`);
    }
    if (matchingStoreCount > 0) {
      opportunityHighlights.push(`تناسب بالا با ${matchingStoreCount} آنلاین‌شاپ در شبکه Zopit`);
    }

    const firstImg = product.images?.[0]?.url || (product as any).imageUrl || '';

    return {
      productId: product.id,
      productName: product.name,
      imageUrl: firstImg,
      categoryName: product.category?.name || 'عمومی',
      supplierBasePrice: product.supplierBasePrice,
      inventory: product.inventory,
      status: product.status,
      createdAt: product.createdAt,

      opportunityScore,
      primaryOpportunityType,
      opportunityTypes,
      demandLevel,

      salesVelocity: {
        recent30DaysUnits,
        previous30DaysUnits,
        growthRatePercent,
        recentSalesCount
      },

      storeInterest: {
        totalStoreSelections,
        activeOrderingStores,
        activityLogInteractions
      },

      inventoryHealth: {
        stock: currentStock,
        isLowStock,
        isOutOfStock,
        restockRecommended: isLowStock || isOutOfStock
      },

      storeMatchOpportunity: {
        matchingStoreCount,
        summary: matchingStoreCount > 0
          ? `این محصول برای ${matchingStoreCount} فروشگاه تناسب بالایی دارد.`
          : 'هنوز فروشگاه منطبقی برای این دسته ثبت نشده است.'
      },

      contentQuality,
      recommendedAction,

      primaryReason: recommendedAction.description,
      opportunityHighlights
    };
  }

  /**
   * Get all product opportunities for a supplier with filters and pagination
   */
  public async getSupplierProductOpportunities(
    supplierId: number,
    options: SupplierOpportunityQueryOptions = {}
  ): Promise<{
    opportunities: ProductOpportunityResult[];
    summary: SupplierOpportunitySummary;
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      categoryId,
      opportunityType,
      minScore = 0,
      page = 1,
      limit = 10,
      sort = 'score_desc'
    } = options;

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));

    // Verify supplier
    const supplier = await this.prisma.user.findUnique({
      where: { id: supplierId },
      select: { id: true, role: true, status: true }
    });

    if (!supplier || supplier.role !== 'SUPPLIER' || supplier.status !== 'ACTIVE') {
      throw new Error('تأمین‌کننده معتبر یا فعال نیست');
    }

    // Fetch supplier published products
    const productWhere: any = {
      supplierId,
      status: 'PUBLISHED'
    };

    if (categoryId && !isNaN(categoryId)) {
      productWhere.categoryId = categoryId;
    }

    const products = await this.prisma.product.findMany({
      where: productWhere,
      select: { id: true }
    });

    const evaluatedList: ProductOpportunityResult[] = [];

    for (const p of products) {
      try {
        const opp = await this.analyzeProductOpportunity(p.id, supplierId);

        // Filters
        if (opp.opportunityScore < minScore) continue;
        if (opportunityType && !opp.opportunityTypes.includes(opportunityType)) continue;

        evaluatedList.push(opp);
      } catch (err) {
        console.error(`Error analyzing product #${p.id}:`, err);
      }
    }

    // Sorting
    if (sort === 'score_desc') {
      evaluatedList.sort((a, b) => b.opportunityScore - a.opportunityScore);
    } else if (sort === 'interest_desc') {
      evaluatedList.sort((a, b) => b.storeInterest.totalStoreSelections - a.storeInterest.totalStoreSelections);
    } else if (sort === 'sales_desc') {
      evaluatedList.sort((a, b) => b.salesVelocity.recent30DaysUnits - a.salesVelocity.recent30DaysUnits);
    } else if (sort === 'stock_asc') {
      evaluatedList.sort((a, b) => a.inventory - b.inventory);
    }

    // Summary calculation
    const totalCount = evaluatedList.length;
    const avgScore = totalCount > 0
      ? Math.round(evaluatedList.reduce((acc, curr) => acc + curr.opportunityScore, 0) / totalCount)
      : 0;

    const highOpportunityCount = evaluatedList.filter(o => o.opportunityScore >= 70).length;
    const risingCount = evaluatedList.filter(o => o.opportunityTypes.includes('RISING')).length;
    const lowStockRiskCount = evaluatedList.filter(o => o.inventoryHealth.isLowStock).length;

    const summary: SupplierOpportunitySummary = {
      supplierId,
      totalProducts: products.length,
      evaluatedProducts: totalCount,
      averageOpportunityScore: avgScore,
      highOpportunityCount,
      risingCount,
      lowStockRiskCount,
      topOpportunities: evaluatedList.slice(0, 3)
    };

    // Pagination
    const startIndex = (safePage - 1) * safeLimit;
    const paginated = evaluatedList.slice(startIndex, startIndex + safeLimit);

    return {
      opportunities: paginated,
      summary,
      total: totalCount,
      page: safePage,
      limit: safeLimit
    };
  }

  /**
   * Admin Aggregate Visibility across all suppliers
   */
  public async getAdminProductOpportunitiesOverview() {
    const publishedProducts = await this.prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      take: 100,
      select: { id: true }
    });

    const evaluatedList: ProductOpportunityResult[] = [];

    for (const p of publishedProducts) {
      try {
        const opp = await this.analyzeProductOpportunity(p.id);
        evaluatedList.push(opp);
      } catch {
        // Skip
      }
    }

    evaluatedList.sort((a, b) => b.opportunityScore - a.opportunityScore);

    const topOpportunities = evaluatedList.slice(0, 10);
    const lowStockHighDemand = evaluatedList.filter(o => o.inventoryHealth.isLowStock && o.opportunityScore >= 60);

    return {
      totalEvaluated: evaluatedList.length,
      averageOpportunityScore: evaluatedList.length > 0
        ? Math.round(evaluatedList.reduce((a, b) => a + b.opportunityScore, 0) / evaluatedList.length)
        : 0,
      highOpportunityCount: evaluatedList.filter(o => o.opportunityScore >= 70).length,
      lowStockRiskCount: lowStockHighDemand.length,
      topOpportunities,
      lowStockHighDemand
    };
  }

  /**
   * Analytics event tracking helper
   */
  public async trackOpportunityInteraction(
    userId: number,
    eventType: 'opportunity_impression' | 'opportunity_click' | 'opportunity_action',
    productId: number,
    metadata?: any
  ) {
    try {
      if (this.prisma.activityLog) {
        await this.prisma.activityLog.create({
          data: {
            userId,
            action: `OPPORTUNITY_EVENT:${eventType.toUpperCase()}`,
            details: JSON.stringify({
              eventType,
              productId,
              timestamp: new Date().toISOString(),
              ...(metadata || {})
            })
          }
        });
      }
      return { success: true };
    } catch (err) {
      console.error('Error tracking opportunity interaction:', err);
      return { success: false };
    }
  }
}
