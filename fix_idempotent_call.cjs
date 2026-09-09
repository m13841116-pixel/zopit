const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    if (groupStatus === 'SHIPPED' && group.status !== 'SHIPPED') {
      await creditSupplierForShippedGroup(tx, group.id);
    }`;

const replacement = `    if (groupStatus === 'SHIPPED' || groupStatus === 'DELIVERED' || groupStatus === 'COMPLETED') {
      await creditSupplierForShippedGroup(tx, group.id);
    }`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log('Fixed idempotent call');
