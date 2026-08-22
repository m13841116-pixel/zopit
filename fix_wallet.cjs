const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\('\/api\/public\/wallet\/deposit-simulate', async \(req: any, res: any\) => \{/g;
const replacement = `app.get('/api/public/wallet/deposit-simulate', async (req: any, res: any) => {\n  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'شبیه ساز پرداخت در محیط عملیاتی غیرفعال است' });`;

code = code.replace(regex, replacement);

const regex2 = /res\.json\(\{ payLink: `\/api\/public\/wallet\/deposit-simulate\?userId=\$\{userId\}&amount=\$\{numericAmount\}` \}\);/g;
const replacement2 = `if (process.env.NODE_ENV === 'production') {
      return res.status(501).json({ error: 'افزایش موجودی کیف پول فعلا غیرفعال است.' });
    } else {
      res.json({ payLink: \`/api/public/wallet/deposit-simulate?userId=\${userId}&amount=\${numericAmount}\` });
    }`;
code = code.replace(regex2, replacement2);

fs.writeFileSync('server.ts', code);
