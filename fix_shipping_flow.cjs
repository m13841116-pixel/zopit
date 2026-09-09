const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    const group = await prisma.supplierOrderGroup.findFirst({
      where: { id: groupId, supplierId: req.user.userId }
    });

    if (!group) return res.status(404).json({ error: 'گروه سفارش یافت نشد.' });

    await prisma.$transaction(async (tx) => {`;

const replacement = `    const group = await prisma.supplierOrderGroup.findFirst({
      where: { id: groupId, supplierId: req.user.userId },
      include: { order: true }
    });

    if (!group) return res.status(404).json({ error: 'گروه سفارش یافت نشد.' });
    if (!group.order) return res.status(404).json({ error: 'سفارش اصلی یافت نشد.' });

    // Validate before marking as SHIPPED
    if (newStatus === 'SHIPPED' && group.status !== 'SHIPPED') {
      const invalidStatuses = ['WAITING_STORE_ADDRESS', 'WAITING_SHIPPING_COST', 'PENDING_PAYMENT', 'CANCELLED', 'FAILED', 'RETURNED', 'REJECTED', 'OUT_OF_STOCK'];
      if (invalidStatuses.includes(group.order.status)) {
        return res.status(400).json({ error: 'وضعیت سفارش اجازه ارسال را نمی‌دهد.' });
      }
      if (!trackingCode && !group.trackingCode) {
        return res.status(400).json({ error: 'کد رهگیری برای ثبت ارسال الزامی است.' });
      }
    }

    await prisma.$transaction(async (tx) => {`;

code = code.replace(target, replacement);

const targetAudit = `      if (newStatus === 'SHIPPED' && group.status !== 'SHIPPED') {
         await tx.orderItem.updateMany({
           where: { supplierGroupId: groupId },
           data: { status: 'SHIPPED' }
         });
      }`;

const replacementAudit = `      if (newStatus === 'SHIPPED' && group.status !== 'SHIPPED') {
         await tx.orderItem.updateMany({
           where: { supplierGroupId: groupId },
           data: { status: 'SHIPPED' }
         });

         // Record Audit Events
         await tx.auditTrail.create({
           data: {
             userId: req.user.userId,
             action: 'SUPPLIER_ORDER_SHIPPED',
             details: \`Supplier shipped group \${groupId} for order \${group.orderId}\`,
             ipAddress: req.ip || '',
             userAgent: req.headers['user-agent'] || ''
           }
         });
      }`;

code = code.replace(targetAudit, replacementAudit);
fs.writeFileSync('server.ts', code);
console.log('Fixed shipping flow');
