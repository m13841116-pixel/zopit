import { MarketplaceMatchingService } from '../src/services/MarketplaceMatchingService.js';

function createMockPrisma() {
  const users: any[] = [
    {
      id: 101,
      role: 'SUPPLIER',
      status: 'ACTIVE',
      username: 'supplier_brand_a',
      brandName: 'برند لواز خانگی آلفا',
      province: 'تهران',
      city: 'تهران',
      avatarUrl: '',
      performanceScore: 95,
      penaltyPoints: 0,
      warningLevel: 'NONE',
      // Private fields that must NOT leak
      password: 'secret_hash_xyz',
      mobile: '09120001122',
      email: 'private@supplier.com',
      nationalCode: '0011223344',
      shaba: 'IR123456789012345678901234',
      cardNumber: '6037991122334455'
    },
    {
      id: 201,
      role: 'STORE',
      status: 'ACTIVE',
      username: 'store_digital_hub',
      storeName: 'فروشگاه دیجی‌هاب',
      fieldOfActivity: 'لوازم خانگی و آشپزخانه',
      activityType: 'آنلاین شاپ',
      platformType: 'اینستاگرام',
      province: 'اصفهان',
      city: 'اصفهان',
      avatarUrl: '',
      // Private fields that must NOT leak
      password: 'store_secret_hash',
      mobile: '09139998877',
      email: 'owner@storehub.ir',
      nationalCode: '1234567890',
      shaba: 'IR987654321098765432109876',
      cardNumber: '5892101020304050'
    }
  ];

  const products: any[] = [
    {
      id: 501,
      name: 'مخلوط‌کن حرفه‌ای ۲۰۰۰ وات',
      supplierId: 101,
      categoryId: 10,
      status: 'PUBLISHED',
      inventory: 25,
      supplierBasePrice: 2500000,
      category: { id: 10, name: 'لوازم خانگی و آشپزخانه' },
      images: [{ url: 'https://example.com/blender.jpg' }],
      _count: { orderItems: 12, storeProductSelections: 8 }
    }
  ];

  const storeProductSelections: any[] = [
    {
      id: 1,
      storeId: 201,
      productId: 501,
      product: { categoryId: 10, supplierId: 101, supplierBasePrice: 2500000 }
    }
  ];

  const orders: any[] = [
    {
      id: 801,
      userId: 201,
      createdAt: new Date(),
      items: [
        { productId: 501, price: 2500000, product: { categoryId: 10 } }
      ]
    }
  ];

  const activityLogs: any[] = [];

  return {
    user: {
      findUnique: async ({ where }: any) => users.find(u => u.id === where.id) || null,
      findMany: async ({ where }: any) => {
        return users.filter(u => {
          if (where.role && u.role !== where.role) return false;
          if (where.status && u.status !== where.status) return false;
          return true;
        }).map(u => ({
          ...u,
          products: products.filter(p => p.supplierId === u.id && p.status === 'PUBLISHED'),
          storeProductSelections: storeProductSelections.filter(s => s.storeId === u.id),
          orders: orders.filter(o => o.userId === u.id)
        }));
      },
      findFirst: async ({ where }: any) => users.find(u => u.role === where.role) || null
    },
    product: {
      findMany: async ({ where }: any) => {
        return products.filter(p => {
          if (where.supplierId && p.supplierId !== where.supplierId) return false;
          if (where.status && p.status !== where.status) return false;
          if (where.id && p.id !== where.id) return false;
          return true;
        });
      },
      findFirst: async ({ where }: any) => {
        return products.find(p => p.id === where.id && p.supplierId === where.supplierId) || null;
      }
    },
    storeProductSelection: {
      findMany: async ({ where }: any) => {
        return storeProductSelections.filter(s => s.storeId === where.storeId);
      }
    },
    order: {
      findMany: async () => []
    },
    orderItem: {
      findMany: async () => []
    },
    activityLog: {
      create: async ({ data }: any) => {
        activityLogs.push(data);
        return { id: activityLogs.length, ...data, createdAt: new Date() };
      }
    },
    activityLogs
  };
}

