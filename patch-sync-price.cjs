const fs = require('fs');
let code = fs.readFileSync('src/services/integrations/woocommerce/ProductService.ts', 'utf8');

code = code.replace(
  `regular_price: sel.product.finalPrice?.toString() || '0',`,
  `regular_price: (sel.customPrice || sel.product.finalPrice || 0).toString(),`
);

fs.writeFileSync('src/services/integrations/woocommerce/ProductService.ts', code);
