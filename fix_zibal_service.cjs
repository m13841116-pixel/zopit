const fs = require('fs');
const file = 'src/services/payment/ZibalService.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace merchant logic in constructor
code = code.replace(
  /this\.zibalMerchant = merchant\.trim\(\);/,
  `this.zibalMerchant = merchant.trim();
    if (process.env.NODE_ENV === 'production' && !this.zibalMerchant) {
      console.error('[ZibalService Error] ZIBAL_MERCHANT is empty. Payments will fail.');
    }`
);

// Replace the IIFE logic in payloads
code = code.replace(
  /merchant: \(this\.zibalMerchant && this\.zibalMerchant\.trim\(\) !== ''\) \? this\.zibalMerchant\.trim\(\) : \(\(\) => \{ if\(process\.env\.NODE_ENV === 'production'\) throw new Error\('ZIBAL_MERCHANT is empty'\); return 'zibal'; \}\)\(\)/g,
  `merchant: this.zibalMerchant || (process.env.NODE_ENV === 'production' ? null : 'zibal')`
);

// We need to make sure we throw if merchant is missing in prod
code = code.replace(
  /const requestPayload: Record<string, any> = \{/g,
  `if (process.env.NODE_ENV === 'production' && !this.zibalMerchant) throw new Error('ZIBAL_MERCHANT is empty');
      const requestPayload: Record<string, any> = {`
);

code = code.replace(
  /const verifyPayload: Record<string, any> = \{/g,
  `if (process.env.NODE_ENV === 'production' && !this.zibalMerchant) throw new Error('ZIBAL_MERCHANT is empty');
      const verifyPayload: Record<string, any> = {`
);

fs.writeFileSync(file, code);
