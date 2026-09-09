const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Insert creditSupplierForShippedGroup function
const creditSupplierFunc = `
// Helper to atomically and idempotently credit a supplier's wallet for a shipped order group
async function creditSupplierForShippedGroup(tx: any, groupId: number) {
  const group = await tx.supplierOrderGroup.findUnique({
    where: { id: groupId },
    include: { items: { include: { product: true } } }
  });
  if (!group || group.status !== 'SHIPPED') return;
  
  // Calculate total base cost for this group
  let totalAmount = 0;
  for (const item of group.items) {
    const basePrice = item.supplierPrice || item.product?.supplierBasePrice || item.price || 0;
    totalAmount += basePrice * (item.quantity || 1);
  }
  
  if (totalAmount <= 0) return;
  
  // Find or create wallet
  let wallet = await tx.wallet.findUnique({
    where: { supplierId: group.supplierId }
  });
  if (!wallet) {
    wallet = await tx.wallet.create({
      data: { supplierId: group.supplierId, balance: 0 }
    });
  }
  
  // Check if ledger entry already exists to ensure idempotency
  const existingLedger = await tx.ledgerEntry.findFirst({
    where: {
      walletId: wallet.id,
      referenceId: \`GROUP_\${groupId}\`,
      type: 'ORDER_REVENUE'
    }
  });
  
  if (existingLedger) return; // Already credited
  
  // Credit wallet
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: { increment: totalAmount } }
  });
  
  // Create ledger entry
  await tx.ledgerEntry.create({
    data: {
      walletId: wallet.id,
      amount: totalAmount,
      type: 'ORDER_REVENUE',
      status: 'COMPLETED',
      referenceId: \`GROUP_\${groupId}\`,
      description: \`درآمد حاصل از ارسال بسته سفارش \${group.orderId}\`
    }
  });
}
`;

code = code.replace('// Helper to credit supplier wallets for paid orders (base cost without mark-up/profit)', creditSupplierFunc + '\n// Helper to credit supplier wallets for paid orders (base cost without mark-up/profit)');

// Now call it in syncSupplierGroupAndParentStatus
const syncGroupTarget = `
  // 3. Find or create the SupplierOrderGroup
  const group = await tx.supplierOrderGroup.findFirst({
    where: { orderId, supplierId }
  });`;

const syncGroupReplacement = `
  // 3. Find or create the SupplierOrderGroup
  const group = await tx.supplierOrderGroup.findFirst({
    where: { orderId, supplierId }
  });
  
  if (group && groupStatus === 'SHIPPED' && group.status !== 'SHIPPED') {
    // Transitioning to SHIPPED -> Credit supplier immediately (idempotently inside)
    await creditSupplierForShippedGroup(tx, group.id);
  }`;

code = code.replace(syncGroupTarget, syncGroupReplacement);
fs.writeFileSync('server.ts', code);
console.log('Supplier wallet credit on SHIPPED injected.');
