import { StoreActionPriorityService, StoreActionCard } from '../src/services/StoreActionPriorityService.js';

// In-Memory Mock Prisma Client for Prompt 12 Smart Action Center Verification
function createMockPrisma() {
  const users: any[] = [];
  const categories: any[] = [];
  const products: any[] = [];
  const storeSelections: any[] = [];
  const orders: any[] = [];
  const storeSettings: any[] = [];
  const activityLogs: any[] = [];

  let nextId = 100;

  return {
    users,
    products,
    storeSelections,
    orders,
    storeSettings,
    activityLogs,
    user: {
      create: async ({ data }: any) => {
        const u = { id: nextId++, ...data };
        users.push(u);
        return u;
      },
      findUnique: async ({ where }: any) => {
        return users.find(u => u.id === where.id) || null;
      },
      findMany: async () => users
    },
    category: {
      create: async ({ data }: any) => {
        const c = { id: nextId++, ...data };
        categories.push(c);
        return c;
      },
      findFirst: async () => categories[0] || null,
      findMany: async () => categories
    },
    product: {
      create: async ({ data }: any) => {
        const p = { id: nextId++, ...data };
        products.push(p);
        return p;
      },
      findUnique: async ({ where }: any) => products.find(p => p.id === where.id) || null,
      findMany: async ({ where }: any = {}) => {
        return products.filter(p => {
          if (where?.status && p.status !== where.status) return false;
          return true;
        });
      }
    },
    storeProductSelection: {
      create: async ({ data }: any) => {
        const s = { id: nextId++, selected_at: new Date(), ...data };
        storeSelections.push(s);
        return s;
      },
      findMany: async ({ where, include }: any = {}) => {
        let res = storeSelections.filter(s => {
          if (where?.storeId && s.storeId !== where.storeId) return false;
          if (where?.status?.in && !where.status.in.includes(s.status)) return false;
          return true;
        });
        if (include?.product) {
          res = res.map(s => ({
            ...s,
            product: products.find(p => p.id === s.productId) || null
          }));
        }
        return res;
      }
    },
    order: {
      findMany: async ({ where }: any = {}) => {
        return orders.filter(o => {
          if (where?.storeId && o.storeId !== where.storeId) return false;
          if (where?.createdAt?.gte && new Date(o.createdAt) < new Date(where.createdAt.gte)) return false;
          return true;
        });
      }
    },
    storeSettings: {
      findUnique: async ({ where }: any) => {
        return storeSettings.find(s => s.storeManagerId === where.storeManagerId) || null;
      }
    },
    activityLog: {
      create: async ({ data }: any) => {
        const log = { id: nextId++, createdAt: new Date(), ...data };
        activityLogs.push(log);
        return log;
      },
      findMany: async ({ where }: any = {}) => {
        return activityLogs.filter(l => {
          if (where?.userId && l.userId !== where.userId) return false;
          if (where?.action?.in && !where.action.in.includes(l.action)) return false;
          if (where?.action && typeof where.action === 'string' && l.action !== where.action) return false;
          return true;
        });
      }
    }
  };
}

