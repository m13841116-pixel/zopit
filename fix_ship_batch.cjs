const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `
      // Credit supplier wallets immediately!
      for (const item of items) {
         // Create supplier wallet transaction
         const existingTx = await tx.supplierWalletTransaction.findFirst({
           where: { orderItemId: item.id }
         });
         if (existingTx) continue; // Already credited
         
         const supplierShare = (item.quantity || 1) * (item.supplierPrice || 0);
         if (supplierShare > 0) {
           totalCreditedAmount += supplierShare;
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
               description: \`تسویه آنی و واریز درآمد برای ارسال سفارش #\${item.orderId}\`,
               orderId: item.orderId,
               orderItemId: item.id
             }
           });
         }
      }

      // Auto Settlement Logic (every 3 shipped items)
      const shippedCount = await tx.orderItem.count({
        where: { supplierId: req.user.userId, status: 'SHIPPED' }
      });

      if (shippedCount % 3 === 0 && shippedCount > 0) {
        const wallet = await tx.supplierWallet.findUnique({ where: { supplierId: req.user.userId } });
        if (wallet && wallet.balance > 0) {
          const supplierUser = await tx.user.findUnique({ where: { id: req.user.userId } });
          const iban = supplierUser?.iban || 'IR000000000000000000000000';
          
          await tx.supplierSettlement.create({
            data: {
              supplierId: req.user.userId,
              amount: wallet.balance,
              status: 'PROCESSING',
              iban,
              description: 'تسویه اتوماتیک گروهی'
            }
          });
          
          await tx.supplierWallet.update({
            where: { supplierId: req.user.userId },
            data: { 
              balance: 0,
              pending: { increment: wallet.balance }
            }
          });
        }
      }`;

code = code.replace(target, '');
fs.writeFileSync('server.ts', code);
console.log('Cleaned up ship-batch wallet logic');
