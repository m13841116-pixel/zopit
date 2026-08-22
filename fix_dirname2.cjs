const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `const safeDirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const getStaticDistPath = (): string => {
    const candidates = [
      path.join(rootDir, 'dist'),
      path.join(rootDir, 'prod_output'),
      safeDirname,
      path.join(safeDirname, '..', 'dist'),
      path.join(process.cwd(), 'dist'),
      path.join(process.cwd(), 'prod_output'),
    ];`;

code = code.replace(/const getStaticDistPath = \(\): string => \{[\s\S]*?path\.join\(process\.cwd\(\), 'prod_output'\),[\s\S]*?\];/m, replacement);

const replacement2 = `const isDev = process.env.NODE_ENV !== "production" && !safeDirname.includes("dist") && !safeDirname.includes("prod_output") && !process.env.K_SERVICE;`;
code = code.replace(/const isDev = process\.env\.NODE_ENV !== "production" && !__dirname\.includes\("dist"\) && !__dirname\.includes\("prod_output"\) && !process\.env\.K_SERVICE;/g, replacement2);

fs.writeFileSync('server.ts', code);