async function runTest() {
  console.log('=== RUNNING PROMPT 14 MATCHING ENGINE VERIFICATION TEST ===\n');

  try {
    const mockPrisma = createMockPrisma() as any;
    const matchingService = new MarketplaceMatchingService(mockPrisma);

    // 1. Test Supplier -> Store Matching
    console.log('1. Testing Supplier -> Store Matching...');
    const supplierStoreMatches = await matchingService.getMatchingStoresForSupplier(101, {
      limit: 5,
      minScore: 0
    });

    console.log(`✅ Matches found: ${supplierStoreMatches.total}`);
    if (supplierStoreMatches.matches.length === 0) {
      throw new Error('Expected at least 1 matching store!');
    }

    const storeMatch = supplierStoreMatches.matches[0];
    console.log(`   Matched Store Name: ${storeMatch.storeName}`);
    console.log(`   Match Score: %${storeMatch.matchScore}`);
    console.log(`   Primary Reason: ${storeMatch.primaryReason}`);
    console.log(`   Match Reasons Count: ${storeMatch.matchReasons.length}`);

    // Verification: Privacy checks
    const matchKeys = Object.keys(storeMatch);
    const forbiddenKeys = ['password', 'mobile', 'email', 'nationalCode', 'shaba', 'cardNumber'];
    const leakedKeys = forbiddenKeys.filter(k => matchKeys.includes(k) && (storeMatch as any)[k]);

    if (leakedKeys.length > 0) {
      throw new Error(`PRIVACY VIOLATION: Leaked keys in store match object: ${leakedKeys.join(', ')}`);
    } else {
      console.log('✅ Privacy verified: No sensitive user fields exposed in store match object.');
    }

    // 2. Test Store -> Supplier Matching
    console.log('\n2. Testing Store -> Supplier Matching...');
    const storeSupplierMatches = await matchingService.getMatchingSuppliersForStore(201, {
      limit: 5,
      minScore: 0
    });

    console.log(`✅ Matches found: ${storeSupplierMatches.total}`);
    if (storeSupplierMatches.matches.length === 0) {
      throw new Error('Expected at least 1 matching supplier!');
    }

    const supplierMatch = storeSupplierMatches.matches[0];
    console.log(`   Matched Supplier Brand: ${supplierMatch.brandName}`);
    console.log(`   Match Score: %${supplierMatch.matchScore}`);
    console.log(`   Performance Score: ${supplierMatch.performanceScore}`);
    console.log(`   Categories offered: ${supplierMatch.categories.join(', ')}`);
    console.log(`   Top matching products count: ${supplierMatch.topProducts.length}`);

    // Verification: Privacy checks
    const suppMatchKeys = Object.keys(supplierMatch);
    const leakedSuppKeys = forbiddenKeys.filter(k => suppMatchKeys.includes(k) && (supplierMatch as any)[k]);

    if (leakedSuppKeys.length > 0) {
      throw new Error(`PRIVACY VIOLATION: Leaked keys in supplier match object: ${leakedSuppKeys.join(', ')}`);
    } else {
      console.log('✅ Privacy verified: No sensitive user fields exposed in supplier match object.');
    }

    // 3. Test Interaction Tracking
    console.log('\n3. Testing Interaction Tracking...');
    const trackRes = await matchingService.trackMatchInteraction(101, 'match_click', {
      targetType: 'STORE',
      targetId: 201,
      metadata: { matchScore: storeMatch.matchScore }
    });

    if (!trackRes.success) {
      throw new Error('Failed to log match interaction');
    }

    if (mockPrisma.activityLogs.length === 0) {
      throw new Error('Activity log was not recorded');
    }

    console.log(`✅ ActivityLog entry recorded successfully: ${mockPrisma.activityLogs[0].action}`);

    console.log('\n=== ALL PROMPT 14 MATCHING ENGINE TESTS PASSED PERFECTLY ===');
  } catch (err: any) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTest();
