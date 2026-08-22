const fs = require('fs');
const file = 'src/services/payment/ZibalService.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/merchant: \(this\.zibalMerchant && this\.zibalMerchant\.trim\(\) !== '' \? this\.zibalMerchant\.trim\(\) : \(\(\) => \{ if\(process\.env\.NODE_ENV === 'production'\) throw new Error\('ZIBAL_MERCHANT is empty'\); return 'zibal'; \}\)\(\),/g, 
  "merchant: (this.zibalMerchant && this.zibalMerchant.trim() !== '') ? this.zibalMerchant.trim() : (() => { if(process.env.NODE_ENV === 'production') throw new Error('ZIBAL_MERCHANT is empty'); return 'zibal'; })(),");
  
code = code.replace(/merchant: \(this\.zibalMerchant && this\.zibalMerchant\.trim\(\) !== '' \? this\.zibalMerchant\.trim\(\) : \(\(\) => \{ if\(process\.env\.NODE_ENV === 'production'\) throw new Error\('ZIBAL_MERCHANT is empty'\); return 'zibal'; \}\)\(\)/g, 
  "merchant: (this.zibalMerchant && this.zibalMerchant.trim() !== '') ? this.zibalMerchant.trim() : (() => { if(process.env.NODE_ENV === 'production') throw new Error('ZIBAL_MERCHANT is empty'); return 'zibal'; })()");

fs.writeFileSync(file, code);
