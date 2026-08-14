const fs = require('fs');
let code = fs.readFileSync('src/services/sms/SmsService.ts', 'utf8');
code = code.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('src/services/sms/SmsService.ts', code);
