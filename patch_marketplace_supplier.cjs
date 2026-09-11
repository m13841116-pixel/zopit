const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  `city: supp.city || 'تعیین‌نشده'`,
  `city: supp.city || 'تعیین‌نشده',
        performanceScore: supp.performanceScore,
        fulfillmentRate: supp.fulfillmentRate,
        avgProcessingTimeHours: supp.avgProcessingTimeHours,
        warningLevel: supp.warningLevel`
);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts marketplace products supplierInfo successfully');
