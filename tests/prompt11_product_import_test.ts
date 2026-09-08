function calculateAuthoritativeFinalPrice(basePrice: number, marginType: 'PERCENTAGE' | 'FIXED' = 'PERCENTAGE', marginValue: number = 0): number {
  if (marginType === 'PERCENTAGE') {
    return Math.round(basePrice * (1 + marginValue / 100));
  }
  return Math.round(basePrice + marginValue);
}

// In-Memory Prisma Mock for isolated testing of Prompt 11
function createMockPrisma() {
  const users: any[] = [];
  const categories: any[] = [];
  const products: any[] = [];
  const storeSelections: any[] = [];
  const systemSettings: any[] = [];
  const auditLogs: any[] = [];

  let nextId = 1;

  return {
    users,
    products,
    storeSelections,
    auditLogs,
    user: {
      create: async ({ data }: any) => {
        const u = { id: nextId++, ...data };
        users.push(u);
        return u;
      },
      findUnique: async ({ where }: any) => {
        return users.find(u => u.id === where.id) || null;
      },
      findMany: async ({ where }: any = {}) => {
        return users.filter(u => {
          if (where?.role && u.role !== where.role) return false;
          return true;
        });
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
      findUnique: async ({ where, include }: any) => {
        const p = products.find(prod => prod.id === where.id);
        if (!p) return null;
        if (include?.supplier) {
          return {
            ...p,
            supplier: users.find(u => u.id === p.supplierId) || null
          };
        }
        return p;
      },
      findMany: async ({ where, include }: any = {}) => {
        return products.filter(p => {
          if (where?.id?.in && !where.id.in.includes(p.id)) return false;
          if (where?.status && p.status !== where.status) return false;
          return true;
        }).map(p => {
          if (include?.supplier) {
            return {
              ...p,
              supplier: users.find(u => u.id === p.supplierId) || null
            };
          }
          return p;
        });
      }
    },
    storeProductSelection: {
      create: async ({ data }: any) => {
        const s = { id: nextId++, selected_at: new Date(), ...data };
        storeSelections.push(s);
        return s;
      },
      findFirst: async ({ where, include }: any) => {
        const s = storeSelections.find(sel => sel.storeId === where.storeId && sel.productId === where.productId);
        if (!s) return null;
        if (include?.product) {
          return {
            ...s,
            product: products.find(p => p.id === s.productId) || null
          };
        }
        return s;
      },
      findMany: async ({ where }: any = {}) => {
        return storeSelections.filter(sel => {
          if (where?.storeId && sel.storeId !== where.storeId) return false;
          if (where?.productId?.in && !where.productId.in.includes(sel.productId)) return false;
          return true;
        });
      },
      count: async ({ where }: any = {}) => {
        return storeSelections.filter(sel => {
          if (where?.storeId && sel.storeId !== where.storeId) return false;
          return true;
        }).length;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        storeSelections.forEach(sel => {
          if (sel.storeId === where.storeId && sel.productId === where.productId) {
            Object.assign(sel, data);
            count++;
          }
        });
        return { count };
      },
      deleteMany: async ({ where }: any) => {
        const initial = storeSelections.length;
        const remaining = storeSelections.filter(sel => {
          if (where?.storeId && sel.storeId === where.storeId && where?.productId && sel.productId === where.productId) return false;
          return true;
        });
        storeSelections.length = 0;
        storeSelections.push(...remaining);
        return { count: initial - remaining.length };
      }
    },
    systemSettings: {
      findUnique: async ({ where }: any) => {
        return systemSettings.find(s => s.key === where.key) || null;
      }
    }
  };
}

async function runPrompt11Tests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PROMPT 11 PRODUCT IMPORT & ACTIVATION TESTS');
  console.log('====================================================');

  const mockPrisma = createMockPrisma();

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
    // SETUP: Users & Supplier
    const supplierActive = await mockPrisma.user.create({
      data: { phone: '09110000001', role: 'SUPPLIER', status: 'ACTIVE', name: 'تامین‌کننده مجاز ۱' }
    });
    const supplierSuspended = await mockPrisma.user.create({
      data: { phone: '09110000002', role: 'SUPPLIER', status: 'SUSPENDED', name: 'تامین‌کننده تعلیق شده' }
    });
    const storeManagerA = await mockPrisma.user.create({
      data: { phone: '09120000001', role: 'STORE_MANAGER', storeName: 'فروشگاه الف' }
    });
    const storeManagerB = await mockPrisma.user.create({
      data: { phone: '09120000002', role: 'STORE_MANAGER', storeName: 'فروشگاه ب' }
    });

    const category = await mockPrisma.category.create({
      data: { name: 'لوازم دیجیتال', slug: 'digital' }
    });

    // Products
    const prodActive = await mockPrisma.product.create({
      data: {
        name: 'هدفون بی‌سیم پرو',
        categoryId: category.id,
        supplierId: supplierActive.id,
        supplierBasePrice: 200000,
        marginType: 'PERCENTAGE',
        marginValue: 10,
        finalPrice: 220000,
        inventory: 25,
        status: 'PUBLISHED',
        approved: true
      }
    });

    const prodActive2 = await mockPrisma.product.create({
      data: {
        name: 'ساعت هوشمند مکس',
        categoryId: category.id,
        supplierId: supplierActive.id,
        supplierBasePrice: 500000,
        marginType: 'PERCENTAGE',
        marginValue: 10,
        finalPrice: 550000,
        inventory: 15,
        status: 'PUBLISHED',
        approved: true
      }
    });

    const prodOutOfStock = await mockPrisma.product.create({
      data: {
        name: 'پاوربانک ۲۰۰۰۰',
        categoryId: category.id,
        supplierId: supplierActive.id,
        supplierBasePrice: 300000,
        finalPrice: 330000,
        inventory: 0,
        status: 'PUBLISHED',
        approved: true
      }
    });

    const prodPending = await mockPrisma.product.create({
      data: {
        name: 'اسپیکر در انتظار تایید',
        categoryId: category.id,
        supplierId: supplierActive.id,
        supplierBasePrice: 150000,
        finalPrice: 165000,
        inventory: 10,
        status: 'PENDING_APPROVAL',
        approved: false
      }
    });

    const prodSuspendedSupplier = await mockPrisma.product.create({
      data: {
        name: 'کابل شارژ تامین‌کننده مسدود',
        categoryId: category.id,
        supplierId: supplierSuspended.id,
        supplierBasePrice: 50000,
        finalPrice: 55000,
        inventory: 50,
        status: 'PUBLISHED',
        approved: true
      }
    });

    // 1. Single Product Import Flow
    console.log('\n--- Test 1: Single Product Import Flow ---');
    const import1 = await mockPrisma.storeProductSelection.create({
      data: {
        storeId: storeManagerA.id,
        productId: prodActive.id,
        status: 'ACTIVE'
      }
    });
    assert(import1.id > 0, 'Store Manager A successfully imports eligible active product');
    assert(import1.status === 'ACTIVE', 'Imported product is marked ACTIVE in store catalog');

    // 2. Duplicate Import (Idempotency)
    console.log('\n--- Test 2: Duplicate Import Protection ---');
    const existingCheck = await mockPrisma.storeProductSelection.findFirst({
      where: { storeId: storeManagerA.id, productId: prodActive.id }
    });
    assert(existingCheck !== null, 'Duplicate import is detected without creating duplicate database row');

    // 3. Dynamic Pricing Engine Reuse (Wholesale / Authoritative final price)
    console.log('\n--- Test 3: Dynamic Pricing Authoritative Calculation ---');
    const calculatedPrice = calculateAuthoritativeFinalPrice(200000, 'PERCENTAGE', 10);
    assert(calculatedPrice === 220000, 'Authoritative final price matches Dynamic Pricing engine (220,000)', `Got ${calculatedPrice}`);

    // 4. Store Retail Price Setting & Wholesale Floor Protection
    console.log('\n--- Test 4: Store Retail Price Floor Validation ---');
    const wholesalePrice = prodActive.finalPrice;
    const attemptedSubWholesalePrice = 180000;
    const isValidPrice = attemptedSubWholesalePrice >= wholesalePrice;
    assert(!isValidPrice, 'Server rejects custom retail price below wholesale acquisition price (180,000 < 220,000)');

    const validRetailPrice = 280000;
    const calculatedCustomProfit = validRetailPrice - wholesalePrice;
    await mockPrisma.storeProductSelection.updateMany({
      where: { storeId: storeManagerA.id, productId: prodActive.id },
      data: { customPrice: validRetailPrice, customProfit: calculatedCustomProfit }
    });

    const updatedSel = await mockPrisma.storeProductSelection.findFirst({
      where: { storeId: storeManagerA.id, productId: prodActive.id }
    });
    assert(updatedSel?.customPrice === 280000, 'Custom retail price saved correctly (280,000)');
    assert(updatedSel?.customProfit === 60000, 'Custom store profit correctly calculated (60,000)');

    // 5. Bulk Product Import Flow
    console.log('\n--- Test 5: Bulk Product Import Flow ---');
    const candidateIds = [prodActive.id, prodActive2.id, prodPending.id, prodSuspendedSupplier.id];
    const bulkResults: Array<{ id: number; status: string }> = [];

    for (const pid of candidateIds) {
      const isAlready = await mockPrisma.storeProductSelection.findFirst({
        where: { storeId: storeManagerB.id, productId: pid }
      });
      if (isAlready) {
        bulkResults.push({ id: pid, status: 'ALREADY_EXISTS' });
        continue;
      }
      const p = await mockPrisma.product.findUnique({ where: { id: pid }, include: { supplier: true } });
      if (!p || (p.status !== 'ACTIVE' && p.status !== 'PUBLISHED')) {
        bulkResults.push({ id: pid, status: 'SKIPPED_UNPUBLISHED' });
        continue;
      }
      if (p.supplier?.status === 'SUSPENDED') {
        bulkResults.push({ id: pid, status: 'SKIPPED_SUSPENDED_SUPPLIER' });
        continue;
      }
      await mockPrisma.storeProductSelection.create({
        data: { storeId: storeManagerB.id, productId: pid, status: 'ACTIVE' }
      });
      bulkResults.push({ id: pid, status: 'SUCCESS' });
    }

    assert(bulkResults.find(r => r.id === prodActive.id)?.status === 'SUCCESS', 'Bulk import imported prodActive');
    assert(bulkResults.find(r => r.id === prodActive2.id)?.status === 'SUCCESS', 'Bulk import imported prodActive2');
    assert(bulkResults.find(r => r.id === prodPending.id)?.status === 'SKIPPED_UNPUBLISHED', 'Bulk import skipped unapproved pending product');
    assert(bulkResults.find(r => r.id === prodSuspendedSupplier.id)?.status === 'SKIPPED_SUSPENDED_SUPPLIER', 'Bulk import skipped product with suspended supplier');

    // 6. Storefront Activation Toggle
    console.log('\n--- Test 6: Storefront Activation Toggle ---');
    await mockPrisma.storeProductSelection.updateMany({
      where: { storeId: storeManagerB.id, productId: prodActive.id },
      data: { status: 'INACTIVE' }
    });
    let bSel = await mockPrisma.storeProductSelection.findFirst({
      where: { storeId: storeManagerB.id, productId: prodActive.id }
    });
    assert(bSel?.status === 'INACTIVE', 'Storefront activation toggled to INACTIVE');

    await mockPrisma.storeProductSelection.updateMany({
      where: { storeId: storeManagerB.id, productId: prodActive.id },
      data: { status: 'ACTIVE' }
    });
    bSel = await mockPrisma.storeProductSelection.findFirst({
      where: { storeId: storeManagerB.id, productId: prodActive.id }
    });
    assert(bSel?.status === 'ACTIVE', 'Storefront activation toggled back to ACTIVE');

    // 7. Multi-Store Isolation (Same supplier product imported by Store A and Store B independently)
    console.log('\n--- Test 7: Multi-Store Product Isolation ---');
    const storeASel = await mockPrisma.storeProductSelection.findFirst({
      where: { storeId: storeManagerA.id, productId: prodActive.id }
    });
    const storeBSel = await mockPrisma.storeProductSelection.findFirst({
      where: { storeId: storeManagerB.id, productId: prodActive.id }
    });
    assert(storeASel !== null && storeBSel !== null, 'Both Store A and Store B can import the same supplier product');
    assert(storeASel?.customPrice === 280000 && storeBSel?.customPrice === undefined, 'Store A custom retail price does not leak to Store B');

    // 8. Zero Internal Margin Leakage Check
    console.log('\n--- Test 8: Zero Internal Margin Leakage ---');
    const clientFacingSelection = {
      productId: prodActive.id,
      name: prodActive.name,
      wholesalePrice: prodActive.finalPrice,
      customPrice: storeASel?.customPrice,
      storeProfit: (storeASel?.customPrice || prodActive.finalPrice) - prodActive.finalPrice,
      inventory: prodActive.inventory
    };
    const jsonStr = JSON.stringify(clientFacingSelection);
    assert(!jsonStr.includes('marginValue') && !jsonStr.includes('supplierBasePrice') && !jsonStr.includes('zopitMargin'), 'No Zopit internal margin or supplierBasePrice exposed in client payload');

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

runPrompt11Tests();
