const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /catch \(paymentErr\) \{[\s\S]*?console\.error\('Error creating Zibal payment for invoice:', paymentErr\);[\s\S]*?payLink = `\/api\/public\/store-invoice\/pay-simulate\?invoiceId=\$\{invoice\.id\}`;[\s\S]*?\}/g;
const replacement = `catch (paymentErr) {
      console.error('Error creating Zibal payment for invoice:', paymentErr);
      throw new Error('درگاه پرداخت در حال حاضر در دسترس نیست. لطفاً دوباره تلاش کنید.');
    }`;

code = code.replace(regex, replacement);

fs.writeFileSync('server.ts', code);
