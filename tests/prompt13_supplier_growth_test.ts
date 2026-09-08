import { SupplierGrowthService } from '../src/services/SupplierGrowthService.js';

function createMockPrisma() {
  const users: any[] = [];
  const products: any[] = [];
  const orderItems: any[] = [];
  const storeSelections: any[] = [];
  const wallets: any[] = [];
  const payoutRequests: any[] = [];

  let nextId = 500;

  return {
    users,
    products,
    orderItems,
    storeSelections,
    wallets,
    payoutRequests,

    user: {
      findUnique: async ({ where }: any) => {
        return users.find(u => u.id === where.id) || null;
      }
    },

    product: {
      findMany: async ({ where }: any = {}) => {
        return products.filter(p => {
          if (where?.supplierId && p.supplierId !== where.supplierId) return false;
          return true;
        }).map(p => {
          const pSelections = storeSelections.filter(s => s.productId === p.id);
          const pOrderItems = orderItems.filter(o => o.productId === p.id);
          return {
            ...p,
            _count: {
              storeProductSelections: pSelections.length,
              orderItems: pOrderItems.length
            },
            storeProductSelections: pSelections,
            orderItems: pOrderItems,
            images: p.images || (p.imageUrl ? [{ url: p.imageUrl }] : [])
          };
        });
      }
    },

    orderItem: {
      findMany: async ({ where }: any = {}) => {
        return orderItems.filter(o => {
          if (where?.supplierId && o.supplierId !== where.supplierId) return false;
          if (where?.order?.createdAt?.gte) {
            const orderDate = new Date(o.order?.createdAt || Date.now());
            if (orderDate < new Date(where.order.createdAt.gte)) return false;
          }
          return true;
        });
      }
    },

    storeProductSelection: {
      findMany: async ({ where }: any = {}) => {
        return storeSelections.filter(s => {
          if (where?.product?.supplierId) {
            const prod = products.find(p => p.id === s.productId);
            if (!prod || prod.supplierId !== where.product.supplierId) return false;
          }
          return true;
        });
      }
    },

    wallet: {
      findUnique: async ({ where }: any) => {
        const w = wallets.find(wal => wal.supplierId === where.supplierId);
        if (!w) return null;
        return {
          ...w,
          payoutRequests: payoutRequests.filter(pr => pr.walletId === w.id)
        };
      }
    }
  };
}

