const fs = require('fs');
const file = 'src/services/payment/proxyClient.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /process\.env\.PAYMENT_PROXY_SECRET_KEY/g,
  `(process.env.PAYMENT_PROXY_SECRET || process.env.PAYMENT_PROXY_SECRET_KEY)`
);

code = code.replace(
  /'PAYMENT_PROXY_SECRET_KEY is not configured'/g,
  `'PAYMENT_PROXY_SECRET or PAYMENT_PROXY_SECRET_KEY is not configured'`
);

// We should also make sure it uses APP_BASE_URL if available
// Actually ZibalService handles APP_BASE_URL inside the createPayment method.
// Let's check ZibalService.ts for APP_BASE_URL usage.

fs.writeFileSync(file, code);
