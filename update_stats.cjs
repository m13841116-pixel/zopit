const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStats = `app.get('/api/store-manager/stats', authenticateToken, requireStoreManager, async (req: any, res: any) => {
  try {
    const storeId = req.user.userId;

    const totalOrders = await prisma.order.count({ where: { storeId } });
    const paidInvoices = await prisma.storeInvoice.findMany({ where: { storeManagerId: storeId, status: 'PAID' } });
    const totalPaid = paidInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

    // Get recently added items (mock)
    const recentActivity = await prisma.order.findMany({
      where: { storeId },
      orderBy: { id: 'desc' },
      take: 5
    });

    res.json({ totalOrders, totalPaid, netProfit: totalPaid * 1.5, recentActivity });
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت آمار' });
  }
});`;

const replacementStats = `app.get('/api/store-manager/stats', authenticateToken, requireStoreManager, async (req: any, res: any) => {
  try {
    const storeId = req.user.userId;

    const totalOrders = await prisma.order.count({ where: { storeId } });
    const paidInvoices = await prisma.storeInvoice.findMany({ where: { storeManagerId: storeId, status: 'PAID' } });
    const totalPaid = paidInvoices.reduce((acc: number, inv: any) => acc + inv.totalAmount, 0);

    // Get recently added items
    const recentActivity = await prisma.order.findMany({
      where: { storeId },
      orderBy: { id: 'desc' },
      take: 5
    });

    // Compute top sellers (sellers with sales above average)
    const allStoreUsers = await prisma.user.findMany({
      where: { role: 'STORE_MANAGER' },
      select: { id: true, firstName: true, lastName: true, storeName: true, avatarUrl: true, createdAt: true }
    });

    const allInvoices = await prisma.storeInvoice.findMany({
      where: { status: 'PAID' },
      select: { storeManagerId: true, totalAmount: true }
    });

    const salesByStore: Record<number, { totalAmount: number; count: number }> = {};
    for (const inv of allInvoices) {
      if (!salesByStore[inv.storeManagerId]) {
        salesByStore[inv.storeManagerId] = { totalAmount: 0, count: 0 };
      }
      salesByStore[inv.storeManagerId].totalAmount += inv.totalAmount;
      salesByStore[inv.storeManagerId].count += 1;
    }

    const storesWithSales = allStoreUsers.map((u: any) => {
      const perf = salesByStore[u.id] || { totalAmount: 0, count: 0 };
      return {
        id: u.id,
        name: (u.firstName ? (u.firstName + ' ' + (u.lastName || '')).trim() : u.storeName) || ('فروشگاه #' + u.id),
        storeName: u.storeName || 'فروشگاه زوپیتی',
        avatarUrl: u.avatarUrl,
        totalSales: perf.totalAmount,
        orderCount: perf.count,
        joinedAt: u.createdAt
      };
    });

    const totalNetworkSales = storesWithSales.reduce((acc: number, s: any) => acc + s.totalSales, 0);
    const averageSales = storesWithSales.length > 0 ? Math.round(totalNetworkSales / storesWithSales.length) : 0;

    // Filter better sellers (above average or top performers)
    let betterSellers = storesWithSales
      .filter((s: any) => s.totalSales > averageSales || s.orderCount > 0)
      .sort((a: any, b: any) => b.totalSales - a.totalSales);

    if (betterSellers.length === 0) {
      betterSellers = storesWithSales.slice(0, 3);
    }

    res.json({
      totalOrders,
      totalPaid,
      netProfit: totalPaid * 1.5,
      recentActivity,
      averageSales,
      betterSellers: betterSellers.slice(0, 6)
    });
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت آمار' });
  }
});`;

content = content.replace(targetStats, replacementStats);
fs.writeFileSync('server.ts', content);
