const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

const metricsHelper = `
// --- Helper: Update Supplier Metrics ---
async function updateSupplierMetrics(supplierId: number) {
  try {
    const supplierItems = await prisma.orderItem.findMany({
      where: { supplierId: supplierId },
      select: { id: true, status: true, createdAt: true, updatedAt: true }
    });

    const total = supplierItems.length;
    if (total === 0) return { fulfillmentRate: 100, avgProcessingTimeHours: 12 };

    let shippedAndBeyond = 0;
    let rejected = 0;
    let processingTimeSum = 0;
    let processingTimeCount = 0;

    for (const item of supplierItems) {
      if (['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(item.status)) {
        shippedAndBeyond++;
        const diffMs = new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);
        if (diffHrs > 0 && diffHrs < 720) {
          processingTimeSum += diffHrs;
          processingTimeCount++;
        }
      } else if (['REJECTED', 'CANCELLED', 'OUT_OF_STOCK'].includes(item.status)) {
        rejected++;
      }
    }

    const finished = shippedAndBeyond + rejected;
    const fulfillmentRate = finished > 0 ? (shippedAndBeyond / finished) * 100 : 100;
    const avgProcessingTimeHours = processingTimeCount > 0 ? (processingTimeSum / processingTimeCount) : 12;

    await prisma.user.update({
      where: { id: supplierId },
      data: {
        fulfillmentRate,
        avgProcessingTimeHours
      }
    });
    return { fulfillmentRate, avgProcessingTimeHours };
  } catch (err) {
    console.error('Error updating supplier metrics:', err);
    return null;
  }
}
// ----------------------------------------
`;

if (!code.includes('updateSupplierMetrics(')) {
  code = code.replace(
    '// Helper to credit supplier wallets for paid orders',
    metricsHelper + '\n// Helper to credit supplier wallets for paid orders'
  );
}

// Add call in dashboard stats
code = code.replace(
  'const pendingItemsCount = await prisma.orderItem.count({ where: { supplierId, status: \'PENDING\' } });',
  `await updateSupplierMetrics(supplierId);
    const pendingItemsCount = await prisma.orderItem.count({ where: { supplierId, status: 'PENDING' } });`
);

// Include in public products
code = code.replace(
  `supplier: {
          select: {
            storeUrl: true,
            storeLink: true,
            storeName: true
          }
        }`,
  `supplier: {
          select: {
            id: true,
            storeUrl: true,
            storeLink: true,
            storeName: true,
            performanceScore: true,
            fulfillmentRate: true,
            avgProcessingTimeHours: true,
            warningLevel: true
          }
        }`
);

// Also we need to include it in the mapped products returning from public API
code = code.replace(
  `storeLink: p.supplier?.storeLink || '',`,
  `storeLink: p.supplier?.storeLink || '',
        supplierInfo: p.supplier ? {
          performanceScore: p.supplier.performanceScore,
          fulfillmentRate: p.supplier.fulfillmentRate,
          avgProcessingTimeHours: p.supplier.avgProcessingTimeHours,
          warningLevel: p.supplier.warningLevel
        } : null,`
);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts successfully');
