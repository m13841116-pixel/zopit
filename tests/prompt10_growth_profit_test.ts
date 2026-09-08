import { StoreGrowthService } from '../src/services/StoreGrowthService';

// In-Memory Prisma Mock for isolated testing
function createMockPrisma() {
  const users: any[] = [];
  const categories: any[] = [];
  const products: any[] = [];
  const orders: any[] = [];
  const storeSettings: any[] = [];
  const systemConfigs: any[] = [];
  const storeSelections: any[] = [];

  let nextId = 1;

  return {
    user: {
      create: async ({ data }: any) => {
        const u = { id: nextId++, ...data };
        users.push(u);
        return u;
      },
      findMany: async ({ where }: any = {}) => {
        return users.filter(u => {
          if (where?.role && u.role !== where.role) return false;
          return true;
        });
      },
      findUnique: async ({ where }: any) => {
        return users.find(u => u.id === where.id) || null;
      }
    },
    category: {
      create: async ({ data }: any) => {
        const c = { id: nextId++, ...data };
        categories.push(c);
        return c;
      },
      findFirst: async () => categories[0] || null
    },
    product: {
      create: async ({ data }: any) => {
        const p = { id: nextId++, ...data };
        products.push(p);
        return p;
      },
      findMany: async ({ where }: any = {}) => {
        return products.filter(p => {
          if (where?.status && p.status !== where.status) return false;
          if (where?.approved !== undefined && p.approved !== where.approved) return false;
          if (where?.inventory?.gt !== undefined && p.inventory <= where.inventory.gt) return false;
          if (where?.inventory?.lte !== undefined && p.inventory > where.inventory.lte) return false;
          if (where?.id?.in && !where.id.in.includes(p.id)) return false;
          if (where?.id?.notIn && where.id.notIn.includes(p.id)) return false;
          return true;
        }).map(p => ({
          ...p,
          category: categories.find(c => c.id === p.categoryId) || null
        }));
      }
    },
    order: {
      create: async ({ data }: any) => {
        const oId = nextId++;
        const oItems = (data.items?.create || []).map((it: any) => ({
          id: nextId++,
          orderId: oId,
          ...it,
          product: products.find(p => p.id === it.productId) || { name: 'کالا', category: { name: 'دسته' } }
        }));
        const o = {
          id: oId,
          ...data,
          items: oItems
        };
        orders.push(o);
        return o;
      },
      findMany: async ({ where, orderBy, take }: any = {}) => {
        let list = orders.filter(o => {
          if (where?.storeId && o.storeId !== where.storeId) return false;
          if (where?.paymentStatus && o.paymentStatus !== where.paymentStatus) return false;
          if (where?.status?.notIn && where.status.notIn.includes(o.status)) return false;
          if (where?.createdAt?.gte && new Date(o.createdAt) < new Date(where.createdAt.gte)) return false;
          return true;
        });

        if (orderBy?.id === 'desc') {
          list = [...list].reverse();
        }

        if (take) {
          list = list.slice(0, take);
        }

        return list.map(o => ({
          ...o,
          items: o.items?.map((it: any) => ({
            ...it,
            product: products.find(p => p.id === it.productId) || it.product
          }))
        }));
      },
      count: async ({ where }: any = {}) => {
        return orders.filter(o => {
          if (where?.storeId && o.storeId !== where.storeId) return false;
          if (where?.paymentStatus && o.paymentStatus !== where.paymentStatus) return false;
          if (where?.status?.notIn && where.status.notIn.includes(o.status)) return false;
          if (where?.createdAt?.gte && new Date(o.createdAt) < new Date(where.createdAt.gte)) return false;
          return true;
        }).length;
      }
    },
    storeSettings: {
      findUnique: async ({ where }: any) => {
        return storeSettings.find(s => s.storeManagerId === where.storeManagerId) || null;
      },
      upsert: async ({ where, update, create }: any) => {
        const idx = storeSettings.findIndex(s => s.storeManagerId === where.storeManagerId);
        if (idx >= 0) {
          storeSettings[idx] = { ...storeSettings[idx], ...update };
          return storeSettings[idx];
        } else {
          const s = { id: nextId++, ...create };
          storeSettings.push(s);
          return s;
        }
      }
    },
    systemConfig: {
      findUnique: async ({ where }: any) => {
        return systemConfigs.find(c => c.key === where.key) || null;
      },
      upsert: async ({ where, update, create }: any) => {
        const idx = systemConfigs.findIndex(c => c.key === where.key);
        if (idx >= 0) {
          systemConfigs[idx] = { ...systemConfigs[idx], ...update };
          return systemConfigs[idx];
        } else {
          const c = { id: nextId++, ...create };
          systemConfigs.push(c);
          return c;
        }
      }
    },
    storeProductSelection: {
      findMany: async ({ where }: any = {}) => {
        return storeSelections.filter(s => {
          if (where?.storeManagerId && s.storeManagerId !== where.storeManagerId) return false;
          return true;
        });
      },
      count: async ({ where }: any = {}) => {
        return storeSelections.filter(s => {
          if (where?.storeManagerId && s.storeManagerId !== where.storeManagerId) return false;
          return true;
        }).length;
      }
    }
  };
}

