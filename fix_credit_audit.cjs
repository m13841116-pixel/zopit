const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  // Create ledger entry
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

const replacement = `  // Create ledger entry
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

  // Record audit event
  await tx.auditTrail.create({
    data: {
      userId: group.supplierId,
      action: 'SUPPLIER_BALANCE_CREDITED',
      details: \`Supplier credited \${totalAmount} for shipped group \${groupId} of order \${group.orderId}\`,
      ipAddress: 'SYSTEM',
      userAgent: 'SYSTEM'
    }
  });
}
`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
console.log('Fixed credit audit');
