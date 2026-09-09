const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  if (group) {
    await tx.supplierOrderGroup.update({
      where: { id: group.id },
      data: { 
        status: groupStatus, 
        subtotal,
        trackingCode: groupTrackingCode || group.trackingCode
      }
    });
  } else {`;

const replacement = `  if (group) {
    await tx.supplierOrderGroup.update({
      where: { id: group.id },
      data: { 
        status: groupStatus, 
        subtotal,
        trackingCode: groupTrackingCode || group.trackingCode
      }
    });
    
    if (groupStatus === 'SHIPPED' && group.status !== 'SHIPPED') {
      await creditSupplierForShippedGroup(tx, group.id);
    }
  } else {`;

code = code.replace(target, replacement);

const badIf = `  if (group && groupStatus === 'SHIPPED' && group.status !== 'SHIPPED') {
    // Transitioning to SHIPPED -> Credit supplier immediately (idempotently inside)
    await creditSupplierForShippedGroup(tx, group.id);
  }`;
code = code.replace(badIf, '');

fs.writeFileSync('server.ts', code);
console.log('Fixed execution order');
