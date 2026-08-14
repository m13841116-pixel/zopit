const fs = require('fs');
let code = fs.readFileSync('src/services/sms/SmsService.ts', 'utf8');
code = code.replace(/\[\\`var\\\$\\{i\+1\\}\\`\]/g, "[`var${i+1}`]");
fs.writeFileSync('src/services/sms/SmsService.ts', code);
