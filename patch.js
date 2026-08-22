const fs = require('fs');
const file = 'src/services/payment/ZibalService.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/process\.env\.ZIBAL_MERCHANT \|\| 'zibal';/g, 'process.env.ZIBAL_MERCHANT || \'\';');
code = code.replace(/\? this\.zibalMerchant\.trim\(\) : 'zibal'/g, '? this.zibalMerchant.trim() : \'\'');

fs.writeFileSync(file, code);
