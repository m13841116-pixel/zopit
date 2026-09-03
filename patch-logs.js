const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Find all createPayment calls and add logging
code = code.replace(/const zibalResult = await paymentGateway\.createPayment\(/g, `console.log('[Payment] Requesting payment...', { amount });\n      const zibalResult = await paymentGateway.createPayment(`);

fs.writeFileSync('server.ts', code);
