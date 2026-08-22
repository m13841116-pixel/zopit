const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /payLink = `\/api\/public\/store-invoice\/pay-simulate\?invoiceId=\$\{invoice\.id\}`;/g;
const replacement = `throw new Error('درگاه پرداخت در حال حاضر در دسترس نیست. لطفاً دوباره تلاش کنید.');`;

code = code.replace(regex, replacement);

fs.writeFileSync('server.ts', code);
