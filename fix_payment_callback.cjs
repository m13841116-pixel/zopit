const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `
      if (orderToUpdate) {
        await prisma.$transaction(async (tx) => {
          const currentOrder = await tx.order.findUnique({
            where: { id: orderToUpdate.id }
          });
          if (!currentOrder || currentOrder.status === 'PAID' || currentOrder.status === 'SUCCESS' || currentOrder.status === 'COMPLETED') {
            return; // Idempotently exit
          }

          const updatedOrder = await tx.order.update({
            where: { id: orderToUpdate.id },
            data: {
              status: 'PAID',
              trackingCode: refId,
              statusHistory: {
                create: {
                  fromStatus: currentOrder.status,
                  toStatus: 'PAID',
                  actorRole: 'SYSTEM',
                  actorName: 'درگاه پرداخت زیبال',
                  note: \`پرداخت با موفقیت تایید شد. کد رهگیری: \${refId}\`
                }
              }
            }
          });

          // Deduct inventory for paid order
          await deductOrderInventory(tx, [updatedOrder]);

          // Credit supplier revenue
          // await creditSuppliersForOrders(tx, [updatedOrder]); // MOVED TO SHIPPED EVENT
        });
      }

      return res.redirect(
        \`\${baseUrl}/checkout/success?trackId=\${trackId}&orderId=\${orderToUpdate?.id || orderId || ''}&refNumber=\${refId}\`
      );`;

const replacement = `
      if (orderToUpdate) {
        try {
          await prisma.$transaction(async (tx) => {
            const currentOrder = await tx.order.findUnique({
              where: { id: orderToUpdate.id }
            });
            if (!currentOrder || currentOrder.status === 'PAID' || currentOrder.status === 'SUCCESS' || currentOrder.status === 'COMPLETED') {
              return; // Idempotently exit
            }

            const updatedOrder = await tx.order.update({
              where: { id: orderToUpdate.id },
              data: {
                status: 'PAID',
                trackingCode: refId,
                statusHistory: {
                  create: {
                    fromStatus: currentOrder.status,
                    toStatus: 'PAID',
                    actorRole: 'SYSTEM',
                    actorName: 'درگاه پرداخت زیبال',
                    note: \`پرداخت با موفقیت تایید شد. کد رهگیری: \${refId}\`
                  }
                }
              }
            });

            // Deduct inventory for paid order
            await deductOrderInventory(tx, [updatedOrder]);
          });
        } catch (txErr: any) {
          console.error("Payment verified but inventory failed:", txErr);
          
          // Fallback transaction to record the failed fulfillment
          await prisma.order.update({
            where: { id: orderToUpdate.id },
            data: {
              status: 'OUT_OF_STOCK',
              statusHistory: {
                create: {
                  fromStatus: orderToUpdate.status,
                  toStatus: 'OUT_OF_STOCK',
                  actorRole: 'SYSTEM',
                  actorName: 'سیستم انبار',
                  note: \`موجودی کافی نبود. پرداخت تایید شد اما سفارش لغو شد جهت عودت وجه. دلیل: \${txErr.message}\`
                }
              }
            }
          }).catch(console.error);
          
          return res.redirect(
            \`\${baseUrl}/checkout/failed?trackId=\${trackId}&orderId=\${orderToUpdate?.id || orderId || ''}&message=\${encodeURIComponent('پرداخت انجام شد اما متاسفانه موجودی انبار به اتمام رسیده است. وجه شما به زودی عودت داده خواهد شد.')}\`
          );
        }
      }

      return res.redirect(
        \`\${baseUrl}/checkout/success?trackId=\${trackId}&orderId=\${orderToUpdate?.id || orderId || ''}&refNumber=\${refId}\`
      );`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
console.log('Fixed handlePaymentCallback');
