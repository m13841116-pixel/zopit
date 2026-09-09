const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add supplierGroup to the include in /api/supplier/orders
code = code.replace(
  /order: \{\s*include: \{\s*store: true\s*\}\s*\},/g,
  `order: {
            include: {
              store: true
            }
          },
          supplierGroup: true,`
);

fs.writeFileSync('server.ts', code);
console.log('Update 1 done');
