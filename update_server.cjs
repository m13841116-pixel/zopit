const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const newBatchEndpoint = `
// Batch ship orders
app.post('/api/supplier/orders/ship-batch', authenticateToken, requireSupplier, async (req: any, res: any) => {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'لیست سفارشات نامعتبر است' });
    }
    
    let updatedItems = [];
    
    await prisma.$transaction(async (tx) => {
      // Get the items
      const items = await tx.orderItem.findMany({
        where: {
          id: { in: itemIds.map(id => parseInt(id)) },
          supplierId: req.user.userId,
          status: { in: ['PAID', 'PREPARING'] } // Ensure they are eligible to be shipped
        },
        include: { order: true }
      });
      
      if (items.length === 0) return;
      
      // Update item statuses to SHIPPED
      await tx.orderItem.updateMany({
        where: { id: { in: items.map(i => i.id) } },
        data: { status: 'SHIPPED' }
      });
      
      updatedItems = items;
      
      // Update parent order statuses
      const orderIds = Array.from(new Set(items.map(i => i.orderId)));
      for (const orderId of orderIds) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'SHIPPED' },
        });
        
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            fromStatus: 'PREPARING',
            toStatus: 'SHIPPED',
            actorRole: 'SUPPLIER',
            actorName: req.user.brandName || req.user.username || 'تامین‌کننده',
            note: 'سفارش توسط تامین‌کننده تحویل پست/ارسال شد.'
          }
        });
      }
      
      // Credit supplier wallets immediately!
      for (const item of items) {
         // Create supplier wallet transaction
         const existingTx = await tx.supplierWalletTransaction.findFirst({
           where: { orderItemId: item.id }
         });
         if (existingTx) continue; // Already credited
         
         const supplierShare = item.quantity * item.supplierPrice;
         
         // Add to wallet
         const wallet = await tx.supplierWallet.findUnique({ where: { supplierId: item.supplierId } });
         if (!wallet) {
           await tx.supplierWallet.create({
             data: {
               supplierId: item.supplierId,
               balance: supplierShare,
               pending: 0
             }
           });
         } else {
           await tx.supplierWallet.update({
             where: { supplierId: item.supplierId },
             data: { balance: { increment: supplierShare } }
           });
         }
         
         // Create tx record
         await tx.supplierWalletTransaction.create({
           data: {
             supplierId: item.supplierId,
             amount: supplierShare,
             type: 'CREDIT',
             status: 'COMPLETED',
             description: \`تسویه آنی برای تحویل سفارش #\${item.orderId}\`,
             orderId: item.orderId,
             orderItemId: item.id
           }
         });
      }
    });

    res.json({ success: true, count: updatedItems.length });
  } catch (err) {
    console.error('Error in ship-batch:', err);
    res.status(500).json({ error: 'خطا در ثبت ارسال' });
  }
});
`;

content = content.replace(
  "// Batch approve orders",
  newBatchEndpoint + "\n\n// Batch approve orders"
);

// We need to also auto-deduct inventory on order creation instead of SHIPPED.
// Let's find where inventory is deducted in `api/supplier/orders/:itemId` and remove it,
// and add it to the direct order creation / store order checkout.
// Wait, the simplest way is to intercept where items are created.
// Since time is limited, the prompt states: "یک مرحله رو هم میخوام تقریبا حذف کنیم اون تایید موجودیه... یکی از اونا کم بشه دیگه ۵۰ تا بشه ۴۹ تا... نباید سفارشی پذیرفته بشه".
// Let's deduct inventory inside app.post('/api/store-manager/orders' and '/api/public/checkout/callback'.

fs.writeFileSync('server.ts', content);
