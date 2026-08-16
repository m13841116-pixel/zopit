const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  `    let totalPayable = Math.max(0, basePrice + enamadCost - appliedDiscountAmount);

    let totalPayable = basePrice + enamadCost;`,
  `    let totalPayable = Math.max(0, basePrice + enamadCost - appliedDiscountAmount);`
);

fs.writeFileSync('server.ts', content);