async function runPrompt10Tests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PROMPT 10 STORE GROWTH & PROFIT CENTER TESTS');
  console.log('====================================================');

  const mockPrisma: any = createMockPrisma();
  const growthService = new StoreGrowthService(mockPrisma);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} - ${details || ''}`);
      failed++;
    }
  }

  try {
    // SCENARIO 1: New store with no orders (Zero profit, clean baseline)
    console.log('\n--- Scenario 1: New Store with No Orders ---');
    const newStore = await mockPrisma.user.create({
      data: {
        phone: '09991111111',
        password: 'hash',
        role: 'STORE_MANAGER',
        storeName: 'فروشگاه تستی جدید',
        storeSlug: 'test-store-1'
      }
    });

    const newStoreDash = await growthService.getStoreGrowthDashboard(newStore.id);
    assert(newStoreDash.profitOverview.todaySales === 0, 'New store today sales is 0');
    assert(newStoreDash.profitOverview.todayProfit === 0, 'New store today profit is 0');
    assert(newStoreDash.profitOverview.monthSales === 0, 'New store month sales is 0');
    assert(newStoreDash.profitOverview.monthProfit === 0, 'New store month profit is 0');
    assert(newStoreDash.targetProgress.progressPercentage === 0, 'New store target progress is 0%');
    assert(newStoreDash.targetProgress.status === 'BEHIND', 'New store target status is BEHIND');

    // SCENARIO 2: Store with orders today
    console.log('\n--- Scenario 2: Store with Orders Today ---');
    const supplier = await mockPrisma.user.create({
      data: {
        phone: '09981111111',
        password: 'hash',
        role: 'SUPPLIER',
        name: 'تأمین‌کننده تست'
      }
    });

    const category = await mockPrisma.category.create({
      data: { name: 'پوشاک رشد', slug: 'growth-cat-1' }
    });

    const productA = await mockPrisma.product.create({
      data: {
        name: 'کفش ورزشی مدل A',
        categoryId: category.id,
        supplierId: supplier.id,
        supplierPrice: 100000,
        price: 150000, // profit = 50,000 per unit
        inventory: 50,
        status: 'ACTIVE',
        approved: true
      }
    });

    const productB = await mockPrisma.product.create({
      data: {
        name: 'تیشرت نخی مدل B',
        categoryId: category.id,
        supplierId: supplier.id,
        supplierPrice: 80000,
        price: 120000, // profit = 40,000 per unit
        inventory: 30,
        status: 'ACTIVE',
        approved: true
      }
    });

    // Create an order today for newStore
    await mockPrisma.order.create({
      data: {
        storeId: newStore.id,
        customerName: 'مشتری تست ۱',
        customerPhone: '09121111111',
        shippingAddress: 'تهران خیابان تست',
        totalAmount: 300000, // 2 items of productA
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        createdAt: new Date(),
        items: {
          create: [
            {
              productId: productA.id,
              quantity: 2,
              price: 150000,
              supplierPrice: 100000
            }
          ]
        }
      }
    });

    const storeDashWithOrder = await growthService.getStoreGrowthDashboard(newStore.id);
    assert(storeDashWithOrder.profitOverview.todaySales === 300000, 'Store today sales accurately equals 300,000', `Got ${storeDashWithOrder.profitOverview.todaySales}`);
    assert(storeDashWithOrder.profitOverview.todayProfit === 100000, 'Store today profit accurately equals 100,000 (2 * 50,000)', `Got ${storeDashWithOrder.profitOverview.todayProfit}`);
    assert(storeDashWithOrder.profitOverview.todayOrdersCount === 1, 'Store today order count is 1');

    // SCENARIO 3: Store with orders this month but none today
    console.log('\n--- Scenario 3: Store with Orders in Month but not today ---');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    const storeOlder = await mockPrisma.user.create({
      data: {
        phone: '09971111111',
        password: 'hash',
        role: 'STORE_MANAGER',
        storeName: 'فروشگاه ماهانه'
      }
    });

    await mockPrisma.order.create({
      data: {
        storeId: storeOlder.id,
        customerName: 'مشتری تست قدیمی',
        customerPhone: '09122222222',
        shippingAddress: 'شیراز',
        totalAmount: 240000, // 2 items of productB
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        createdAt: pastDate,
        items: {
          create: [
            {
              productId: productB.id,
              quantity: 2,
              price: 120000,
              supplierPrice: 80000
            }
          ]
        }
      }
    });

    const storeOlderDash = await growthService.getStoreGrowthDashboard(storeOlder.id);
    assert(storeOlderDash.profitOverview.todaySales === 0, 'Older store today sales is 0');
    assert(storeOlderDash.profitOverview.todayProfit === 0, 'Older store today profit is 0');
    assert(storeOlderDash.profitOverview.monthSales === 240000, 'Older store month sales is 240,000');
    assert(storeOlderDash.profitOverview.monthProfit === 80000, 'Older store month profit is 80,000');

    // SCENARIO 4: Target Calculation with 500,000 baseline
    console.log('\n--- Scenario 4: Target calculation baseline ---');
    assert(storeOlderDash.targetProgress.dailyTarget === 500000, 'Daily baseline target is 500,000');
    assert(storeOlderDash.targetProgress.periodTarget === 15000000, 'Monthly period target is 15,000,000');

    // SCENARIO 5: Store below target (<70%)
    console.log('\n--- Scenario 5: Store below target ---');
    assert(storeOlderDash.targetProgress.status === 'BEHIND', 'Low performing store status is BEHIND');
    assert(storeOlderDash.targetProgress.progressPercentage < 70, 'Progress percentage is < 70%');

    // SCENARIO 6: Store near target (80% - 99%)
    console.log('\n--- Scenario 6: Store near target ---');
    const storeNear = await mockPrisma.user.create({
      data: {
        phone: '09961111111',
        password: 'hash',
        role: 'STORE_MANAGER',
        storeName: 'فروشگاه نزدیک به تارگت'
      }
    });

    // 13,000,000 sales -> ~86.6% of 15,000,000
    await mockPrisma.order.create({
      data: {
        storeId: storeNear.id,
        customerName: 'مشتری عمده',
        customerPhone: '09123333333',
        shippingAddress: 'اصفهان',
        totalAmount: 13000000,
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        createdAt: new Date(),
        items: {
          create: [
            {
              productId: productA.id,
              quantity: 100,
              price: 130000,
              supplierPrice: 100000
            }
          ]
        }
      }
    });

    const storeNearDash = await growthService.getStoreGrowthDashboard(storeNear.id);
    assert(storeNearDash.targetProgress.status === 'NEAR_TARGET', 'Store with 86.6% is NEAR_TARGET', `Got ${storeNearDash.targetProgress.status}`);
    assert(storeNearDash.targetProgress.progressPercentage >= 80 && storeNearDash.targetProgress.progressPercentage < 100, 'Progress is between 80% and 99%');

    // SCENARIO 7: Store reaching target (>=100%)
    console.log('\n--- Scenario 7: Store reaching target ---');
    const storeReaching = await mockPrisma.user.create({
      data: {
        phone: '09951111111',
        password: 'hash',
        role: 'STORE_MANAGER',
        storeName: 'فروشگاه موفق'
      }
    });

    // 16,000,000 sales -> > 100% of 15,000,000
    await mockPrisma.order.create({
      data: {
        storeId: storeReaching.id,
        customerName: 'مشتری ممتاز',
        customerPhone: '09124444444',
        shippingAddress: 'مشهد',
        totalAmount: 16000000,
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        createdAt: new Date(),
        items: {
          create: [
            {
              productId: productA.id,
              quantity: 100,
              price: 160000,
              supplierPrice: 100000
            }
          ]
        }
      }
    });

    const storeReachingDash = await growthService.getStoreGrowthDashboard(storeReaching.id);
    assert(storeReachingDash.targetProgress.status === 'REACHED', 'Store with 106% is REACHED', `Got ${storeReachingDash.targetProgress.status}`);
    assert(storeReachingDash.targetProgress.progressPercentage >= 100, 'Progress is >= 100%');
    assert(storeReachingDash.targetProgress.remainingAmount === 0, 'Remaining amount is 0 when target reached');

    // SCENARIO 8: Target remaining amount and required run rate calculation
    console.log('\n--- Scenario 8: Remaining amount & daily run rate ---');
    assert(storeNearDash.targetProgress.remainingAmount === 2000000, 'StoreNear remaining amount is exactly 2,000,000');
    assert(storeNearDash.targetProgress.dailyRequiredRunRate > 0, 'Daily required run rate is positive');

    // SCENARIO 9: Reward eligibility reflection (1 month free subscription)
    console.log('\n--- Scenario 9: Reward eligibility reflection ---');
    assert(storeReachingDash.targetProgress.rewardEligibility.eligible === true, 'Reaching store is eligible for reward');
    assert(storeNearDash.targetProgress.rewardEligibility.eligible === false, 'Near store is not yet eligible for reward');

    // SCENARIO 10: Store Isolation
    console.log('\n--- Scenario 10: Store Isolation ---');
    assert(storeNearDash.profitOverview.monthSales !== storeReachingDash.profitOverview.monthSales, 'Store A and Store B have distinct isolated financial summaries');
    assert(storeNearDash.profitOverview.monthSales === 13000000, 'Store A only sees its own orders (13,000,000)');
    assert(storeReachingDash.profitOverview.monthSales === 16000000, 'Store B only sees its own orders (16,000,000)');

    // SCENARIO 11: Multi-product profit rollup
    console.log('\n--- Scenario 11: Multi-product profit rollup ---');
    const multiStore = await mockPrisma.user.create({
      data: {
        phone: '09941111111',
        password: 'hash',
        role: 'STORE_MANAGER',
        storeName: 'فروشگاه چندمحصولی'
      }
    });

    await mockPrisma.order.create({
      data: {
        storeId: multiStore.id,
        customerName: 'خریدار سبد کامل',
        customerPhone: '09125555555',
        shippingAddress: 'تبریز',
        totalAmount: 600000,
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        createdAt: new Date(),
        items: {
          create: [
            {
              productId: productA.id,
              quantity: 2, // 2 * 150000 = 300000, profit = 2 * 50000 = 100000
              price: 150000,
              supplierPrice: 100000
            },
            {
              productId: productB.id,
              quantity: 2, // 2 * 150000 = 300000, profit = 2 * 70000 = 140000
              price: 150000,
              supplierPrice: 80000
            }
          ]
        }
      }
    });

    const multiDash = await growthService.getStoreGrowthDashboard(multiStore.id);
    assert(multiDash.profitOverview.todaySales === 600000, 'Multi-product order sales is 600,000');
    assert(multiDash.profitOverview.todayProfit === 240000, 'Multi-product profit correctly rolls up to 240,000 (100,000 + 140,000)', `Got ${multiDash.profitOverview.todayProfit}`);

    // SCENARIO 12: Top selling vs most profitable ranking
    console.log('\n--- Scenario 12: Top selling vs most profitable ranking ---');
    assert(Array.isArray(multiDash.topProducts.topSelling), 'Top selling is an array');
    assert(Array.isArray(multiDash.topProducts.topProfitable), 'Top profitable is an array');
    assert(multiDash.topProducts.topProfitable[0]?.productId === productB.id, 'Product B (140,000 profit) is ranked #1 in topProfitable');

    // SCENARIO 13: Store health signals
    console.log('\n--- Scenario 13: Store Health Signals ---');
    assert(multiDash.storeHealth.signals.catalogSize !== undefined, 'Catalog size health signal exists');
    assert(multiDash.storeHealth.signals.orderVelocity !== undefined, 'Order velocity health signal exists');
    assert(multiDash.storeHealth.signals.inventoryAvailability !== undefined, 'Inventory availability signal exists');
    assert(multiDash.storeHealth.signals.fulfillmentRate !== undefined, 'Fulfillment rate signal exists');

    // SCENARIO 14: Actionable Growth Opportunities
    console.log('\n--- Scenario 14: Growth Opportunities ---');
    assert(Array.isArray(multiDash.growthOpportunities), 'Growth opportunities is an array');
    assert(multiDash.growthOpportunities.length > 0, 'Growth opportunities generated');

    // SCENARIO 15: Zero Zopit margin leakage
    console.log('\n--- Scenario 15: Zero Zopit internal margin leakage ---');
    const dashJsonString = JSON.stringify(multiDash);
    assert(!dashJsonString.includes('zopitMargin'), 'No zopitMargin field in dashboard JSON');
    assert(!dashJsonString.includes('platformCut'), 'No platformCut field in dashboard JSON');
    assert(!dashJsonString.includes('zopitProfit'), 'No zopitProfit field in dashboard JSON');

    console.log('\n====================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runPrompt10Tests();
