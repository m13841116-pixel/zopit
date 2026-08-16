const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/const errorLogPath = path\.join\(process\.cwd\(\), 'error\.log'\);/g, "const errorLogPath = process.env.VERCEL ? path.join('/tmp', 'error.log') : path.join(process.cwd(), 'error.log');");
fs.writeFileSync('server.ts', code);