async function runPrompt12Tests() {
  console.log('=== STARTING PROMPT 12: SMART ACTION CENTER TESTS ===');

  const mockPrisma = createMockPrisma() as any;

  // 1. Seed Store Manager & Supplier
  const store = await mockPrisma.user.create({
    data: {
      username: 'smart_store_manager',
      password: 'password123',
      role: 'STORE_MANAGER',
      storeName: 'فروشگاه هوشمند زوپیت'
    }
  });

  const supplier = await mockPrisma.user.create({
    data: {
      username: 'supplier_1',
      password: 'password123',
      role: 'SUPPLIER',
      brandName: 'تامین کننده برتر'
    }
  });

  const category = await mockPrisma.category.create({
    data: { name: 'لوازم دیجیتال' }
  });

  // Seed Products
  const p1 = await mockPrisma.product.create({
    data: {
      supplierId: supplier.id,
      categoryId: category.id,
      name: 'هندزفری بلوتوثی پرو',
      supplierBasePrice: 500000,
      inventory: 3, // Low stock!
      status: 'PUBLISHED',
      marginType: 'PERCENTAGE',
      marginValue: 20
    }
  });

  const p2 = await mockPrisma.product.create({
    data: {
      supplierId: supplier.id,
      categoryId: category.id,
      name: 'ساعت هوشمند فلزی',
      supplierBasePrice: 1200000,
      inventory: 50,
      status: 'PUBLISHED',
      marginType: 'PERCENTAGE',
      marginValue: 25
    }
  });

  // Seed Store Catalog
  await mockPrisma.storeProductSelection.create({
    data: {
      storeId: store.id,
      productId: p1.id,
      status: 'ACTIVE',
      customPrice: 600000
    }
  });

  // -----------------------------------------------------------------
  // TEST 1: Generate Smart Actions
  // -----------------------------------------------------------------
  console.log('\n--- TEST 1: Generate Smart Actions ---');
  const actions: StoreActionCard[] = await StoreActionPriorityService.getSmartActions(mockPrisma, store.id, 5);

  console.log(`Generated ${actions.length} smart action cards for store ID ${store.id}:`);
  actions.forEach((a, i) => {
    console.log(` [${i + 1}] Priority: ${a.priority} (Score: ${a.priorityScore}) | Type: ${a.type} | Title: ${a.title}`);
  });

  if (actions.length === 0) {
    throw new Error('TEST 1 FAILED: Expected smart action cards to be generated');
  }

  // Verify that cards are sorted descending by priorityScore
  for (let i = 0; i < actions.length - 1; i++) {
    if (actions[i].priorityScore < actions[i + 1].priorityScore) {
      throw new Error(`TEST 1 FAILED: Action cards not sorted by priorityScore descending at index ${i}`);
    }
  }
  console.log('✔ TEST 1 PASSED: Smart actions generated and sorted by priority score.');

  // -----------------------------------------------------------------
  // TEST 2: Action Interactions (Impression, Click, Dismiss, Complete)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 2: Action Interactions & Deduplication ---');
  const targetAction = actions[0];

  // Track impression
  await StoreActionPriorityService.trackActionImpression(mockPrisma, store.id, [targetAction.id]);
  console.log(`✔ Tracked impression for action ID: ${targetAction.id}`);

  // Track click
  await StoreActionPriorityService.trackActionClick(mockPrisma, store.id, targetAction.id);
  console.log(`✔ Tracked click for action ID: ${targetAction.id}`);

  // Dismiss action
  await StoreActionPriorityService.dismissAction(mockPrisma, store.id, targetAction.id);
  console.log(`✔ Dismissed action ID: ${targetAction.id}`);

  // Re-fetch actions, dismissed action should be filtered out
  const actionsAfterDismiss: StoreActionCard[] = await StoreActionPriorityService.getSmartActions(mockPrisma, store.id, 5);
  const isDismissedPresent = actionsAfterDismiss.some(a => a.id === targetAction.id);

  if (isDismissedPresent) {
    throw new Error(`TEST 2 FAILED: Dismissed action ${targetAction.id} was still present in smart actions`);
  }
  console.log('✔ TEST 2 PASSED: Dismissed action correctly excluded from subsequent recommendations.');

  // -----------------------------------------------------------------
  // TEST 3: Admin Analytics Aggregation
  // -----------------------------------------------------------------
  console.log('\n--- TEST 3: Admin Action Analytics Aggregation ---');
  const analytics = await StoreActionPriorityService.getAdminActionAnalytics(mockPrisma);

  console.log('Action Analytics Summary:', JSON.stringify(analytics.summary, null, 2));

  if (analytics.summary.impressionsCount < 1) {
    throw new Error('TEST 3 FAILED: Expected impressionsCount >= 1');
  }
  if (analytics.summary.clicksCount < 1) {
    throw new Error('TEST 3 FAILED: Expected clicksCount >= 1');
  }
  if (analytics.summary.dismissalsCount < 1) {
    throw new Error('TEST 3 FAILED: Expected dismissalsCount >= 1');
  }

  console.log('✔ TEST 3 PASSED: Admin Action Analytics generated accurately.');

  console.log('\n==================================================');
  console.log('🎉 ALL PROMPT 12 SMART ACTION CENTER TESTS PASSED PERFECTLY!');
  console.log('==================================================');
}

runPrompt12Tests().catch(err => {
  console.error('PROMPT 12 TEST FAILURE:', err);
  process.exit(1);
});
