const fs = require('fs');
const file = 'src/services/payment/proxyClient.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const timeoutMs = options\.timeoutMs \|\| 7000;/g,
  `const timeoutMs = options.timeoutMs || parseInt(process.env.PAYMENT_PROXY_TIMEOUT_MS || '7000', 10);`
);

fs.writeFileSync(file, code);
