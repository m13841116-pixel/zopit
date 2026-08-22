const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add getCanonicalAppUrl
const func = `
function getCanonicalAppUrl(req?: any): string {
  if (process.env.NODE_ENV === 'production' && process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\\/$/, '');
  }
  if (req) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (host) {
      if (process.env.NODE_ENV === 'production' && !host.includes('localhost') && !host.includes('run.app')) {
         return \`https://\${host}\`;
      }
      return \`\${protocol}://\${host}\`;
    }
  }
  return 'http://localhost:3000';
}
`;
code = code.replace(/function getPublicUrl\(req\?: any\): string \{[\s\S]*?\n\}/, func);
code = code.replace(/getPublicUrl/g, 'getCanonicalAppUrl');

// 2. Fix the Torob Route
const regexTorob = /\/\/ Torob & Emalls XML Feed for Store[\s\S]*?\}\);/m;
const matchTorob = code.match(regexTorob);
if (matchTorob) {
  code = code.replace(regexTorob, '');
  code = code.replace('startServer();', matchTorob[0] + '\n\nstartServer();');
}

// 3. Fix app.listen on Vercel
const targetVercel = `if (process.env.VERCEL) {
    console.log("Running on Vercel, skipping app.listen()");
    setImmediate(async () => {
      try {
        await seedDatabase();
        await syncAllPaidOrdersSupplierWallets();
      } catch (err: any) {
        console.warn('[Server Startup] Warning: seedDatabase or syncAllPaidOrdersSupplierWallets failed:', err?.message || err);
      }
    });
    return;
  }`;

const replaceVercel = `if (process.env.VERCEL) {
    console.log("Running on Vercel, skipping app.listen() and heavy startup tasks");
    return;
  }`;

code = code.replace(targetVercel, replaceVercel);

// 4. Test endpoint secure
const targetTest = `app.get('/api/payment/test', async (req, res) => {`;
code = code.replace(targetTest, `app.get('/api/payment/test', async (req, res) => {\n  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Endpoint test در محیط عملیاتی غیرفعال است' });`);

// 5. fix wallet simulate
const regexWallet1 = /app\.get\('\/api\/public\/wallet\/deposit-simulate', async \(req: any, res: any\) => \{/g;
code = code.replace(regexWallet1, `app.get('/api/public/wallet/deposit-simulate', async (req: any, res: any) => {\n  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'شبیه ساز پرداخت در محیط عملیاتی غیرفعال است' });`);

const regexWallet2 = /res\.json\(\{ payLink: `\/api\/public\/wallet\/deposit-simulate\?userId=\$\{userId\}&amount=\$\{numericAmount\}` \}\);/g;
code = code.replace(regexWallet2, `if (process.env.NODE_ENV === 'production') {
      return res.status(501).json({ error: 'افزایش موجودی کیف پول فعلا غیرفعال است.' });
    } else {
      res.json({ payLink: \`/api/public/wallet/deposit-simulate?userId=\${userId}&amount=\${numericAmount}\` });
    }`);

// 6. fix dirname
const replacementDir = `const safeDirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const getStaticDistPath = (): string => {
    const candidates = [
      path.join(rootDir, 'dist'),
      path.join(rootDir, 'prod_output'),
      safeDirname,
      path.join(safeDirname, '..', 'dist'),
      path.join(process.cwd(), 'dist'),
      path.join(process.cwd(), 'prod_output'),
    ];`;
code = code.replace(/const getStaticDistPath = \(\): string => \{[\s\S]*?path\.join\(process\.cwd\(\), 'prod_output'\),[\s\S]*?\];/m, replacementDir);
code = code.replace(/const isDev = process\.env\.NODE_ENV !== "production" && !__dirname\.includes\("dist"\) && !__dirname\.includes\("prod_output"\) && !process\.env\.K_SERVICE;/g, `const isDev = process.env.NODE_ENV !== "production" && !safeDirname.includes("dist") && !safeDirname.includes("prod_output") && !process.env.K_SERVICE;`);

fs.writeFileSync('server.ts', code);
