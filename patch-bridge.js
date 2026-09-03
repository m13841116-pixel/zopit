const fs = require('fs');
let code = fs.readFileSync('src/services/payment/clientPaymentBridge.ts', 'utf8');

code = code.replace(/console\.warn\("\[ClientPaymentBridge\] Parallel race failed, trying single fallback\.\.\.", parallelErr\);/g, `console.warn("[ClientPaymentBridge] Parallel race failed, trying single fallback...", parallelErr);\n    toast("ارتباط اولیه ناموفق بود، در حال تلاش مجدد...", "info");`);

fs.writeFileSync('src/services/payment/clientPaymentBridge.ts', code);
