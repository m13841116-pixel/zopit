import { Router } from 'express';
import { FinancialControlService } from './FinancialControlService.js';
import { getPrisma } from '../prisma.js';

const router = Router();
const financialControlService = new FinancialControlService();
const prisma = getPrisma();

/**
 * 1. Executive Metrics Endpoint with Revenue Separation & Supplier Liabilities
 * GET /api/admin/financial-control/metrics
 */
router.get('/metrics', async (req: any, res: any) => {
  try {
    const { startDate, endDate, supplierId, storeId, orderId } = req.query;
    const metrics = await financialControlService.getExecutiveMetrics({
      startDate: startDate as string,
      endDate: endDate as string,
      supplierId: supplierId ? parseInt(supplierId as string) : undefined,
      storeId: storeId ? parseInt(storeId as string) : undefined,
      orderId: orderId ? parseInt(orderId as string) : undefined,
    });

    res.json({
      success: true,
      metrics
    });
  } catch (err: any) {
    console.error('Error fetching financial control metrics:', err);
    res.status(500).json({ error: err.message || 'خطا در محاسبه شاخص‌های مالی' });
  }
});

/**
 * 2. Paginated Unified Financial Stream
 * GET /api/admin/financial-control/stream
 */
router.get('/stream', async (req: any, res: any) => {
  try {
    const {
      page = '1',
      limit = '15',
      startDate,
      endDate,
      supplierId,
      storeId,
      orderId,
      financialType,
      status,
      search
    } = req.query;

    const stream = await financialControlService.getFinancialStream({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      startDate: startDate as string,
      endDate: endDate as string,
      supplierId: supplierId ? parseInt(supplierId as string) : undefined,
      storeId: storeId ? parseInt(storeId as string) : undefined,
      orderId: orderId ? parseInt(orderId as string) : undefined,
      financialType: financialType as string,
      status: status as string,
      search: search as string,
    });

    res.json({
      success: true,
      ...stream
    });
  } catch (err: any) {
    console.error('Error fetching financial stream:', err);
    res.status(500).json({ error: err.message || 'خطا در دریافت ریز تراکنش‌های مالی' });
  }
});

/**
 * 3. Authoritative Reconciliation & Anomaly Scanner
 * GET /api/admin/financial-control/reconciliation
 */
router.get('/reconciliation', async (req: any, res: any) => {
  try {
    const audit = await financialControlService.runReconciliationAudit();
    res.json({
      success: true,
      ...audit
    });
  } catch (err: any) {
    console.error('Error running financial reconciliation:', err);
    res.status(500).json({ error: err.message || 'خطا در اجرای ممیزی و تطبیق مالی' });
  }
});

/**
 * 4. Suppliers & Stores for Filter Dropdowns
 * GET /api/admin/financial-control/filter-options
 */
router.get('/filter-options', async (req: any, res: any) => {
  try {
    const suppliers = await prisma.user.findMany({
      where: { role: 'SUPPLIER' },
      select: { id: true, username: true, brandName: true }
    }).catch(() => []);

    const stores = await prisma.user.findMany({
      where: { role: 'STORE' },
      select: { id: true, username: true, shopName: true }
    }).catch(() => []);

    res.json({
      success: true,
      suppliers: suppliers.map((s: any) => ({
        id: s.id,
        name: s.brandName || s.username,
      })),
      stores: stores.map((st: any) => ({
        id: st.id,
        name: st.shopName || st.username,
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
