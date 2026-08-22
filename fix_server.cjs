const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the duplicated getCanonicalAppUrl section
const regex = /function getCanonicalAppUrl\(req\?: any\): string \{[\s\S]*?function getCanonicalAppUrl\(req: any\): string \{[\s\S]*?\n\}/m;

const replacement = `function getCanonicalAppUrl(req?: any): string {
  const configured = process.env.APP_BASE_URL || process.env.APP_URL;
  if (configured && configured.trim()) {
    return configured.trim().replace(/\\/$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('APP_BASE_URL is required in production');
  }

  // Fallback for local dev
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host || 'localhost:3000';
  const protocol = req?.headers?.['x-forwarded-proto'] || 'http';
  return \`\${protocol}://\${host}\`.replace(/\\/$/, '');
}`;

code = code.replace(regex, replacement);

// Fix fake callbacks:
// payLink = `/api/payment/callback?orderId=${order.id}&success=true`;
code = code.replace(/payLink = `\/api\/payment\/callback\?orderId=\$\{.*\}\&success=true`;/g, `throw new Error('درگاه پرداخت در حال حاضر در دسترس نیست. لطفاً دوباره تلاش کنید.');`);
code = code.replace(/let payLink = `\/api\/payment\/callback\?orderId=\$\{.*\}\&success=true`;/g, `let payLink = '';`);
code = code.replace(/payLink = `\/api\/payment\/callback\?orderId=\$\{singleOrder.id\}\&success=true`;/g, `throw new Error('درگاه پرداخت در حال حاضر در دسترس نیست. لطفاً دوباره تلاش کنید.');`);

// Replace appUrl = ... getCanonicalAppUrl(req) || 'https://www.zopit.ir';
code = code.replace(/const appUrl = process.env.APP_BASE_URL \|\| process.env.APP_URL \|\| getCanonicalAppUrl\(req\) \|\| 'https:\/\/www.zopit.ir';/g, `const appUrl = getCanonicalAppUrl(req);`);

fs.writeFileSync('server.ts', code);
