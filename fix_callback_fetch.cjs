const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ 1\. Read Merchant ID from Database[\s\S]*?if \(resCode === 100\) \{/m;
const replacement = `const paymentGateway = await PaymentServiceFactory.getService();
    console.log(\`[Zibal Payment Verify] Verifying trackId: \${trackId}\`);
    
    // We will do verification after finding the order.
    let isSuccess = false;
    let refId = '';
    
    if (true) {`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
