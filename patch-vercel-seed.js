const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/if \(process\.env\.VERCEL\) \{\n\s*console\.log\("Running on Vercel, skipping app\.listen\(\)"\);\n\s*return;\n\s*\}/g,
`  if (process.env.VERCEL) {
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
  }`);

fs.writeFileSync('server.ts', code);
