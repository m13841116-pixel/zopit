const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/let throw new Error\('درگاه پرداخت در حال حاضر در دسترس نیست\. لطفاً دوباره تلاش کنید\.'\);/g, `let payLink = '';`);
fs.writeFileSync('server.ts', code);
