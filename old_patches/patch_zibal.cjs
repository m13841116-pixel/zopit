const fs = require('fs');
const file = 'src/services/payment/ZibalService.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/\/api\/public\/checkout\/callback/g, '/api/payment/callback');
code = code.replace(/this\.zibalMerchant\.trim\(\) !== ''\) \? this\.zibalMerchant\.trim\(\) : ''/g, 'this.zibalMerchant.trim() !== \'\' ? this.zibalMerchant.trim() : (() => { if(process.env.NODE_ENV === \'production\') throw new Error(\'ZIBAL_MERCHANT is empty\'); return \'zibal\'; })()');

fs.writeFileSync(file, code);
