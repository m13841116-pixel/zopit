const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const analyticsEndpoint = `
app.get('/api/admin/analytics/performance', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { status: { notIn: ['CANCELLED', 'REJECTED'] } } },
      include: {
        order: { include: { store: true } },
        product: { include: { supplier: true } }
      }
    });

    const suppliersMap = new Map();
    const storesMap = new Map();

    orderItems.forEach(item => {
      const q = item.quantity || 1;
      const zopitPrice = item.price * q;
      const suppPrice = item.supplierPrice * q;
      const profit = zopitPrice - suppPrice;

      if (item.product && item.product.supplier) {
        const sup = item.product.supplier;
        if (!suppliersMap.has(sup.id)) {
          suppliersMap.set(sup.id, { id: sup.id, name: sup.firstName + ' ' + sup.lastName || sup.username, salesVolume: 0, profit: 0, orders: new Set(), itemsSold: 0 });
        }
        const s = suppliersMap.get(sup.id);
        s.salesVolume += suppPrice;
        s.profit += profit;
        s.orders.add(item.orderId);
        s.itemsSold += q;
      }

      if (item.order && item.order.store) {
        const store = item.order.store;
        if (!storesMap.has(store.id)) {
          storesMap.set(store.id, { id: store.id, name: store.firstName + ' ' + store.lastName || store.username, purchaseVolume: 0, profit: 0, orders: new Set(), itemsSold: 0 });
        }
        const st = storesMap.get(store.id);
        st.purchaseVolume += zopitPrice;
        st.profit += profit;
        st.orders.add(item.order.id);
        st.itemsSold += q;
      }
    });

    const supplierArray = Array.from(suppliersMap.values()).map(s => ({
      ...s,
      orders: s.orders.size
    }));

    const storeArray = Array.from(storesMap.values()).map(st => ({
      ...st,
      orders: st.orders.size
    }));

    res.json({
      suppliers: supplierArray,
      stores: storeArray
    });

  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'خطا در دریافت گزارش عملکرد' });
  }
});
`;

code = code.replace("app.get('/api/admin/stats'", analyticsEndpoint + "\napp.get('/api/admin/stats'");
fs.writeFileSync('server.ts', code);
