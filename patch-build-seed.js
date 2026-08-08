const fs = require('fs');
let code = fs.readFileSync('build.js', 'utf8');

code = code.replace(/execSync\('npx prisma db push --accept-data-loss', \{ stdio: 'inherit' \}\);\n\s*console\.log\('\[Build\] Schema push successful\.'\);/g,
  `execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
        console.log('[Build] Schema push successful.');
        console.log('[Build] Running seed script...');
        execSync('npx tsx src/seed-vercel.ts', { stdio: 'inherit' });`);

fs.writeFileSync('build.js', code);
