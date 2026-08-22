const fs = require('fs');
let code = fs.readFileSync('src/services/payment/ZibalService.ts', 'utf8');

code = code.replace(/ZIBAL_MERCHANT is empty/g, 'ZIBAL_MERCHANT_ID is empty');
code = code.replace(/console\.error\('\[ZibalService Error\] ZIBAL_MERCHANT_ID is empty\. Payments will fail\.'\);/g, `throw new Error('ZIBAL_MERCHANT_ID is not configured in production.');`);

fs.writeFileSync('src/services/payment/ZibalService.ts', code);
