import { Decimal } from '@prisma/client/runtime/library';

export interface SupplierMilestone {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  isAchieved: boolean;
  levelName: string;
}

export interface SupplierActionCard {
  id: string;
  type: 'ORDER_FULFILLMENT' | 'LOW_INVENTORY_RESTOCK' | 'CATALOG_COMPLETENESS' | 'EXPAND_CATALOG' | 'STAGNANT_PRODUCT';
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'NORMAL';
  actionLabel: string;
  targetTab: string;
  impactText: string;
  targetProductId?: number;
}

export class SupplierGrowthService {
  /**
   * Get main supplier growth dashboard aggregated data
   */
  static async getSupplierGrowthDashboard(prisma: any, supplierId: number) {
    if (!supplierId || isNaN(supplierId)) {
      throw new Error('شناسه تامین‌کننده معتبر نیست');
    }

    const supplier = await prisma.user.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        username: true,
        brandName: true,
        firstName: true,
        lastName: true,
        status: true,
        performanceScore: true,
        penaltyPoints: true,
        warningLevel: true,
        shaba: true,
        accountHolderName: true,
        bankName: true,
      }
    });

    if (!supplier) {
      throw new Error('تامین‌کننده یافت نشد');
    }

    // Dates
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Fetch Order Items for this Supplier
    const orderItems = await prisma.orderItem.findMany({
      where: { supplierId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            inventory: true,
            images: { take: 1, select: { url: true } },
          }
        },
        order: {
          select: { id: true, createdAt: true, status: true, storeId: true }
        }
      }
    });

    // 2. Sales calculations
    let todaySales = 0;
    let thisMonthSales = 0;
    let newOrdersCount = 0;
    let awaitingShipmentCount = 0;
    let totalUnitsSold = 0;
    let totalFulfilledOrders = 0;
    let totalCancelledOrders = 0;

    for (const item of orderItems) {
      const itemPrice = Number(item.supplierPrice || item.price || 0);
      const qty = Number(item.quantity || 1);
      const itemTotal = itemPrice * qty;
      const createdAt = new Date(item.order?.createdAt || Date.now());
      const status = item.status;

      if (status === 'REJECTED' || status === 'CANCELLED') {
        totalCancelledOrders++;
        continue;
      }

      if (status === 'PENDING' || status === 'REQUESTED') {
        newOrdersCount++;
      }

      if (status === 'PAID' || status === 'SUPPLIER_APPROVED' || status === 'PROCESSING') {
        awaitingShipmentCount++;
      }

      if (status === 'SHIPPED' || status === 'DELIVERED' || status === 'COMPLETED' || status === 'PAID') {
        totalUnitsSold += qty;
        totalFulfilledOrders++;

        if (createdAt >= startOfToday) {
          todaySales += itemTotal;
        }

        if (createdAt >= startOfMonth) {
          thisMonthSales += itemTotal;
        }
      }
    }

    // 3. Products Summary & Inventory Health
    const products = await prisma.product.findMany({
      where: { supplierId },
      include: {
        images: { select: { url: true } },
        variants: { select: { id: true, stock: true } },
        _count: {
          select: { storeProductSelections: true, orderItems: true }
        }
      }
    });

    const activeProducts = products.filter((p: any) => p.status === 'PUBLISHED');
    const activeProductsCount = activeProducts.length;

    const healthyStock = products.filter((p: any) => p.inventory > 5);
    const lowStock = products.filter((p: any) => p.inventory >= 1 && p.inventory <= 5);
    const outOfStock = products.filter((p: any) => p.inventory === 0);

    // 4. Store Reach (Unique Stores Importing Supplier's Products)
    const storeSelections = await prisma.storeProductSelection.findMany({
      where: {
        product: { supplierId }
      },
      select: {
        storeManagerId: true,
        productId: true,
        isPublished: true,
      }
    });

    const uniqueStores = new Set(storeSelections.map((s: any) => s.storeManagerId));
    const activeStores = new Set(storeSelections.filter((s: any) => s.isPublished).map((s: any) => s.storeManagerId));

    // 5. Product Catalog Quality Checks
    const incompleteProducts = products.filter((p: any) => {
      const hasImage = (p.images && p.images.length > 0) || Boolean(p.imageUrl);
      const hasShortDesc = Boolean(p.shortDescription && p.shortDescription.trim().length >= 15);
      const hasSpecs = Boolean(p.technicalSpecs && p.technicalSpecs.trim().length >= 10);
      return !hasImage || !hasShortDesc || !hasSpecs;
    });

    // 6. Milestones Calculation
    const milestones = SupplierGrowthService.calculateMilestones(totalFulfilledOrders);

    // 7. Action Center Generation
    const actions = SupplierGrowthService.generateActionCards({
      newOrdersCount,
      awaitingShipmentCount,
      products,
      lowStock,
      incompleteProducts,
      uniqueStoresCount: uniqueStores.size,
    });

    // 8. Wallet / Financial Status
    const wallet = await prisma.wallet.findUnique({
      where: { supplierId },
      include: {
        payoutRequests: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return {
      supplier: {
        id: supplier.id,
        brandName: supplier.brandName || supplier.username,
        performanceScore: supplier.performanceScore ?? 100,
        penaltyPoints: supplier.penaltyPoints ?? 0,
        warningLevel: supplier.warningLevel || 'NONE',
        status: supplier.status || 'ACTIVE',
        bankInfoCompleted: Boolean(supplier.shaba && supplier.accountHolderName)
      },
      executiveSummary: {
        todaySales,
        thisMonthSales,
        newOrdersCount,
        awaitingShipmentCount,
        activeProductsCount,
        totalProductsCount: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        importingStoresCount: uniqueStores.size,
        activeImportingStoresCount: activeStores.size,
        totalUnitsSold,
        fulfillmentRate: (totalFulfilledOrders + totalCancelledOrders) > 0 
          ? Math.round((totalFulfilledOrders / (totalFulfilledOrders + totalCancelledOrders)) * 100) 
          : 100,
      },
      milestones,
      actions,
      inventoryHealth: {
        healthyCount: healthyStock.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        lowStockItems: lowStock.map((p: any) => ({
          id: p.id,
          name: p.name,
          inventory: p.inventory,
          storeCount: p._count?.storeProductSelections || 0,
        })),
        outOfStockItems: outOfStock.map((p: any) => ({
          id: p.id,
          name: p.name,
          inventory: 0,
          storeCount: p._count?.storeProductSelections || 0,
        }))
      },
      catalogQuality: {
        incompleteCount: incompleteProducts.length,
        incompleteItems: incompleteProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          missingImage: !(p.images && p.images.length > 0) && !p.imageUrl,
          missingDesc: !p.shortDescription || p.shortDescription.trim().length < 15,
          missingSpecs: !p.technicalSpecs || p.technicalSpecs.trim().length < 10,
        }))
      },
      wallet: {
        balance: wallet ? Number(wallet.balance) : 0,
        payoutRequests: wallet?.payoutRequests || []
      }
    };
  }

  /**
   * Calculate milestone thresholds for supplier growth
   */
  static calculateMilestones(completedOrders: number): {
    currentLevel: string;
    nextLevelTarget: number;
    progressPercent: number;
    completedOrders: number;
    levels: SupplierMilestone[];
  } {
    const levels: SupplierMilestone[] = [
      {
        id: 'FIRST_SALE',
        title: 'اولین فروش',
        targetCount: 1,
        currentCount: Math.min(completedOrders, 1),
        isAchieved: completedOrders >= 1,
        levelName: 'شروع‌کننده'
      },
      {
        id: 'ACTIVE_SUPPLIER',
        title: '۳ فروش (تامین‌کننده فعال)',
        targetCount: 3,
        currentCount: Math.min(completedOrders, 3),
        isAchieved: completedOrders >= 3,
        levelName: 'فعال'
      },
      {
        id: 'GROWING_SUPPLIER',
        title: '۱۰ فروش (در حال رشد)',
        targetCount: 10,
        currentCount: Math.min(completedOrders, 10),
        isAchieved: completedOrders >= 10,
        levelName: 'در حال رشد'
      },
      {
        id: 'TOP_SUPPLIER',
        title: '۵۰ فروش (تامین‌کننده برتر)',
        targetCount: 50,
        currentCount: Math.min(completedOrders, 50),
        isAchieved: completedOrders >= 50,
        levelName: 'تامین‌کننده برتر'
      }
    ];

    let currentLevel = 'شروع‌کننده';
    let nextLevelTarget = 1;

    if (completedOrders >= 50) {
      currentLevel = 'تامین‌کننده برتر';
      nextLevelTarget = 50;
    } else if (completedOrders >= 10) {
      currentLevel = 'در حال رشد';
      nextLevelTarget = 50;
    } else if (completedOrders >= 3) {
      currentLevel = 'فعال';
      nextLevelTarget = 10;
    } else if (completedOrders >= 1) {
      currentLevel = 'شروع‌کننده';
      nextLevelTarget = 3;
    } else {
      currentLevel = 'جدید';
      nextLevelTarget = 1;
    }

    const progressPercent = Math.min(100, Math.round((completedOrders / nextLevelTarget) * 100));

    return {
      currentLevel,
      nextLevelTarget,
      progressPercent,
      completedOrders,
      levels
    };
  }

  /**
   * Deterministic Action Center cards for Supplier
   */
  static generateActionCards(data: {
    newOrdersCount: number;
    awaitingShipmentCount: number;
    products: any[];
    lowStock: any[];
    incompleteProducts: any[];
    uniqueStoresCount: number;
  }): SupplierActionCard[] {
    const actions: SupplierActionCard[] = [];

    // 1. Pending/Awaiting Shipment Orders (Highest Priority)
    if (data.awaitingShipmentCount > 0 || data.newOrdersCount > 0) {
      const totalNeedingAction = data.awaitingShipmentCount + data.newOrdersCount;
      actions.push({
        id: 'FULFILL_PENDING_ORDERS',
        type: 'ORDER_FULFILLMENT',
        title: `${totalNeedingAction} سفارش نیازمند پردازش و ارسال`,
        description: 'برای جلوگیری از کسر امتیاز و دریافت سریع درآمد، سفارشات جدید را تایید و ارسال کنید.',
        priority: 'HIGH',
        actionLabel: 'بررسی و ارسال سفارشات',
        targetTab: 'orders',
        impactText: 'تسریع واریز وجه و افزایش امتیاز عملکرد'
      });
    }

    // 2. Low Stock Restock for Active Demand
    if (data.lowStock.length > 0) {
      const topLowStock = data.lowStock[0];
      actions.push({
        id: `RESTOCK_PRODUCT_${topLowStock.id}`,
        type: 'LOW_INVENTORY_RESTOCK',
        title: `موجودی محصول «${topLowStock.name}» رو به اتمام است (${topLowStock.inventory} عدد)`,
        description: 'این محصول در فروشگاه‌ها فعال است. جهت جلوگیری از لغو سفارشات، موجودی آن را افزایش دهید.',
        priority: 'HIGH',
        actionLabel: 'افزایش موجودی',
        targetTab: 'products',
        impactText: 'جلوگیری از توقف فروش در فروشگاه‌ها',
        targetProductId: topLowStock.id
      });
    }

    // 3. Catalog Expansion
    if (data.products.length < 3) {
      actions.push({
        id: 'EXPAND_CATALOG_MIN3',
        type: 'EXPAND_CATALOG',
        title: 'تنوع محصولات خود را به حداقل ۳ محصول برسانید',
        description: 'تامین‌کنندگان با تنوع محصول بیشتر، تا ۳ برابر سفارش‌های بیشتری از فروشگاه‌ها دریافت می‌کنند.',
        priority: 'HIGH',
        actionLabel: 'افزودن محصول جدید',
        targetTab: 'add-product',
        impactText: 'افزایش احتمال جذب فروشگاه‌های خریدار'
      });
    }

    // 4. Catalog Completeness
    if (data.incompleteProducts.length > 0) {
      const item = data.incompleteProducts[0];
      actions.push({
        id: `COMPLETE_PRODUCT_${item.id}`,
        type: 'CATALOG_COMPLETENESS',
        title: `تکمیل مشخصات محصول «${item.name}»`,
        description: 'تصویر و مشخصات کامل محصول باعث افزایش اعتماد فروشگاه‌ها و رشد نرخ تبدیل می‌شود.',
        priority: 'MEDIUM',
        actionLabel: 'ویرایش و تکمیل محصول',
        targetTab: 'products',
        impactText: 'افزایش جذب فروشگاه‌ها و بازدید',
        targetProductId: item.id
      });
    }

    // 5. Expand Store Reach
    if (data.uniqueStoresCount < 3 && data.products.length >= 3) {
      actions.push({
        id: 'EXPAND_STORE_REACH',
        type: 'EXPAND_CATALOG',
        title: 'محصولات خود را به فروشگاه‌های جدید معرفی کنید',
        description: 'قیمت‌گذاری رقابتی و تصاویر باکیفیت باعث می‌شود فروشگاه‌های بیشتری محصول شما را به ویترین خود اضافه کنند.',
        priority: 'NORMAL',
        actionLabel: 'مدیریت قیمت و محصولات',
        targetTab: 'products',
        impactText: 'افزایش تعداد فروشگاه‌های خریدار'
      });
    }

    return actions;
  }

  /**
   * Get Supplier Sales Performance trends for 1d, 7d, 30d
   */
  static async getSupplierSalesPerformance(prisma: any, supplierId: number, period: string = '7days') {
    const days = period === 'today' ? 1 : period === '30days' ? 30 : 7;
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const items = await prisma.orderItem.findMany({
      where: {
        supplierId,
        order: {
          createdAt: { gte: startDate }
        }
      },
      include: {
        order: { select: { createdAt: true, status: true } }
      },
      orderBy: { id: 'asc' }
    });

    let totalVolume = 0;
    let totalOrders = items.length;
    let fulfilledOrders = 0;
    let cancelledOrders = 0;

    // Group sales by day
    const dayMap = new Map<string, { sales: number; orders: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dayMap.set(key, { sales: 0, orders: 0 });
    }

    for (const item of items) {
      const qty = Number(item.quantity || 1);
      const price = Number(item.supplierPrice || item.price || 0);
      const itemTotal = price * qty;
      const status = item.status;
      const dateKey = new Date(item.order?.createdAt || Date.now()).toISOString().split('T')[0];

      if (status === 'REJECTED' || status === 'CANCELLED') {
        cancelledOrders++;
        continue;
      }

      if (status === 'SHIPPED' || status === 'DELIVERED' || status === 'COMPLETED' || status === 'PAID') {
        fulfilledOrders++;
        totalVolume += itemTotal;

        if (dayMap.has(dateKey)) {
          const entry = dayMap.get(dateKey)!;
          entry.sales += itemTotal;
          entry.orders += 1;
        }
      }
    }

    const chartData = Array.from(dayMap.entries()).map(([date, val]) => ({
      date: new Date(date).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
      rawDate: date,
      sales: val.sales,
      orders: val.orders
    }));

    const cancellationRate = totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0;

    return {
      period,
      days,
      totalOrders,
      totalVolume,
      fulfilledOrders,
      cancelledOrders,
      cancellationRate,
      chartData
    };
  }

  /**
   * Get Detailed Product Performance, Store Reach, and Catalog Completeness
   */
  static async getSupplierProductsPerformance(prisma: any, supplierId: number) {
    const products = await prisma.product.findMany({
      where: { supplierId },
      include: {
        category: { select: { name: true } },
        images: { select: { url: true } },
        variants: true,
        storeProductSelections: {
          select: {
            id: true,
            storeManagerId: true,
            isPublished: true,
            createdAt: true
          }
        },
        orderItems: {
          select: {
            id: true,
            quantity: true,
            supplierPrice: true,
            price: true,
            status: true,
            order: { select: { createdAt: true } }
          }
        }
      }
    });

    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const productPerformances = products.map((p: any) => {
      const importedStoresCount = p.storeProductSelections.length;
      const activeStoresCount = p.storeProductSelections.filter((s: any) => s.isPublished).length;

      let unitsSold = 0;
      let revenue = 0;
      let orderCount = 0;
      let salesLast7Days = 0;
      let salesPrev7Days = 0;

      for (const item of p.orderItems) {
        if (item.status !== 'REJECTED' && item.status !== 'CANCELLED') {
          const qty = Number(item.quantity || 1);
          const price = Number(item.supplierPrice || item.price || 0);
          unitsSold += qty;
          revenue += price * qty;
          orderCount++;

          const itemDate = new Date(item.order?.createdAt || Date.now());
          if (itemDate >= last7Days) {
            salesLast7Days += qty;
          } else if (itemDate >= prev14Days) {
            salesPrev7Days += qty;
          }
        }
      }

      // Trend calculation
      let trend: 'RISING' | 'STABLE' | 'LOW' = 'STABLE';
      if (orderCount >= 2 && salesLast7Days > salesPrev7Days && salesLast7Days > 0) {
        trend = 'RISING';
      } else if (orderCount === 0 && importedStoresCount <= 1) {
        trend = 'LOW';
      }

      // Catalog Completeness Evaluation
      const hasImage = (p.images && p.images.length > 0) || Boolean(p.imageUrl);
      const hasShortDesc = Boolean(p.shortDescription && p.shortDescription.trim().length >= 15);
      const hasSpecs = Boolean(p.technicalSpecs && p.technicalSpecs.trim().length >= 10);
      const isComplete = hasImage && hasShortDesc && hasSpecs;

      return {
        id: p.id,
        name: p.name,
        categoryName: p.category?.name || 'دسته‌بندی نشده',
        imageUrl: (p.images && p.images[0]?.url) || p.imageUrl || '',
        supplierBasePrice: p.supplierBasePrice,
        inventory: p.inventory,
        status: p.status,
        importedStoresCount,
        activeStoresCount,
        orderCount,
        unitsSold,
        revenue,
        trend,
        catalogCompleteness: {
          isComplete,
          hasImage,
          hasShortDesc,
          hasSpecs
        },
        displayText: `${p.name} | ${importedStoresCount} فروشگاه اضافه کرده‌اند | ${activeStoresCount} فروشگاه فعال | ${orderCount} سفارش`
      };
    });

    // Categorize top products
    const bestSelling = [...productPerformances].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
    const highestDemand = [...productPerformances].sort((a, b) => b.importedStoresCount - a.importedStoresCount).slice(0, 5);
    const rising = productPerformances.filter(p => p.trend === 'RISING').slice(0, 5);
    const lowPerforming = productPerformances.filter(p => p.trend === 'LOW' && p.status === 'PUBLISHED').slice(0, 5);

    return {
      totalProducts: productPerformances.length,
      bestSelling,
      highestDemand,
      rising,
      lowPerforming,
      allProducts: productPerformances
    };
  }
}