async function runTests() {
  console.log('--- STARTING PROMPT 13 SUPPLIER GROWTH CENTER TESTS ---');

  const mockPrisma = createMockPrisma();

  // 1. Setup Test Supplier User
  const supplierId = 10;
  mockPrisma.users.push({
    id: supplierId,
    username: 'test_supplier',
    brandName: 'برند آزمایشی زوپیت',
    role: 'SUPPLIER',
    status: 'ACTIVE',
    performanceScore: 95,
    penaltyPoints: 5,
    warningLevel: 'NONE',
    shaba: 'IR123456789012345678901234',
    accountHolderName: 'رضا علوی'
  });

  // Setup Wallet
  mockPrisma.wallets.push({
    id: 'wallet_10',
    supplierId,
    balance: 1500000
  });

  // 2. Test New Supplier Dashboard (0 products, 0 orders)
  console.log('\n[TEST 1] New Supplier Growth Dashboard (Initial State)');
  const newDashboard = await SupplierGrowthService.getSupplierGrowthDashboard(mockPrisma as any, supplierId);
  console.assert(newDashboard.supplier.brandName === 'برند آزمایشی زوپیت', 'Supplier brand name matches');
  console.assert(newDashboard.executiveSummary.todaySales === 0, 'Today sales is 0');
  console.assert(newDashboard.executiveSummary.totalUnitsSold === 0, 'Total units sold is 0');
  console.assert(newDashboard.milestones.currentLevel === 'جدید', 'Level is جدید for 0 sales');
  console.assert(newDashboard.actions.some((a: any) => a.id === 'EXPAND_CATALOG_MIN3'), 'Recommends adding at least 3 products');
  console.log('✓ New Supplier Dashboard passed!');

  // 3. Add Products & Store Imports & Order Items
  console.log('\n[TEST 2] Active Supplier with Products, Store Imports & Orders');
  const p1 = {
    id: 101,
    supplierId,
    name: 'کفش ورزشی چرمی زوپیت',
    categoryName: 'پوشاک',
    supplierBasePrice: 500000,
    inventory: 20,
    status: 'PUBLISHED',
    imageUrl: 'https://example.com/shoe.jpg',
    shortDescription: 'کفش ورزشی چرمی با کیفیت عالی و راحتی فوق‌العاده',
    technicalSpecs: 'جنس: چرم طبیعی، سایز: ۴۰-۴۴'
  };

  const p2 = {
    id: 102,
    supplierId,
    name: 'کیف دستی چرمی',
    categoryName: 'پوشاک',
    supplierBasePrice: 300000,
    inventory: 3, // Low stock <= 5
    status: 'PUBLISHED',
    imageUrl: 'https://example.com/bag.jpg',
    shortDescription: 'کیف دستی تک چرم',
    technicalSpecs: 'چرم مصنوعی درجه یک'
  };

  const p3 = {
    id: 103,
    supplierId,
    name: 'ساعت مچی اسپرت',
    categoryName: 'لوازم جانبی',
    supplierBasePrice: 800000,
    inventory: 0, // Out of stock
    status: 'PUBLISHED',
    images: [], // Missing images
    shortDescription: 'کوتاه', // Short description < 15 chars
    technicalSpecs: ''
  };

  mockPrisma.products.push(p1, p2, p3);

  // Add Store Selections (Store Reach)
  mockPrisma.storeSelections.push(
    { id: 1, storeManagerId: 1001, productId: 101, isPublished: true },
    { id: 2, storeManagerId: 1002, productId: 101, isPublished: true },
    { id: 3, storeManagerId: 1003, productId: 101, isPublished: false },
    { id: 4, storeManagerId: 1001, productId: 102, isPublished: true }
  );

  // Add Completed Order Items
  const now = new Date();
  mockPrisma.orderItems.push(
    { id: 1, supplierId, productId: 101, quantity: 2, supplierPrice: 500000, status: 'DELIVERED', order: { createdAt: now } },
    { id: 2, supplierId, productId: 101, quantity: 1, supplierPrice: 500000, status: 'SHIPPED', order: { createdAt: now } },
    { id: 3, supplierId, productId: 102, quantity: 1, supplierPrice: 300000, status: 'PAID', order: { createdAt: now } },
    { id: 4, supplierId, productId: 101, quantity: 1, supplierPrice: 500000, status: 'PENDING', order: { createdAt: now } }
  );

  const activeDashboard = await SupplierGrowthService.getSupplierGrowthDashboard(mockPrisma as any, supplierId);

  console.assert(activeDashboard.executiveSummary.todaySales === 1800000, 'Today sales equals sum of delivered/shipped/paid (2*500k + 1*500k + 1*300k = 1.8M)');
  console.assert(activeDashboard.executiveSummary.importingStoresCount === 3, 'Unique importing stores equals 3 (1001, 1002, 1003)');
  console.assert(activeDashboard.executiveSummary.totalUnitsSold === 4, 'Total units sold equals 4');
  console.assert(activeDashboard.milestones.currentLevel === 'فعال', '3+ completed sales levels up to فعال');
  console.assert(activeDashboard.inventoryHealth.lowStockCount === 1, 'Low stock count equals 1 (p2)');
  console.assert(activeDashboard.inventoryHealth.outOfStockCount === 1, 'Out of stock count equals 1 (p3)');
  console.assert(activeDashboard.catalogQuality.incompleteCount === 1, 'Incomplete product count equals 1 (p3)');

  console.log('✓ Active Supplier Dashboard passed!');

  // 4. Test Sales Performance Trends
  console.log('\n[TEST 3] Sales Performance Trend Calculation');
  const salesTrend = await SupplierGrowthService.getSupplierSalesPerformance(mockPrisma as any, supplierId, '7days');
  console.assert(salesTrend.totalVolume === 1800000, 'Sales volume calculation correct');
  console.assert(salesTrend.chartData.length === 7, '7 days chart data generated');
  console.log('✓ Sales Performance Trend passed!');

  // 5. Test Product Performance & Store Reach Categorization
  console.log('\n[TEST 4] Product Performance & Store Reach Categorization');
  const prodPerf = await SupplierGrowthService.getSupplierProductsPerformance(mockPrisma as any, supplierId);
  console.assert(prodPerf.totalProducts === 3, '3 total products listed');
  console.assert(prodPerf.bestSelling[0].id === 101, 'Top best selling product is p1 (101)');
  console.assert(prodPerf.highestDemand[0].importedStoresCount === 3, 'Highest store import count is 3 for p1');
  console.log('✓ Product Performance & Store Reach passed!');

  console.log('\n ALL PROMPT 13 SUPPLIER GROWTH CENTER TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
