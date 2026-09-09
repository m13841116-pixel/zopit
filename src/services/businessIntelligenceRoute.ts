import { Express, Request, Response } from 'express';

/**
 * Zopit Business Intelligence & Growth Analytics Service
 * 
 * Provides server-authoritative, highly performant BI analytics, funnel metrics,
 * revenue stream breakdowns, daily target tracking, contribution rankings, and deterministic insights.
 */

export function parseDateRange(range: string, startDate?: string, endDate?: string): { start: Date; end: Date } {
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  let start = new Date();
  if (startDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
  } else {
    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case '90days':
        start.setDate(start.getDate() - 90);
        start.setHours(0, 0, 0, 0);
        break;
      case '30days':
      default:
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
    }
  }

  return { start, end };
}

export function registerBusinessIntelligenceRoutes(
  app: Express,
  prisma: any,
  authenticateToken: any,
  requireStoreManager: any,
  requireSupplier: any,
  requireAdmin: any
) {

  // =========================================================================
  // 1. ADMIN EXECUTIVE DASHBOARD & BI ANALYTICS
  // =========================================================================
  app.get('/api/admin/analytics/executive', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { range, startDate, endDate } = req.query as { range?: string; startDate?: string; endDate?: string };
      const { start, end } = parseDateRange(range || '30days', startDate, endDate);

      // Yesterday / Previous Period comparison dates
      const periodDurationMs = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - periodDurationMs);
      const prevEnd = new Date(start.getTime() - 1);

      // Active Suppliers & Active Stores
      const [
        activeSuppliersCount,
        activeStoresCount,
        totalProductsCount,
        publishedProductsCount,
        periodOrdersCount,
        prevPeriodOrdersCount
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'SUPPLIER', status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'STORE_MANAGER', status: 'ACTIVE' } }),
        prisma.product.count(),
        prisma.product.count({ where: { status: 'APPROVED' } }),
        prisma.order.count({
          where: {
            createdAt: { gte: start, lte: end },
            status: { notIn: ['CANCELLED', 'REFUNDED'] }
          }
        }),
        prisma.order.count({
          where: {
            createdAt: { gte: prevStart, lte: prevEnd },
            status: { notIn: ['CANCELLED', 'REFUNDED'] }
          }
        })
      ]);

      // GMV & Zopit Transaction Profit in selected period
      const currentOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: ['CANCELLED', 'REFUNDED'] }
        },
        select: {
          id: true,
          totalPrice: true,
          items: {
            select: {
              quantity: true,
              price: true,
              supplierPrice: true
            }
          }
        }
      });

      let currentGMV = 0;
      let currentZopitTransactionProfit = 0;

      for (const ord of currentOrders) {
        currentGMV += (ord.totalPrice || 0);
        for (const item of (ord.items || [])) {
          const itemPrice = item.price || 0;
          const suppPrice = item.supplierPrice || 0;
          const qty = item.quantity || 1;
          const itemProfit = Math.max(0, itemPrice - suppPrice) * qty;
          currentZopitTransactionProfit += itemProfit;
        }
      }

      // Previous Period GMV
      const prevOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: prevStart, lte: prevEnd },
          status: { notIn: ['CANCELLED', 'REFUNDED'] }
        },
        select: { totalPrice: true }
      });
      const prevGMV = prevOrders.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);

      // Subscription Revenue (StoreInvoice / ProAccount)
      const subInvoices = await prisma.storeInvoice.aggregate({
        _sum: { amount: true },
        where: {
          status: 'PAID',
          paidAt: { gte: start, lte: end }
        }
      });
      const subscriptionRevenue = subInvoices._sum.amount || 0;

      // Featured Revenue (Banner / Featured placement)
      const bannerRevenueAggr = await prisma.banner.aggregate({
        _sum: { price: true },
        where: {
          status: 'ACTIVE',
          createdAt: { gte: start, lte: end }
        }
      });
      const featuredRevenue = bannerRevenueAggr._sum.price || 0;

      // Supplier Payouts
      const payoutsAggr = await prisma.settlement.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end }
        }
      });
      const supplierPayouts = payoutsAggr._sum.amount || 0;

      // Daily Profit vs 10M Toman Business Target
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { notIn: ['CANCELLED', 'REFUNDED'] }
        },
        select: {
          items: {
            select: { quantity: true, price: true, supplierPrice: true }
          }
        }
      });

      let todayZopitProfit = 0;
      for (const ord of todayOrders) {
        for (const item of (ord.items || [])) {
          const itemProfit = Math.max(0, (item.price || 0) - (item.supplierPrice || 0)) * (item.quantity || 1);
          todayZopitProfit += itemProfit;
        }
      }

      const dailyTargetToman = 10000000; // 10 Million Toman
      const targetProgressPercentage = Math.min(100, Math.round((todayZopitProfit / dailyTargetToman) * 100));

      // Growth Calculations
      const dailyGrowth = prevPeriodOrdersCount > 0
        ? Math.round(((periodOrdersCount - prevPeriodOrdersCount) / prevPeriodOrdersCount) * 100)
        : (periodOrdersCount > 0 ? 100 : 0);

      const monthlyGrowth = prevGMV > 0
        ? Math.round(((currentGMV - prevGMV) / prevGMV) * 100)
        : (currentGMV > 0 ? 100 : 0);

      return res.json({
        success: true,
        metrics: {
          activeSuppliers: activeSuppliersCount,
          activeStores: activeStoresCount,
          products: totalProductsCount,
          publishedProducts: publishedProductsCount,
          orders: periodOrdersCount,
          gmv: currentGMV,
          zopitTransactionProfit: currentZopitTransactionProfit,
          subscriptionRevenue,
          featuredRevenue,
          supplierPayouts,
          dailyGrowth,
          monthlyGrowth,
          target: {
            todayProfit: todayZopitProfit,
            dailyTarget: dailyTargetToman,
            progressPercentage: targetProgressPercentage
          }
        }
      });
    } catch (err: any) {
      console.error('[Admin Executive BI API Error]:', err);
      return res.status(500).json({ error: 'خطا در دریافت شاخص‌های اجرایی داشبورد', success: false });
    }
  });

  // =========================================================================
  // 2. FUNNEL ANALYTICS (Core, Store, Supplier Funnels)
  // =========================================================================
  app.get('/api/admin/analytics/funnels', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      // 2a. Supplier Funnel Steps
      const [
        totalSuppliersRegistered,
        activeSuppliers,
        suppliersWithProduct,
        suppliersWithApprovedProduct,
        suppliersWithStoreImport,
        suppliersWithSale,
        activeSuppliersWithRecentShipments
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'SUPPLIER' } }),
        prisma.user.count({ where: { role: 'SUPPLIER', status: 'ACTIVE' } }),
        prisma.user.count({
          where: {
            role: 'SUPPLIER',
            products: { some: {} }
          }
        }),
        prisma.user.count({
          where: {
            role: 'SUPPLIER',
            products: { some: { status: 'APPROVED' } }
          }
        }),
        prisma.user.count({
          where: {
            role: 'SUPPLIER',
            products: {
              some: {
                storeSelections: { some: {} }
              }
            }
          }
        }),
        prisma.user.count({
          where: {
            role: 'SUPPLIER',
            products: {
              some: {
                orderItems: { some: {} }
              }
            }
          }
        }),
        prisma.user.count({
          where: {
            role: 'SUPPLIER',
            products: {
              some: {
                orderItems: {
                  some: {
                    order: {
                      status: 'COMPLETED',
                      createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) }
                    }
                  }
                }
              }
            }
          }
        })
      ]);

      // 2b. Store Funnel Steps
      const [
        totalStoresRegistered,
        subscribedStores,
        storesWithImports,
        storesWithActiveProducts,
        storesWithFirstOrder,
        storesWithRepeatOrders
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'STORE_MANAGER' } }),
        prisma.proAccount.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({
          where: {
            role: 'STORE_MANAGER',
            storeProductSelections: { some: {} }
          }
        }),
        prisma.user.count({
          where: {
            role: 'STORE_MANAGER',
            storeProductSelections: { some: { isSynced: true } }
          }
        }),
        prisma.user.count({
          where: {
            role: 'STORE_MANAGER',
            orders: { some: {} }
          }
        }),
        prisma.user.count({
          where: {
            role: 'STORE_MANAGER',
            orders: {
              some: {
                // Stores that placed more than 1 order
              }
            }
          }
        })
      ]);

      // Count repeat store buyers accurately
      const storeOrderCounts = await prisma.order.groupBy({
        by: ['userId'],
        where: { userId: { not: null } },
        _count: { id: true }
      });
      const actualRepeatStoresCount = storeOrderCounts.filter((s: any) => s._count.id > 1).length;

      // 2c. Core Platform Overview Funnel
      const coreFunnel = [
        { step: 'ثبت‌نام تامین‌کننده', count: totalSuppliersRegistered },
        { step: 'تامین‌کننده فعال', count: activeSuppliers },
        { step: 'ثبت اولین محصول', count: suppliersWithProduct },
        { step: 'تایید محصول', count: suppliersWithApprovedProduct },
        { step: 'کشف و واردسازی توسط فروشگاه', count: suppliersWithStoreImport },
        { step: 'فعالسازی محصول در فروشگاه', count: storesWithActiveProducts },
        { step: 'ثبت اولین فروش', count: suppliersWithSale },
        { step: 'فروش تکرارشونده و پایدار', count: actualRepeatStoresCount }
      ];

      return res.json({
        success: true,
        coreFunnel,
        supplierFunnel: {
          registered: totalSuppliersRegistered,
          onboardingCompleted: activeSuppliers,
          firstProduct: suppliersWithProduct,
          firstApproval: suppliersWithApprovedProduct,
          firstStoreImport: suppliersWithStoreImport,
          firstSale: suppliersWithSale,
          activeSupplier: activeSuppliersWithRecentShipments
        },
        storeFunnel: {
          registered: totalStoresRegistered,
          subscribed: subscribedStores,
          importedProduct: storesWithImports,
          activatedProduct: storesWithActiveProducts,
          firstOrder: storesWithFirstOrder,
          repeatOrder: actualRepeatStoresCount,
          targetProgress: totalStoresRegistered > 0 ? Math.round((storesWithFirstOrder / totalStoresRegistered) * 100) : 0,
          targetAchieved: actualRepeatStoresCount
        }
      });
    } catch (err: any) {
      console.error('[Funnel Analytics Error]:', err);
      return res.status(500).json({ error: 'خطا در محاسبه قیف‌های تبدیل پلتفرم', success: false });
    }
  });

  // =========================================================================
  // 3. PRODUCT PERFORMANCE & OPPORTUNITY SCORE ANALYTICS
  // =========================================================================
  app.get('/api/admin/analytics/products', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const products = await prisma.product.findMany({
        take: 50,
        orderBy: { viewCount: 'desc' },
        include: {
          supplier: { select: { id: true, brandName: true, performanceScore: true } },
          storeSelections: { select: { id: true } },
          orderItems: { select: { id: true, quantity: true, price: true } },
          wholesaleTiers: { select: { id: true } }
        }
      });

      const analytics = products.map((prod: any) => {
        const impressions = prod.viewCount || 0;
        const clicks = Math.round(impressions * 0.45); // Estimated click engagement
        const imports = prod.storeSelections?.length || 0;
        const orders = prod.orderItems?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
        
        // Conversion signal: ratio of orders to imports
        const conversionRate = imports > 0 ? Math.min(100, Math.round((orders / imports) * 100)) : 0;
        
        // Opportunity Score: High imports + good stock - high potential
        const opportunityScore = Math.min(100, Math.round((imports * 10) + (orders * 5) + (prod.inventory > 10 ? 20 : 0)));
        
        const supplierScore = prod.supplier?.performanceScore || 100;
        const isFeatured = Boolean(prod.featured || prod.isPromoted);

        return {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          brandName: prod.supplier?.brandName || 'تامین‌کننده زوپیت',
          supplierScore,
          impressions,
          clicks,
          imports,
          orders,
          conversionRate,
          opportunityScore,
          inventoryStatus: prod.inventory <= 0 ? 'OUT_OF_STOCK' : (prod.inventory < 10 ? 'LOW_STOCK' : 'IN_STOCK'),
          inventoryCount: prod.inventory || 0,
          isFeatured
        };
      });

      return res.json({
        success: true,
        count: analytics.length,
        products: analytics
      });
    } catch (err: any) {
      console.error('[Product Analytics Error]:', err);
      return res.status(500).json({ error: 'خطا در تحلیل عملکرد محصولات', success: false });
    }
  });

  // =========================================================================
  // 4. REVENUE BREAKDOWN & TREND ANALYTICS
  // =========================================================================
  app.get('/api/admin/analytics/revenue-breakdown', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { range } = req.query as { range?: string };
      const { start, end } = parseDateRange(range || '30days');

      // 1. Transaction Profit
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: ['CANCELLED', 'REFUNDED'] }
        },
        select: {
          createdAt: true,
          totalPrice: true,
          items: {
            select: { quantity: true, price: true, supplierPrice: true }
          }
        }
      });

      let totalTransactionProfit = 0;
      let totalGMV = 0;
      for (const ord of orders) {
        totalGMV += (ord.totalPrice || 0);
        for (const item of (ord.items || [])) {
          const itemProfit = Math.max(0, (item.price || 0) - (item.supplierPrice || 0)) * (item.quantity || 1);
          totalTransactionProfit += itemProfit;
        }
      }

      // 2. Subscription Revenue
      const subAggr = await prisma.storeInvoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', paidAt: { gte: start, lte: end } }
      });
      const totalSubscriptionRevenue = subAggr._sum.amount || 0;

      // 3. Featured Placement Revenue
      const bannerAggr = await prisma.banner.aggregate({
        _sum: { price: true },
        where: { status: 'ACTIVE', createdAt: { gte: start, lte: end } }
      });
      const totalFeaturedRevenue = bannerAggr._sum.price || 0;

      return res.json({
        success: true,
        summary: {
          transactionProfit: totalTransactionProfit,
          subscriptionRevenue: totalSubscriptionRevenue,
          featuredRevenue: totalFeaturedRevenue,
          totalCombinedRevenue: totalTransactionProfit + totalSubscriptionRevenue + totalFeaturedRevenue,
          gmv: totalGMV
        }
      });
    } catch (err: any) {
      console.error('[Revenue Breakdown Error]:', err);
      return res.status(500).json({ error: 'خطا در تحلیل درآمدی تفکیک‌شده', success: false });
    }
  });

  // =========================================================================
  // 5. STORE & SUPPLIER CONTRIBUTION RANKINGS
  // =========================================================================
  app.get('/api/admin/analytics/contributions', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      // 5a. Store Contribution Ranking
      const topStores = await prisma.user.findMany({
        where: { role: 'STORE_MANAGER' },
        take: 10,
        select: {
          id: true,
          storeName: true,
          brandName: true,
          username: true,
          mobile: true,
          orders: {
            where: { status: { notIn: ['CANCELLED', 'REFUNDED'] } },
            select: {
              id: true,
              totalPrice: true,
              items: {
                select: { quantity: true, price: true, supplierPrice: true }
              }
            }
          },
          storeProductSelections: { select: { id: true, isSynced: true } }
        }
      });

      const storeContributions = topStores.map((store: any) => {
        let totalProfit = 0;
        let totalOrders = store.orders?.length || 0;
        
        for (const ord of (store.orders || [])) {
          for (const item of (ord.items || [])) {
            totalProfit += Math.max(0, (item.price || 0) - (item.supplierPrice || 0)) * (item.quantity || 1);
          }
        }

        const activeProducts = store.storeProductSelections?.filter((s: any) => s.isSynced).length || 0;
        const repeatActivity = totalOrders > 1 ? 'فعال و تکرارشونده' : 'تک‌سفارش';

        return {
          id: store.id,
          name: store.storeName || store.brandName || store.username,
          mobile: store.mobile,
          profitContribution: totalProfit,
          ordersCount: totalOrders,
          activeProductsCount: activeProducts,
          repeatActivity
        };
      }).sort((a: any, b: any) => b.profitContribution - a.profitContribution);

      // 5b. Supplier Contribution Ranking
      const topSuppliers = await prisma.user.findMany({
        where: { role: 'SUPPLIER' },
        take: 10,
        select: {
          id: true,
          brandName: true,
          firstName: true,
          lastName: true,
          performanceScore: true,
          products: {
            select: {
              id: true,
              status: true,
              storeSelections: { select: { storeId: true } },
              orderItems: {
                select: {
                  quantity: true,
                  price: true,
                  supplierPrice: true,
                  order: { select: { status: true } }
                }
              }
            }
          }
        }
      });

      const supplierContributions = topSuppliers.map((supp: any) => {
        let totalSales = 0;
        let shippedOrdersCount = 0;
        const storeSet = new Set<number>();

        for (const prod of (supp.products || [])) {
          for (const sel of (prod.storeSelections || [])) {
            if (sel.storeId) storeSet.add(sel.storeId);
          }
          for (const item of (prod.orderItems || [])) {
            totalSales += (item.supplierPrice || item.price || 0) * (item.quantity || 1);
            if (item.order?.status === 'COMPLETED' || item.order?.status === 'SHIPPED') {
              shippedOrdersCount += 1;
            }
          }
        }

        const activeProductsCount = supp.products?.filter((p: any) => p.status === 'APPROVED').length || 0;
        const storeReach = storeSet.size;

        return {
          id: supp.id,
          brandName: supp.brandName || `${supp.firstName || ''} ${supp.lastName || ''}`.trim() || 'تامین‌کننده',
          salesTotal: totalSales,
          shippedOrdersCount,
          supplierScore: supp.performanceScore || 100,
          activeProductsCount,
          storeReach,
          productOpportunityScore: Math.min(100, (activeProductsCount * 10) + (storeReach * 5))
        };
      }).sort((a: any, b: any) => b.salesTotal - a.salesTotal);

      return res.json({
        success: true,
        storeContributions,
        supplierContributions
      });
    } catch (err: any) {
      console.error('[Contributions Analytics Error]:', err);
      return res.status(500).json({ error: 'خطا در سهم مشارکت فروشگاه‌ها و تامین‌کنندگان', success: false });
    }
  });

  // =========================================================================
  // 6. ACTIONABLE DETERMINISTIC INSIGHTS
  // =========================================================================
  app.get('/api/admin/analytics/actionable-insights', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const insights: Array<{ type: 'WARNING' | 'OPPORTUNITY' | 'SUCCESS' | 'INFO'; message: string; score?: number }> = [];

      // 1. Low inventory check
      const lowInventoryProducts = await prisma.product.count({
        where: {
          inventory: { lte: 5 },
          status: 'APPROVED'
        }
      });
      if (lowInventoryProducts > 0) {
        insights.push({
          type: 'WARNING',
          message: `${lowInventoryProducts} محصول دارای موجودی بحرانی (کمتر از ۵ عدد) هستند.`
        });
      }

      // 2. High import but low conversion check
      const highImportLowSales = await prisma.product.findMany({
        where: { status: 'APPROVED' },
        take: 5,
        include: {
          storeSelections: { select: { id: true } },
          orderItems: { select: { id: true } }
        }
      });

      for (const prod of highImportLowSales) {
        const importCount = prod.storeSelections?.length || 0;
        const orderCount = prod.orderItems?.length || 0;
        if (importCount >= 3 && orderCount === 0) {
          insights.push({
            type: 'OPPORTUNITY',
            message: `محصول "${prod.name}" نرخ واردسازی بالایی دارد (${importCount} فروشگاه) ولی هنوز فروشی ثبت نکرده است.`
          });
          break;
        }
      }

      // 3. High store reach suppliers
      const topSuppliers = await prisma.user.findMany({
        where: { role: 'SUPPLIER' },
        take: 10,
        include: {
          products: {
            include: {
              storeSelections: { select: { storeId: true } }
            }
          }
        }
      });

      let highReachSupplierCount = 0;
      for (const supp of topSuppliers) {
        const storeSet = new Set<number>();
        for (const prod of (supp.products || [])) {
          for (const sel of (prod.storeSelections || [])) {
            if (sel.storeId) storeSet.add(sel.storeId);
          }
        }
        if (storeSet.size >= 5) {
          highReachSupplierCount += 1;
        }
      }

      if (highReachSupplierCount > 0) {
        insights.push({
          type: 'SUCCESS',
          message: `${highReachSupplierCount} تامین‌کننده موفق به جذب بیش از ۵ فروشگاه فعال برای محصولات خود شده‌اند.`
        });
      }

      // 4. Pending product approvals
      const pendingApprovalCount = await prisma.product.count({ where: { status: 'PENDING' } });
      if (pendingApprovalCount > 0) {
        insights.push({
          type: 'INFO',
          message: `${pendingApprovalCount} محصول جدید در انتظار بررسی و تایید مدیریت قرار دارد.`
        });
      }

      return res.json({
        success: true,
        count: insights.length,
        insights
      });
    } catch (err: any) {
      console.error('[Actionable Insights Error]:', err);
      return res.status(500).json({ error: 'خطا در تولید تحلیل‌های هوشمند', success: false });
    }
  });

  // =========================================================================
  // 7. STORE MANAGER ISOLATED ANALYTICS
  // =========================================================================
  app.get('/api/store-manager/analytics/overview', authenticateToken, requireStoreManager, async (req: any, res: Response) => {
    try {
      const storeId = req.user.id || req.user.userId;

      const [
        totalImports,
        activeSyncedImports,
        storeOrders
      ] = await Promise.all([
        prisma.storeProductSelection.count({ where: { storeId } }),
        prisma.storeProductSelection.count({ where: { storeId, isSynced: true } }),
        prisma.order.findMany({
          where: { userId: storeId, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
          select: { id: true, totalPrice: true, createdAt: true }
        })
      ]);

      const totalSpentGMV = storeOrders.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
      const ordersCount = storeOrders.length;

      return res.json({
        success: true,
        storeAnalytics: {
          totalImports,
          activeSyncedImports,
          ordersCount,
          totalSpentGMV,
          hasRepeatOrders: ordersCount > 1
        }
      });
    } catch (err: any) {
      console.error('[Store Analytics Overview Error]:', err);
      return res.status(500).json({ error: 'خطا در دریافت آمار اختصاصی فروشگاه', success: false });
    }
  });

  // =========================================================================
  // 8. SUPPLIER ISOLATED ANALYTICS
  // =========================================================================
  app.get('/api/supplier/analytics/overview', authenticateToken, requireSupplier, async (req: any, res: Response) => {
    try {
      const supplierId = req.user.supplierId || req.user.id || req.user.userId;

      const [
        totalProducts,
        approvedProducts,
        supplierProducts
      ] = await Promise.all([
        prisma.product.count({ where: { supplierId } }),
        prisma.product.count({ where: { supplierId, status: 'APPROVED' } }),
        prisma.product.findMany({
          where: { supplierId },
          select: {
            id: true,
            storeSelections: { select: { storeId: true } },
            orderItems: { select: { quantity: true, supplierPrice: true } }
          }
        })
      ]);

      const storeSet = new Set<number>();
      let totalSalesGMV = 0;
      let totalUnitsSold = 0;

      for (const prod of supplierProducts) {
        for (const sel of (prod.storeSelections || [])) {
          if (sel.storeId) storeSet.add(sel.storeId);
        }
        for (const item of (prod.orderItems || [])) {
          totalUnitsSold += (item.quantity || 1);
          totalSalesGMV += (item.supplierPrice || 0) * (item.quantity || 1);
        }
      }

      return res.json({
        success: true,
        supplierAnalytics: {
          totalProducts,
          approvedProducts,
          storeReach: storeSet.size,
          totalUnitsSold,
          totalSalesGMV
        }
      });
    } catch (err: any) {
      console.error('[Supplier Analytics Overview Error]:', err);
      return res.status(500).json({ error: 'خطا در دریافت آمار اختصاصی تامین‌کننده', success: false });
    }
  });
}

export default registerBusinessIntelligenceRoutes;
