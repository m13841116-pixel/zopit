const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `
      // If orderId exists, update order status to PAID
      if (orderId && !orderId.startsWith('DIRECT')) {
        const numericOrderId = parseInt(orderId.toString().replace(/\\D/g, ''), 10);
        if (!isNaN(numericOrderId)) {
          await prisma.order.updateMany({
            where: { id: numericOrderId },
            data: { status: 'PAID' },
          }).catch(() => {});
        }
      }
`;

const replacement = `
      // If orderId exists, update order status to PAID and charge wallets
      if (orderId && !orderId.startsWith('DIRECT')) {
        const numericOrderId = parseInt(orderId.toString().replace(/\\D/g, ''), 10);
        if (!isNaN(numericOrderId)) {
          const orderToUpdate = await prisma.order.findUnique({
             where: { id: numericOrderId },
             include: { items: true }
          });
          if (orderToUpdate && orderToUpdate.status !== 'PAID') {
             await prisma.order.update({
               where: { id: numericOrderId },
               data: { status: 'PAID' }
             });
             
             // Charge supplier wallets based on supplier base price
             for (const item of orderToUpdate.items) {
               const amountToAdd = Number(item.supplierPrice || 0) * Number(item.quantity || 1);
               if (amountToAdd > 0 && item.supplierId) {
                  let wallet = await prisma.wallet.findUnique({ where: { supplierId: item.supplierId } });
                  if (!wallet) {
                     wallet = await prisma.wallet.create({
                        data: { supplierId: item.supplierId, balance: 0, currency: 'IRR' }
                     });
                  }
                  await prisma.wallet.update({
                     where: { id: wallet.id },
                     data: { balance: { increment: amountToAdd } }
                  });
                  await prisma.ledgerEntry.create({
                     data: {
                        walletId: wallet.id,
                        amount: amountToAdd,
                        type: 'CREDIT',
                        status: 'COMPLETED',
                        description: \`درآمد از فروش محصول در سفارش #\${orderToUpdate.id}\`,
                        referenceId: orderToUpdate.id.toString()
                     }
                  });
               }
             }
          }
        }
      }
`;

code = code.replace(target.trim(), replacement.trim());
fs.writeFileSync('server.ts', code);
console.log('Patched payment callback');
