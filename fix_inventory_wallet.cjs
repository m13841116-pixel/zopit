const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Remove inventory deduction from Order Creation
const orderCreationTarget = `      // Decrement Inventory Atomically with raw updates preventing overselling
      for (const item of sortedItems) {
        if (item.variantId) {
          const affected: number = await tx.$executeRaw\`
            UPDATE "ProductVariant"
            SET stock = stock - \${item.quantity}
            WHERE id = \${item.variantId} AND stock >= \${item.quantity}
          \`;
          if (affected === 0) {
            throw new Error(\`موجودی یکی از محصولات (تنوع \${item.variantId}) کافی نمی‌باشد.\`);
          }
        }
        if (item.product.id) {
          const affected: number = await tx.$executeRaw\`
            UPDATE "Product"
            SET inventory = inventory - \${item.quantity}
            WHERE id = \${item.product.id} AND inventory >= \${item.quantity}
          \`;
          if (affected === 0) {
            throw new Error(\`موجودی یکی از محصولات (\${item.product.name}) کافی نمی‌باشد.\`);
          }
        }
      }`;
code = code.replace(orderCreationTarget, `      // NO INVENTORY DECREMENT HERE - DECREMENT ONLY AT PAYMENT VERIFICATION`);

// 2. Remove creditSuppliersForOrders from payment verifications
code = code.replace(/await creditSuppliersForOrders\(tx, orders\);/g, '// await creditSuppliersForOrders(tx, orders); // MOVED TO SHIPPED EVENT');
code = code.replace(/await creditSuppliersForOrders\(tx, currentInvoice.orders\);/g, '// await creditSuppliersForOrders(tx, currentInvoice.orders); // MOVED TO SHIPPED EVENT');
code = code.replace(/await creditSuppliersForOrders\(tx, \[updatedOrder\]\);/g, '// await creditSuppliersForOrders(tx, [updatedOrder]); // MOVED TO SHIPPED EVENT');
code = code.replace(/await creditSuppliersForOrders\(prisma, paidOrders\);/g, '// await creditSuppliersForOrders(prisma, paidOrders); // MOVED TO SHIPPED EVENT');

fs.writeFileSync('server.ts', code);
console.log('Replacements done');
