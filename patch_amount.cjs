const fs = require('fs');
let code = fs.readFileSync('src/services/payment/ZibalService.ts', 'utf8');

const regex = /if \(data\.success \|\| resCode === 100 \|\| resCode === 201\) \{/g;
const replacement = `if (data.success || resCode === 100 || resCode === 201) {
          if (amount && data.amount && Number(data.amount) !== Number(amount)) {
             throw new Error('مبلغ پرداختی با مبلغ فاکتور تطابق ندارد.');
          }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/services/payment/ZibalService.ts', code);
