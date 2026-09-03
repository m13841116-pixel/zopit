const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/console\.warn\('Server Zibal error/g, `console.warn('[Payment Failed] Took ' + (Date.now() - (req.paymentStartTime || 0)) + 'ms. Error:', paymentErr.message);\n      console.warn('Server Zibal error`);

code = code.replace(/try {\n\s*const paymentGateway = await PaymentServiceFactory\.getService\(\);/g, `req.paymentStartTime = Date.now();\n    try {\n      const paymentGateway = await PaymentServiceFactory.getService();`);

fs.writeFileSync('server.ts', code);
