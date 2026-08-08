const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');
const stuckOrdersRoute = `
// --- Stuck Orders for Admin ---
app.get("/api/admin/stuck-orders", authenticate, requireRole(["SUPERADMIN"]), async (req, res) => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { status: 'APPROVED', trackingCode: null },
          { status: 'REQUESTED', createdAt: { lt: twoDaysAgo } }
        ]
      },
      include: {
        store: true,
        items: { include: { supplier: true } }
      },
      take: 20
    });

    const stuck = orders.map(order => {
      let supplierName = "نامشخص";
      let supplierPhone = "نامشخص";
      if (order.items && order.items.length > 0 && order.items[0].supplier) {
        supplierName = order.items[0].supplier.firstName + " " + order.items[0].supplier.lastName;
        supplierPhone = order.items[0].supplier.mobile || "ندارد";
      }

      let severity = "yellow";
      let delay = "در انتظار پیگیری";
      const hoursPassed = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60));
      if (hoursPassed > 48) {
        severity = "red";
        delay = \`\${hoursPassed} ساعت تاخیر\`;
      } else {
        severity = "yellow";
        delay = \`\${hoursPassed} ساعت گذشته\`;
      }

      return {
        id: order.id,
        orderNumber: \`ORD-\${order.id}\`,
        storeName: order.store?.storeName || order.store?.firstName + " " + order.store?.lastName || "نامشخص",
        supplierName,
        supplierPhone,
        status: order.status,
        delay,
        severity
      };
    });

    res.json(stuck);
  } catch (error) {
    console.error("Error fetching stuck orders:", error);
    res.status(500).json({ error: "خطای سرور" });
  }
});
`;

if (!serverContent.includes('/api/admin/stuck-orders')) {
  serverContent = serverContent.replace(
    /app\.get\("\/api\/admin\/overview"/,
    stuckOrdersRoute + '\napp.get("/api/admin/overview"'
  );
  fs.writeFileSync('server.ts', serverContent, 'utf8');
  console.log('Stuck orders route added.');
}

let overviewContent = fs.readFileSync('src/components/superadmin/Overview.tsx', 'utf8');
const newFetchStuckOrders = `
  const fetchStuckOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/stuck-orders", {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.ok) {
        const data = await res.json();
        setStuckOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };
`;

if (overviewContent.includes('setStuckOrders([')) {
  overviewContent = overviewContent.replace(
    /const fetchStuckOrders = \(\) => \{[\s\S]*?\}\];\s*\};/,
    newFetchStuckOrders
  );
  fs.writeFileSync('src/components/superadmin/Overview.tsx', overviewContent, 'utf8');
  console.log('Overview component updated.');
}

