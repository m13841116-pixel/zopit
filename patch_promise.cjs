const fs = require('fs');
let content = fs.readFileSync('src/services/payment/clientPaymentBridge.ts', 'utf8');
content = content.replace(
  'const fastestResult = await @ts-ignore\n    const fastestResult = await Promise.any([',
  '// @ts-ignore\n    const fastestResult = await Promise.any(['
);
fs.writeFileSync('src/services/payment/clientPaymentBridge.ts', content);
