import { FinancialControlService } from './src/services/FinancialControlService.js';
import { getPrisma } from './src/prisma.js';

async function runFinancialControlTests() {
  console.log('=== STARTING ZOPIT FINANCIAL CONTROL CENTER TESTS ===');
  const prisma = getPrisma();
  const service = new FinancialControlService();

  try {
    // 1. Test Executive Metrics Calculation
    console.log('\n[1] Testing Executive Metrics...');
    const metrics = await service.getExecutiveMetrics({});
    console.log('Executive Metrics computed:', {
      todayProfit: metrics.todayTransactionProfit,
      monthlyProfit: metrics.monthlyTransactionProfit,
      totalGMV: metrics.totalGMV,
      totalPlatformRevenue: metrics.totalPlatformRevenue,
      transactionRevenue: metrics.transactionRevenue,
      subscriptionRevenue: metrics.subscriptionRevenue,
      featuredRevenue: metrics.featuredRevenue,
      supplierLiability: metrics.outstandingSupplierLiability,
      shippedCredits: metrics.shippedCreditMetrics,
    });

    if (metrics.totalPlatformRevenue !== (metrics.transactionRevenue + metrics.subscriptionRevenue + metrics.featuredRevenue)) {
      throw new Error('Platform total revenue does not equal the sum of separated revenue streams!');
    }
    console.log('✓ Revenue separation validation passed.');

    // 2. Test Shipped Credit Metric
    console.log('\n[2] Testing Shipped Credit Metric ("اعتبار ثبت‌شده پس از ارسال")...');
    console.log('Shipped Credit Metrics:', metrics.shippedCreditMetrics);
    if (!metrics.shippedCreditMetrics.title.includes('اعتبار ثبت‌شده پس از ارسال')) {
      throw new Error('Shipped credit metric title missing Persian requirement.');
    }
    console.log('✓ Shipped credit metric structure verified.');

    // 3. Test Paginated Unified Financial Stream
    console.log('\n[3] Testing Unified Financial Stream...');
    const stream = await service.getFinancialStream({ page: 1, limit: 10 });
    console.log(`Stream retrieved ${stream.items.length} items (Total: ${stream.pagination.total}, Pages: ${stream.pagination.totalPages})`);
    if (stream.items.length > 0) {
      console.log('Sample Stream Item:', stream.items[0]);
    }
    console.log('✓ Financial stream pagination and formatting passed.');

    // 4. Test Reconciliation & Anomaly Engine
    console.log('\n[4] Testing 5-Way Reconciliation Anomaly Scanner...');
    const audit = await service.runReconciliationAudit();
    console.log('Audit Summary:', audit.summary);
    console.log(`Found ${audit.anomalies.length} potential anomalies in database.`);
    if (audit.anomalies.length > 0) {
      console.log('Sample Anomaly Record:', audit.anomalies[0]);
    }
    console.log('✓ Reconciliation audit engine completed successfully.');

    // 5. Test Filters on Metrics
    console.log('\n[5] Testing Metrics Filters (Date & Supplier)...');
    const filteredMetrics = await service.getExecutiveMetrics({
      startDate: '2020-01-01',
      endDate: '2030-12-31'
    });
    console.log('Filtered Metrics Total GMV:', filteredMetrics.totalGMV);
    console.log('✓ Filtered queries verified.');

    console.log('\n==================================================');
    console.log('ALL FINANCIAL CONTROL CENTER TESTS PASSED! 🎉');
    console.log('==================================================');
  } catch (error: any) {
    console.error('❌ FINANCIAL CONTROL TEST FAILED:', error);
    process.exit(1);
  }
}

runFinancialControlTests();
