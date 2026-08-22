const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\('\/api\/payment\/zibal\/simulated-gateway', \(req, res\) => \{/g;
code = code.replace(regex, `app.get('/api/payment/zibal/simulated-gateway', (req, res) => {\n  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'شبیه ساز پرداخت در محیط عملیاتی غیرفعال است' });`);

const regex2 = /app\.get\('\/api\/public\/store-invoice\/pay-simulate', async \(req: any, res: any\) => \{/g;
code = code.replace(regex2, `app.get('/api/public/store-invoice/pay-simulate', async (req: any, res: any) => {\n  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'شبیه ساز پرداخت در محیط عملیاتی غیرفعال است' });`);

fs.writeFileSync('server.ts', code);
